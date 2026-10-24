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
  | "image"
  | "term"
  | "sources"
  | "lines"
  | "facts";

export type FieldDef = {
  name: string;
  label: string;
  kind: FieldKind;
  options?: readonly string[];
  required?: boolean;
  help?: string;
  /** For kind "term": which tag list to pick one value from. */
  termKind?: string;
};

export type EntityKey = "organisations" | "people" | "events" | "opportunities" | "episodes" | "guides" | "glossary";

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
  /** Link table has no role column. */
  noRole?: boolean;
};
export const ORG_RELATIONS = ["invested_in", "spun_out_of", "acquired", "partner_of", "part_of"] as const;

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
  /** Tag lists offered in the tag picker (default: field, sub-area, country, stage). */
  tagKinds?: readonly string[];
};

export const DEFAULT_TAG_KINDS = ["field", "sub_area", "country", "stage"] as const;
const WITH_JOURNEY = [...DEFAULT_TAG_KINDS, "journey_step"] as const;
export const GUIDE_LEVELS = ["beginner", "intermediate"] as const;

export const STATUS = ["draft", "published", "archived"] as const;
export const ORG_TYPES = [
  "startup", "investor", "incubator", "accelerator", "funder", "research_group", "lab",
  "hospital_innovation_unit", "service_provider", "university", "public_agency",
  "patient_organisation", "community", "care_provider",
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
    termTable: "organisation_terms", termFk: "organisation_id", tagKinds: WITH_JOURNEY,
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "type", label: "Type", kind: "select", options: ORG_TYPES, required: true },
      { name: "short_description", label: "Short description", kind: "textarea" },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "offer_chips", label: "How they can help you", kind: "lines", help: "2 to 4 short offers, one per line. Leave empty for type defaults." },
      { name: "story", label: "The story", kind: "textarea" },
      { name: "scale_facts", label: "In numbers", kind: "facts", help: "One per line: 13,000+ | attendees | 2025 | https://source" },
      { name: "our_take", label: "Our take", kind: "textarea" },
      { name: "how_to_get_involved", label: "How to get involved", kind: "lines", help: "One per line" },
      { name: "website", label: "Website", kind: "url" },
      { name: "linkedin_url", label: "LinkedIn", kind: "url" },
      { name: "logo_url", label: "Logo", kind: "image" },
      { name: "cover_image_url", label: "Cover image", kind: "image" },
      { name: "video_url", label: "Official video (YouTube or Vimeo)", kind: "url" },
      { name: "video_source_url", label: "Official channel URL", kind: "url" },
      { name: "city", label: "City", kind: "text" },
      { name: "latitude", label: "Map latitude (filled automatically, correct if needed)", kind: "number" },
      { name: "longitude", label: "Map longitude", kind: "number" },
      { name: "news_feed_url", label: "News feed (RSS or Atom on their own website)", kind: "url" },
      { name: "founded_year", label: "Founded year", kind: "number" },
      { name: "prominence", label: "Prominence (1 first, then 2, then 3; 0 unranked)", kind: "number" },
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
    termTable: "event_terms", termFk: "event_id", tagKinds: WITH_JOURNEY,
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "event_type", label: "Event type", kind: "select", options: EVENT_TYPES, required: true },
      { name: "logo_url", label: "Official logo", kind: "image" },
      { name: "cover_image_url", label: "Cover image", kind: "image" },
      { name: "video_url", label: "Official video (YouTube or Vimeo)", kind: "url" },
      { name: "video_source_url", label: "Official channel URL", kind: "url" },
      { name: "summary", label: "Summary", kind: "textarea" },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "starts_at", label: "Starts", kind: "datetime" },
      { name: "ends_at", label: "Ends", kind: "datetime" },
      { name: "apply_deadline_at", label: "Apply deadline", kind: "datetime" },
      { name: "timezone", label: "Timezone", kind: "text" },
      { name: "format", label: "Format", kind: "select", options: EVENT_FORMATS },
      { name: "venue", label: "Venue", kind: "text" },
      { name: "city", label: "City", kind: "text" },
      { name: "latitude", label: "Map latitude (filled automatically, correct if needed)", kind: "number" },
      { name: "longitude", label: "Map longitude", kind: "number" },
      { name: "registration_url", label: "Registration URL", kind: "url" },
      { name: "price_note", label: "Price note", kind: "text" },
      { name: "founded_year", label: "First held (year)", kind: "number" },
      { name: "story", label: "The story", kind: "textarea" },
      { name: "scale_facts", label: "In numbers", kind: "facts", help: "One per line: 13,000+ | attendees | 2025 | https://source" },
      { name: "our_take", label: "Our take", kind: "textarea" },
      { name: "who_youll_meet", label: "Who you'll meet", kind: "lines", help: "One per line" },
      { name: "price_info", label: "Price", kind: "textarea" },
      { name: "free_ways_in", label: "Free ways in", kind: "textarea" },
      { name: "tips", label: "Tips", kind: "lines", help: "One per line" },
      { name: "profile_sources", label: "Profile sources", kind: "lines", help: "One link per line" },
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
    termTable: "opportunity_terms", termFk: "opportunity_id", tagKinds: WITH_JOURNEY,
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
      { name: "who_can_apply", label: "Who can apply", kind: "lines" },
      { name: "what_you_get", label: "What you get", kind: "textarea" },
      { name: "how_to_apply_steps", label: "How to apply", kind: "lines" },
      { name: "tips", label: "Tips (up to 3)", kind: "lines" },
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
  guides: {
    key: "guides", table: "guides", singular: "Guide", plural: "Guides",
    titleField: "title",
    termTable: "guide_terms", termFk: "guide_id",
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "level", label: "Level", kind: "select", options: GUIDE_LEVELS, required: true },
      { name: "area_id", label: "Area", kind: "term", termKind: "area" },
      { name: "journey_step_id", label: "Journey step", kind: "term", termKind: "journey_step" },
      { name: "one_sentence", label: "One sentence (shown at the top)", kind: "textarea" },
      { name: "summary", label: "Summary", kind: "textarea" },
      { name: "body", label: "Body", kind: "textarea" },
      { name: "next_step", label: "Next step (shown at the end)", kind: "textarea" },
      { name: "common_mistakes", label: "Common mistakes (up to 2)", kind: "lines", help: "One per line, shown on the journey step page." },
      { name: "sources", label: "Sources", kind: "sources", help: "One per line: Title | https://link" },
      { name: "reviewed_by", label: "Reviewed by", kind: "text" },
      { name: "reading_minutes", label: "Reading minutes", kind: "number" },
      { name: "cover_url", label: "Cover image", kind: "image" },
    ],
    links: [
      { table: "guide_organisations", selfFk: "guide_id", otherFk: "organisation_id", other: "organisations", label: "In the hub: organisations (3 picks total)", noRole: true },
      { table: "guide_opportunities", selfFk: "guide_id", otherFk: "opportunity_id", other: "opportunities", label: "In the hub: opportunities (3 picks total)", noRole: true },
      { table: "glossary_term_guides", selfFk: "guide_id", otherFk: "glossary_term_id", other: "glossary", label: "Glossary terms", noRole: true },
    ],
  },
  glossary: {
    key: "glossary", table: "glossary_terms", singular: "Glossary term", plural: "Glossary",
    titleField: "term",
    termTable: "glossary_term_terms", termFk: "glossary_term_id",
    tagKinds: ["field", "area"],
    fields: [
      { name: "term", label: "Term", kind: "text", required: true },
      { name: "short_definition", label: "Short definition (one or two sentences)", kind: "textarea", required: true },
      { name: "explanation", label: "Explanation", kind: "textarea" },
    ],
    links: [
      { table: "glossary_term_relations", selfFk: "from_term_id", otherFk: "to_term_id", other: "glossary", label: "Related terms", noRole: true },
      { table: "glossary_term_guides", selfFk: "glossary_term_id", otherFk: "guide_id", other: "guides", label: "Related guides", noRole: true },
    ],
  },
};
