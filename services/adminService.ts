import { supabase } from './supabase';
import { OfficialResults, UserProfile, PlayerSelection } from '../types';
import { calculateFantasyScore } from './scoreService';

export const fetchOfficialResults = async (): Promise<OfficialResults> => {
  const { data, error } = await supabase
    .from('official_results')
    .select('*')
    .eq('id', 'CURRENT')
    .single();

  if (error || !data) {
    return {
      top15: [],
      top5: [],
      podium: {
        winner: '',
        firstRunnerUp: '',
        secondRunnerUp: '',
        thirdRunnerUp: '',
        fourthRunnerUp: ''
      }
    };
  }

  return {
    top15: data.top15 || [],
    top5: data.top5 || [],
    podium: {
      winner: data.winner_id || '',
      firstRunnerUp: data.first_runner_up_id || '',
      secondRunnerUp: data.second_runner_up_id || '',
      thirdRunnerUp: data.third_runner_up_id || '',
      fourthRunnerUp: data.fourth_runner_up_id || ''
    }
  };
};

export const updateOfficialResults = async (results: OfficialResults) => {
  const payload = {
    top15: results.top15,
    top5: results.top5,
    winner_id: results.podium.winner,
    first_runner_up_id: results.podium.firstRunnerUp,
    second_runner_up_id: results.podium.secondRunnerUp,
    third_runner_up_id: results.podium.thirdRunnerUp,
    fourth_runner_up_id: results.podium.fourthRunnerUp,
    updated_at: new Date()
  };

  const { error } = await supabase
    .from('official_results')
    .update(payload)
    .eq('id', 'CURRENT');

  if (error) {
    console.error("Erreur sauvegarde admin:", error);
    throw error;
  }
};

/**
 * Force le recalcul des points pour TOUS les utilisateurs enregistrés
 * basé sur les résultats officiels actuels.
 * Indispensable pour mettre à jour le Leaderboard pour les utilisateurs hors ligne.
 */
export const triggerGlobalScoreUpdate = async (): Promise<{ updated: number, errors: number }> => {
  console.log("🔄 Démarrage du calcul global des scores...");
  
  // 1. Récupérer les résultats officiels actuels
  const officialResults = await fetchOfficialResults();
  
  // 2. Récupérer TOUS les paris (SQUAD et PODIUM)
  const { data: allBets, error: betsError } = await supabase
    .from('bets')
    .select('*');

  if (betsError || !allBets) {
    throw new Error("Impossible de récupérer les paris joueurs.");
  }

  // 3. Récupérer la liste des utilisateurs concernés
  const userIds = [...new Set(allBets.map((b: any) => b.user_id))] as string[];
  console.log(` -> ${userIds.length} joueurs avec des paris trouvés.`);

  let updatedCount = 0;
  let errorCount = 0;

  // 4. Pour chaque utilisateur, reconstruire ses choix et calculer le score
  for (const userId of userIds) {
    try {
      const userBets = allBets.filter((b: any) => b.user_id === userId);
      
      // Reconstitution SQUAD
      const squadBet = userBets.find((b: any) => b.type === 'SQUAD');
      const squadSelection: PlayerSelection | undefined = squadBet ? {
        id: squadBet.id,
        userId: userId,
        type: 'SQUAD',
        candidateIds: squadBet.candidate_ids,
        timestamp: 0
      } : undefined;

      // Reconstitution PODIUM
      const podiumBet = userBets.find((b: any) => b.type === 'PODIUM');
      const podiumSelection: PlayerSelection | undefined = podiumBet ? {
        id: podiumBet.id,
        userId: userId,
        type: 'PODIUM',
        candidateIds: podiumBet.candidate_ids,
        timestamp: 0,
        modificationCount: podiumBet.stake // Le stake stocke le compteur de modifs
      } : undefined;

      // Calcul du score via le service existant
      const scoreData = calculateFantasyScore(squadSelection, podiumSelection, officialResults);

      // Mise à jour du profil utilisateur
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: scoreData.total })
        .eq('id', userId);

      if (updateError) {
        console.error(`Erreur update user ${userId}:`, updateError);
        errorCount++;
      } else {
        updatedCount++;
      }

    } catch (e) {
      console.error(`Exception pour user ${userId}:`, e);
      errorCount++;
    }
  }

  console.log(`✅ Calcul terminé. Mis à jour: ${updatedCount}, Erreurs: ${errorCount}`);
  return { updated: updatedCount, errors: errorCount };
};

/**
 * Interface de rapport pour le reset
 */
