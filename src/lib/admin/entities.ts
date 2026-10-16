export type FieldKind =
  | "text"
  | "textarea"
  | "url"
  | "email"
  | "number"
  | "date"
  | "datetime"
  | "select"
  | "boolean"
  | "multi"
  | "image";

export type FieldDef = {
  name: string;
  label: string;
  kind: FieldKind;
  options?: readonly string[];
  required?: boolean;
  help?: string;
};

export type EntityKey = "organisations" | "people" | "events" | "opportunities" | "episodes";

export type LinkDef = {
  table: string;
  selfFk: string;
  otherFk: string;
  other: EntityKey;
  label: string;
  /** Column holding the role/relation (default "role"). */
  roleColumn?: string;
  /** When set, the role is picked from these values instead of free text. */
  roleOptions?: readonly string[];
};
export const ORG_RELATIONS = ["invested_in", "spun_out_of", "acquired", "partner_of"] as const;

export type EntityConfig = {
  key: EntityKey;
  table: string;
  singular: string;
  plural: string;
  titleField: string;
  typeField?: string;
  typeOptions?: readonly string[];
  termTable: string;
  termFk: string;
  fields: FieldDef[];
  links: LinkDef[];
};

export const STATUS = ["draft", "published", "archived"] as const;
export const ORG_TYPES = [
  "startup", "investor", "incubator", "accelerator", "funder", "research_group", "lab",
  "hospital_innovation_unit", "service_provider", "university", "public_agency",
  "patient_organisation", "community",
] as const;
export const OPP_TYPES = ["programme_intake", "grant_call", "competition", "job"] as const;
export const EVENT_TYPES = ["conference", "pitch_competition", "hackathon", "demo_day", "meetup", "workshop", "volunteering"] as const;
export const EVENT_FORMATS = ["in_person", "online", "hybrid"] as const;
export const OPEN_TO = ["advising", "mentoring", "intros", "investing", "validation"] as const;

export const humanize = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

const L = (table: string, selfFk: string, otherFk: string, other: EntityKey, label: string): LinkDef => ({ table, selfFk, otherFk, other, label });

