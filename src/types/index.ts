export type UserRole = 'admin' | 'player'

export interface AppUser {
  uid: string
  email: string
  displayName: string
  avatarUrl: string | null
  role: UserRole
  onboardingComplete: boolean
}

export interface Team {
  id: string
  name: string
  flag: string
  group: string
  confederation?: string
  drawEligible?: boolean
  drawSeedOrder?: number
  fifaRank?: number
  fifaRankingSnapshot?: string
  apiFootballAliases?: string[]
  replacement?: {
    active: boolean
    replacedTeamId: string
    replacedTeamName: string
    replacedTeamFlag: string
    replacementAssociationId: string
    replacementName: string
    replacementFlag: string
    replacedAt?: unknown
    replacedByUid?: string
  }
}

export type DrawStatus = 'list_building' | 'draw_day' | 'completed'
export type DrawPhase = 'round_intro' | 'picking' | 'round_summary' | 'completed'

export interface DrawConfig {
  drawStatus?: DrawStatus
  drawRankingSnapshot?: string
  drawRankingSnapshotDate?: string
  drawTeamCount?: number
  teamsPerPlayer?: number
  competitionMode?: string
  competitionName?: string
  gameStartedAt?: unknown
}

export interface DrawPlayerSnapshot {
  uid: string
  displayName: string
  avatarUrl: string | null
}

export interface DrawAssignment {
  userId: string
  teamId: string
  round: number
  pick: number
  assignedAt?: unknown
}

export interface DrawState {
  status: DrawPhase
  roundNumber: number
  roundCount: number
  teamsPerPlayer: number
  numberOfTeams: number
  numberOfPlayers: number
  doubleOwnedLimit: number
  players: DrawPlayerSnapshot[]
  teamIds: string[]
  currentRoundOrder: string[]
  currentPlayerIndex: number | null
  currentPlayerId: string | null
  currentSelectionTeamId: string | null
  assignments: DrawAssignment[]
  startedAt?: unknown
  updatedAt?: unknown
}

export interface PlayerTeam {
  id: string
  userId: string
  teamId: string
}

export type MatchStatus = 'upcoming' | 'live' | 'finished'

export interface Match {
  id: string
  homeTeamId: string
  awayTeamId: string
  homeTeam: Team
  awayTeam: Team
  date: Date
  venue: string
  stage: string
  status: MatchStatus
  homeScore: number | null
  awayScore: number | null
  qualifier: 'home' | 'away' | null
  minute: number | null
  statusShort: string | null
}

export type PredictionOutcome = '1' | 'X' | 'X1' | 'X2' | '2'

export interface Prediction {
  id: string
  matchId: string
  userId: string
  outcome: PredictionOutcome
  submittedAt: Date
}

export interface PlayerStanding {
  userId: string
  displayName: string
  avatarUrl: string | null
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
  teams: Team[]
}

export interface PredictionStanding {
  userId: string
  displayName: string
  avatarUrl: string | null
  points: number
}

export interface ChatMessage {
  id: string
  text: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  sentAt: Date
  replyTo?: {
    messageId: string
    authorName: string
    text: string
  }
  mentions: string[]
  reactions: Record<string, string[]>
}
