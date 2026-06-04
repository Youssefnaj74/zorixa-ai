import { Resend } from "resend";

import { absoluteUrl, BRAND_EMAILS, SITE_NAME } from "@/lib/site-brand";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function fromAlerts(): string {
  return process.env.RESEND_FROM_ALERTS?.trim() || `Zorixa Alerts <system@zorixaai.com>`;
}

function fromSupport(): string {
  return process.env.RESEND_FROM_SUPPORT?.trim() || `${SITE_NAME} <${BRAND_EMAILS.support}>`;
}

function fromBilling(): string {
  return process.env.RESEND_FROM_BILLING?.trim() || `${SITE_NAME} Billing <${BRAND_EMAILS.billing}>`;
}

function notifyInbox(): string | null {
  const to = process.env.SUPPORT_NOTIFY_EMAIL?.trim() || "youssef@zorixaai.com";
  return to || null;
}

export type SupportTicketPayload = {
  name: string;
  email: string;
  issue_type: string;
  subject: string;
  message: string;
  screenshot_url: string | null;
};

export async function sendSupportTicketEmails(ticket: SupportTicketPayload): Promise<void> {
  const resend = resendClient();
  const notifyTo = notifyInbox();
  if (!resend || !notifyTo) {
    if (!process.env.RESEND_API_KEY?.trim()) {
      console.warn("[support-email] RESEND_API_KEY not set — skipping notifications");
    }
    return;
  }

  const safeName = escapeHtml(ticket.name);
  const safeEmail = escapeHtml(ticket.email);
  const safeIssue = escapeHtml(ticket.issue_type);
  const safeSubject = escapeHtml(ticket.subject);
  const safeMessage = escapeHtml(ticket.message).replace(/\n/g, "<br>");
  const screenshotBlock = ticket.screenshot_url
    ? `<p><strong>Screenshot:</strong> <a href="${escapeHtml(ticket.screenshot_url)}">${escapeHtml(ticket.screenshot_url)}</a></p>`
    : "";

  const teamHtml = `
    <p><strong>New support ticket</strong></p>
    <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
    <p><strong>Category:</strong> ${safeIssue}</p>
    <p><strong>Subject:</strong> ${safeSubject}</p>
    <p><strong>Message:</strong><br>${safeMessage}</p>
    ${screenshotBlock}
    <p><a href="${escapeHtml(absoluteUrl("/helpsupport"))}">Support page</a></p>
  `;

  const userHtml = `
    <p>Hi ${safeName},</p>
    <p>Thank you for contacting ${SITE_NAME}. We received your message about <strong>${safeSubject}</strong> (${safeIssue}).</p>
    <p>Our team will reply within <strong>24–48 hours</strong> at ${safeEmail}.</p>
    <p>For urgent billing or account issues, you can also email <a href="mailto:${BRAND_EMAILS.support}">${BRAND_EMAILS.support}</a>.</p>
    <p>Best regards,<br>${SITE_NAME} Team</p>
  `;

  const results = await Promise.allSettled([
    resend.emails.send({
      from: fromAlerts(),
      to: notifyTo,
      replyTo: ticket.email,
      subject: `New ticket: ${ticket.subject}`,
      html: teamHtml
    }),
    resend.emails.send({
      from: fromSupport(),
      to: ticket.email,
      replyTo: BRAND_EMAILS.support,
      subject: `We received your message: ${ticket.subject}`,
      html: userHtml
    })
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[support-email]", result.reason);
    } else if (result.value.error) {
      console.error("[support-email]", result.value.error);
    }
  }
}

export async function sendPurchaseConfirmationEmail(params: {
  email: string;
  credits: number;
  orderId: string;
}): Promise<void> {
  const resend = resendClient();
  if (!resend) return;

  const safeEmail = escapeHtml(params.email);
  const userHtml = `
    <p>Hi,</p>
    <p>Thank you for your purchase on ${SITE_NAME}. <strong>${params.credits} credits</strong> have been added to your account.</p>
    <p>Order reference: ${escapeHtml(params.orderId)}</p>
    <p>View your balance and history in the <a href="${escapeHtml(absoluteUrl("/dashboard/billing"))}">billing dashboard</a>.</p>
    <p>Questions about payments or refunds? Contact <a href="mailto:${BRAND_EMAILS.billing}">${BRAND_EMAILS.billing}</a>.</p>
    <p>Best regards,<br>${SITE_NAME} Billing</p>
  `;

  const { error } = await resend.emails.send({
    from: fromBilling(),
    to: params.email,
    replyTo: BRAND_EMAILS.billing,
    subject: `Your ${SITE_NAME} credits are ready`,
    html: userHtml
  });

  if (error) {
    console.error("[billing-email]", error);
  } else {
    console.info("[billing-email] confirmation sent", { to: safeEmail, orderId: params.orderId });
  }
}