export interface ResetStats {
  success: boolean;
  betsDeleted: number;
  profilesReset: number;
  resultsReset: boolean;
  errors: string[];
}

/**
 * FONCTION DE RÉINITIALISATION "NUCLÉAIRE" AMÉLIORÉE
 * Retourne un rapport détaillé de ce qui a été fait.
 */
export const resetOfficialResults = async (): Promise<ResetStats> => {
  console.log("☢️ DÉMARRAGE DU PROTOCOLE DE RÉINITIALISATION...");
  const stats: ResetStats = {
    success: false,
    betsDeleted: 0,
    profilesReset: 0,
    resultsReset: false,
    errors: []
  };

  try {
    // ---------------------------------------------------------
    // ETAPE 1 : Vider les résultats officiels (Admin)
    // ---------------------------------------------------------
    console.log("Step 1 : Nettoyage des résultats officiels...");
    const emptyPayload = {
      top15: [], 
      top5: [],
      winner_id: null,
      first_runner_up_id: null,
      second_runner_up_id: null,
      third_runner_up_id: null,
      fourth_runner_up_id: null,
      updated_at: new Date()
    };
    
    const { error: errOfficial } = await supabase.from('official_results').update(emptyPayload).eq('id', 'CURRENT');
    if (errOfficial) {
      stats.errors.push(`Erreur Reset Résultats: ${errOfficial.message}`);
    } else {
      stats.resultsReset = true;
    }
    
    // ---------------------------------------------------------
    // ETAPE 2 : Supprimer tous les votes/paris (Bets)
    // ---------------------------------------------------------
    console.log("Step 2 : Suppression des paris...");
    
    // Récupérer TOUS les IDs de paris d'abord
    const { data: allBets, error: fetchBetsError } = await supabase.from('bets').select('id');
    
    if (fetchBetsError) {
      stats.errors.push(`Erreur Lecture Paris: ${fetchBetsError.message}`);
    } else if (allBets && allBets.length > 0) {
        console.log(` -> ${allBets.length} paris trouvés à supprimer.`);
        // Suppression un par un pour éviter les blocages RLS ou timeouts
        for (const bet of allBets) {
            const { error: delErr } = await supabase.from('bets').delete().eq('id', bet.id);
            if (!delErr) stats.betsDeleted++;
            else console.warn(`Echec suppression pari ${bet.id}`);
        }
    }
    console.log(` -> ${stats.betsDeleted} paris supprimés.`);

    // ---------------------------------------------------------
    // ETAPE 3 : Réinitialiser les Profils Joueurs
    // ---------------------------------------------------------
    console.log("Step 3 : Remise à zéro des profils...");
    
    const resetProfilePayload = { 
      points: 0, 
      credits: 100, 
      total_winnings: 0 
    };

    // Récupérer TOUS les profils
    const { data: profiles, error: fetchProfilesError } = await supabase.from('profiles').select('id, username');

    if (fetchProfilesError) {
      stats.errors.push(`Erreur Lecture Profils: ${fetchProfilesError.message}`);
    } else if (profiles && profiles.length > 0) {
       console.log(` -> ${profiles.length} profils trouvés à réinitialiser.`);
       
       for (const p of profiles) {
          // On update profil par profil
          const { error: updateError } = await supabase
              .from('profiles')
              .update(resetProfilePayload)
              .eq('id', p.id);
          
          if (updateError) {
              console.warn(`⚠️ Erreur reset profil ${p.username} (${p.id}):`, updateError.message);
              // On ne bloque pas, on continue
          } else {
              stats.profilesReset++;
          }
       }
    } else {
      console.warn("⚠️ AUCUN PROFIL TROUVÉ (Possible restriction RLS)");
      stats.errors.push("Aucun profil trouvé (Vérifiez les règles RLS si vous avez des utilisateurs)");
    }
    console.log(` -> ${stats.profilesReset} profils réinitialisés.`);

    stats.success = true;
    console.log("🎉 RESET COMPLET TERMINÉ.", stats);
    return stats;

  } catch (e: any) {
    console.error("❌ ERREUR CRITIQUE RESET:", e);
    stats.errors.push(`Exception Critique: ${e.message}`);
    return stats;
  }
};

export const fetchAllProfiles = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('points', { ascending: false }); 

  if (error || !data) {
    console.error("Erreur fetch profiles:", error);
    return [];
  }

  return data.map((p: any) => ({
    id: p.id,
    username: p.username || 'Inconnu',
    email: p.email,
    avatar: p.avatar_id,
    points: p.points,
    credits: p.credits,
    totalWinnings: p.total_winnings || 0
  }));
};