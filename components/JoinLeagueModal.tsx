
import React, { useState, useEffect } from 'react';
import PrimaryButton from './PrimaryButton';

interface JoinLeagueModalProps {
  onClose: () => void;
  onJoin: (code: string) => void;
  error?: string | null;
  initialCode?: string;
}

const JoinLeagueModal: React.FC<JoinLeagueModalProps> = ({ onClose, onJoin, error, initialCode = '' }) => {
  const [code, setCode] = useState(initialCode);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = () => {
    if (code.trim().length > 0) {
      onJoin(code.trim().toUpperCase());
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="bg-gradient-to-b from-zinc-900 to-black w-full max-w-sm rounded-3xl border border-white/10 p-6 relative pointer-events-auto shadow-2xl animate-slide-up">
        
         {/* Decorative elements */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-white/10 rounded-full mt-3"></div>

        <div className="text-center mb-8 mt-2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-black to-zinc-900 flex items-center justify-center mx-auto mb-4 border border-france-blue/30 text-4xl shadow-[0_0_20px_rgba(0,85,164,0.15)]">
            🎟️
          </div>
          <h2 className="text-2xl font-serif font-bold text-white">Rejoindre un Comité</h2>
          <p className="text-zinc-500 text-xs mt-2 uppercase tracking-wide">
            {initialCode ? "Code détecté" : "Entrez votre code invité"}
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-[10px] font-bold text-france-blue uppercase tracking-widest mb-2 ml-1">Code d'invitation</label>
            <input 
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: PRONO75"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-zinc-700 text-center font-mono text-xl tracking-[0.2em] uppercase focus:outline-none focus:border-france-blue focus:ring-1 focus:ring-france-blue transition"
              autoFocus={!initialCode}
              maxLength={10}
            />
            {error && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-france-red" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-france-red text-xs font-bold">{error}</p>
              </div>
            )}
          </div>
        </div>

        <PrimaryButton 
          title={initialCode ? "Confirmer" : "Rejoindre"} 
          onPress={handleSubmit}
          disabled={code.trim().length < 3}
          variant="secondary"
          className="bg-france-card hover:bg-france-blue border border-france-blue/20"
        />
        
        <button onClick={onClose} className="w-full mt-5 py-2 text-zinc-500 text-xs uppercase tracking-widest hover:text-white transition">
          Annuler
        </button>
      </div>
    </div>
  );
};

export default JoinLeagueModal;
