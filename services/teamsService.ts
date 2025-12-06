
import { supabase } from './supabase';
import { Team, TeamMember, ChatMessage } from '../types';

// Récupérer les Comités de l'utilisateur
export const fetchMyTeams = async (userId: string): Promise<Team[]> => {
  const { data: memberships, error: memError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId);

  if (memError || !memberships || memberships.length === 0) return [];

  const teamIds = memberships.map(m => m.team_id);

  const { data: teamsData, error: teamsError } = await supabase
    .from('teams')
    .select('*')
    .in('id', teamIds);

  if (teamsError || !teamsData) return [];

  const teams: Team[] = await Promise.all(teamsData.map(async (t: any) => {
      const { count } = await supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', t.id);
      
      return {
        id: t.id,
        name: t.name,
        memberCount: count || 1,
        rank: 0,
        inviteCode: t.invite_code,
        members: [],
        messages: []
      };
  }));

  return teams;
};

// Récupérer TOUS les comités pour l'exploration
export const fetchAllTeams = async (): Promise<Team[]> => {
  const { data: teamsData, error } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50); // Limite pour performance

  if (error || !teamsData) return [];

  const teams: Team[] = await Promise.all(teamsData.map(async (t: any) => {
      // On récupère le count approximatif
      const { count } = await supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', t.id);
      
      return {
        id: t.id,
        name: t.name,
        memberCount: count || 1,
        rank: 0,
        inviteCode: t.invite_code, // S'il y a un code, c'est privé
        isPublic: !t.invite_code,
        members: [],
        messages: []
      };
  }));

  return teams;
};

// Créer un Comité
export const createTeamInDb = async (name: string, userId: string): Promise<Team | null> => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data: team, error } = await supabase
    .from('teams')
    .insert([{ name, created_by: userId, invite_code: code }])
    .select()
    .single();

  if (error || !team) {
    console.error("Erreur création team:", error);
    return null;
  }

  await supabase.from('team_members').insert([{ team_id: team.id, user_id: userId }]);

  return {
    id: team.id,
    name: team.name,
    memberCount: 1,
    rank: 0,
    inviteCode: team.invite_code,
    members: [],
    messages: []
  };
};

// Rejoindre un Comité
export const joinTeamInDb = async (code: string, userId: string): Promise<{ success: boolean, message?: string, team?: Team }> => {
  // 1. Trouver le comité
  const { data: team, error } = await supabase
    .from('teams')
    .select('*')
    .eq('invite_code', code.toUpperCase()) // Toujours majuscule
    .single();

  if (error || !team) return { success: false, message: "Code introuvable. Vérifiez l'orthographe." };

  // 2. Vérifier si déjà membre
  const { data: existing } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', team.id)
    .eq('user_id', userId)
    .single();

  if (existing) return { success: false, message: "Vous faites déjà partie de ce comité." };

  // 3. Ajouter le membre
  const { error: joinError } = await supabase.from('team_members').insert([{ team_id: team.id, user_id: userId }]);

  if (joinError) return { success: false, message: "Impossible de rejoindre. Erreur technique." };

  return { 
    success: true, 
    team: {
        id: team.id,
        name: team.name,
        memberCount: 1, 
        rank: 0,
        inviteCode: team.invite_code,
        members: [],
        messages: []
    }
  };
};

// Récupérer les détails
export const fetchTeamDetails = async (teamId: string, currentUserId: string): Promise<{ members: TeamMember[], messages: ChatMessage[] }> => {
  // Membres
  const { data: membersData } = await supabase
    .from('team_members')
    .select(`
      user_id,
      profiles:user_id ( username, avatar_id, credits, points, total_winnings )
    `)
    .eq('team_id', teamId);

  const members: TeamMember[] = membersData?.map((m: any) => ({
    id: m.user_id,
    name: m.profiles?.username || 'Inconnu',
    points: m.profiles?.points || 0,
    avatar: m.profiles?.avatar_id || 'default',
    isMe: m.user_id === currentUserId
  })) || [];

  // Messages (Chat)
  const { data: msgData } = await supabase
    .from('messages')
    .select(`
        id,
        content,
        created_at,
        user_id,
        profiles:user_id ( username, avatar_id )
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: true });

  const messages: ChatMessage[] = msgData?.map((m: any) => ({
    id: m.id,
    userId: m.user_id,
    userName: m.profiles?.username || '...',
    userAvatar: m.profiles?.avatar_id || 'default',
    content: m.content,
    timestamp: new Date(m.created_at).getTime()
  })) || [];

  return { members, messages };
};

export const sendMessageInDb = async (teamId: string, userId: string, content: string) => {
  await supabase.from('messages').insert([{ team_id: teamId, user_id: userId, content }]);
};
