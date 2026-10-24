import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { addTag } from "./site";

const Input = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  consent: z.literal(true),
  source: z.string().max(60).optional(),
  tag: z.enum(["podcast"]).optional(),
});

/** Public newsletter sign-up. Visitors have no table access; this uses the admin client. */
export const subscribeToNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const { data: existing, error: selErr } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id,tags")
      .ilike("email", data.email)
      .maybeSingle();
    if (selErr) throw new Error("Could not sign up right now.");
    if (existing) {
      const { error } = await supabaseAdmin
        .from("newsletter_subscribers")
        .update({ unsubscribed_at: null, consent_at: now, tags: addTag(existing.tags, data.tag) })
        .eq("id", existing.id);
      if (error) throw new Error("Could not sign up right now.");
    } else {
      const { error } = await supabaseAdmin
        .from("newsletter_subscribers")
        .insert({ email: data.email, consent_at: now, source: data.source ?? "footer", tags: addTag([], data.tag) });
      if (error) throw new Error("Could not sign up right now.");
    }
    // Same response either way: never reveal whether an email was already subscribed.
    return { ok: true as const };
  });
