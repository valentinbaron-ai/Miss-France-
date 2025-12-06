import React, { Component, useState, useEffect, useRef, ReactNode, ErrorInfo } from 'react';
import { supabase } from './services/supabase';
import { Candidate, ScreenName, UserProfile, Team, TeamMember, ChatMessage, PlayerSelection, LeaderboardEntry, OfficialResults } from './types';
import { fetchCandidates } from './services/candidatesService';
import { signIn, signUp, resetPassword, fetchUserProfile, updateUserAvatar, updateUserPseudo, updateUserPoints, ensureProfileExists } from './services/authService';
import { fetchMyTeams, fetchAllTeams, createTeamInDb, joinTeamInDb, fetchTeamDetails, sendMessageInDb } from './services/teamsService';
import { fetchNationalLeaderboard } from './services/leaderboardService';
import { fetchOfficialResults, updateOfficialResults, resetOfficialResults, fetchAllProfiles, triggerGlobalScoreUpdate } from './services/adminService';
import { calculateFantasyScore } from './services/scoreService';
import { ADMIN_PIN, DONATION_LINK, DONATION_TEXT } from './constants';
import MissCard from './components/MissCard';
import PrimaryButton from './components/PrimaryButton';
import ProfileModal from './components/ProfileModal';
import CreateLeagueModal from './components/CreateLeagueModal';
import JoinLeagueModal from './components/JoinLeagueModal';
import SelectionRecapModal from './components/SelectionRecapModal';
import CandidateDetailModal from './components/CandidateDetailModal';
import UserSearchModal from './components/UserSearchModal';
import LeaderboardModal from './components/LeaderboardModal'; 
import ResetGameModal from './components/ResetGameModal';
import Logo from './components/Logo';
import ThemeIcon from './components/ThemeIcon';
import AvatarIcon from './components/AvatarIcon';

// --- ERROR BOUNDARY ---

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-950 text-white p-6 font-mono overflow-auto flex flex-col items-center justify-center">
          <div className="max-w-2xl w-full bg-black/50 border border-red-500 rounded-xl p-8 shadow-2xl backdrop-blur-xl">
            <h1 className="text-3xl font-bold text-red-500 mb-4 flex items-center gap-3">
              <span>💥</span> Application Plantée
            </h1>
            <p className="text-zinc-300 mb-6">Une erreur critique est survenue. Voici les détails techniques :</p>
            
            <div className="bg-black/80 p-4 rounded-lg border border-white/10 mb-6 overflow-x-auto">
              <p className="text-red-400 font-bold mb-2">{this.state.error?.toString()}</p>
              <pre className="text-[10px] text-zinc-500 whitespace-pre-wrap">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>

            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-4 bg-white text-black font-bold uppercase rounded-xl hover:bg-zinc-200 transition"
            >
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- STYLE INJECTION ---

const TailwindInjector = () => {
  useEffect(() => {
    // Prevent overriding existing config if already present via index.html
    if (document.getElementById('tailwind-script')) return;

    const script = document.createElement('script');
    script.id = 'tailwind-script';
    script.src = "https://cdn.tailwindcss.com";
    document.head.appendChild(script);

    const configScript = document.createElement('script');
    configScript.innerHTML = `
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              france: { blue: '#002654', lightBlue: '#0055A4', red: '#EF4135', white: '#FFFFFF', dark: '#001b3d', card: '#003366' },
              premium: { dark: '#020617', card: '#0f172a', gold: '#D4AF37', goldLight: '#F3E5AB' },
              zinc: { 850: '#1e293b', 900: '#0f172a', 950: '#020617' }
            },
            fontFamily: { serif: ['Playfair Display', 'Georgia', 'serif'] }
          }
        }
      }
    `;
    document.head.appendChild(configScript);
  }, []);
  return null;
};

// --- SUB-COMPONENTS ---

const ScoreDetailsModal = ({ breakdown, score, onClose }: { breakdown: string[], score: number, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="bg-zinc-900 w-full max-w-sm rounded-2xl border border-premium-gold/30 p-5 relative shadow-2xl animate-slide-up">
        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
           <h3 className="text-white font-serif font-bold text-lg">Détail des Points</h3>
           <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-white">✕</button>
        </div>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar">
           {breakdown.length === 0 ? (
             <p className="text-zinc-500 text-xs italic text-center py-4">Aucun point marqué pour le moment.</p>
           ) : (
             breakdown.map((line, i) => (
               <div key={i} className={`text-xs p-2 rounded border ${line.startsWith('-') ? 'bg-red-900/20 border-red-500/30 text-red-200' : 'bg-green-900/20 border-green-500/30 text-green-200'}`}>
                 {line}
               </div>
             ))
           )}
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
           <span className="text-zinc-400 text-xs uppercase font-bold">Total Calculé</span>
           <span className="text-2xl font-mono font-bold text-premium-gold">{score} PTS</span>
        </div>
      </div>
    </div>
  );
};

const AuthScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) return setError("Veuillez entrer votre email.");
    setLoading(true);
    setError(null);
    setResetSent(false);
    try {
      if (mode === 'FORGOT') {
        const { error } = await resetPassword(email.trim());
        if (error) throw error;
        setResetSent(true);
      } else if (mode === 'LOGIN') {
        if (!password) { setLoading(false); return setError("Mot de passe requis"); }
        const { user, error } = await signIn(email.trim(), password.trim());
        if (error) throw error;
        if (user) {
          await ensureProfileExists(user.id, email.split('@')[0]);
          onLogin();
        }
      } else if (mode === 'SIGNUP') {
        if (!password) { setLoading(false); return setError("Mot de passe requis"); }
        if (password.length < 6) { setLoading(false); return setError("Le mot de passe doit faire 6 caractères min."); }
        const { user, error } = await signUp(email.trim(), password.trim());
        if (error) throw error;
        if (user) {
          await ensureProfileExists(user.id, email.split('@')[0]);
          onLogin();
        }
      }
    } catch (err: any) {
      if (err.message?.includes("Invalid login")) setError("Email ou mot de passe incorrect.");
      else if (err.message?.includes("already registered")) setError("Cet email est déjà inscrit. Connectez-vous.");
      else setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-premium-dark flex flex-col items-center justify-center p-6 text-white">
      <Logo size="xl" className="mb-6" />
      <div className="w-full max-w-sm bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-sm">
        <h2 className="text-2xl font-serif font-bold text-center mb-6">
          {mode === 'LOGIN' ? 'Connexion' : mode === 'SIGNUP' ? 'Créer un compte' : 'Réinitialisation'}
        </h2>
        {error && <div className="bg-red-500/20 text-red-200 text-xs p-3 rounded-lg text-center font-bold border border-red-500/30 mb-4">{error}</div>}
        {resetSent && <div className="bg-green-500/20 text-green-200 text-xs p-3 rounded-lg text-center font-bold border border-green-500/30 mb-4">Email envoyé !</div>}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1 mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-france-blue transition" placeholder="votre@email.com" />
          </div>
          {mode !== 'FORGOT' && (
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1 mb-1 block">Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white outline-none focus:border-france-blue transition" placeholder="••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-white transition">
                  {showPassword ? "👁️" : "🔒"}
                </button>
              </div>
            </div>
          )}
        </div>
        {mode === 'LOGIN' && (
          <div className="flex justify-end mt-2">
            <button onClick={() => setMode('FORGOT')} className="text-xs text-zinc-400 hover:text-white">Mot de passe oublié ?</button>
          </div>
        )}
        <PrimaryButton title={loading ? "Chargement..." : mode === 'LOGIN' ? "Se connecter" : mode === 'SIGNUP' ? "S'inscrire" : "Envoyer le lien"} onPress={handleSubmit} disabled={loading} variant="gold" className="mt-6" />
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col gap-3">
          {mode === 'LOGIN' ? (
             <>
               <p className="text-center text-xs text-zinc-400">Nouveau ici ?</p>
               <button onClick={() => { setMode('SIGNUP'); setError(null); }} className="w-full py-3 rounded-xl border border-white/20 text-white font-bold text-xs uppercase hover:bg-white/5 transition">
                 Créer un compte
               </button>
             </>
          ) : (
             <>
               <p className="text-center text-xs text-zinc-400">{mode === 'FORGOT' ? 'Retourner à la connexion' : 'Vous avez déjà un compte ?'}</p>
               <button onClick={() => { setMode('LOGIN'); setError(null); }} className="w-full py-3 rounded-xl border border-white/20 text-white font-bold text-xs uppercase hover:bg-white/5 transition">
                 J'ai déjà un compte
               </button>
             </>
          )}
        </div>
      </div>
    </div>
  );
};

