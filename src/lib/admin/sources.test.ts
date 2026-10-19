import { describe, expect, it } from "vitest";
import { parseSources } from "@/components/admin/EntityEdit";

describe("guide sources", () => {
  it("keeps lines with a title and an http link", () => {
    expect(parseSources("Business Finland | https://www.businessfinland.fi\nno link here\n | https://x.fi")).toEqual([
      { title: "Business Finland", url: "https://www.businessfinland.fi" },
    ]);
  });
});
