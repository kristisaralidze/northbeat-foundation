import { z } from "zod";

export const SUBMIT_TABS = [
  { id: "company", label: "Add a company", heading: "Add a company", intro: "Suggest a Nordic health startup, investor or programme for the directory." },
  { id: "event", label: "Add an event", heading: "Add an event", intro: "Send us the details of an event for Nordic health innovation." },
  { id: "opportunity", label: "Add an opportunity", heading: "Add an opportunity", intro: "Share a grant call, programme intake, competition or job opening in Nordic health." },
  { id: "guest", label: "Be a podcast guest", heading: "Apply to be a podcast guest", intro: "Tell us about your work in Nordic health innovation and what you would discuss on the podcast." },
] as const;

export type SubmitTab = (typeof SUBMIT_TABS)[number]["id"];

export function validTab(value: unknown): SubmitTab {
  return SUBMIT_TABS.some((tab) => tab.id === value) ? (value as SubmitTab) : "company";
}

const base = {
  name: z.string().trim().min(1, "Please tell us your name.").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(254),
  message: z.string().trim().max(2000).optional(),
  consent: z.literal(true, { message: "Please tick the box so we can reply to you." }),
};

export const submissionSchema = z.discriminatedUnion("tab", [
  z.object({ tab: z.literal("company"), ...base, organisation_name: z.string().trim().min(1, "What's the company called?").max(200), website: z.string().trim().url("Please paste a full link, starting with https://").max(500).optional().or(z.literal("")) }),
  z.object({ tab: z.literal("event"), ...base, event_title: z.string().trim().min(1, "What's the event called?").max(200), event_url: z.string().trim().url("Please paste a full link, starting with https://").max(500).optional().or(z.literal("")), event_date: z.string().trim().max(40).optional(), event_city: z.string().trim().max(100).optional() }),
  z.object({ tab: z.literal("opportunity"), ...base, opportunity_title: z.string().trim().min(1, "What's the opportunity called?").max(200), opportunity_url: z.string().trim().url("Please paste a full link, starting with https://").max(500).optional().or(z.literal("")), deadline: z.string().trim().max(40).optional() }),
  z.object({ tab: z.literal("guest"), ...base, topic: z.string().trim().max(200).optional() }),
]);

export type SubmissionInput = z.infer<typeof submissionSchema>;
