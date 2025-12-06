
import { supabase } from './supabase';
import { UserSearchResult } from '../types';

export const searchUsers = async (query: string, currentUserId: string): Promise<UserSearchResult[]> => {
  if (!query || query.length < 2) return [];

  // Recherche des profils correspondant au username (case insensitive via ilike)
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_id')
    .ilike('username', `%${query}%`)
    .limit(10);

  if (error || !data) return [];

  // On filtre pour ne pas se voir soi-même
  const others = data.filter((u: any) => u.id !== currentUserId);

  return others.map((u: any) => ({
    id: u.id,
    username: u.username,
    avatar: u.avatar_id || 'default',
    isFriend: false, // À implémenter avec une vraie table friendships
    hasPendingRequest: false // À implémenter
  }));
};

export const sendFriendRequest = async (fromUserId: string, toUserId: string): Promise<boolean> => {
  // Simulation ou vraie implémentation si table friendships existe
  // Pour l'instant on simule le succès pour l'interface UI
  console.log(`Friend request from ${fromUserId} to ${toUserId}`);
  
  /* Vrai code si table existe :
  const { error } = await supabase
    .from('friendships')
    .insert([{ user_id_1: fromUserId, user_id_2: toUserId, status: 'PENDING' }]);
  return !error;
  */
  
  return true;
};
