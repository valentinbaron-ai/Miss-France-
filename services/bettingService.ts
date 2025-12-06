
import { BetType, Candidate } from '../types';

export interface BetComputation {
  type: BetType;
  label: string;
  minSelection: number;
  exactSelection: number;
  getMultiplier: () => number;
  description: string;
}

export const BET_TYPES: Record<BetType, BetComputation> = {
  'SIMPLE_GAGNANT': {
    type: 'SIMPLE_GAGNANT',
    label: 'Gagnant',
    minSelection: 1,
    exactSelection: 1,
    getMultiplier: () => 3, // Fixed x3
    description: "Multipliez votre mise par 3 !"
  },
  'COUPLE_GAGNANT': {
    type: 'COUPLE_GAGNANT',
    label: 'Couplé Gagnant',
    minSelection: 2,
    exactSelection: 2,
    getMultiplier: () => 10, // Fixed x10
    description: "Les 2 doivent passer. Multiplicateur x10."
  },
  'COUPLE_PLACE': {
    type: 'COUPLE_PLACE',
    label: 'Couplé Placé',
    minSelection: 2,
    exactSelection: 2,
    getMultiplier: () => 4, // Fixed x4
    description: "Au moins 1 passe. Multiplicateur x4."
  },
  'TRIO_GAGNANT': {
    type: 'TRIO_GAGNANT',
    label: 'Trio Gagnant',
    minSelection: 3,
    exactSelection: 3,
    getMultiplier: () => 25, // Fixed x25
    description: "Les 3 doivent passer. Multiplicateur x25."
  },
  'TRIO_PLACE': {
    type: 'TRIO_PLACE',
    label: 'Trio Placé',
    minSelection: 3,
    exactSelection: 3,
    getMultiplier: () => 8, // Fixed x8
    description: "Au moins 2 passent. Multiplicateur x8."
  },
  'QUARTE_GAGNANT': {
    type: 'QUARTE_GAGNANT',
    label: 'Quarté Gagnant',
    minSelection: 4,
    exactSelection: 4,
    getMultiplier: () => 50,
    description: "Les 4 doivent passer. Multiplicateur x50."
  },
  'QUINTE_GAGNANT': {
    type: 'QUINTE_GAGNANT',
    label: 'Quinté Gagnant',
    minSelection: 5,
    exactSelection: 5,
    getMultiplier: () => 100,
    description: "Le Jackpot ! Multiplicateur x100."
  }
};
