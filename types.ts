
export interface Candidate {
  id: string;
  name: string;
  region: string;
  photoUrl: string;
  age: number;
  height: number;
  bio: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar?: string;
  points: number; // Remplacement de 'credits' par 'points'
  credits: number; // Added to support betting features
  totalWinnings: number; // Added to support profile stats
  rank?: number;
  email?: string; // Visible only for admin
}

// Structure de stockage dans la BDD (table 'bets' recyclée en 'selections')
export type SelectionType = 'SQUAD' | 'PODIUM';

export interface PlayerSelection {
  id: string;
  userId: string;
  type: SelectionType;
  candidateIds: string[]; // 10 ids pour SQUAD, 5 ids ordonnés pour PODIUM (Top 5)
  timestamp: number;
  modificationCount?: number; // Pour le malus
}

export interface TeamMember {
  id: string;
  name: string;
  points: number; // Fantasy Points
  avatar: string;
  isMe?: boolean;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar: string;
  points: number;
  rank: number;
  isMe: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: number;
}

export interface Team {
  id: string;
  name: string;
  memberCount: number;
  rank: number;
  inviteCode?: string;
  members: TeamMember[];
  messages: ChatMessage[];
  isPublic?: boolean; // Pour l'affichage cadenas
}

export type ScreenName = 
  | 'Home'
  | 'Candidates' // NOUVEAU : Trombinoscope
  | 'Squad' // Selection Top 15
  | 'Podium' // Selection Top 5
  | 'Teams'
  | 'TeamDetail'
  | 'Rules'
  | 'Admin';

// --- SCORING TYPES ---

export interface OfficialResults {
  top15: string[]; // Ids
  top5: string[];
  podium: {
    winner: string;
    firstRunnerUp: string;
    secondRunnerUp: string;
    thirdRunnerUp: string; // 3ème dauphine
    fourthRunnerUp: string; // 4ème dauphine
  };
}

export interface ScoreDetails {
  total: number;
  breakdown: string[]; // Liste des logs (ex: "+3 pts Alsace Top 5")
}

// --- BETTING TYPES ---

export type BetType = 
  | 'SIMPLE_GAGNANT' 
  | 'COUPLE_GAGNANT' 
  | 'COUPLE_PLACE' 
  | 'TRIO_GAGNANT' 
  | 'TRIO_PLACE' 
  | 'QUARTE_GAGNANT' 
  | 'QUINTE_GAGNANT';

// --- SOCIAL TYPES ---

export interface FriendRequest {
  id: string;
  fromUser: { id: string; username: string; avatar: string };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface UserSearchResult {
  id: string;
  username: string;
  avatar: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
}
