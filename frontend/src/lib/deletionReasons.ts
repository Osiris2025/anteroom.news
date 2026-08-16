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
  { code: "broken_source", label: "Broken or unverifiable source link" },
  { code: "other", label: "Other" },
] as const;

export type DeletionReasonCode = (typeof DELETION_REASONS)[number]["code"];

export function deletionReasonLabel(code: string): string {
  const hit = DELETION_REASONS.find((r) => r.code === code);
  return hit ? hit.label : code;
}

// Deletion reasons that reflect poorly on the SOURCE itself vs circumstances
// that are not the source's fault (duplicate that arrived from
// another feed, outdated, or simply didn't fit any magazine). These "minor"
// reasons still count toward the delete tally but weigh less in source health.
export const SOURCE_MINOR_DELETION_REASONS: ReadonlySet<string> = new Set<string>([
  "duplicate",
  "outdated",
  "off_topic",
]);