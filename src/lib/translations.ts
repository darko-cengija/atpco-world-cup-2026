/**
 * Display aliases for team names.
 * Keys are the names stored in Firestore; values are what the UI shows.
 */
export const countryNames: Record<string, string> = {
  'Korea Republic': 'South Korea',
  Türkiye: 'Turkey',
}

const teamNameSoftBreaks: Record<string, string> = {
  Bournemouth: 'Bourne\u00ADmouth',
  Brighton: 'Bright\u00ADon',
  Newcastle: 'New\u00ADcastle',
  Sunderland: 'Sunder\u00ADland',
  Wolverhampton: 'Wolver\u00ADhampton',
}

/** Returns the display name for a country, falling back to the stored name. */
export function getCountryName(englishName: string): string {
  return countryNames[englishName] ?? englishName
}

/** Adds manual soft-break points for proper names that browsers hyphenate poorly. */
export function getTeamNameWithSoftBreaks(displayName: string): string {
  return teamNameSoftBreaks[displayName] ?? displayName
}

export const stageNames: Record<string, string> = {
  'Regular Season': 'Regular Season',
  'Group Stage': 'Group Stage',
  'League Phase': 'League Phase',
  'Knockout Round Play-offs': 'Knockout Round Play-offs',
  'Round of 32': 'Round of 32',
  'Round of 16': 'Round of 16',
  'Quarter-finals': 'Quarter-finals',
  'Semi-finals': 'Semi-finals',
  'Third Place Play-off': 'Third Place Play-off',
  Final: 'Final',
}

/** Returns the display name for a tournament stage, falling back to the stored name. */
export function getStageName(englishName: string): string {
  return stageNames[englishName] ?? englishName
}
