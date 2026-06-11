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

/** Collapse leetspeak and punctuation so simple evasions still match. */
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

const RULES: Rule[] = [
  {
    category: "child_exploitation",
    patterns: [
      /\bchild\s+porn\b/,
      /\bchild\s+sex\b/,
      /\bchild\s+nude\b/,
      /\bchild\s+naked\b/,
      /\bunderage\s+(sex|nude|naked|porn)\b/,
      /\bminor\s+(sex|nude|naked|porn)\b/,
      /\bpedoph/,
      /\bpaedoph/,
      /\bloli\b/,
      /\bshota\b/,
      /\bpreteen\s+(sex|nude|naked|porn)\b/,
      /\bkiddie\s+porn\b/,
      /\bcsam\b/,
      /\bjailbait\b/
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
      /\bimpersonat(e|ing|ion)\b/,
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
      /\bxxx\b/,
      /\bhentai\b/,
      /\berotic\s+film\b/,
      /\badult\s+film\b/,
      /\bhardcore\s+sex\b/
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
      /\bwithout\s+clothes\b/,
      /\bremove\s+clothes\b/,
      /\bundress\b/,
      /\bstrip\s+clothes\b/
    ]
  },
  {
    category: "sexual_content",
    patterns: [
      /\bexplicit\s+sex\b/,
      /\bsex\s+scene\b/,
      /\bsexual\s+intercourse\b/,
      /\bmake\s+love\b/,
      /\borgasm\b/,
      /\bmasturbat/,
      /\bblow\s*job\b/,
      /\bhand\s*job\b/,
      /\banal\s+sex\b/,
      /\boral\s+sex\b/,
      /\bnsfw\b/,
      /\bonlyfans\b/,
      /\bstripper\b/,
      /\bprostitut/,
      /\bbrothel\b/,
      /\berotic\b/,
      /\bsexy\s+(woman|man|girl|boy|model)\b/,
      /\b(seduc|arousing)\b/
    ]
  },
  {
    category: "nsfw",
    patterns: [/\bnsfw\b/, /\bnot\s+safe\s+for\s+work\b/, /\badult\s+only\b/]
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
      /\bincest\b/
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

  const match = firstMatch(normalized);
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
