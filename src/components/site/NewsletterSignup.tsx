import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { subscribeToNewsletter } from "@/lib/newsletter.functions";
import { Button } from '@/components/ui/button';

export function NewsletterSignup({ source = "footer" }: { source?: string }) {
  const subscribe = useServerFn(subscribeToNewsletter);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!consent) { setState("error"); setMsg("Please tick the box so we can email you."); return; }
    setState("busy");
    try {
      await subscribe({ data: { email, consent: true, source } });
      setState("done");
      setMsg("You're on the list. We'll email you when the next issue is out.");
      setEmail("");
      setConsent(false);
    } catch {
      setState("error");
      setMsg("That didn't work. Check the email address and try again.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <label htmlFor={`nl-${source}`} className="sr-only">Email address</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={`nl-${source}`}
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.fi"
          className="nb-input sm:flex-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" className="nb-btn nb-btn-primary" disabled={state === "busy"}>
          {state === "busy" ? "Signing up…" : "Subscribe"}
        </Button>
      </div>
      <label className="flex items-start gap-2 nb-small text-muted-foreground">
        <input type="checkbox" className="mt-1 accent-primary" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>Yes, email me the Northbeat newsletter. Unsubscribe any time.</span>
      </label>
      <p role="status" aria-live="polite" className={`nb-small ${state === "error" ? "text-danger" : "text-berry"}`}>
        {state === "done" || state === "error" ? msg : ""}
      </p>
    </form>
  );
}
