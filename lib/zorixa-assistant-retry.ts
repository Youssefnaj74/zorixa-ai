import {
  ASSISTANT_MISSING_INFO_REPLY,
  ASSISTANT_OFF_TOPIC_REPLY
} from "@/lib/zorixa-assistant-replies";

/**
 * Detects when the model used off-topic / missing-info refusals for clearly
 * in-scope Zorixa product questions (competitor availability, founder FAQ, etc.).
 */
export function isUnexpectedAssistantRefusal(input: {
  userMessage: string;
  reply: string;
}): boolean {
  const q = input.userMessage.toLowerCase();
  const reply = input.reply.trim();
  const isOffTopic =
    reply === ASSISTANT_OFF_TOPIC_REPLY ||
    reply.toLowerCase().startsWith("i'm specialized in zorixa");
  const isMissing =
    reply === ASSISTANT_MISSING_INFO_REPLY ||
    reply.toLowerCase().startsWith("i'm unable to find accurate information");

  const competitorAvailability =
    /\b(midjourney|runway|pika|sora|luma|elevenlabs|heygen)\b/i.test(q) &&
    /\b(available|use|offer|support|inside|on zorixa|in (?:the )?studio)\b/i.test(q);

  const founderQuestion = /\b(who founded|founder of)\b/i.test(q) && /\bzorixa\b/i.test(q);

  const yearlyDiscountQuestion =
    /\byearly\b/i.test(q) && /\b(discount|price|billing|plan)\b/i.test(q);

  const promptHelpQuestion =
    /\b(prompt|rewrite|improve|generate a .{0,40}prompt|write me a .{0,40}prompt)\b/i.test(q);

  if (competitorAvailability && isOffTopic) return true;
  if (founderQuestion && isMissing) return true;
  if (yearlyDiscountQuestion && isMissing) return true;
  if (promptHelpQuestion && isMissing) return true;
  return false;
}

export const ASSISTANT_REFUSAL_RETRY_SUFFIX = `

REMINDER (mandatory):
- Competitor availability questions are in-scope — answer from the available models list, do not use the off-topic reply.
- If the FAQ/documentation already contains the answer (founder, yearly discount, credits behavior), answer from that text.
- Prompt writing / prompt improvement requests are in-scope creative help — write or improve the prompt using the selected model/session context. Do not use the missing-information support reply for prompt help.
- Use the missing-information support reply only when a factual Zorixa product detail is truly absent from the context.`;
