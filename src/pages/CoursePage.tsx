import { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router";
import { Background } from "@/components/portfolio/Background";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { listAccessFor, listProducts, type StoreProduct, type AccessGrantWithProduct } from "@/lib/store";
import { ArrowLeft, Loader2 } from "lucide-react";
import { portfolio } from "@/lib/portfolio";

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
        setProduct(foundProduct ?? products[0]); // Defaulting to 1st product if ID mismatch for now
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
        <header className="flex items-center justify-between px-4 py-4 sm:px-8">
          <Link to="/storefront" className="group flex items-center gap-3">
            <span className="grid size-10 place-items-center overflow-hidden rounded-full ring-1 ring-border transition-transform duration-300 group-hover:scale-105">
              <img
                src={portfolio.avatar}
                alt={portfolio.name}
                className="h-full w-full object-cover"
              />
            </span>
            <span className="font-display text-[15px] font-semibold text-foreground">
              {portfolio.brand} Dashboard
            </span>
          </Link>
          <Button
            variant="ghost"
            asChild
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            <Link to="/storefront">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
          <div className="w-full max-w-4xl space-y-6">
            <Card className="min-h-[60vh] overflow-hidden border-border/50 bg-card/50 shadow-2xl backdrop-blur-xl">
              <CardHeader className="border-b border-border/50 bg-muted/20 px-8 py-6">
                <CardTitle className="text-2xl font-bold leading-tight md:text-3xl">
                  {product?.name || "HIDDEN SECRETS TO LAND YOUR FIRST REMOTE JOB"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-6 p-8 pt-20 text-center">
                <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground md:text-4xl">
                  Welcome to the Course!
                </h3>
                <p className="max-w-xl text-lg text-muted-foreground">
                  The video modules and materials are currently being finalized and uploaded. 
                  Bookmark this page and check back very soon!
                </p>
                {isAdmin && (
                  <p className="rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
                    (Admin: You can safely embed your videos and code custom content into this component: <code className="font-mono text-xs">src/pages/CoursePage.tsx</code>)
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
