
import { supabase } from './supabase';
import { LeaderboardEntry } from '../types';

export const fetchNationalLeaderboard = async (currentUserId: string): Promise<LeaderboardEntry[]> => {
  try {
    // Récupère le top 50 trié par points
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_id, points')
      .order('points', { ascending: false })
      .limit(50);

    if (error) {
      // On convertit l'objet erreur en chaîne pour le voir dans la console
      console.error("Erreur classement national:", JSON.stringify(error, null, 2));
      return [];
    }

    if (!data) return [];

    return data.map((profile: any, index: number) => ({
      id: profile.id,
      username: profile.username || 'Anonyme',
      avatar: profile.avatar_id || 'default',
      points: profile.points || 0,
      rank: index + 1,
      isMe: profile.id === currentUserId
    }));
  } catch (err) {
    console.error("Erreur fetch leaderboard:", err);
    return [];
  }
};
