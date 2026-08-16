// Shared list of reason codes for why a post is deleted/removed.
// A post should only be deleted after the editor has already tried moving it to
// a better-fitting magazine and it still doesn't suit. Max 10 entries incl Other.
export const DELETION_REASONS = [
  { code: "not_suitable", label: "Not suitable for publication" },
  { code: "not_real", label: "Not real content (AI spam / hoax / fabricated)" },
  { code: "duplicate", label: "Duplicate of an existing post" },
  { code: "off_topic", label: "Off-topic — no magazine fits even after moving" },
  { code: "low_quality", label: "Low quality / thin / no substance" },
  { code: "misleading", label: "Misleading headline or false claims" },
  { code: "outdated", label: "Outdated / superseded" },
  { code: "regulatory", label: "Regulatory / legal / sensitive to publish" },
  { code: "broken_source", label: "Broken or unverifiable source link" },
  { code: "other", label: "Other" },
] as const;

export type DeletionReasonCode = (typeof DELETION_REASONS)[number]["code"];

export function deletionReasonLabel(code: string): string {
  const hit = DELETION_REASONS.find((r) => r.code === code);
  return hit ? hit.label : code;
}

// Subset codes that should keep nudging toward a magazine (i.e. NOT deletions
// that reflect badly on the source itself). Everything else hurts source health.
export const SOURCE_NEUTRAL_REASONS = new Set<string>(["duplicate", "outdated", "regulatory"]);