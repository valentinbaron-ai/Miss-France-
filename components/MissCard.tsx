import React from 'react';
import { Candidate } from '../types';
import AvatarIcon from './AvatarIcon';

export interface MissCardProps {
  candidate: Candidate;
  selected?: boolean;
  onPress?: (candidate: Candidate) => void;
  // onDetail removed as requested
  disabled?: boolean;
  size?: 'standard' | 'small';
  badge?: string;
}

const MissCard: React.FC<MissCardProps> = ({ candidate, selected, onPress, disabled, size = 'standard', badge }) => {
  const isSmall = size === 'small';

  return (
    <div 
      onClick={() => !disabled && onPress && onPress(candidate)}
      className={`
        relative flex flex-col rounded-lg overflow-hidden transition-all duration-300 cursor-pointer group
        ${selected 
            ? 'ring-2 ring-premium-gold transform scale-[1.02] shadow-xl shadow-premium-gold/20' 
            : 'border border-white/10 hover:border-white/30 hover:shadow-lg'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
      `}
    >
      {/* Badge de statut */}
      {badge && (
        <div className={`absolute top-2 right-2 z-30 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest shadow-lg border border-black/20 ${badge.includes('✓') ? 'bg-green-500 text-black' : 'bg-red-600 text-white'}`}>
           {badge}
        </div>
      )}
      
      {/* Visual Area (Crown + Region instead of Photo) */}
      <div className={`relative w-full ${isSmall ? 'aspect-[3/4]' : 'aspect-[4/5]'} bg-zinc-900 flex flex-col items-center justify-center p-4 overflow-hidden group-hover:bg-zinc-800 transition-colors`}>
        
        {/* Background decorative glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50" />
        <div className="absolute w-24 h-24 bg-premium-gold/5 rounded-full blur-xl group-hover:bg-premium-gold/10 transition-all"></div>

        {/* Crown Icon */}
        <div className={`relative z-10 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110 ${isSmall ? 'mb-2' : 'mb-4'}`}>
           <AvatarIcon id="crown" size={isSmall ? "md" : "xl"} className="text-premium-gold drop-shadow-lg" />
        </div>

        {/* Region Name */}
        <div className="relative z-10 text-center">
            <p className={`font-black uppercase tracking-widest text-white leading-tight ${isSmall ? 'text-[10px]' : 'text-sm'}`}>
                {candidate.region}
            </p>
            <div className={`mx-auto bg-premium-gold rounded-full mt-2 ${isSmall ? 'w-4 h-0.5' : 'w-8 h-1 group-hover:w-12 transition-all'}`}></div>
        </div>

      </div>
      
      {/* Info Area */}
      <div className={`absolute bottom-0 w-full ${isSmall ? 'p-2 bg-black/80' : 'p-3 bg-black/60 backdrop-blur-sm'}`}>
        <div className="text-center">
            <h3 className={`font-serif font-bold text-zinc-300 truncate ${isSmall ? 'text-[9px]' : 'text-xs'}`}>
              {candidate.name}
            </h3>
        </div>
      </div>

      {/* Selected Indicator */}
      {selected && !badge && (
        <div className={`absolute ${isSmall ? 'top-1 right-1' : 'top-2 right-2'}`}>
           <div className={`${isSmall ? 'w-4 h-4' : 'w-6 h-6'} bg-green-500 text-black rounded-full flex items-center justify-center shadow-lg animate-bounce`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`${isSmall ? 'h-2 w-2' : 'h-3 w-3'}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
           </div>
        </div>
      )}
    </div>
  );
};

export default MissCard;