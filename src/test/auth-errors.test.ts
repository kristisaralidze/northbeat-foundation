import { describe, it, expect } from "vitest";
import { friendlyAuthError } from "@/lib/auth-errors";

describe("friendlyAuthError", () => {
  it("shows invite-only message when sign-up is blocked for a non-allowed email", () => {
    expect(friendlyAuthError("Database error saving new user")).toBe("Sorry, admin accounts are invite-only.");
  });
});
