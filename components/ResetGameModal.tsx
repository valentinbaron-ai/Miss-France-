
import React, { useState } from 'react';

interface ResetGameModalProps {
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const ResetGameModal: React.FC<ResetGameModalProps> = ({ onClose, onConfirm, isLoading }) => {
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');

  const handleFirstConfirm = () => {
    setStep(2);
  };

  const handleFinalConfirm = () => {
    if (confirmText.toUpperCase() === 'RESET') {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay Backdrop */}
      <div 
        className="absolute inset-0 bg-red-950/90 backdrop-blur-xl transition-opacity" 
        onClick={isLoading ? undefined : onClose} 
      />

      {/* Modal Content */}
      <div className="bg-black w-full max-w-sm rounded-2xl border-4 border-red-600 p-6 relative shadow-2xl animate-slide-up overflow-hidden">
        
        {/* Striped Warning Background Effect */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-black to-red-500"></div>

        <div className="text-center mb-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4 border-2 border-red-500 text-3xl animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.5)]">
            ☢️
          </div>
          <h2 className="text-2xl font-black text-red-500 uppercase tracking-widest mb-1">ZONE DANGER</h2>
          <p className="text-white font-bold text-xs uppercase tracking-wide">RÉINITIALISATION TOTALE DU JEU</p>
        </div>

        {step === 1 ? (
          <div className="space-y-4 relative z-10">
             <div className="bg-red-900/30 p-4 rounded-xl border border-red-500/30">
               <p className="text-white text-sm font-bold text-center mb-2">ACTIONS IMMÉDIATES :</p>
               <ul className="text-xs text-red-200 space-y-1.5 list-disc pl-4">
                  <li>Suppression de <strong>TOUS</strong> les paris/votes.</li>
                  <li>Remise à zéro de <strong>TOUS</strong> les points joueurs.</li>
                  <li>Effacement des résultats officiels (Top 12/5).</li>
               </ul>
             </div>
             <p className="text-zinc-500 text-[10px] text-center italic">
               Les comptes utilisateurs (email/mot de passe) sont conservés.
             </p>
             <button
               type="button"
               onClick={handleFirstConfirm}
               className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase rounded-xl transition shadow-lg shadow-red-900/40 active:scale-95"
             >
               Je comprends les risques
             </button>
             <button type="button" onClick={onClose} className="w-full py-3 text-zinc-500 text-xs font-bold uppercase hover:text-white transition">Annuler</button>
          </div>
        ) : (
          <div className="space-y-4 relative z-10">
             <p className="text-white text-sm text-center font-bold bg-white/10 p-2 rounded">
               DERNIÈRE VÉRIFICATION
             </p>
             <p className="text-zinc-400 text-xs text-center px-4">
               Cette action est irréversible. Tapez <strong>RESET</strong> pour déclencher le nettoyage.
             </p>
             <input
               type="text"
               value={confirmText}
               onChange={e => setConfirmText(e.target.value)}
               placeholder="Tapez RESET ici"
               className="w-full bg-black border-2 border-red-500 rounded-xl p-4 text-center text-white font-black text-xl uppercase tracking-[0.2em] focus:outline-none focus:ring-4 focus:ring-red-500/50 transition placeholder-zinc-700"
               autoFocus
             />
             <button
               type="button"
               onClick={handleFinalConfirm}
               disabled={confirmText.toUpperCase() !== 'RESET' || isLoading}
               className={`w-full py-4 font-black uppercase rounded-xl transition flex items-center justify-center gap-2 shadow-xl ${confirmText.toUpperCase() === 'RESET' ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer transform hover:scale-105' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
             >
               {isLoading ? (
                 <>
                   <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                   <span>NETTOYAGE...</span>
                 </>
               ) : (
                 'CONFIRMER LE RESET'
               )}
             </button>
             {!isLoading && (
               <button type="button" onClick={onClose} className="w-full py-3 text-zinc-500 text-xs font-bold uppercase hover:text-white transition">Annuler</button>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetGameModal;
