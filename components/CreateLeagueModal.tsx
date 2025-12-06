
import React, { useState } from 'react';
import PrimaryButton from './PrimaryButton';

interface CreateLeagueModalProps {
  onClose: () => void;
  onCreate: (name: string) => void;
}

const CreateLeagueModal: React.FC<CreateLeagueModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (name.trim().length > 0) {
      onCreate(name);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="bg-gradient-to-b from-zinc-900 to-black w-full max-w-sm rounded-3xl border border-white/10 p-6 relative pointer-events-auto shadow-2xl animate-slide-up">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-white/10 rounded-full mt-3"></div>

        <div className="text-center mb-8 mt-2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-black to-zinc-900 flex items-center justify-center mx-auto mb-4 border border-premium-gold/30 text-4xl shadow-[0_0_20px_rgba(212,175,55,0.1)]">
            ✨
          </div>
          <h2 className="text-2xl font-serif font-bold text-white">Créer un Comité</h2>
          <p className="text-zinc-500 text-xs mt-2 uppercase tracking-wide">Devenez le Président</p>
        </div>

        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-[10px] font-bold text-premium-gold uppercase tracking-widest mb-2 ml-1">Nom du Comité</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Comité des Amis"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-zinc-700 focus:outline-none focus:border-premium-gold/50 focus:ring-1 focus:ring-premium-gold/50 transition font-serif"
              autoFocus
            />
          </div>
        </div>

        <PrimaryButton 
          title="Créer et Inviter" 
          onPress={handleSubmit}
          disabled={name.trim().length === 0}
          variant="gold"
        />
        
        <button onClick={onClose} className="w-full mt-5 py-2 text-zinc-500 text-xs uppercase tracking-widest hover:text-white transition">
          Annuler
        </button>
      </div>
    </div>
  );
};

export default CreateLeagueModal;
