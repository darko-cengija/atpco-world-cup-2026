import type { FifaMemberAssociation } from '@/data/fifaMemberAssociations'
import type { Team } from '@/types'

export function normalizeTeamName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function getReplacementOptions(
  associations: FifaMemberAssociation[],
  activeTeams: Team[],
) {
  const activeIds = new Set(activeTeams.map((team) => team.id))
  const activeNames = new Set(activeTeams.map((team) => normalizeTeamName(team.name)))

  return associations
    .filter((association) =>
      !activeIds.has(association.id)
      && !activeNames.has(normalizeTeamName(association.name))
      && !(association.apiFootballAliases ?? []).some((alias) => activeNames.has(normalizeTeamName(alias))),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'hr', { sensitivity: 'base' }))
}
