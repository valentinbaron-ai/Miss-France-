
import { PlayerSelection, OfficialResults, ScoreDetails } from '../types';
import { CANDIDATES } from '../data/missCandidates';

const getRegion = (id: string) => {
  const c = CANDIDATES.find(cand => cand.id === id);
  return c ? c.region : id;
};

export const calculateFantasyScore = (
  squadSelection: PlayerSelection | undefined,
  podiumSelection: PlayerSelection | undefined,
  official: OfficialResults
): ScoreDetails => {
  let score = 0;
  const breakdown: string[] = [];
  const squadIds = squadSelection?.candidateIds || []; 
  const podiumIds = podiumSelection?.candidateIds || []; // [Winner, 1st, 2nd, 3rd, 4th]

  // --- 1. SQUAD (Les 12 Qualifiées) ---
  const officialPodiumList = [
    official.podium.winner, 
    official.podium.firstRunnerUp, 
    official.podium.secondRunnerUp,
    official.podium.thirdRunnerUp,
    official.podium.fourthRunnerUp
  ].filter(id => id); 

  squadIds.forEach(id => {
    if (!id) return;
    const region = getRegion(id);

    // Si la candidate est dans le Top 15/12 officiel (+1 pt)
    if (official.top15.includes(id)) {
      score += 1;
      breakdown.push(`+1 pt : ${region} dans le Top 12`);
    }
    // Si la candidate est dans le Top 5 officiel (+3 pts)
    if (official.top5.includes(id)) {
      score += 3;
      breakdown.push(`+3 pts : ${region} dans le Top 5`);
    }
    // Si la candidate est sur le Podium final (+5 pts)
    if (officialPodiumList.includes(id)) {
      score += 5;
      breakdown.push(`+5 pts : ${region} sur le Podium Final`);
    }
  });

  // --- 2. PODIUM (Prédiction Top 5 - Mon Top 5) ---
  if (podiumIds.length >= 3) {
    const userWinner = podiumIds[0];
    const user1st = podiumIds[1];
    const user2nd = podiumIds[2];
    const user3rd = podiumIds[3];
    const user4th = podiumIds[4];

    const realWinner = official.podium.winner;
    const real1st = official.podium.firstRunnerUp;
    const real2nd = official.podium.secondRunnerUp;
    const real3rd = official.podium.thirdRunnerUp;
    const real4th = official.podium.fourthRunnerUp;
    
    const realPodiumArray = [realWinner, real1st, real2nd, real3rd, real4th];

    // Pour chaque miss de TON Top 5
    podiumIds.forEach((id, index) => {
      if (!id) return;
      const region = getRegion(id);

      // Est-elle présente dans le vrai Top 5 ? (+5 pts)
      if (realPodiumArray.includes(id)) {
        score += 5;
        breakdown.push(`+5 pts : ${region} (Prono Top 5) confirmée`);
      }
    });

    // BONUS : Respect de l'ordre exact (+3 pts par bonne place)
    if (realWinner && userWinner === realWinner) { score += 3; breakdown.push(`+3 pts : ${getRegion(userWinner)} est bien Miss France`); }
    if (real1st && user1st === real1st) { score += 3; breakdown.push(`+3 pts : ${getRegion(user1st)} est bien 1ère Dauphine`); }
    if (real2nd && user2nd === real2nd) { score += 3; breakdown.push(`+3 pts : ${getRegion(user2nd)} est bien 2ème Dauphine`); }
    if (real3rd && user3rd === real3rd) { score += 3; breakdown.push(`+3 pts : ${getRegion(user3rd)} est bien 3ème Dauphine`); }
    if (real4th && user4th === real4th) { score += 3; breakdown.push(`+3 pts : ${getRegion(user4th)} est bien 4ème Dauphine`); }

    // --- 3. BONUS COHÉRENCE ---
    const consistentCandidates = podiumIds.filter(pid => pid && squadIds.includes(pid) && realPodiumArray.includes(pid));
    if (consistentCandidates.length > 0) {
      // Note: La logique précédente donnait +3 une seule fois si au moins une candidate était cohérente.
      // On garde cette logique ou on l'affine. Ici on garde +3 global.
      score += 3;
      breakdown.push(`+3 pts : Bonus Cohérence (Prono Top 5 inclus dans Top 12)`);
    }

    // Grand Chelem
    const allInTop5 = realPodiumArray.every(realId => realId && podiumIds.includes(realId));
    if (allInTop5 && podiumIds.length === 5 && realPodiumArray.filter(x => x).length === 5) {
      score += 5;
      breakdown.push(`+5 pts : GRAND CHELEM ! Le Top 5 est complet.`);
    }
  }

  // --- 4. MALUS MODIFICATION ---
  if (podiumSelection?.modificationCount) {
    const penalty = podiumSelection.modificationCount * 2;
    score -= penalty;
    breakdown.push(`-${penalty} pts : Pénalité modification (${podiumSelection.modificationCount}x)`);
  }

  return { total: score, breakdown };
};
