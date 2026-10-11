import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, LogOut, ArrowLeft, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { ChangePasswordCard } from "@/components/ChangePasswordCard";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <main className="min-h-screen bg-background px-4 sm:px-6 py-8 sm:py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 sm:gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="sm" asChild className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground">
                <Link to="/storefront">
                  <ArrowLeft className="size-3.5 mr-1" />
                  Back to Storefront
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-display">
              User Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Logged in as <span className="font-semibold text-foreground">{user?.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="rounded-full text-xs font-medium"
            >
              <Link to="/storefront">
                <ShoppingBag className="size-3.5 mr-1.5" />
                Storefront
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full text-xs font-medium cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="size-3.5 mr-1.5" />
              Sign out
            </Button>
          </div>
        </header>

        {/* Change Password Section */}
        <ChangePasswordCard userEmail={user?.email} />

        {/* Account Details & Status */}
        <Card className="border-border/70 shadow-sm rounded-2xl bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LayoutDashboard className="size-5" />
            </div>
            <CardTitle className="text-lg">Account Workspace</CardTitle>
            <CardDescription className="text-xs">
              Manage your digital learning products, purchased toolkit credentials, and affiliate earnings.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs sm:text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              Your account grants access to all digital courses, toolkit downloads, and community resources associated with your account email.
            </p>
            <div className="pt-2">
              <Button asChild size="sm" className="rounded-full text-xs font-semibold">
                <Link to="/storefront">Explore Courses & Toolkits</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
