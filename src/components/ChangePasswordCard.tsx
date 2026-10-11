import { useState, type FormEvent } from "react";
import { supabase, friendlyAuthError } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function ChangePasswordCard({ userEmail }: { userEmail?: string }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!supabase) {
      setError("Authentication is not configured.");
      return;
    }

    if (!oldPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (oldPassword === newPassword) {
      setError("New password cannot be the same as your old password.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Get current user's email if not provided
      let email = userEmail;
      if (!email) {
        const { data: userData } = await supabase.auth.getUser();
        email = userData.user?.email;
      }

      if (!email) {
        throw new Error("Unable to identify current user account.");
      }

      // 2. Re-authenticate to verify old password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: oldPassword,
      });

      if (verifyError) {
        throw new Error("Current password is incorrect. Please try again.");
      }

      // 3. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw new Error(friendlyAuthError(updateError.message));
      }

      setSuccess("Your password has been changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-border/70 shadow-sm bg-card/60 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Key className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold">Change Password</CardTitle>
            <CardDescription className="text-xs">
              Update your account password by verifying your current credentials.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs sm:text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="current-password" className="text-xs font-medium">
              Current (Old) Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••"
                className="pl-9 text-xs sm:text-sm"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dashboard-new-password" className="text-xs font-medium">
                New Password
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dashboard-new-password"
                  type="password"
                  placeholder="At least 6 characters"
                  className="pl-9 text-xs sm:text-sm"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dashboard-confirm-password" className="text-xs font-medium">
                Confirm New Password
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dashboard-confirm-password"
                  type="password"
                  placeholder="Repeat new password"
                  className="pl-9 text-xs sm:text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              className="w-full sm:w-auto rounded-full font-semibold text-xs sm:text-sm px-6"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Updating password...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
