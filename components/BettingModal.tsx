
import React, { useState, useEffect } from 'react';
import { Candidate, BetType } from '../types';
import { BET_TYPES } from '../services/bettingService';
import PrimaryButton from './PrimaryButton';
import Logo from './Logo';

interface BettingModalProps {
  selectedCandidates: Candidate[];
  onClose: () => void;
  onConfirm: (betType: BetType, stake: number, odds: number, potentialGain: number) => void;
  userCredits: number;
}

const BettingModal: React.FC<BettingModalProps> = ({ selectedCandidates, onClose, onConfirm, userCredits }) => {
  const [stake, setStake] = useState<number>(10);
  const [selectedBetType, setSelectedBetType] = useState<BetType | null>(null);

  // Determine available bet types based on selection count
  const count = selectedCandidates.length;
  const availableTypes = Object.values(BET_TYPES).filter(t => t.exactSelection === count);

  useEffect(() => {
    if (availableTypes.length > 0 && !selectedBetType) {
      setSelectedBetType(availableTypes[0].type);
    }
  }, [count, availableTypes]);

  const currentBetConfig = selectedBetType ? BET_TYPES[selectedBetType] : null;
  // Use fixed multiplier
  const multiplier = currentBetConfig ? currentBetConfig.getMultiplier() : 0;
  const potentialGain = stake * multiplier;

  const handleStakeChange = (delta: number) => {
    const newStake = stake + delta;
    if (newStake >= 5 && newStake <= userCredits) {
      setStake(newStake);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="bg-gradient-to-b from-zinc-900 to-black w-full max-w-md sm:rounded-3xl border-t sm:border border-white/10 p-6 pointer-events-auto transform transition-transform duration-300 max-h-[90vh] overflow-y-auto shadow-2xl shadow-black relative animate-slide-up">
        
        {/* Decorative Gold Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-premium-gold to-transparent opacity-50 rounded-full mt-2"></div>

        <div className="flex justify-between items-center mb-6 pt-2">
          <div>
            <h2 className="text-2xl font-serif font-bold text-white">Validation</h2>
            <p className="text-premium-gold text-xs uppercase tracking-widest mt-1">Confirmez votre prono</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition">✕</button>
        </div>

        {/* Selected Candidates Summary */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-6 no-scrollbar mask-linear-fade">
          {selectedCandidates.map(c => (
             <div key={c.id} className="flex-shrink-0 w-16 text-center group">
                <div className="w-16 h-16 rounded-full border-2 border-white/10 group-hover:border-premium-gold transition-colors overflow-hidden mb-2 relative shadow-lg bg-black flex items-center justify-center">
                  {c.photoUrl === 'LOGO_PLACEHOLDER' ? (
                     <Logo size="sm" className="scale-75 opacity-80" />
                  ) : (
                    <img src={c.photoUrl} className="w-full h-full object-cover" />
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 truncate font-serif">{c.name.split(' ')[0]}</p>
             </div>
          ))}
        </div>

        {/* Bet Type Selection */}
        <div className="mb-6">
          <label className="text-premium-gold text-[10px] uppercase font-bold mb-3 block tracking-widest">Type de prono</label>
          <div className="grid grid-cols-1 gap-2">
            {availableTypes.length > 0 ? availableTypes.map(bt => (
              <button
                key={bt.type}
                onClick={() => setSelectedBetType(bt.type)}
                className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all duration-300 group
                  ${selectedBetType === bt.type 
                    ? 'bg-gradient-to-r from-france-blue/20 to-transparent border-france-blue shadow-[0_0_15px_rgba(0,85,164,0.2)]' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                  }
                `}
              >
                <div>
                  <span className={`font-bold block text-sm ${selectedBetType === bt.type ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{bt.label}</span>
                  <span className="text-[10px] opacity-60 text-zinc-500">{bt.description}</span>
                </div>
                {selectedBetType === bt.type && (
                  <div className="bg-premium-gold text-black text-xs font-bold px-2 py-1 rounded shadow-lg transform scale-110">
                    x{bt.getMultiplier()}
                  </div>
                )}
              </button>
            )) : (
              <p className="text-red-400 text-sm border border-red-900/50 bg-red-900/10 p-3 rounded-lg">Aucun type de prono disponible pour {count} candidate(s).</p>
            )}
          </div>
        </div>

        {/* Stake Input */}
        {currentBetConfig && (
          <div className="mb-8">
            <div className="flex justify-between text-[10px] text-zinc-500 mb-3 uppercase font-bold tracking-widest">
              <span>Votre Mise</span>
              <div className="flex items-center gap-1 text-premium-gold">
                <span>Solde : {userCredits}</span>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V17H19V19Z" /></svg>
              </div>
            </div>
            
            <div className="bg-black/40 p-1.5 rounded-2xl border border-white/10 flex items-center gap-2 mb-3">
               <button 
                 onClick={() => handleStakeChange(-5)} 
                 className="w-12 h-12 bg-white/5 rounded-xl text-white font-bold hover:bg-white/10 active:scale-95 transition text-lg"
               >−</button>
               <div className="flex-1 text-center flex items-center justify-center gap-2">
                 <span className="text-3xl font-serif font-bold text-white">{stake}</span>
                 <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-premium-gold"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V17H19V19Z" /></svg>
               </div>
               <button 
                 onClick={() => handleStakeChange(5)} 
                 className="w-12 h-12 bg-white/5 rounded-xl text-white font-bold hover:bg-white/10 active:scale-95 transition text-lg"
               >+</button>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2 justify-center">
              {[10, 20, 50, 100].map(amt => (
                <button 
                  key={amt} 
                  disabled={amt > userCredits}
                  onClick={() => setStake(amt)}
                  className={`text-[10px] font-bold px-4 py-1.5 rounded-full border transition-all
                    ${amt === stake 
                      ? 'bg-premium-gold text-black border-premium-gold' 
                      : amt > userCredits 
                        ? 'opacity-20 border-white/10 cursor-not-allowed' 
                        : 'border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'
                    }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Summary & Action */}
        <div className="bg-gradient-to-r from-zinc-900 to-black p-5 rounded-2xl border border-white/10 mb-6 relative overflow-hidden group">
           <div className="absolute inset-0 bg-premium-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <div className="flex justify-between items-center mb-1 relative z-10">
             <span className="text-zinc-500 text-xs">Multiplicateur</span>
             <span className="text-zinc-300 font-bold font-mono">x{multiplier}</span>
           </div>
           <div className="flex justify-between items-end relative z-10">
             <span className="text-zinc-400 text-sm uppercase tracking-wide font-bold">Gain potentiel</span>
             <div className="flex items-center gap-1">
               <span className="text-premium-gold font-bold text-2xl font-serif text-shadow-gold">{potentialGain}</span>
               <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-premium-gold"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V17H19V19Z" /></svg>
             </div>
           </div>
        </div>

        <PrimaryButton 
          title={stake > userCredits ? "Solde insuffisant" : "Valider le prono"} 
          onPress={() => currentBetConfig && onConfirm(selectedBetType!, stake, multiplier, potentialGain)}
          disabled={!currentBetConfig || stake > userCredits}
          variant="gold"
          className="w-full shadow-lg shadow-premium-gold/10"
        />
      </div>
    </div>
  );
};

export default BettingModal;
