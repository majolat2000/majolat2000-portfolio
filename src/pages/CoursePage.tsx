import { useEffect, useRef, useState } from "react";
import { useParams, Navigate, Link } from "react-router";
import { Background } from "@/components/portfolio/Background";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { listAccessFor, listProducts, type StoreProduct, type AccessGrantWithProduct } from "@/lib/store";
import { ArrowLeft, Loader2 } from "lucide-react";
import { portfolio } from "@/lib/portfolio";

/** Load a <script> tag once and resolve when it fires `load`. */
function loadScript(src: string, attrs?: Record<string, string>): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    }
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

function WistiaPlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      loadScript("https://fast.wistia.com/player.js"),
      loadScript("https://fast.wistia.com/embed/b0lzfkvru4.js", { type: "module" }),
    ]).then(() => {
      if (!cancelled) setReady(true);
    });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    // If the custom element hasn't been rendered yet, inject it
    if (!containerRef.current.querySelector("wistia-player")) {
      const player = document.createElement("wistia-player");
      player.setAttribute("media-id", "b0lzfkvru4");
      player.setAttribute("seo", "false");
      player.setAttribute("aspect", "1.7777777777777777");
      containerRef.current.appendChild(player);
    }
  }, [ready]);

  return (
    <div className="w-full overflow-hidden rounded-xl sm:rounded-2xl border border-border/50 shadow-lg">
      <style>{`
        wistia-player[media-id='b0lzfkvru4']:not(:defined) { 
          background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/b0lzfkvru4/swatch'); 
          display: block; 
          filter: blur(5px); 
          padding-top:56.25%; 
        }
      `}</style>
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ paddingTop: "56.25%" /* 16:9 aspect ratio */ }}
      >
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30 backdrop-blur-sm">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function CoursePage() {
  const { id } = useParams();
  const { session, loading } = useSupabaseSession();
  
  const [fetching, setFetching] = useState(true);
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [access, setAccess] = useState<AccessGrantWithProduct[]>([]);

  useEffect(() => {
    if (!session) {
      if (!loading) setFetching(false);
      return;
    }
    
    let cancelled = false;
    Promise.all([listProducts(), listAccessFor(session.user.id)])
      .then(([products, grants]) => {
        if (cancelled) return;
        const foundProduct = products.find(p => p.id === id || p.id.startsWith(id || ""));
        setProduct(foundProduct ?? products[0]);
        setAccess(grants);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session, loading, id]);

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/storefront" replace />;
  }

  const hasAccess = product && access.some(grant => grant.product_id === product.id);
  const isAdmin = session.user.app_metadata?.role === "admin";

  if (!hasAccess && !isAdmin) {
    return <Navigate to="/storefront" replace />;
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Background />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-4 py-3 sm:px-8 sm:py-4 border-b border-border/40 backdrop-blur-md bg-background/50 sticky top-0 z-20">
          <Link to="/storefront" className="group flex items-center gap-3">
            <span className="grid size-10 place-items-center overflow-hidden rounded-full ring-1 ring-border transition-transform duration-300 group-hover:scale-105">
              <img
                src={portfolio.avatar}
                alt={portfolio.name}
                className="h-full w-full object-cover"
              />
            </span>
            <span className="font-display text-sm sm:text-[15px] font-semibold text-foreground truncate max-w-[150px] sm:max-w-none">
              {portfolio.brand} Dashboard
            </span>
          </Link>
          <Button
            variant="ghost"
            asChild
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            <Link to="/storefront" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
              <ArrowLeft className="size-4" />
              <span>Back to Storefront</span>
            </Link>
          </Button>
        </header>

        <main className="flex flex-1 flex-col items-center px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
          <div className="w-full max-w-4xl space-y-6">
            {/* Course Header */}
            <div className="space-y-2">
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                {product?.name || "Course"}
              </h1>
              {product?.description && (
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                  {product.description}
                </p>
              )}
            </div>

            {/* Video Player */}
            <WistiaPlayer />

            {/* Course Info Card */}
            <Card className="overflow-hidden border-border/50 bg-card/50 shadow-xl backdrop-blur-xl rounded-2xl sm:rounded-3xl">
              <CardHeader className="border-b border-border/50 bg-muted/20 px-4 sm:px-8 py-4 sm:py-5">
                <CardTitle className="text-lg sm:text-xl font-bold">
                  Course Materials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5 sm:p-8">
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Watch the video above to get started. Additional modules and
                  materials will be added here as they become available.
                </p>
                {isAdmin && (
                  <p className="rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
                    Admin: To add more videos or sections, edit{" "}
                    <code className="font-mono text-xs">src/pages/CoursePage.tsx</code>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
