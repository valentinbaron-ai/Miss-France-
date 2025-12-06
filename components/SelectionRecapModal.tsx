import React from 'react';
import { Candidate } from '../types';
import PrimaryButton from './PrimaryButton';
import AvatarIcon from './AvatarIcon';
import Logo from './Logo';

interface SelectionRecapModalProps {
  squad: Candidate[];
  podiumIds: string[]; // [winnerId, 1st, 2nd, 3rd, 4th]
  allCandidates: Candidate[];
  onClose: () => void;
  userName: string;
}

const SelectionRecapModal: React.FC<SelectionRecapModalProps> = ({ squad, podiumIds, allCandidates, onClose, userName }) => {
  
  const getCandidate = (id: string) => allCandidates.find(c => c.id === id);
  
  const winner = getCandidate(podiumIds[0]);
  const first = getCandidate(podiumIds[1]);
  const second = getCandidate(podiumIds[2]);
  const third = getCandidate(podiumIds[3]);
  const fourth = getCandidate(podiumIds[4]);

  const handleShare = async () => {
    const winnerName = winner ? winner.name : "Non définie";
    const squadNames = squad.map(c => c.name.split(' ')[0]).join(', ');
    
    const text = `👑 MF- MISS FANTASY 👑\n\nVoici ma Sélection Officielle pour 2026 !\n\n✨ Ma Miss France : ${winnerName}\n🔥 Mes 12 Finalistes : ${squadNames}\n\nViens me défier sur l'appli !`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ma Sélection Miss France',
          text: text,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      // Fallback copy to clipboard
      navigator.clipboard.writeText(text);
      alert('Récap copié dans le presse-papier !');
    }
  };

  // Helper pour les cercles de dauphines (REMPLACEMENT PHOTO PAR COURONNE)
  const DauphineBubble = ({ candidate, label, color, border }: { candidate?: Candidate, label: string, color: string, border: string }) => (
    <div className="flex flex-col items-center">
        <div className={`w-12 h-12 rounded-full border-2 ${border} overflow-hidden bg-zinc-900 mb-1 shadow-lg relative flex items-center justify-center`}>
            {candidate ? (
                <div className="flex flex-col items-center justify-center w-full h-full pb-1">
                    <AvatarIcon id="crown" size="sm" className="text-white/80 scale-75" />
                    <span className="text-[6px] font-bold text-white uppercase mt-0.5">{candidate.region.substring(0, 3)}</span>
                </div>
            ) : (
                <span className="text-xl flex items-center justify-center h-full opacity-20">?</span>
            )}
            <div className={`absolute bottom-0 w-full ${color} text-black text-[6px] font-bold text-center leading-none py-0.5`}>{label}</div>
        </div>
        <p className="text-[8px] text-zinc-300 truncate w-14 text-center">{candidate?.name || '-'}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl transition-opacity" onClick={onClose} />
      
      <div className="bg-gradient-to-b from-zinc-900 to-black w-full max-w-sm rounded-3xl border border-premium-gold/30 p-0 relative pointer-events-auto shadow-2xl animate-slide-up overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-france-blue via-france-blue to-black p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/3 -translate-y-1/3">
              <Logo size="xl" />
           </div>
           <p className="text-[10px] text-premium-gold font-bold uppercase tracking-widest mb-1">DÉCISION OFFICIELLE</p>
           <h2 className="text-2xl font-serif font-bold text-white italic">LA SÉLECTION DE <span className="uppercase text-premium-gold">{userName}</span></h2>
        </div>

        <div className="p-6 overflow-y-auto">
            {/* SECTION TOP 5 (Pyramide) */}
            <div className="mb-6">
                <div className="flex justify-between items-end px-2 mb-4">
                    <h3 className="text-white font-bold uppercase text-sm flex items-center gap-2">
                        <span className="text-xl">🏆</span> Mon Top 5
                    </h3>
                    {!winner && <span className="text-[10px] text-red-400 bg-red-400/10 px-2 py-1 rounded">Incomplet</span>}
                </div>
                
                <div className="flex flex-col items-center gap-2">
                    {/* Row 1: Winner */}
                    <div className="flex flex-col items-center relative z-20">
                        <div className="absolute -top-5 text-2xl animate-bounce">👑</div>
                        <div className="w-20 h-20 rounded-full border-2 border-premium-gold overflow-hidden bg-zinc-900 mb-1 shadow-[0_0_15px_rgba(212,175,55,0.4)] relative flex items-center justify-center">
                            {winner ? (
                                <div className="flex flex-col items-center justify-center w-full h-full pb-2">
                                    <AvatarIcon id="crown" size="md" className="text-premium-gold" />
                                    <span className="text-[8px] font-bold text-white uppercase mt-1">{winner.region}</span>
                                </div>
                            ) : (
                                <span className="text-3xl flex items-center justify-center h-full opacity-20">?</span>
                            )}
                             <div className="absolute bottom-0 w-full bg-premium-gold text-black text-[9px] font-bold text-center">MISS FRANCE</div>
                        </div>
                        <p className="text-[10px] font-bold text-premium-gold truncate w-full text-center">{winner?.name || 'A définir'}</p>
                    </div>

                    {/* Row 2: 1st & 2nd Runner Up */}
                    <div className="flex justify-center gap-8 -mt-2 z-10 w-full">
                        <DauphineBubble candidate={first} label="1ÈRE" color="bg-zinc-400" border="border-zinc-400" />
                        <DauphineBubble candidate={second} label="2ÈME" color="bg-orange-400" border="border-orange-400" />
                    </div>

                    {/* Row 3: 3rd & 4th Runner Up */}
                    <div className="flex justify-center gap-8 w-full">
                        <DauphineBubble candidate={third} label="3ÈME" color="bg-pink-400" border="border-pink-400" />
                        <DauphineBubble candidate={fourth} label="4ÈME" color="bg-purple-400" border="border-purple-400" />
                    </div>
                </div>
            </div>

            {/* SEPARATOR */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-4"></div>

            {/* SECTION SQUAD */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                     <h3 className="text-white font-bold uppercase text-sm flex items-center gap-2">
                        <span className="text-xl">✨</span> Mes 12 Demi-Finalistes
                    </h3>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                    {squad.map((c, i) => (
                        <div key={c.id} className="flex flex-col items-center animate-slide-up" style={{animationDelay: `${i * 0.05}s`}}>
                            <div className="w-12 h-12 rounded-full border border-white/20 overflow-hidden bg-zinc-900 mb-1 flex items-center justify-center">
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <AvatarIcon id="crown" size="sm" className="scale-50 text-white/50" />
                                    <span className="text-[5px] font-bold text-white uppercase">{c.region.substring(0, 3)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {/* Empty slots placeholders */}
                    {Array.from({ length: Math.max(0, 12 - squad.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="flex flex-col items-center opacity-30">
                             <div className="w-12 h-12 rounded-full border border-dashed border-white/30 bg-white/5 mb-1 flex items-center justify-center text-[8px] text-white">
                                +
                             </div>
                        </div>
                    ))}
                </div>
            </div>

            <PrimaryButton 
                title="PARTAGER MES VOTES 🚀" 
                onPress={handleShare}
                variant="gold"
                className="shadow-xl shadow-premium-gold/20 mb-3"
            />
            
            <button onClick={onClose} className="w-full py-3 text-zinc-500 text-xs uppercase tracking-widest hover:text-white transition bg-white/5 rounded-xl">
                Modifier ma sélection
            </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionRecapModal;