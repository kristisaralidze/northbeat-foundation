import { describe, expect, it } from "vitest";
import { buildDraft, guessEntity } from "./submissions";

const base = { name: null, organisation_name: null, proposed_url: null, message: null, payload: {} };

describe("buildDraft", () => {
  it("always creates a draft", () => {
    expect(buildDraft("organisations", base)["status"]).toBe("draft");
  });
  it("uses organisation name as title and proposed URL as website + source", () => {
    const d = buildDraft("organisations", { ...base, organisation_name: "Acme Health", proposed_url: "https://acme.fi" });
    expect(d["name"]).toBe("Acme Health");
    expect(d["website"]).toBe("https://acme.fi");
    expect(d["source_url"]).toBe("https://acme.fi");
  });
  it("defaults a required type when payload type is invalid", () => {
    expect(buildDraft("organisations", { ...base, payload: { type: "bogus" } })["type"]).toBe("startup");
    expect(buildDraft("organisations", { ...base, payload: { type: "investor" } })["type"]).toBe("investor");
  });
});

describe("guessEntity", () => {
  it("maps entry_kind to admin entity", () => {
    expect(guessEntity({ entry_kind: "person", payload: {} })).toBe("people");
    expect(guessEntity({ entry_kind: null, payload: { kind: "event" } })).toBe("events");
    expect(guessEntity({ entry_kind: "guide", payload: {} })).toBeNull();
  });
});

import { approvableEntity, submissionLabel } from "./submissions";
describe("submission approval", () => {
  it("guest applications approve into a person draft", () => {
    expect(approvableEntity({ type: "podcast_guest", entry_kind: null, payload: {} })).toBe("people");
    expect(submissionLabel({ type: "podcast_guest", entry_kind: null, payload: {} })).toBe("Apply to be a guest");
  });
  it("new organisation entry is labelled Add company", () => {
    expect(submissionLabel({ type: "new_entry", entry_kind: "organisation", payload: {} })).toBe("Add company");
  });
  it("contact submissions cannot be approved", () => {
    expect(approvableEntity({ type: "contact", entry_kind: null, payload: {} })).toBeNull();
  });
});
