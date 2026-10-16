export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("not_allowed") || m.includes("database error saving new user"))
    return "Sorry, admin accounts are invite-only.";
  if (m.includes("invalid login credentials")) return "Wrong email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email first. Check your inbox.";
  return message;
}
