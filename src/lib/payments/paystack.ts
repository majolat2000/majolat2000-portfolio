import { buildTxRef } from "./txref";

export const PAYSTACK_CURRENCY = "NGN";

export { buildTxRef, parseTxRef } from "./txref";

export interface CheckoutInput {
  productId: string;
  userId: string;
  email: string;
  amountKobo: number; // Paystack requires amount in KOBO (integer)
  productName: string;
  durationDays: number;
}

export interface CheckoutResult {
  status: string;
  reference: string;
  transactionId: string | number | null;
  txRef: string;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: Record<string, unknown>) => {
        openIframe: () => void;
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadPaystackScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Payments can only start in a browser."));
  }
  if (window.PaystackPop) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Could not load Paystack checkout popup."));
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
  const publicKey =
    (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY ||
    (import.meta as any).env?.PAYSTACK_PUBLIC_KEY ||
    "";

  if (!publicKey) {
    throw new Error("Paystack public key is not configured.");
  }

  await loadPaystackScript();
  if (!window.PaystackPop) {
    throw new Error("Could not start Paystack checkout popup.");
  }

  const txRef = buildTxRef(input.productId, input.userId);

  const handler = window.PaystackPop.setup({
    key: publicKey,
    email: input.email,
    amount: input.amountKobo, // Paystack amount is in kobo
    currency: PAYSTACK_CURRENCY,
    ref: txRef,
    metadata: {
      custom_fields: [
        {
          display_name: "Product",
          variable_name: "product_name",
          value: input.productName,
        },
        {
          display_name: "Product ID",
          variable_name: "product_id",
          value: input.productId,
        },
        {
          display_name: "User ID",
          variable_name: "user_id",
          value: input.userId,
        },
        {
          display_name: "Access Duration",
          variable_name: "duration_days",
          value: `${input.durationDays} days`,
        },
      ],
      product_id: input.productId,
      user_id: input.userId,
    },
    callback: (response: {
      reference: string;
      status?: string;
      message?: string;
      trxref?: string;
      transaction?: string | number;
    }) => {
      console.log("[Paystack] Callback response:", JSON.stringify(response));
      const ref = response.reference || response.trxref || txRef;
      const transId = response.transaction ?? response.reference ?? txRef;
      onCompleted?.({
        status: "success",
        reference: ref,
        transactionId: transId,
        txRef: ref,
      });
    },
    onClose: () => {
      console.log("[Paystack] Modal closed by user");
    },
  });

  handler.openIframe();
}
