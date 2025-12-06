
import { supabase } from './supabase';
import { UserProfile } from '../types';

// Connexion stricte
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data.user, error };
};

// Inscription stricte
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { user: data.user, error };
};

// Mot de passe oublié
export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
  });
  return { error };
};

// Gardé pour compatibilité si besoin, mais on privilégie les appels distincts désormais
export const signInOrSignUp = async (email: string, password: string): Promise<{ user: any, error: any }> => {
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (!signUpError && signUpData.user) {
      return { user: signUpData.user, error: null };
    }

    if (signUpError && signUpError.message.includes('already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
           return { user: null, error: signInError };
        }
        return { user: signInData.user, error: null };
    }

    return { user: null, error: signUpError };

  } catch (e) {
    return { user: null, error: e };
  }
};

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    username: data.username || data.email?.split('@')[0] || 'Joueur',
    avatar: data.avatar_id || 'default',
    points: data.points || 0,
    credits: data.credits || 0,
    totalWinnings: data.total_winnings || 0
  };
};

export const ensureProfileExists = async (userId: string, emailOrPseudo: string) => {
  const { data } = await supabase.from('profiles').select('id').eq('id', userId).single();
  
  if (!data) {
    console.log("⚠️ Profil manquant détecté. Réparation en cours...");
    const username = emailOrPseudo.split('@')[0];
    
    const { error } = await supabase.from('profiles').insert([{
        id: userId,
        username: username,
        avatar_id: 'default',
        points: 0,
        credits: 100,
        total_winnings: 0
    }]);

    if (error) console.error("Échec de la réparation du profil:", error);
    else console.log("✅ Profil réparé avec succès.");
  }
};

export const updateUserAvatar = async (userId: string, avatarId: string) => {
  await supabase.from('profiles').update({ avatar_id: avatarId }).eq('id', userId);
};

export const updateUserPseudo = async (userId: string, username: string) => {
  await supabase.from('profiles').update({ username: username }).eq('id', userId);
};

export const updateUserPoints = async (userId: string, points: number) => {
  const { error } = await supabase.from('profiles').update({ points: points }).eq('id', userId);
  if (error) {
    console.error("Erreur sauvegarde points:", JSON.stringify(error, null, 2));
  }
};