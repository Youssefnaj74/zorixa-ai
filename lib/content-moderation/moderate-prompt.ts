import type { ModerationCategory } from "./constants";

export type ModerationMatch = {
  category: ModerationCategory;
  pattern: string;
};

export type ModerationResult =
  | { blocked: false }
  | { blocked: true; category: ModerationCategory; pattern: string };

type Rule = {
  category: ModerationCategory;
  patterns: RegExp[];
};

/**
 * Collapse leetspeak / punctuation so simple evasions still match.
 * Providers never see the raw prompt until this gate passes.
 */
export function normalizeModerationText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[@4]/g, "a")
    .replace(/3/g, "e")
    .replace(/1|!/g, "i")
    .replace(/0/g, "o")
    .replace(/5|\$/g, "s")
    .replace(/7/g, "t")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fashion / medical / educational / cosmetic multi-word phrases that should not
 * trip soft NSFW rules. Stripped before classification so "nude makeup" stays OK
 * while "nude woman" still blocks.
 */
const SAFE_PHRASE_STRIPPERS: RegExp[] = [
  /\bsex\s+education\b/g,
  /\bsexual\s+health\b/g,
  /\bsexual\s+harassment\b/g,
  /\bconsent\s+education\b/g,
  /\breproductive\s+health\b/g,
  /\bbreast\s+cancer\b/g,
  /\bbreastfeeding\b/g,
  /\bnude\s+(makeup|lipstick|lip|palette|eyes?hadow|tones?|heels?|shoes?|flats?)\b/g,
  /\bnaked\s+(eye|truth)\b/g,
  /\bmedical\s+(illustration|diagram|textbook|education|training|anatomy)\b/g,
  /\banatomy\s+(class|lesson|study|diagram|textbook)\b/g,
  /\beducational\s+(video|film|content|diagram|anatomy)\b/g,
  /\bfigure\s+drawing\b/g,
  /\blife\s+drawing\b/g
];

/** Remove allowlisted phrases so residual text is classified. */
export function stripSafeModerationPhrases(normalized: string): string {
  let out = normalized;
  for (const pattern of SAFE_PHRASE_STRIPPERS) {
    out = out.replace(pattern, " ");
  }
  return out.replace(/\s+/g, " ").trim();
}

