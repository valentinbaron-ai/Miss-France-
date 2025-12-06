
import React, { useState } from 'react';
import { searchUsers, sendFriendRequest } from '../services/socialService';
import { UserSearchResult } from '../types';
import AvatarIcon from './AvatarIcon';

interface UserSearchModalProps {
  currentUserId: string;
  onClose: () => void;
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({ currentUserId, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length >= 2) {
      setLoading(true);
      const res = await searchUsers(val, currentUserId);
      setResults(res);
      setLoading(false);
    } else {
      setResults([]);
    }
  };

  const handleAdd = async (targetId: string) => {
    const success = await sendFriendRequest(currentUserId, targetId);
    if (success) {
      setSentRequests([...sentRequests, targetId]);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-20">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="bg-zinc-900 w-full max-w-sm rounded-2xl border border-white/10 p-4 relative pointer-events-auto shadow-2xl animate-slide-up">
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-white font-bold text-lg">Rechercher un ami</h3>
           <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        <input 
           type="text" 
           value={query}
           onChange={e => handleSearch(e.target.value)}
           placeholder="Pseudo du joueur..."
           className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white mb-4 focus:border-premium-gold outline-none"
           autoFocus
        />

        <div className="max-h-60 overflow-y-auto space-y-2">
           {loading && <p className="text-zinc-500 text-xs text-center">Recherche...</p>}
           
           {!loading && results.length === 0 && query.length >= 2 && (
             <p className="text-zinc-500 text-xs text-center">Aucun joueur trouvé.</p>
           )}

           {results.map(user => (
             <div key={user.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-black border border-white/10 overflow-hidden">
                      <AvatarIcon id={user.avatar} size="md" />
                   </div>
                   <span className="font-bold text-white text-sm">{user.username}</span>
                </div>
                {sentRequests.includes(user.id) ? (
                   <span className="text-xs text-green-500 font-bold">Envoyé ✓</span>
                ) : (
                   <button 
                     onClick={() => handleAdd(user.id)}
                     className="bg-premium-gold text-black text-xs font-bold px-3 py-1.5 rounded-full hover:scale-105 transition"
                   >
                     Ajouter
                   </button>
                )}
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;
