import { createServerFn } from "@tanstack/react-start";
import { submissionSchema, type SubmissionInput } from "./submit";

/** Public submission form. Visitors have no table access; this uses the admin client. */
export const sendSubmission = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => submissionSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = toRow(data);
    const { error } = await supabaseAdmin.from("submissions").insert(row);
    if (error) throw new Error("Could not send your submission right now.");
    return { ok: true as const };
  });

function toRow(data: SubmissionInput) {
  const common = {
    name: data.name,
    email: data.email,
    message: data.message || null,
    consent_at: new Date().toISOString(),
    status: "new" as const,
  };
  switch (data.tab) {
    case "company":
      return { ...common, type: "new_entry" as const, entry_kind: "organisation" as const, organisation_name: data.organisation_name, proposed_url: data.website || null, payload: { organisation_name: data.organisation_name, website: data.website || null } };
    case "event":
      return { ...common, type: "new_entry" as const, entry_kind: "event" as const, proposed_url: data.event_url || null, payload: { title: data.event_title, url: data.event_url || null, date: data.event_date || null, city: data.event_city || null } };
    case "opportunity":
      return { ...common, type: "new_entry" as const, entry_kind: "opportunity" as const, proposed_url: data.opportunity_url || null, payload: { title: data.opportunity_title, url: data.opportunity_url || null, deadline: data.deadline || null } };
    case "guest":
      return { ...common, type: "podcast_guest" as const, payload: { topic: data.topic || null } };
  }
}