const RULES: Rule[] = [
  {
    category: "child_exploitation",
    patterns: [
      /\bchild\s+porn\b/,
      /\bchild\s+sex\b/,
      /\bchild\s+nude\b/,
      /\bchild\s+naked\b/,
      /\bunderage\s+(sex|nude|naked|porn|girl|boy)\b/,
      /\bminor\s+(sex|nude|naked|porn)\b/,
      /\b(nude|naked|sex|porn|erotic)\b.{0,40}\b(underage|minor|child|preteen|toddler)\b/,
      /\b(underage|minor|child|preteen|toddler)\b.{0,40}\b(nude|naked|sex|porn|erotic)\b/,
      /\bpedoph/,
      /\bpaedoph/,
      /\bloli\b/,
      /\bshota\b/,
      /\bpreteen\s+(sex|nude|naked|porn)\b/,
      /\bkiddie\s+porn\b/,
      /\bcsam\b/,
      /\bjailbait\b/,
      /\bchild\s+sexual\b/,
      /\byoung\s+(girl|boy)s?\s+(nude|naked|sex|porn)\b/
    ]
  },
  {
    category: "deepfake_impersonation",
    patterns: [
      /\bdeep\s*fake\b/,
      /\bdeepfake\b/,
      /\bface\s*swap\b/,
      /\bfaceswap\b/,
      /\bfake\s+nude\b/,
      /\bnudify\b/,
      /\bnon\s*consensual\b/,
      /\brevenge\s+porn\b/,
      /\bimpersonat(e|ing|ion)\b.{0,30}\b(nude|naked|sex|porn)\b/,
      /\bwithout\s+consent\b/,
      /\blook\s+like\s+[a-z]+\s+(nude|naked|sex)\b/,
      /\bcelebrity\s+(nude|naked|porn|sex)\b/
    ]
  },
  {
    category: "pornography",
    patterns: [
      /\bporn\b/,
      /\bporno\b/,
      /\bpornograph/,
      /\bxxx\b/,
      /\bhentai\b/,
      /\brule\s*34\b/,
      /\berotic\s+(film|video|movie|scene|content|manga|anime)\b/,
      /\badult\s+(film|video|movie|content|site)\b/,
      /\bhardcore\s+(sex|porn|xxx)\b/,
      /\bsoftcore\b/,
      /\bcam\s*girl\b/,
      /\bonlyfans\b/,
      /\bpornstar\b/,
      /\bsex\s+tape\b/,
      /\bsex\s+video\b/,
      /\bsex\s+film\b/
    ]
  },
  {
    category: "nudity",
    patterns: [
      /\bnude\b/,
      /\bnudes\b/,
      /\bnudity\b/,
      /\bnaked\b/,
      /\btopless\b/,
      /\bbottomless\b/,
      /\bfully\s+nude\b/,
      /\bno\s+clothes\b/,
      /\bwithout\s+(any\s+)?clothes\b/,
      /\bremove\s+(her|his|their|the)\s+clothes\b/,
      /\bremove\s+clothes\b/,
      /\bundress(es|ing|ed)?\b/,
      /\bstrip\s+(naked|nude|clothes|down)\b/,
      /\bstripping\b/,
      /\b(show|showing|exposed)\s+(her|his|their)\s+(breasts?|nipples?|genitals?|butt|ass|vagina|penis)\b/,
      /\bbare\s+(breasts?|chest|genitals?|body)\b/,
      /\bno\s+underwear\b/,
      /\bwithout\s+underwear\b/
    ]
  },
  {
    category: "sexual_content",
    patterns: [
      /\bexplicit\s+sex\b/,
      /\bsex\s+scene\b/,
      /\bsexual\s+(intercourse|act|content|activity|video|pose)\b/,
      /\b(having|have|had|does)\s+sex\b/,
      /\bmake\s+love\b/,
      /\bintercourse\b/,
      /\borgasm\b/,
      /\bmasturbat/,
      /\bblow\s*job\b/,
      /\bhand\s*job\b/,
      /\banal\s+sex\b/,
      /\boral\s+sex\b/,
      /\bcunnilingus\b/,
      /\bfellatio\b/,
      /\bthreesome\b/,
      /\borgy\b/,
      /\bgangbang\b/,
      /\bcumshot\b/,
      /\bcreampie\b/,
      /\bbukk?ake\b/,
      /\bdildo\b/,
      /\bvibrator\b/,
      /\bsex\s+toy\b/,
      /\bfetish\b/,
      /\bbdsm\b/,
      /\bbondage\b/,
      /\bkink(y)?\s+(sex|scene|play)\b/,
      /\bsado\s*masoch/,
      /\brape\b/,
      /\braping\b/,
      /\braped\b/,
      /\bnoncon\b/,
      /\bforced\s+sex\b/,
      /\bincest\b/,
      /\bstep(mom|dad|sister|brother|daughter|son)\s+(sex|nude|naked)\b/,
      /\bbestiality\b/,
      /\bzoophil/,
      /\banimal\s+sex\b/,
      /\bfucks?\b/,
      /\bfucking\b/,
      /\bfucked\b/,
      /\b(cock|dick|pussy)\b/,
      /\b(penis|vagina|clitoris)\b.{0,20}\b(sex|erotic|aroused|hard|wet)\b/,
      /\b(sex|erotic|aroused)\b.{0,20}\b(penis|vagina|clitoris)\b/,
      /\bhumping\b/,
      /\bmoaning\s+(in\s+)?(bed|pleasure|ecstasy)\b/,
      /\berotic\b/,
      /\bstripper\b/,
      /\bstrip\s+tease\b/,
      /\bprostitut/,
      /\bbrothel\b/,
      /\blap\s+dance\b/,
      /\bnsfw\b/,
      /\bnot\s+safe\s+for\s+work\b/,
      /\badult\s+only\b/,
      /\buncensored\s+(nude|naked|sex|porn)\b/,
      /\bsexy\s+(nude|naked)\b/,
      /\b(seduce|seducing)\b.{0,25}\b(bed|sex|nude|naked)\b/,
      /\barousing\b/,
      /\bsexo\b/
    ]
  },
  {
    category: "nsfw",
    patterns: [
      /\bnsfw\b/,
      /\bnot\s+safe\s+for\s+work\b/,
      /\badult\s+only\b/,
      /\b18\s+plus\b/,
      /\b18\s+only\b/
    ]
  },
  {
    category: "illegal_content",
    patterns: [
      /\bhow\s+to\s+make\s+(a\s+)?bomb\b/,
      /\bbuild\s+(a\s+)?bomb\b/,
      /\bterrorist\s+attack\b/,
      /\bchild\s+traffick/,
      /\bhuman\s+traffick/,
      /\bsnuff\s+film\b/,
      /\bbestiality\b/,
      /\bzoophil/,
      /\bincest\b/,
      /\brape\b/,
      /\braping\b/,
      /\braped\b/
    ]
  }
];

function firstMatch(normalized: string): ModerationMatch | null {
  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(normalized)) {
        return { category: rule.category, pattern: pattern.source };
      }
    }
  }
  return null;
}

export function moderatePrompt(text: string): ModerationResult {
  const normalized = normalizeModerationText(text);
  if (!normalized) return { blocked: false };

  const searchable = stripSafeModerationPhrases(normalized);
  if (!searchable) return { blocked: false };

  const match = firstMatch(searchable);
  if (!match) return { blocked: false };

  return {
    blocked: true,
    category: match.category,
    pattern: match.pattern
  };
}

/** Moderate multiple user-supplied strings; returns first violation. */
export function moderateTexts(texts: Array<string | null | undefined>): ModerationResult {
  for (const text of texts) {
    if (typeof text !== "string") continue;
    const trimmed = text.trim();
    if (!trimmed) continue;
    const result = moderatePrompt(trimmed);
    if (result.blocked) return result;
  }
  return { blocked: false };
}
