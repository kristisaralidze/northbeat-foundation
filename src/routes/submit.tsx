import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { SUBMIT_TABS, validTab, type SubmitTab } from "@/lib/submit";
import { sendSubmission } from "@/lib/submit.functions";

export const Route = createFileRoute("/submit")({
  validateSearch: zodValidator(z.object({ tab: z.string().optional() })),
  head: () => ({
    meta: [
      { title: "Submit: Northbeat" },
      { name: "description", content: "Suggest a company, event or opportunity for Northbeat, or apply to be a podcast guest." },
      { property: "og:title", content: "Submit: Northbeat" },
      { property: "og:description", content: "Suggest a company, event or opportunity for Northbeat, or apply to be a podcast guest." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SubmitPage,
});

function SubmitPage() {
  const { tab: rawTab } = Route.useSearch();
  const navigate = useNavigate({ from: "/submit" });
  const tab = validTab(rawTab);
  const active = SUBMIT_TABS.find((item) => item.id === tab)!;
  return (
    <div className="nb-page">
      <header className="nb-page-header">
        
        <h1 className="nb-h1">Help us track it</h1>
        <p className="nb-lead">Northbeat is curated. Send us what we're missing and we'll take a look.</p>
      </header>
      <div role="tablist" aria-label="What would you like to submit?" className="flex flex-wrap gap-2">
        {SUBMIT_TABS.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={item.id === tab}
            className={item.id === tab ? "nb-btn nb-btn-primary" : "nb-btn nb-btn-secondary"}
            onClick={() => navigate({ search: { tab: item.id }, replace: true })}
          >
            {item.label}
          </button>
        ))}
      </div>
      <section aria-label={active.heading} className="nb-card mt-6 max-w-xl">
        <h2 className="nb-h3">{active.heading}</h2>
        <p className="nb-small text-muted-foreground">{active.intro}</p>
        <SubmitForm key={tab} tab={tab} />
      </section>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className="nb-small font-medium">{label}</span>
      {children}
      {hint ? <span className="nb-small text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function SubmitForm({ tab }: { tab: SubmitTab }) {
  const send = useServerFn(sendSubmission);
  const [values, setValues] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const set = (key: string) => (e: { target: { value: string } }) => setValues((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!consent) { setState("error"); setMsg("Please tick the box so we can reply to you."); return; }
    setState("busy");
    try {
      await send({ data: { tab, consent: true, ...values } as never });
      setState("done");
    } catch (err) {
      setState("error");
      setMsg(err instanceof Error ? err.message : "That didn't work. Please try again.");
    }
  };

  if (state === "done") {
    return (
      <div role="status" className="space-y-2 py-4">
        <p className="nb-h3">Thank you.</p>
        <p className="nb-body text-muted-foreground">We've received your submission. We'll review it and email you if we need more details.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
      {tab === "company" && (
        <>
          <Field label="Company or organisation name"><input className="nb-input" required value={values['organisation_name'] ?? ""} onChange={set("organisation_name")} /></Field>
          <Field label="Website" hint="Optional, but it helps us check it quickly."><input className="nb-input" type="url" placeholder="https://" value={values['website'] ?? ""} onChange={set("website")} /></Field>
        </>
      )}
      {tab === "event" && (
        <>
          <Field label="Event name"><input className="nb-input" required value={values['event_title'] ?? ""} onChange={set("event_title")} /></Field>
          <Field label="Event link"><input className="nb-input" type="url" placeholder="https://" value={values['event_url'] ?? ""} onChange={set("event_url")} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" hint="Optional."><input className="nb-input" placeholder="e.g. 12 March 2027" value={values['event_date'] ?? ""} onChange={set("event_date")} /></Field>
            <Field label="City" hint="Optional."><input className="nb-input" value={values['event_city'] ?? ""} onChange={set("event_city")} /></Field>
          </div>
        </>
      )}
      {tab === "opportunity" && (
        <>
          <Field label="Opportunity name"><input className="nb-input" required value={values['opportunity_title'] ?? ""} onChange={set("opportunity_title")} /></Field>
          <Field label="Link to apply or read more"><input className="nb-input" type="url" placeholder="https://" value={values['opportunity_url'] ?? ""} onChange={set("opportunity_url")} /></Field>
          <Field label="Deadline" hint="Optional."><input className="nb-input" placeholder="e.g. 30 April 2027" value={values['deadline'] ?? ""} onChange={set("deadline")} /></Field>
        </>
      )}
      {tab === "guest" && (
        <Field label="What would you talk about?" hint="Optional. A sentence is enough."><input className="nb-input" value={values['topic'] ?? ""} onChange={set("topic")} /></Field>
      )}
      <Field label="Your name"><input className="nb-input" required autoComplete="name" value={values['name'] ?? ""} onChange={set("name")} /></Field>
      <Field label="Your email"><input className="nb-input" type="email" required autoComplete="email" value={values['email'] ?? ""} onChange={set("email")} /></Field>
      <Field label="Anything else?" hint="Optional.">
        <textarea className="nb-input min-h-24" value={values['message'] ?? ""} onChange={set("message")} />
      </Field>
      <label className="flex items-start gap-2 nb-small text-muted-foreground">
        <input type="checkbox" className="mt-1 accent-primary" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>It's OK to email me about this submission.</span>
      </label>
      <button type="submit" className="nb-btn nb-btn-primary" disabled={state === "busy"}>
        {state === "busy" ? "Sending…" : "Send"}
      </button>
      <p role="status" aria-live="polite" className={`nb-small ${state === "error" ? "text-danger" : "text-berry"}`}>
        {state === "error" ? msg : ""}
      </p>
    </form>
  );
}
