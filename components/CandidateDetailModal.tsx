import React, { useState } from 'react';
import { Candidate } from '../types';
import PrimaryButton from './PrimaryButton';
import AvatarIcon from './AvatarIcon';

interface CandidateDetailModalProps {
  candidates: Candidate[];
  initialIndex: number;
  onClose: () => void;
}

const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({ candidates, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const candidate = candidates[currentIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % candidates.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + candidates.length) % candidates.length);
  };

  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl transition-opacity" onClick={onClose} />
      
      <div className="bg-zinc-900 w-full max-w-sm h-[85vh] rounded-3xl border border-white/10 relative pointer-events-auto shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/50 rounded-full text-white flex items-center justify-center backdrop-blur-md">✕</button>

        {/* Image Area - REPLACED WITH GRAPHIC DESIGN */}
        <div className="relative flex-1 w-full bg-zinc-900 flex flex-col items-center justify-center overflow-hidden group">
           
           {/* Decorative Background */}
           <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black"></div>
           <div className="absolute w-64 h-64 bg-premium-gold/5 rounded-full blur-3xl"></div>

           {/* Crown & Region - Main Visual */}
           <div className="relative z-10 flex flex-col items-center">
              <div className="mb-6 transform scale-150 drop-shadow-2xl">
                 <AvatarIcon id="crown" size="xl" className="text-premium-gold" />
              </div>
              
              <h1 className="text-4xl font-black text-white uppercase tracking-widest text-center leading-none px-4 drop-shadow-lg">
                 {candidate.region}
              </h1>
              <div className="w-16 h-1.5 bg-premium-gold rounded-full mt-4 shadow-[0_0_15px_rgba(212,175,55,0.5)]"></div>
           </div>
           
           {/* Navigation Arrows */}
           <button 
             onClick={handlePrev}
             className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/30 hover:bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition z-20 border border-white/10"
           >
             ‹
           </button>
           <button 
             onClick={handleNext}
             className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/30 hover:bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition z-20 border border-white/10"
           >
             ›
           </button>
        </div>

        {/* Info Area */}
        <div className="bg-black/80 backdrop-blur-xl pt-8 pb-8 px-6 relative z-10 border-t border-white/5">
           <h2 className="text-2xl font-serif font-bold text-white mb-2">{candidate.name}</h2>
           
           <div className="flex gap-4 text-xs text-zinc-400 mb-4 border-b border-white/10 pb-4">
              <span className="font-bold text-white bg-white/10 px-2 py-1 rounded">{candidate.age} ans</span>
              <span className="font-bold text-white bg-white/10 px-2 py-1 rounded">{candidate.height} cm</span>
           </div>

           <p className="text-zinc-300 text-sm leading-relaxed italic opacity-80">
              "{candidate.bio}"
           </p>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailModal;