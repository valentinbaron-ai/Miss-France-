import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// 🛑 CLÉS API SUPABASE 🛑
// ------------------------------------------------------------------

const YOUR_SUPABASE_URL: string = 'https://ddnkimfzqrvbpvcthgsg.supabase.co'; 
const YOUR_SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbmtpbWZ6cXJ2YnB2Y3RoZ3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMTIxMTgsImV4cCI6MjA3OTY4ODExOH0.cxFNvsc6F1_wYWAP4agM2HeU-DYy7KIFDV5XRYA7HOk';

// ------------------------------------------------------------------

// Fonction sécurisée pour récupérer les variables d'environnement sans faire planter le web
const getEnv = (key: string) => {
  try {
    // Sur le web (Vercel/Expo Web), process peut ne pas être défini du tout
    // On vérifie son existence avant d'essayer de lire quoi que ce soit
    if (typeof process !== 'undefined' && process && process.env) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore error
  }
  return undefined;
};

// On privilégie les clés en dur ici pour simplifier le déploiement Web 
// car les variables d'environnement Expo ne sont pas toujours injectées dans le build HTML statique
const supabaseUrl = YOUR_SUPABASE_URL;
const supabaseAnonKey = YOUR_SUPABASE_ANON_KEY;

// Création du client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return YOUR_SUPABASE_URL.length > 0 && YOUR_SUPABASE_ANON_KEY.length > 0;
};