import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin sign in · Northbeat" },
      { name: "description", content: "Northbeat admin sign in." },
      { property: "og:title", content: "Admin sign in · Northbeat" },
      { property: "og:description", content: "Northbeat admin sign in." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLogin,
});

export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("not_allowed") || m.includes("database error saving new user"))
    return "Sorry, admin accounts are invite-only.";
  if (m.includes("invalid login credentials")) return "Wrong email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email first. Check your inbox.";
  return message;
}

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMsg(friendlyAuthError(error.message));
    navigate({ to: "/admin" });
  }

  async function signUp(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setBusy(false);
    if (error) return setMsg(friendlyAuthError(error.message));
    setMsg("Check your email to confirm your account, then sign in.");
  }

  async function forgot() {
    if (!email) return setMsg("Enter your email first.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setMsg(error ? error.message : "If that account exists, a reset link is on its way.");
  }

  const fields = (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
    </>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">Northbeat admin</h1>
        <Tabs defaultValue="signin" onValueChange={() => setMsg(null)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create admin account</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={signIn} className="space-y-4 pt-4">
              {fields}
              <Button type="submit" className="w-full" disabled={busy}>Sign in</Button>
              <button type="button" onClick={forgot} className="text-sm text-muted-foreground underline">
                Forgot password?
              </button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={signUp} className="space-y-4 pt-4">
              {fields}
              <Button type="submit" className="w-full" disabled={busy}>Create account</Button>
            </form>
          </TabsContent>
        </Tabs>
        {msg && <p role="status" className="text-sm text-foreground">{msg}</p>}
      </div>
    </main>
  );
}
