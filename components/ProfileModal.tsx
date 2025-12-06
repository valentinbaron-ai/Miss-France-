
import React, { useState } from 'react';
import { UserProfile } from '../types';
import AvatarIcon, { AVAILABLE_AVATARS } from './AvatarIcon';
import { DONATION_LINK } from '../constants';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate: (username: string, avatar: string) => void;
  onLogout: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdate, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || 'default');
  const [viewMode, setViewMode] = useState<'MAIN' | 'AVATAR_SELECT'>('MAIN');

  const handleSave = () => {
    onUpdate(username, selectedAvatar);
    setIsEditing(false);
    setViewMode('MAIN');
  };

  const handleAvatarSelect = (id: string) => {
    setSelectedAvatar(id);
    // Don't save immediately, let user confirm with "Sauvegarder" button if we wanted, 
    // but for smoother UX, we update local state and let them save globally.
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="bg-gradient-to-b from-zinc-900 to-black w-full max-w-md sm:rounded-3xl border-t sm:border border-white/10 p-6 pointer-events-auto transform transition-transform duration-300 animate-slide-up shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-white/10 rounded-full mt-3"></div>

        {viewMode === 'MAIN' ? (
          <div className="flex flex-col items-center pt-6 pb-4">
              {/* Avatar with Tricolor Ring */}
              <div className="relative mb-4 group cursor-pointer" onClick={() => setViewMode('AVATAR_SELECT')}>
                  <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-br from-france-blue via-white to-france-red shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all">
                      <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-black flex items-center justify-center relative">
                          <AvatarIcon id={selectedAvatar} size="lg" className="text-premium-gold" />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Modifier</span>
                          </div>
                      </div>
                  </div>
              </div>

              {isEditing ? (
                 <div className="mb-6 w-full px-4">
                   <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">Pseudo</label>
                   <div className="flex gap-2">
                     <input 
                       type="text" 
                       value={username}
                       onChange={(e) => setUsername(e.target.value)}
                       className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-premium-gold/50"
                     />
                     <button onClick={handleSave} className="bg-premium-gold text-black font-bold px-4 rounded-lg text-sm">OK</button>
                   </div>
                 </div>
              ) : (
                <div className="text-center mb-6">
                   <h2 className="text-2xl font-bold text-white mb-1 flex items-center justify-center gap-2">
                     {username}
                     <button onClick={() => setIsEditing(true)} className="text-zinc-600 hover:text-white transition">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                         <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                       </svg>
                     </button>
                   </h2>
                   <p className="text-zinc-400 text-sm">Membre VIP</p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                      <div className="flex items-center gap-2">
                         <span className="text-2xl font-bold text-premium-gold">{user.points}</span>
                         <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-premium-gold"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V17H19V19Z" /></svg>
                      </div>
                      <span className="text-xs uppercase tracking-widest text-zinc-500 mt-1">Points</span>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                      <span className="text-2xl font-bold text-white">{user.totalWinnings}</span>
                      <span className="text-xs uppercase tracking-widest text-zinc-500 mt-1">Victoires</span>
                  </div>
              </div>

              <div className="w-full space-y-3">
                  <button 
                    onClick={() => setViewMode('AVATAR_SELECT')}
                    className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition flex justify-between px-6 items-center"
                  >
                      <span>Changer d'avatar</span>
                      <span className="opacity-50 text-xl">🎭</span>
                  </button>
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition flex justify-between px-6 items-center"
                  >
                      <span>Changer de pseudo</span>
                      <span className="opacity-50 text-xl">✏️</span>
                  </button>
                  
                  {/* Bouton de Don */}
                  <button 
                    onClick={() => window.open(DONATION_LINK, '_blank')}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#B8860B] via-premium-gold to-[#B8860B] text-black font-bold hover:brightness-110 transition flex justify-between px-6 items-center shadow-lg shadow-premium-gold/10 mt-2"
                  >
                      <span>Faire un don pour participer 🎁</span>
                      <span className="text-xl">❤️</span>
                  </button>
              </div>

              <div className="w-full mt-8 pt-4 border-t border-white/5 space-y-3">
                 <button onClick={onLogout} className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 font-bold text-xs uppercase tracking-widest hover:bg-red-500/10 transition">
                     Se déconnecter
                 </button>
                 <button onClick={onClose} className="w-full text-center text-sm text-zinc-500 hover:text-white transition">
                     Fermer
                 </button>
              </div>
          </div>
        ) : (
          <div className="pt-2 pb-4">
             <div className="flex items-center justify-between mb-6">
                <button onClick={() => setViewMode('MAIN')} className="text-sm text-zinc-400 hover:text-white">← Retour</button>
                <h3 className="font-bold text-white text-lg">Choisir un Avatar</h3>
                <div className="w-8"></div>
             </div>

             <div className="grid grid-cols-3 gap-4 mb-6">
                {AVAILABLE_AVATARS.map(avatarId => (
                  <button
                    key={avatarId}
                    onClick={() => handleAvatarSelect(avatarId)}
                    className={`aspect-square rounded-2xl flex items-center justify-center transition-all border ${selectedAvatar === avatarId ? 'bg-premium-gold/20 border-premium-gold shadow-lg shadow-premium-gold/20 scale-105' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                  >
                     <AvatarIcon id={avatarId} size="md" className={selectedAvatar === avatarId ? 'text-premium-gold' : 'text-zinc-400'} />
                  </button>
                ))}
             </div>

             <button 
               onClick={() => { onUpdate(username, selectedAvatar); setViewMode('MAIN'); }}
               className="w-full py-4 bg-premium-gold text-black font-bold rounded-xl uppercase tracking-widest shadow-lg shadow-premium-gold/20"
             >
               Confirmer
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
