import { buildTxRef } from "./txref";

export const FLUTTERWAVE_CURRENCY = "NGN";

export { buildTxRef, parseTxRef } from "./txref";

export interface CheckoutInput {
  productId: string;
  userId: string;
  email: string;
  amountKobo: number;
  productName: string;
  durationDays: number;
}

export interface CheckoutResult {
  status: string;
  transactionId: string | number | null;
  txRef: string;
}

declare global {
  interface Window {
    FlutterwaveCheckout?: (config: Record<string, unknown>) => void;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadFlutterwaveScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Payments can only start in a browser."));
  }
  if (window.FlutterwaveCheckout) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Could not load Flutterwave checkout."));
      };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

export async function startCheckout(
  input: CheckoutInput,
  onCompleted?: (result: CheckoutResult) => void,
): Promise<void> {
  const publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error("Payments aren't connected yet — coming soon.");
  }
  await loadFlutterwaveScript();
  if (!window.FlutterwaveCheckout) {
    throw new Error("Could not start Flutterwave checkout.");
  }

  const txRef = buildTxRef(input.productId, input.userId);
  window.FlutterwaveCheckout({
    public_key: publicKey,
    tx_ref: txRef,
    amount: input.amountKobo / 100,
    currency: FLUTTERWAVE_CURRENCY,
    payment_options: "card,banktransfer,ussd",
    customer: { email: input.email },
    meta: { product_id: input.productId, user_id: input.userId },
    customizations: {
      title: input.productName,
      description: `${input.durationDays}-day access`,
    },
    callback: (response: {
      status: string;
      transaction_id?: string | number;
      tx_ref?: string;
    }) => {
      onCompleted?.({
        status: response.status,
        transactionId: response.transaction_id ?? null,
        txRef: response.tx_ref ?? txRef,
      });
    },
    onclose: () => undefined,
  });
}