const Navigation = ({ active, onNavigate }: { active: ScreenName, onNavigate: (s: ScreenName) => void }) => {
  const navItems: {id: ScreenName, iconVariant: 'home' | 'play' | 'pronos' | 'teams' | 'rules', label: string}[] = [
    { id: 'Home', iconVariant: 'home', label: 'ACCUEIL' },
    { id: 'Candidates', iconVariant: 'play', label: 'LES 30' }, 
    { id: 'Squad', iconVariant: 'pronos', label: 'MON TOP 12' }, 
    { id: 'Podium', iconVariant: 'pronos', label: 'MON TOP 5' }, 
    { id: 'Teams', iconVariant: 'teams', label: 'COMITÉS' },
    { id: 'Rules', iconVariant: 'rules', label: 'RÈGLES' }
  ];

  if (active === 'Admin') return null;

  return (
    <div className="fixed bottom-0 w-full bg-black/90 backdrop-blur-xl border-t border-white/10 pb-safe z-40 shadow-2xl">
       <div className="flex justify-around items-end h-[84px] pb-3 overflow-x-auto no-scrollbar px-2">
          {navItems.map(item => (
            <button key={item.id} onClick={() => onNavigate(item.id)} className="flex flex-col items-center justify-center min-w-[60px] h-full group">
              <div className={`mb-1 transition-transform duration-300 ${active === item.id ? '-translate-y-1' : ''}`}>
                <ThemeIcon variant={item.iconVariant} size="sm" active={active === item.id} />
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-widest ${active === item.id ? 'text-premium-gold' : 'text-zinc-600'}`}>{item.label}</span>
            </button>
          ))}
       </div>
    </div>
  );
};

const Header = ({ user, liveScore, onOpenProfile, onOpenSearch, onOpenScoreDetails }: { user: UserProfile, liveScore: number, onOpenProfile: () => void, onOpenSearch: () => void, onOpenScoreDetails: () => void }) => {
  return (
    <div className="fixed top-0 w-full z-40 px-4 py-4 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent backdrop-blur-[2px]">
       <button onClick={onOpenProfile} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-br from-france-blue via-white to-france-red">
            <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
              <AvatarIcon id={user.avatar || 'default'} size="md" className="text-premium-gold scale-75" />
            </div>
          </div>
          <div className="flex flex-col items-start">
             <span className="font-bold text-white text-sm font-serif uppercase">{user.username}</span>
             <span className="text-[10px] text-zinc-500 uppercase tracking-wider">MON PROFIL</span>
          </div>
       </button>

       <div className="flex items-center gap-3">
          <button 
             onClick={onOpenSearch}
             className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
          >
             <span className="text-sm">🔍</span>
          </button>

          <button 
             onClick={() => window.open(DONATION_LINK, '_blank')}
             className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20 hover:scale-110 transition border border-pink-400/50"
             title="Faire un don"
          >
             <span className="text-lg">❤️</span>
          </button>

          <button onClick={onOpenScoreDetails} className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-premium-gold/30 flex items-center gap-2 shadow-lg hover:bg-white/10 transition active:scale-95">
              <span className="text-[10px] text-zinc-400 uppercase mr-1">Live</span>
              <span className="text-sm font-bold text-premium-gold font-mono">{liveScore} PTS</span>
          </button>
       </div>
    </div>
  );
};

const HostVoice = ({ text }: { text: string }) => (
  <div className="bg-gradient-to-r from-france-blue/20 to-france-red/20 border-y border-white/10 p-3 mb-6 backdrop-blur-sm animate-slide-up">
    <p className="text-center text-white italic font-serif text-sm">
      <span className="text-premium-gold mr-2">❝</span>
      {text}
      <span className="text-premium-gold ml-2">❞</span>
    </p>
  </div>
);

// --- ADMIN SCREEN (RÉGIE TECHNIQUE) ---

const AdminScreen = ({ candidates, onBack }: { candidates: Candidate[], onBack: () => void }) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<'GAME' | 'PLAYERS'>('GAME'); // View Switcher
  const [step, setStep] = useState<'TOP12' | 'TOP5' | 'PODIUM'>('TOP12');
  
  // ADMIN STATE (Indépendant du User)
  const [adminResults, setAdminResults] = useState<OfficialResults>({
    top15: [], // Sera utilisé comme Top 12
    top5: [], 
    podium: { winner: '', firstRunnerUp: '', secondRunnerUp: '', thirdRunnerUp: '', fourthRunnerUp: '' }
  });
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    fetchOfficialResults().then(setAdminResults);
  }, []);
  
  useEffect(() => {
    if (isAuthenticated && view === 'PLAYERS') {
       fetchAllProfiles().then(setPlayers);
    }
  }, [isAuthenticated, view]);

  const handleLogin = () => {
    if (pin === ADMIN_PIN) setIsAuthenticated(true);
    else alert("Code PIN incorrect");
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateOfficialResults(adminResults);
      alert("✅ Résultats officiels mis à jour et diffusés aux joueurs !");
    } catch (e) {
      alert("Erreur lors de la publication");
    }
    setLoading(false);
  };

  const handleGlobalScoreUpdate = async () => {
    if (!window.confirm("Ceci va recalculer le score de TOUS les joueurs inscrits (même hors ligne) basé sur les résultats actuels. Continuer ?")) return;
    
    setCalcLoading(true);
    try {
      const stats = await triggerGlobalScoreUpdate();
      alert(`✅ Calcul terminé !\n\nJoueurs mis à jour : ${stats.updated}\nErreurs : ${stats.errors}\n\nLe classement général est maintenant synchronisé.`);
    } catch (e: any) {
      alert(`❌ Erreur: ${e.message}`);
    } finally {
      setCalcLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    setResetLoading(true);
    try {
      const stats = await resetOfficialResults();
      
      let message = `✅ TERMINÉ !\n\n📊 Bilan :\n- Paris supprimés : ${stats.betsDeleted}\n- Profils remis à zéro : ${stats.profilesReset}\n`;
      
      if (stats.errors.length > 0) {
        message += `\n⚠️ ATTENTION : ${stats.errors.length} erreur(s) détectée(s).\nCela arrive souvent si vous n'avez pas la permission de modifier les autres joueurs (RLS).\n\nErreurs:\n${stats.errors.join('\n')}`;
      } else {
        message += `\nTout est propre. L'application va se recharger.`;
      }
      
      alert(message);
      window.location.reload(); 
    } catch (e: any) {
      console.error(e);
      alert("❌ ERREUR LORS DE LA RÉINITIALISATION :\n" + e.message);
    } finally {
      setResetLoading(false);
      setShowResetModal(false);
    }
  };

  const toggleTop12 = (id: string) => {
    const current = adminResults.top15; // Mapped to top15 column in DB
    if (current.includes(id)) setAdminResults({ ...adminResults, top15: current.filter(x => x !== id) });
    else if (current.length < 12) setAdminResults({ ...adminResults, top15: [...current, id] });
  };

  const toggleTop5 = (id: string) => {
    if (!adminResults.top15.includes(id)) return;
    const current = adminResults.top5;
    if (current.includes(id)) setAdminResults({ ...adminResults, top5: current.filter(x => x !== id) });
    else if (current.length < 5) setAdminResults({ ...adminResults, top5: [...current, id] });
  };

  const getDisplayCandidates = () => {
    if (step === 'TOP5') return candidates.filter(c => adminResults.top15.includes(c.id));
    return candidates;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <Logo size="lg" className="mb-8" />
          <h2 className="text-red-600 font-serif font-bold text-xl mb-1">RÉGIE TECHNIQUE</h2>
          <input 
            type="password" 
            value={pin} 
            onChange={e => setPin(e.target.value)} 
            placeholder="Code PIN" 
            className="w-full bg-white/10 p-4 rounded-xl text-center text-white tracking-[1em] text-xl mb-4 font-mono"
            maxLength={4}
          />
          <PrimaryButton title="Accéder au contrôle" onPress={handleLogin} variant="danger" />
          <button onClick={onBack} className="mt-6 text-zinc-500 text-xs uppercase">Retour Jeu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-safe border-4 border-red-900/30 flex flex-col relative">
      <div className="sticky top-0 z-50 bg-red-950/90 border-b border-red-500/30 p-4 flex justify-between items-center shadow-xl backdrop-blur-md">
        <div className="flex flex-col">
          <h2 className="text-white font-bold font-serif uppercase text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            RÉGIE DIRECT
          </h2>
          <span className="text-[8px] text-red-200 font-bold uppercase tracking-widest">CONFIGURATION OFFICIELLE</span>
        </div>
        <div className="flex gap-2">
            <button onClick={handleSave} disabled={loading} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-white text-xs font-bold uppercase shadow-lg transition">
                {loading ? 'ENVOI...' : 'PUBLIER'}
            </button>
            <button onClick={onBack} className="bg-black/40 px-3 py-2 rounded text-white text-xs">QUITTER</button>
        </div>
      </div>
      
      <div className="flex p-2 gap-2 bg-zinc-900 border-b border-white/5">
         <button onClick={() => setView('GAME')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${view === 'GAME' ? 'bg-white text-black' : 'text-zinc-500 hover:bg-white/10'}`}>Jeu / Résultats</button>
         <button onClick={() => setView('PLAYERS')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${view === 'PLAYERS' ? 'bg-white text-black' : 'text-zinc-500 hover:bg-white/10'}`}>Joueurs inscrits</button>
      </div>

      {view === 'GAME' ? (
        <>
          <div className="flex border-b border-white/5 bg-black">
             <button onClick={() => setStep('TOP12')} className={`flex-1 py-4 text-[10px] font-bold uppercase ${step === 'TOP12' ? 'bg-red-900/20 text-white border-b-2 border-red-500' : 'text-zinc-600'}`}>1. Les 12 ({adminResults.top15.length})</button>
             <button onClick={() => setStep('TOP5')} className={`flex-1 py-4 text-[10px] font-bold uppercase ${step === 'TOP5' ? 'bg-red-900/20 text-white border-b-2 border-red-500' : 'text-zinc-600'}`}>2. Les 5 ({adminResults.top5.length})</button>
             <button onClick={() => setStep('PODIUM')} className={`flex-1 py-4 text-[10px] font-bold uppercase ${step === 'PODIUM' ? 'bg-red-900/20 text-white border-b-2 border-red-500' : 'text-zinc-600'}`}>3. Verdict Final</button>
          </div>

          <div className="p-4 pb-32 overflow-y-auto flex-1 bg-zinc-950">
            {step === 'PODIUM' ? (
               <div className="space-y-4 max-w-md mx-auto">
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-center mb-4">
                    <p className="text-red-200 text-xs font-bold uppercase">Attention : Ces choix mettent à jour l'application de TOUS les joueurs en temps réel.</p>
                  </div>
                  {[
                    { label: 'MISS FRANCE 2026', key: 'winner' },
                    { label: '1ère Dauphine', key: 'firstRunnerUp' },
                    { label: '2ème Dauphine', key: 'secondRunnerUp' },
                    { label: '3ème Dauphine', key: 'thirdRunnerUp' },
                    { label: '4ème Dauphine', key: 'fourthRunnerUp' },
                  ].map((role) => (
                    <div key={role.key} className="bg-zinc-900 p-4 rounded-xl border border-white/10">
                       <label className="text-premium-gold text-xs font-bold uppercase mb-2 block">{role.label}</label>
                       <select 
                         className="w-full bg-black text-white p-3 rounded-lg border border-white/20"
                         value={adminResults.podium[role.key as keyof typeof adminResults.podium]}
                         onChange={(e) => setAdminResults({
                            ...adminResults, 
                            podium: { ...adminResults.podium, [role.key]: e.target.value }
                         })}
                       >
                         <option value="">-- Non attribué --</option>
                         {candidates.filter(c => adminResults.top5.includes(c.id)).map(c => (
                           <option key={c.id} value={c.id}>{c.name} ({c.region})</option>
                         ))}
                       </select>
                    </div>
                  ))}
               </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {getDisplayCandidates().map(c => {
                   const isSelected = step === 'TOP12' ? adminResults.top15.includes(c.id) : adminResults.top5.includes(c.id);
                   return (
                      <button 
                         key={c.id} 
                         onClick={() => step === 'TOP12' ? toggleTop12(c.id) : toggleTop5(c.id)}
                         className={`relative flex flex-col items-center justify-center aspect-[4/5] rounded-xl border transition-all duration-200 group overflow-hidden ${isSelected ? 'bg-green-900/40 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-zinc-900 border-white/10 hover:bg-zinc-800 hover:border-white/30'}`}
                      >
                         <div className="absolute top-2 left-2 z-10">
                            {isSelected ? <div className="bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">SÉLECTION</div> : null}
                         </div>
                         <div className={`mb-2 transform transition-transform duration-300 ${isSelected ? 'scale-110' : 'scale-100 opacity-70'}`}>
                            <AvatarIcon id="crown" size="lg" className={isSelected ? 'text-white' : 'text-zinc-600'} />
                         </div>
                         <h3 className={`font-black text-sm uppercase tracking-wider text-center px-1 ${isSelected ? 'text-white' : 'text-zinc-500'}`}>{c.region}</h3>
                         <p className="text-[10px] text-zinc-500">{c.name.split(' ')[0]}</p>
                      </button>
                   );
                })}
              </div>
            )}
            
             <div className="mt-8 pt-8 border-t border-white/10 pb-8 space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 text-center">
                  <p className="text-blue-300 font-bold uppercase text-xs mb-2">🔄 SYNCHRONISATION</p>
                  <button 
                    onClick={handleGlobalScoreUpdate} 
                    disabled={calcLoading}
                    className="w-full py-3 bg-blue-600 rounded-xl text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    {calcLoading ? "CALCUL EN COURS..." : "FORCER LE CALCUL DES POINTS (GLOBAL)"}
                  </button>
                </div>

                <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4 text-center">
                  <p className="text-red-400 font-bold uppercase text-xs mb-2">⚠️ ZONE DANGER</p>
                  <button 
                    onClick={() => setShowResetModal(true)} 
                    disabled={loading || resetLoading}
                    className="w-full py-4 bg-red-600 rounded-xl text-white text-sm font-bold uppercase tracking-widest hover:bg-red-500 transition flex items-center justify-center gap-2 shadow-lg shadow-red-900/50"
                  >
                    <span>🗑️</span> {resetLoading ? "RÉINITIALISATION..." : "RÉINITIALISER LE JEU"}
                  </button>
                </div>
             </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-950">
           <h3 className="text-white font-bold mb-4">Liste des inscrits ({players.length})</h3>
           <div className="space-y-2">
              {players.map(p => (
                <div key={p.id} className="bg-white/5 p-3 rounded-lg border border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-black"><AvatarIcon id={p.avatar || 'default'} size="sm" /></div>
                        <div><p className="text-sm font-bold text-white">{p.username}</p></div>
                    </div>
                    <p className="text-premium-gold font-mono">{p.points} pts</p>
                </div>
              ))}
           </div>
        </div>
      )}
      
      {showResetModal && (
        <ResetGameModal onClose={() => setShowResetModal(false)} onConfirm={handleConfirmReset} isLoading={resetLoading} />
      )}
    </div>
  );
};

function MainContent() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Home');
  const [showProfile, setShowProfile] = useState(false);
  const [showSelectionRecap, setShowSelectionRecap] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const [liveScore, setLiveScore] = useState(0);
  const [scoreDetails, setScoreDetails] = useState<{breakdown: string[], total: number}>({breakdown: [], total: 0});

  const [squad, setSquad] = useState<PlayerSelection | undefined>(undefined);
  const [podium, setPodium] = useState<PlayerSelection | undefined>(undefined);
  const [officialResults, setOfficialResults] = useState<OfficialResults>({ top15: [], top5: [], podium: { winner: '', firstRunnerUp: '', secondRunnerUp: '', thirdRunnerUp: '', fourthRunnerUp: '' }});

  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [allOpenTeams, setAllOpenTeams] = useState<Team[]>([]);
  const [nationalLeaderboard, setNationalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamDetails, setTeamDetails] = useState<{members: TeamMember[], messages: ChatMessage[]} | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showCreateLeague, setShowCreateLeague] = useState(false);
  const [showJoinLeague, setShowJoinLeague] = useState(false);
  const [teamTab, setTeamTab] = useState<'MY_TEAMS' | 'EXPLORE'>('MY_TEAMS');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  
  const [leaderboardTab, setLeaderboardTab] = useState<'NATIONAL' | 'COMMITTEE'>('NATIONAL');
  const [committeeLeaderboard, setCommitteeLeaderboard] = useState<TeamMember[]>([]);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  const [activeTeamTab, setActiveTeamTab] = useState<'CHAT' | 'RANKING'>('CHAT');
  const [detailCandidateIndex, setDetailCandidateIndex] = useState<number | null>(null);
  const [podiumLocked, setPodiumLocked] = useState(false);
  const [selectingSlot, setSelectingSlot] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const email = session.user.email || 'joueur';
          await ensureProfileExists(session.user.id, email.split('@')[0]);
          const profile = await fetchUserProfile(session.user.id);
          if (profile) setUser(profile);
        }
        const data = await fetchCandidates();
        setCandidates(data);
        setLoading(false);
      } catch (err) {
        console.error("Initialization error:", err);
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData();
      const interval = setInterval(loadOfficialResults, 10000);
      loadOfficialResults();
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (currentScreen === 'Teams' && teamTab === 'EXPLORE') {
       fetchAllTeams().then(setAllOpenTeams);
    }
  }, [currentScreen, teamTab]);

  useEffect(() => {
    const scoreData = calculateFantasyScore(squad, podium, officialResults);
    setLiveScore(scoreData.total);
    setScoreDetails(scoreData);
    if (user && scoreData.total !== user.points) {
       updateUserPoints(user.id, scoreData.total);
    }
  }, [squad, podium, officialResults]);

  useEffect(() => {
    let interval: any;
    if (currentScreen === 'TeamDetail' && selectedTeam && user) {
       interval = setInterval(async () => {
          const details = await fetchTeamDetails(selectedTeam.id, user.id);
          if (details) setTeamDetails(details);
       }, 3000);
    }
    return () => { if (interval) clearInterval(interval); }
  }, [currentScreen, selectedTeam, user]);

  const loadUserData = async () => {
    if (!user) return;
    const teams = await fetchMyTeams(user.id);
    setMyTeams(teams);
    
    const national = await fetchNationalLeaderboard(user.id);
    setNationalLeaderboard(national);

    if (teams.length > 0) {
      const firstTeam = teams[0];
      const details = await fetchTeamDetails(firstTeam.id, user.id);
      const sortedMembers = details.members.sort((a, b) => b.points - a.points);
      setCommitteeLeaderboard(sortedMembers);
    } else {
      setCommitteeLeaderboard([]);
    }

    const { data: bets } = await supabase.from('bets').select('*').eq('user_id', user.id);
    if (bets) {
      const squadBet = bets.find((b: any) => b.type === 'SQUAD');
      if (squadBet) setSquad({ id: squadBet.id, userId: user.id, type: 'SQUAD', candidateIds: squadBet.candidate_ids, timestamp: 0 });
      const podiumBet = bets.find((b: any) => b.type === 'PODIUM');
      if (podiumBet) {
        setPodium({ 
          id: podiumBet.id, 
          userId: user.id, 
          type: 'PODIUM', 
          candidateIds: podiumBet.candidate_ids, 
          timestamp: 0,
          modificationCount: podiumBet.stake 
        });
        if (podiumBet.candidate_ids.length > 0) setPodiumLocked(true);
      }
    }
  };

  const loadOfficialResults = async () => {
    const res = await fetchOfficialResults();
    setOfficialResults(res);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSquad(undefined);
    setPodium(undefined);
    setMyTeams([]);
    setNationalLeaderboard([]);
    setCommitteeLeaderboard([]);
    setShowProfile(false);
    setCurrentScreen('Home');
  };

  const handleCreateTeam = async (name: string) => {
    if (!user) return;
    const newTeam = await createTeamInDb(name, user.id);
    if (newTeam) {
      setMyTeams([...myTeams, newTeam]);
      setShowCreateLeague(false);
      handleOpenTeam(newTeam);
    }
  };

  const handleJoinTeam = async (code: string) => {
    if (!user) return;
    await ensureProfileExists(user.id, user.username);
    const res = await joinTeamInDb(code, user.id);
    if (res.success && res.team) {
      setMyTeams([...myTeams, res.team]);
      setShowJoinLeague(false);
      handleOpenTeam(res.team);
    } else {
      alert(res.message || "Erreur impossible de rejoindre.");
    }
  };

  const handleOpenTeam = async (team: Team) => {
    if (!user) return;
    setSelectedTeam(team);
    const details = await fetchTeamDetails(team.id, user.id);
    details.members.sort((a, b) => b.points - a.points);
    setTeamDetails(details);
    setActiveTeamTab('CHAT');
    setCurrentScreen('TeamDetail');
  };

  const handleSendMessage = async () => {
    if (!user || !selectedTeam || !messageText.trim()) return;
    await sendMessageInDb(selectedTeam.id, user.id, messageText);
    setMessageText('');
    const details = await fetchTeamDetails(selectedTeam.id, user.id);
    setTeamDetails(prev => prev ? { ...prev, messages: details.messages } : null);
  };

  const handleSaveSelection = async (type: 'SQUAD' | 'PODIUM', ids: string[]) => {
    if (!user) return;
    let modCount = 0;
    if (type === 'PODIUM' && podium) {
      modCount = (podium.modificationCount || 0) + 1;
    }
    const { error } = await supabase.from('bets').upsert({
      user_id: user.id,
      type: type,
      candidate_ids: ids,
      stake: type === 'PODIUM' ? modCount : 0,
      potential_gain: 0
    }, { onConflict: 'user_id, type' });

    if (!error) {
       if (type === 'SQUAD') setSquad({ id: 'local', userId: user.id, type: 'SQUAD', candidateIds: ids, timestamp: Date.now() });
       if (type === 'PODIUM') {
           setPodium({ id: 'local', userId: user.id, type: 'PODIUM', candidateIds: ids, timestamp: Date.now(), modificationCount: modCount });
           setPodiumLocked(true);
       }
       setShowSelectionRecap(true);
    }
  };
  
  const handleUnlockPodium = () => {
      if (window.confirm("⚠️ ATTENTION : Modifier votre podium une fois validé coûte 2 POINTS de pénalité à chaque fois ! Continuer ?")) {
          setPodiumLocked(false);
      }
  };

  const PodiumSlot = ({ rank, label, candidateId, locked, onClick }: { rank: number, label: string, candidateId?: string, locked: boolean, onClick: () => void }) => {
     const candidate = candidates.find(c => c.id === candidateId);
     const isWinner = rank === 0;
     return (
        <div 
            onClick={() => !locked && onClick()}
            className={`relative flex flex-col items-center justify-end ${isWinner ? 'w-36 z-20 -mt-10' : 'w-24 z-10'} transition-transform active:scale-95`}
        >
            <div className={`${isWinner ? 'aspect-[3/4.5] w-full border-premium-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'aspect-[3/4] w-full border-white/20'} rounded-xl border-2 overflow-hidden bg-zinc-900 relative group flex flex-col items-center justify-center ${!locked && 'cursor-pointer hover:border-white/50 border-dashed'}`}>
                {candidate ? (
                    <>
                      <div className={`w-full h-full flex flex-col items-center justify-center bg-zinc-900 p-2 ${locked ? 'opacity-80' : ''}`}>
                         <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                         <div className="relative z-10 mb-1">
                            <AvatarIcon id="crown" size={isWinner ? 'lg' : 'md'} className="text-premium-gold drop-shadow-md" />
                         </div>
                         <p className={`font-black uppercase text-center leading-none text-white ${isWinner ? 'text-[10px]' : 'text-[8px]'}`}>{candidate.region}</p>
                      </div>
                      {locked && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                              <div className="bg-black/60 p-2 rounded-full border border-white/20">🔒</div>
                          </div>
                      )}
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/10">
                        <span className="text-3xl mb-1">{isWinner ? '👑' : '✨'}</span>
                        <span className="text-[9px] uppercase font-bold tracking-widest">Choisir</span>
                    </div>
                )}
            </div>
            <div className={`mt-3 text-center w-full px-2 py-1.5 rounded-lg shadow-lg relative z-20 ${isWinner ? 'bg-gradient-to-r from-[#B8860B] via-premium-gold to-[#B8860B] text-black ring-1 ring-white/20' : 'bg-zinc-800/90 text-zinc-300 border border-white/10'}`}>
                <p className="text-[8px] font-bold uppercase tracking-widest leading-none mb-1 opacity-80">{label}</p>
                <p className={`font-bold truncate leading-none font-serif ${isWinner ? 'text-sm' : 'text-[10px]'}`}>{candidate?.name.split(' ')[0] || '-'}</p>
            </div>
        </div>
     );
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-premium-gold border-t-transparent rounded-full animate-spin"></div></div>;

  if (!user) return <><TailwindInjector /><AuthScreen onLogin={async () => {
           try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.user) {
                await ensureProfileExists(session.user.id, session.user.email?.split('@')[0] || 'Joueur');
                setUser(await fetchUserProfile(session.user.id));
              }
           } catch (e) { console.error(e); }
        }} /></>;

  if (currentScreen === 'Admin') return <><TailwindInjector /><AdminScreen candidates={candidates} onBack={() => setCurrentScreen('Home')} /></>;

  return (
    <div className="min-h-screen bg-premium-dark text-white pb-24">
      <TailwindInjector />
      <Header user={user} liveScore={liveScore} onOpenProfile={() => setShowProfile(true)} onOpenSearch={() => setShowUserSearch(true)} onOpenScoreDetails={() => setShowScoreDetails(true)} />
      
      <div className="pt-20 px-4 max-w-md mx-auto">
        {currentScreen === 'Home' && (
          <div className="animate-slide-up space-y-6">
             <div className="text-center py-6">
                <Logo size="xl" className="mx-auto mb-4" />
                <h1 className="text-3xl font-serif font-bold text-white mb-2">MF- MISS FANTASY</h1>
                <p className="text-zinc-400 text-sm max-w-xs mx-auto">Prédisez le Top 12, le Top 5 et le couronnement final.</p>
             </div>
             
             <div className="bg-gradient-to-r from-pink-900/40 to-rose-900/40 border border-pink-500/30 rounded-xl p-4 flex flex-col items-center text-center gap-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 text-4xl">❤️</div>
                <h3 className="text-pink-200 font-serif font-bold text-lg">Soutenez la cause</h3>
                <p className="text-xs text-zinc-300">{DONATION_TEXT}</p>
                <button onClick={() => window.open(DONATION_LINK, '_blank')} className="bg-white text-pink-700 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wide hover:bg-pink-100 transition shadow-lg">Faire un don</button>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setCurrentScreen('Candidates')} className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-3 hover:border-france-blue/50 transition group col-span-2">
                   <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition"><span className="text-2xl">💃</span></div>
                   <span className="font-bold text-sm uppercase">Voir les 30 Candidates</span>
                </button>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setCurrentScreen('Squad')} className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-3 hover:border-premium-gold/50 transition group">
                   <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition"><ThemeIcon variant="play" className="text-premium-gold" /></div>
                   <span className="font-bold text-sm uppercase">Mon Top 12</span>
                </button>
                <button onClick={() => setCurrentScreen('Podium')} className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-3 hover:border-premium-gold/50 transition group">
                   <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition"><ThemeIcon variant="pronos" className="text-premium-gold" /></div>
                   <span className="font-bold text-sm uppercase">Mon Top 5</span>
                </button>
             </div>

             <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                   <h3 className="font-serif font-bold text-lg flex items-center gap-2"><span className="text-xl">🏆</span> Classement</h3>
                   <div className="flex bg-black/40 rounded-lg p-0.5">
                      <button onClick={() => setLeaderboardTab('NATIONAL')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${leaderboardTab === 'NATIONAL' ? 'bg-premium-gold text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>France</button>
                      <button onClick={() => setLeaderboardTab('COMMITTEE')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${leaderboardTab === 'COMMITTEE' ? 'bg-premium-gold text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>Comité</button>
                   </div>
                </div>
                
                {leaderboardTab === 'NATIONAL' ? (
                    nationalLeaderboard.length === 0 ? <p className="text-zinc-500 text-sm text-center py-4">Aucun classement disponible</p> : (
                      <>
                        {nationalLeaderboard.slice(0, 3).map((entry, i) => (
                          <div key={entry.id} className="flex items-center gap-3 mb-3 last:mb-0 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                             <span className={`font-bold w-6 text-center ${i===0 ? 'text-premium-gold text-lg' : 'text-zinc-500'}`}>{i+1}</span>
                             <div className="w-8 h-8 rounded-full bg-black overflow-hidden"><AvatarIcon id={entry.avatar} size="sm" /></div>
                             <span className={`flex-1 font-bold text-sm truncate ${entry.isMe ? 'text-premium-gold' : 'text-white'}`}>{entry.username} {entry.isMe && '(Moi)'}</span>
                             <span className="text-premium-gold font-mono font-bold">{entry.points} pts</span>
                          </div>
                        ))}
                      </>
                    )
                ) : (
                    committeeLeaderboard.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-zinc-500 text-xs mb-2">Vous n'avez rejoint aucun comité.</p>
                        <button onClick={() => setCurrentScreen('Teams')} className="text-premium-gold text-xs font-bold uppercase underline">Rejoindre un comité</button>
                      </div>
                    ) : (
                      <>
                        {committeeLeaderboard.slice(0, 3).map((member, i) => (
                          <div key={member.id} className="flex items-center gap-3 mb-3 last:mb-0 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                             <span className={`font-bold w-6 text-center ${i===0 ? 'text-premium-gold text-lg' : 'text-zinc-500'}`}>{i+1}</span>
                             <div className="w-8 h-8 rounded-full bg-black overflow-hidden"><AvatarIcon id={member.avatar} size="sm" /></div>
                             <span className={`flex-1 font-bold text-sm truncate ${member.isMe ? 'text-premium-gold' : 'text-white'}`}>{member.name} {member.isMe && '(Moi)'}</span>
                             <span className="text-premium-gold font-mono font-bold">{member.points} pts</span>
                          </div>
                        ))}
                      </>
                    )
                )}
                
                <div className="mt-4 pt-2 border-t border-white/5 text-center">
                    <button onClick={() => setShowFullLeaderboard(true)} className="text-[9px] text-zinc-500 hover:text-white uppercase tracking-wider w-full py-2 hover:bg-white/5 rounded transition">Voir tout le classement {leaderboardTab === 'NATIONAL' ? 'National' : 'Comité'} →</button>
                </div>
             </div>

             <div className="flex justify-center mt-8">
               <button onClick={() => setCurrentScreen('Admin')} className="text-[10px] text-zinc-600 uppercase tracking-widest hover:text-white transition flex items-center gap-1">Accès Admin / Régie</button>
             </div>
          </div>
        )}

        {currentScreen === 'Candidates' && (
          <div className="animate-slide-up pb-20">
             <h2 className="text-2xl font-serif font-bold mb-2 text-center">Les 30 Candidates</h2>
             <p className="text-zinc-400 text-xs text-center mb-6 uppercase tracking-wider">Découvrez les Miss régionales</p>
             <div className="grid grid-cols-2 gap-2">
                {candidates.map(c => (
                   <MissCard key={c.id} candidate={c} selected={false} onPress={() => setDetailCandidateIndex(candidates.findIndex(cand => cand.id === c.id))} />
                ))}
             </div>
          </div>
        )}

        {currentScreen === 'Squad' && (
          <div className="animate-slide-up pb-20">
             <h2 className="text-2xl font-serif font-bold mb-2 text-center">Mon Top 12</h2>
             <p className="text-zinc-400 text-xs text-center mb-6 uppercase tracking-wider">Sélectionnez vos 12 demi-finalistes</p>
             {squad?.candidateIds.length === 12 ? (
                <div className="space-y-4">
                  <HostVoice text="Vos 12 favorites sont prêtes pour la demi-finale !" />
                  <div className="grid grid-cols-2 gap-2">
                     {candidates.filter(c => squad.candidateIds.includes(c.id)).map(c => (
                        <MissCard key={c.id} candidate={c} selected={false} badge={officialResults.top15.length > 0 ? (officialResults.top15.includes(c.id) ? '✓ QUALIFIÉE' : '✕ ÉLIMINÉE') : undefined} onPress={() => setDetailCandidateIndex(candidates.findIndex(cand => cand.id === c.id))} />
                     ))}
                  </div>
                  <PrimaryButton title="Modifier ma sélection" onPress={() => setSquad(undefined)} variant="secondary" className="mt-8 opacity-50" />
                </div>
             ) : (
                <>
                  <div className="sticky top-20 z-30 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-premium-gold/30 mb-4 flex justify-between items-center shadow-xl">
                      <span className="text-sm font-bold text-white">Sélectionnées</span>
                      <span className="text-2xl font-serif font-bold text-premium-gold">{(squad?.candidateIds.length || 0)} / 12</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {candidates.map(c => {
                       const isSelected = squad?.candidateIds.includes(c.id);
                       return (
                         <MissCard key={c.id} candidate={c} selected={isSelected} onPress={() => {
                               const current = squad?.candidateIds || [];
                               if (current.includes(c.id)) { setSquad(prev => ({ ...prev!, candidateIds: current.filter(id => id !== c.id) } as PlayerSelection)); } 
                               else if (current.length < 12) { setSquad({ id: 'temp', userId: user.id, type: 'SQUAD', candidateIds: [...current, c.id], timestamp: 0 }); }
                            }} />
                       );
                    })}
                  </div>
                  {(squad?.candidateIds.length || 0) === 12 && (
                    <div className="fixed bottom-24 left-4 right-4 animate-slide-up z-30">
                       <PrimaryButton title="Valider mes 12" onPress={() => handleSaveSelection('SQUAD', squad!.candidateIds)} variant="gold" className="shadow-2xl shadow-premium-gold/30" />
                    </div>
                  )}
                </>
             )}
          </div>
        )}

        {currentScreen === 'Podium' && (
          <div className="animate-slide-up pb-20">
             <h2 className="text-2xl font-serif font-bold mb-2 text-center">Mon Top 5</h2>
             <p className="text-zinc-400 text-xs text-center mb-6 uppercase tracking-wider">Couronnez votre Miss France 2026</p>
             {(!squad || squad.candidateIds.length < 12) ? (
                 <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/20">
                    <p className="text-zinc-400 mb-4 px-4">Vous devez d'abord sélectionner vos 12 demi-finalistes avant de faire votre Top 5.</p>
                    <PrimaryButton title="Aller à la sélection" onPress={() => setCurrentScreen('Squad')} variant="secondary" className="max-w-xs mx-auto" />
                 </div>
             ) : (
                <>
                  <div className="relative py-8 px-2 flex flex-col items-center gap-6 mt-4">
                      <PodiumSlot rank={0} label="MISS FRANCE" candidateId={podium?.candidateIds?.[0]} locked={podiumLocked} onClick={() => setSelectingSlot(0)} />
                      <div className="flex justify-center gap-4 w-full -mt-2">
                          <PodiumSlot rank={1} label="1ÈRE DAUPHINE" candidateId={podium?.candidateIds?.[1]} locked={podiumLocked} onClick={() => setSelectingSlot(1)} />
                          <PodiumSlot rank={2} label="2ÈME DAUPHINE" candidateId={podium?.candidateIds?.[2]} locked={podiumLocked} onClick={() => setSelectingSlot(2)} />
                      </div>
                      <div className="flex justify-center gap-4 w-full">
                          <PodiumSlot rank={3} label="3ÈME DAUPHINE" candidateId={podium?.candidateIds?.[3]} locked={podiumLocked} onClick={() => setSelectingSlot(3)} />
                          <PodiumSlot rank={4} label="4ÈME DAUPHINE" candidateId={podium?.candidateIds?.[4]} locked={podiumLocked} onClick={() => setSelectingSlot(4)} />
                      </div>
                  </div>
                  <div className="fixed bottom-24 left-4 right-4 animate-slide-up z-30">
                    {podiumLocked ? (
                        <div className="flex flex-col gap-2">
                             <div className="bg-black/80 border border-white/20 p-4 rounded-xl text-center backdrop-blur-md shadow-2xl">
                                <span className="text-3xl block mb-2">🔒</span>
                                <p className="text-white text-sm font-bold uppercase mb-1">PODIUM SCELLÉ</p>
                                <p className="text-[10px] text-zinc-400 mb-3">Vos pronostics sont enregistrés et définitifs.</p>
                                <button onClick={handleUnlockPodium} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold uppercase transition shadow-lg animate-pulse border border-red-400">DÉBLOQUER (COÛT : -2 PTS)</button>
                             </div>
                        </div>
                    ) : (
                        (podium?.candidateIds || []).filter(Boolean).length === 5 && (
                           <PrimaryButton title="VALIDER MA SÉLECTION (DÉFINITIF)" onPress={() => handleSaveSelection('PODIUM', podium!.candidateIds)} variant="gold" className="shadow-2xl shadow-premium-gold/30" />
                        )
                    )}
                  </div>
                  {selectingSlot !== null && (
                      <div className="fixed inset-0 z-[60] flex flex-col bg-zinc-900/95 backdrop-blur-xl animate-slide-up">
                          <div className="p-4 flex justify-between items-center border-b border-white/10">
                              <h3 className="text-white font-serif font-bold text-lg">Choisir : {selectingSlot === 0 ? 'Miss France' : `${selectingSlot}ème Dauphine`}</h3>
                              <button onClick={() => setSelectingSlot(null)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-white">✕</button>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-3">
                              {candidates.filter(c => squad.candidateIds.includes(c.id)).map(c => {
                                  const isUsed = podium?.candidateIds?.includes(c.id) && podium?.candidateIds?.indexOf(c.id) !== selectingSlot;
                                  return (
                                    <button key={c.id} disabled={isUsed} onClick={() => {
                                            const newIds = [...(podium?.candidateIds || Array(5).fill(''))];
                                            newIds[selectingSlot] = c.id;
                                            setPodium({ ...podium, id: 'temp', userId: user.id, type: 'PODIUM', candidateIds: newIds, timestamp: 0 } as PlayerSelection);
                                            setSelectingSlot(null);
                                        }} className={`relative rounded-lg overflow-hidden aspect-[3/4] flex flex-col items-center justify-center bg-zinc-800 border border-white/10 ${isUsed ? 'opacity-20 grayscale' : 'hover:scale-105 transition-transform'}`}>
                                        <AvatarIcon id="crown" size="sm" className="text-premium-gold mb-1" />
                                        <p className="text-[10px] text-white font-bold truncate text-center uppercase tracking-wider">{c.region}</p>
                                    </button>
                                  );
                              })}
                          </div>
                      </div>
                  )}
                </>
             )}
          </div>
        )}

        {currentScreen === 'Teams' && (
          <div className="animate-slide-up pb-20">
             <div className="flex justify-between items-center mb-6">
                <div><h2 className="text-2xl font-serif font-bold text-white">Comités</h2><p className="text-zinc-400 text-xs uppercase tracking-wide">Mes groupes d'amis</p></div>
                <button onClick={() => setShowCreateLeague(true)} className="w-10 h-10 bg-premium-gold rounded-full flex items-center justify-center text-black font-bold text-2xl shadow-lg hover:scale-110 transition">+</button>
             </div>
             <div className="flex gap-2 mb-4 bg-white/5 p-1 rounded-xl">
                 <button onClick={() => setTeamTab('MY_TEAMS')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition ${teamTab === 'MY_TEAMS' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}>Mes Comités</button>
                 <button onClick={() => setTeamTab('EXPLORE')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition ${teamTab === 'EXPLORE' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}>Explorer 🌎</button>
             </div>
             <div className="space-y-4">
               {teamTab === 'MY_TEAMS' ? (
                  <>
                     {myTeams.length === 0 ? (
                       <div className="text-center py-10 bg-white/5 rounded-2xl border border-dashed border-white/20">
                          <p className="text-zinc-500 text-sm mb-4">Vous n'avez rejoint aucun comité.</p>
                          <button onClick={() => setShowJoinLeague(true)} className="text-premium-gold text-xs font-bold uppercase underline">Rejoindre avec un code</button>
                       </div>
                     ) : (
                       myTeams.map(team => (
                         <button key={team.id} onClick={() => handleOpenTeam(team)} className="w-full bg-gradient-to-r from-zinc-900 to-black p-5 rounded-2xl border border-white/10 flex justify-between items-center hover:border-premium-gold/30 transition group">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition">🛡️</div>
                               <div className="text-left"><h3 className="font-bold text-white group-hover:text-premium-gold transition">{team.name}</h3><p className="text-xs text-zinc-500">{team.memberCount} membres</p></div>
                            </div>
                            <span className="text-zinc-600">›</span>
                         </button>
                       ))
                     )}
                     {myTeams.length > 0 && (
                       <button onClick={() => setShowJoinLeague(true)} className="w-full py-4 border border-dashed border-white/20 rounded-xl text-zinc-500 text-xs font-bold uppercase hover:bg-white/5 transition">Rejoindre un autre comité</button>
                     )}
                  </>
               ) : (
                  <div className="space-y-4">
                     <input type="text" placeholder="Rechercher un comité..." value={teamSearchQuery} onChange={e => setTeamSearchQuery(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-premium-gold outline-none" />
                     <div className="space-y-3">
                        {allOpenTeams.filter(t => t.name.toLowerCase().includes(teamSearchQuery.toLowerCase())).map(team => (
                           <button key={team.id} onClick={() => setShowJoinLeague(true)} className="w-full bg-zinc-900/50 p-4 rounded-xl border border-white/5 flex justify-between items-center hover:bg-zinc-800 transition">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-lg border border-white/10">{team.isPublic ? '🌐' : '🔒'}</div>
                                 <div className="text-left"><h3 className="font-bold text-white text-sm">{team.name}</h3><p className="text-[10px] text-zinc-500">{team.memberCount} membres • {team.isPublic ? 'Ouvert' : 'Code requis'}</p></div>
                              </div>
                              <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white font-bold uppercase">Rejoindre</span>
                           </button>
                        ))}
                     </div>
                  </div>
               )}
             </div>
          </div>
        )}

        {currentScreen === 'TeamDetail' && selectedTeam && (
           <div className="animate-slide-up pb-24 h-screen flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                 <button onClick={() => setCurrentScreen('Teams')} className="text-zinc-400 hover:text-white">← Retour</button>
                 <h2 className="text-xl font-serif font-bold text-white truncate flex-1">{selectedTeam.name}</h2>
              </div>
              <div className="mb-6 bg-gradient-to-r from-premium-gold/20 to-transparent p-4 rounded-xl border border-premium-gold/30 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer" onClick={() => {navigator.clipboard.writeText(selectedTeam.inviteCode || ''); alert("Code copié !");}}>
                 <div className="absolute inset-0 bg-premium-gold/10 opacity-0 group-hover:opacity-100 transition"></div>
                 <p className="text-[10px] font-bold text-premium-gold uppercase tracking-widest mb-1">Ticket d'entrée</p>
                 <p className="text-4xl font-mono font-bold text-white tracking-widest text-shadow-lg">{selectedTeam.inviteCode}</p>
                 <p className="text-[9px] text-zinc-400 mt-1">(Touchez pour copier)</p>
              </div>
              <div className="flex px-4 mb-2 gap-4">
                <button onClick={() => setActiveTeamTab('CHAT')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTeamTab === 'CHAT' ? 'text-premium-gold border-premium-gold' : 'text-zinc-600 border-transparent hover:text-white'}`}>Discussion</button>
                <button onClick={() => setActiveTeamTab('RANKING')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTeamTab === 'RANKING' ? 'text-premium-gold border-premium-gold' : 'text-zinc-600 border-transparent hover:text-white'}`}>Classement</button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col bg-zinc-900/50 rounded-t-3xl border-t border-white/10 backdrop-blur-sm -mx-4 px-4 pt-4">
                  {activeTeamTab === 'CHAT' ? (
                    <>
                      <div className="flex-1 overflow-y-auto space-y-3 p-2 no-scrollbar">
                         {teamDetails?.messages.length === 0 && <p className="text-center text-zinc-600 text-xs italic mt-10">Le chat est calme... Lancez les pronos !</p>}
                         {teamDetails?.messages.map(msg => (
                            <div key={msg.id} className={`flex gap-2 ${msg.userId === user.id ? 'flex-row-reverse' : ''}`}>
                               <div className="w-8 h-8 rounded-full bg-black overflow-hidden flex-shrink-0 border border-white/10"><AvatarIcon id={msg.userAvatar} size="sm" /></div>
                               <div className={`max-w-[70%] p-3 rounded-2xl ${msg.userId === user.id ? 'bg-france-blue text-white rounded-tr-none' : 'bg-white/10 text-zinc-200 rounded-tl-none'}`}>
                                  <p className="text-[10px] font-bold opacity-50 mb-0.5">{msg.userName}</p>
                                  <p className="text-sm">{msg.content}</p>
                               </div>
                            </div>
                         ))}
                      </div>
                      <div className="pt-2 pb-4 flex gap-2">
                         <input type="text" value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Message..." className="flex-1 bg-black border border-white/20 rounded-full px-4 py-3 text-white focus:outline-none focus:border-premium-gold" onKeyPress={e => e.key === 'Enter' && handleSendMessage()} />
                         <button onClick={handleSendMessage} className="w-12 h-12 bg-premium-gold rounded-full flex items-center justify-center text-black hover:scale-105 transition shadow-lg">➤</button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                      {teamDetails?.members.length === 0 ? <p className="text-center text-zinc-600 text-xs italic mt-10">Aucun membre...</p> : (
                        teamDetails?.members.map((member, index) => {
                          let rankColor = "text-zinc-500";
                          let rankBg = "bg-zinc-800";
                          if (index === 0) { rankColor = "text-yellow-400"; rankBg = "bg-yellow-500/20 border-yellow-500/50"; }
                          else if (index === 1) { rankColor = "text-gray-300"; rankBg = "bg-gray-400/20 border-gray-400/50"; }
                          else if (index === 2) { rankColor = "text-orange-400"; rankBg = "bg-orange-500/20 border-orange-500/50"; }
                          return (
                            <div key={member.id} className={`flex items-center gap-3 mb-2 p-3 rounded-xl border border-white/5 ${member.isMe ? 'bg-white/10 border-white/20' : 'bg-black/20'}`}>
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-serif text-sm border ${rankBg} ${rankColor}`}>{index + 1}</div>
                               <div className="w-10 h-10 rounded-full bg-black overflow-hidden border border-white/10 relative">
                                  <AvatarIcon id={member.avatar} size="md" />
                                  {member.isMe && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>}
                               </div>
                               <div className="flex-1">
                                  <p className={`text-sm font-bold ${member.isMe ? 'text-white' : 'text-zinc-300'}`}>{member.name} {member.isMe && '(Moi)'}</p>
                                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Membre</p>
                               </div>
                               <div className="text-right">
                                  <span className="text-lg font-mono font-bold text-premium-gold">{member.points}</span>
                                  <span className="text-[9px] block text-zinc-600 font-bold">PTS</span>
                               </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
              </div>
           </div>
        )}

        {currentScreen === 'Rules' && (
          <div className="animate-slide-up pb-24 px-4 pt-10">
             <div className="text-center mb-8">
               <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10"><ThemeIcon variant="rules" size="md" className="text-premium-gold" /></div>
               <h2 className="text-2xl font-serif font-bold text-white">Règles du Jeu</h2><p className="text-zinc-400 text-xs uppercase tracking-widest">Comment gagner ?</p>
             </div>
             <div className="space-y-6">
               <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                 <h3 className="text-premium-gold font-bold uppercase text-sm mb-4 border-b border-white/10 pb-2">🎯 1. Les Pronostics</h3>
                 <ul className="space-y-3 text-sm text-zinc-300">
                   <li>1. Sélectionnez votre <strong>Top 12</strong>.</li>
                   <li>2. Composez votre <strong>Top 5</strong>.</li>
                   <li>3. Validez avant le début !</li>
                 </ul>
               </div>
               <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                 <h3 className="text-premium-gold font-bold uppercase text-sm mb-4 border-b border-white/10 pb-2">⭐️ 2. Le Barème</h3>
                 <div className="space-y-3">
                    <p className="text-xs">Top 12 : <strong>+1 PT</strong> / Miss</p>
                    <p className="text-xs">Top 5 : <strong>+3 PTS</strong> / Miss</p>
                    <p className="text-xs">Podium : <strong>+5 PTS</strong> / Miss</p>
                 </div>
               </div>
             </div>
          </div>
        )}

      </div>

      <Navigation active={currentScreen} onNavigate={setCurrentScreen} />

      {/* Modals */}
      {showProfile && user && <ProfileModal user={user} onClose={() => setShowProfile(false)} onLogout={handleLogout} onUpdate={async (u, a) => { if(u !== user.username) await updateUserPseudo(user.id, u); if(a !== user.avatar) await updateUserAvatar(user.id, a); setUser({ ...user, username: u, avatar: a }); }} />}
      {showCreateLeague && user && <CreateLeagueModal onClose={() => setShowCreateLeague(false)} onCreate={handleCreateTeam} />}
      {showJoinLeague && user && <JoinLeagueModal onClose={() => setShowJoinLeague(false)} onJoin={handleJoinTeam} />}
      {showSelectionRecap && squad && podium && <SelectionRecapModal squad={candidates.filter(c => squad.candidateIds.includes(c.id))} podiumIds={podium.candidateIds} allCandidates={candidates} onClose={() => setShowSelectionRecap(false)} userName={user.username} />}
      {showUserSearch && user && <UserSearchModal currentUserId={user.id} onClose={() => setShowUserSearch(false)} />}
      {showScoreDetails && <ScoreDetailsModal breakdown={scoreDetails.breakdown} score={scoreDetails.total} onClose={() => setShowScoreDetails(false)} />}
      {showFullLeaderboard && user && <LeaderboardModal title={leaderboardTab === 'NATIONAL' ? "Classement National" : "Classement Comité"} data={leaderboardTab === 'NATIONAL' ? nationalLeaderboard : committeeLeaderboard.map((m, i) => ({ id: m.id, username: m.name, avatar: m.avatar, points: m.points, rank: i+1, isMe: m.isMe || false }))} onClose={() => setShowFullLeaderboard(false)} />}
      {detailCandidateIndex !== null && <CandidateDetailModal candidates={candidates} initialIndex={detailCandidateIndex} onClose={() => setDetailCandidateIndex(null)} />}
    </div>
  );
}

const App = () => {
  return (
    <ErrorBoundary>
      <TailwindInjector />
      <MainContent />
    </ErrorBoundary>
  );
};

export default App;