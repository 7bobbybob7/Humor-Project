/**
 * A rotating daily theme. The point is a reason to come back tomorrow: the
 * prompt on the generate page changes every day, and the feed can be filtered
 * to today. Derived from the date so every visitor sees the same theme without
 * needing a table or a cron job.
 */
const THEMES = [
  "Butler Library at 3am",
  "the 1 train during rush hour",
  "dining hall food on a Sunday night",
  "your first NYC winter",
  "group projects where you do everything",
  "finding an apartment in Manhattan",
  "the walk across campus in February",
  "explaining your major at Thanksgiving",
  "8:40am lectures",
  "midterm season energy",
  "bodega cats",
  "roommates who never leave",
  "tourists in Times Square",
  "the printer in the library basement",
];

export function themeForToday(now = new Date()): string {
  // Days since epoch in UTC, so the theme flips at the same moment for everyone.
  const day = Math.floor(now.getTime() / 86_400_000);
  return THEMES[day % THEMES.length];
}

/** Hours until the theme rotates, for the "come back tomorrow" nudge. */
export function hoursUntilNextTheme(now = new Date()): number {
  const nextMidnightUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return Math.max(1, Math.ceil((nextMidnightUtc - now.getTime()) / 3_600_000));
}
