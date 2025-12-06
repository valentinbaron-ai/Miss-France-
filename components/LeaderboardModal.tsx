
import React from 'react';
import { LeaderboardEntry } from '../types';
import AvatarIcon from './AvatarIcon';

interface LeaderboardModalProps {
  title: string;
  data: LeaderboardEntry[];
  onClose: () => void;
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ title, data, onClose }) => {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 pt-12">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="bg-gradient-to-b from-zinc-900 to-black w-full max-w-md h-[80vh] rounded-3xl border border-white/10 p-0 relative pointer-events-auto shadow-2xl animate-slide-up flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-black/50 flex justify-between items-center shrink-0">
           <div>
             <h2 className="text-xl font-serif font-bold text-white">{title}</h2>
             <p className="text-xs text-zinc-400 uppercase tracking-widest">{data.length} Joueurs</p>
           </div>
           <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition">✕</button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
           {data.length === 0 ? (
             <div className="text-center py-10 text-zinc-500">Aucun classement disponible.</div>
           ) : (
             data.map((entry, index) => {
               // Calcul du rang si non fourni ou forcé par l'index
               const rank = entry.rank || index + 1;
               
               let rankStyle = "text-zinc-500 font-bold";
               let bgStyle = "bg-white/5 border-white/5";
               let icon = null;

               if (rank === 1) { 
                 rankStyle = "text-yellow-400 font-black text-lg"; 
                 bgStyle = "bg-yellow-500/10 border-yellow-500/30";
                 icon = "👑";
               } else if (rank === 2) { 
                 rankStyle = "text-gray-300 font-bold text-md"; 
                 bgStyle = "bg-gray-400/10 border-gray-400/30";
               } else if (rank === 3) { 
                 rankStyle = "text-orange-400 font-bold text-md"; 
                 bgStyle = "bg-orange-500/10 border-orange-500/30";
               }

               if (entry.isMe) {
                 bgStyle = "bg-france-blue/20 border-france-blue/50 shadow-[0_0_15px_rgba(0,85,164,0.3)]";
               }

               return (
                 <div key={entry.id} className={`flex items-center gap-4 p-3 rounded-xl border ${bgStyle} transition-all`}>
                    <div className={`w-8 text-center ${rankStyle}`}>
                       {icon || rank}
                    </div>
                    
                    <div className="relative">
                       <div className={`w-10 h-10 rounded-full bg-black overflow-hidden border ${entry.isMe ? 'border-premium-gold' : 'border-white/10'}`}>
                          <AvatarIcon id={entry.avatar} size="md" />
                       </div>
                       {entry.isMe && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>}
                    </div>

                    <div className="flex-1 min-w-0">
                       <p className={`text-sm font-bold truncate ${entry.isMe ? 'text-premium-gold' : 'text-white'}`}>
                         {entry.username} {entry.isMe && '(Moi)'}
                       </p>
                       <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                         {rank === 1 ? 'Leader' : `${entry.points} points`}
                       </p>
                    </div>

                    <div className="text-right">
                       <span className="font-mono font-bold text-white text-lg">{entry.points}</span>
                       <span className="text-[9px] text-zinc-500 block">PTS</span>
                    </div>
                 </div>
               );
             })
           )}
        </div>
        
        {/* Footer info */}
        <div className="p-3 bg-black/80 border-t border-white/5 text-center">
           <p className="text-[9px] text-zinc-600">Classement mis à jour en temps réel</p>
        </div>

      </div>
    </div>
  );
};

export default LeaderboardModal;
