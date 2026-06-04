/** Ticket categories for /support and /helpsupport forms (must match API route). */
export const SUPPORT_TICKET_TYPES = [
  "Billing & Payments",
  "Credits Issue",
  "Image Generation",
  "Video Generation",
  "Account Problem",
  "Feature Request",
  "Bug Report"
] as const;

export type SupportTicketType = (typeof SUPPORT_TICKET_TYPES)[number];