export const ENTITIES: Record<EntityKey, EntityConfig> = {
  organisations: {
    key: "organisations", table: "organisations", singular: "Organisation", plural: "Organisations",
    titleField: "name", typeField: "type", typeOptions: ORG_TYPES,
    termTable: "organisation_terms", termFk: "organisation_id",
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "type", label: "Type", kind: "select", options: ORG_TYPES, required: true },
      { name: "short_description", label: "Short description", kind: "textarea" },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "website", label: "Website", kind: "url" },
      { name: "linkedin_url", label: "LinkedIn", kind: "url" },
      { name: "logo_url", label: "Logo", kind: "image" },
      { name: "city", label: "City", kind: "text" },
      { name: "founded_year", label: "Founded year", kind: "number" },
      { name: "contact_email", label: "Contact email", kind: "email" },
      { name: "contact_email_public", label: "Show contact email publicly", kind: "boolean" },
      { name: "ticket_min_eur", label: "Ticket min (EUR, investors)", kind: "number" },
      { name: "ticket_max_eur", label: "Ticket max (EUR, investors)", kind: "number" },
    ],
    links: [
      L("organisation_people", "organisation_id", "person_id", "people", "People"),
      L("organisation_events", "organisation_id", "event_id", "events", "Events"),
      L("organisation_opportunities", "organisation_id", "opportunity_id", "opportunities", "Opportunities"),
      L("organisation_episodes", "organisation_id", "episode_id", "episodes", "Episodes"),
      { table: "organisation_relations", selfFk: "from_org_id", otherFk: "to_org_id", other: "organisations", label: "Related organisations", roleColumn: "relation", roleOptions: ORG_RELATIONS },
    ],
  },
  people: {
    key: "people", table: "people", singular: "Person", plural: "People",
    titleField: "full_name",
    termTable: "person_terms", termFk: "person_id",
    fields: [
      { name: "full_name", label: "Full name", kind: "text", required: true },
      { name: "headline", label: "Headline", kind: "text" },
      { name: "bio", label: "Bio", kind: "textarea" },
      { name: "photo_url", label: "Photo", kind: "image" },
      { name: "linkedin_url", label: "LinkedIn", kind: "url" },
      { name: "open_to", label: "Open to", kind: "multi", options: OPEN_TO },
      { name: "expertise_note", label: "Expertise note", kind: "textarea" },
      { name: "contact_email", label: "Contact email", kind: "email" },
      { name: "contact_email_public", label: "Show contact email publicly", kind: "boolean" },
    ],
    links: [
      L("organisation_people", "person_id", "organisation_id", "organisations", "Organisations"),
      L("person_events", "person_id", "event_id", "events", "Events"),
      L("person_opportunities", "person_id", "opportunity_id", "opportunities", "Opportunities"),
      L("person_episodes", "person_id", "episode_id", "episodes", "Episodes"),
    ],
  },
  events: {
    key: "events", table: "events", singular: "Event", plural: "Events",
    titleField: "title", typeField: "event_type", typeOptions: EVENT_TYPES,
    termTable: "event_terms", termFk: "event_id",
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "event_type", label: "Event type", kind: "select", options: EVENT_TYPES, required: true },
      { name: "summary", label: "Summary", kind: "textarea" },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "starts_at", label: "Starts", kind: "datetime" },
      { name: "ends_at", label: "Ends", kind: "datetime" },
      { name: "apply_deadline_at", label: "Apply deadline", kind: "datetime" },
      { name: "timezone", label: "Timezone", kind: "text" },
      { name: "format", label: "Format", kind: "select", options: EVENT_FORMATS },
      { name: "venue", label: "Venue", kind: "text" },
      { name: "city", label: "City", kind: "text" },
      { name: "registration_url", label: "Registration URL", kind: "url" },
      { name: "price_note", label: "Price note", kind: "text" },
    ],
    links: [
      L("organisation_events", "event_id", "organisation_id", "organisations", "Organisations"),
      L("person_events", "event_id", "person_id", "people", "People"),
      L("event_opportunities", "event_id", "opportunity_id", "opportunities", "Opportunities"),
    ],
  },
  opportunities: {
    key: "opportunities", table: "opportunities", singular: "Opportunity", plural: "Opportunities",
    titleField: "title", typeField: "type", typeOptions: OPP_TYPES,
    termTable: "opportunity_terms", termFk: "opportunity_id",
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "type", label: "Type", kind: "select", options: OPP_TYPES, required: true },
      { name: "summary", label: "Summary", kind: "textarea" },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "opens_at", label: "Opens", kind: "datetime" },
      { name: "deadline_at", label: "Deadline", kind: "datetime" },
      { name: "amount_min_eur", label: "Amount min (EUR)", kind: "number" },
      { name: "amount_max_eur", label: "Amount max (EUR)", kind: "number" },
      { name: "apply_url", label: "Apply URL", kind: "url" },
      { name: "location", label: "Location (jobs)", kind: "text" },
      { name: "employment_type", label: "Employment type (jobs)", kind: "text" },
      { name: "remote_ok", label: "Remote OK (jobs)", kind: "boolean" },
    ],
    links: [
      L("organisation_opportunities", "opportunity_id", "organisation_id", "organisations", "Organisations"),
      L("person_opportunities", "opportunity_id", "person_id", "people", "People"),
      L("event_opportunities", "opportunity_id", "event_id", "events", "Events"),
    ],
  },
  episodes: {
    key: "episodes", table: "episodes", singular: "Episode", plural: "Episodes",
    titleField: "title",
    termTable: "episode_terms", termFk: "episode_id",
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "episode_number", label: "Episode number", kind: "number" },
      { name: "season", label: "Season", kind: "number" },
      { name: "summary", label: "Summary", kind: "textarea" },
      { name: "show_notes", label: "Show notes", kind: "textarea" },
      { name: "transcript", label: "Transcript", kind: "textarea" },
      { name: "audio_url", label: "Audio URL", kind: "url" },
      { name: "embed_url", label: "Embed URL", kind: "url" },
      { name: "duration_seconds", label: "Duration (seconds)", kind: "number" },
      { name: "published_on", label: "Published on", kind: "date" },
      { name: "cover_url", label: "Cover image", kind: "image" },
    ],
    links: [
      L("organisation_episodes", "episode_id", "organisation_id", "organisations", "Organisations"),
      L("person_episodes", "episode_id", "person_id", "people", "People"),
    ],
  },
};
