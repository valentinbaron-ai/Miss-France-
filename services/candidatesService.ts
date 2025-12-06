
import { supabase, isSupabaseConfigured } from './supabase';
import { Candidate } from '../types';
import { CANDIDATES as FALLBACK_CANDIDATES } from '../data/missCandidates';

export const fetchCandidates = async (): Promise<Candidate[]> => {
  // Si Supabase n'est pas configuré (mode démo local pur), on utilise le fichier JSON
  if (!isSupabaseConfigured()) {
    console.log("Supabase not configured, using fallback data.");
    // Simulation d'un délai réseau pour le réalisme
    await new Promise(resolve => setTimeout(resolve, 800)); 
    return FALLBACK_CANDIDATES;
  }

  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      // Correction: JSON.stringify pour voir le vrai message d'erreur
      console.error("Error fetching candidates:", JSON.stringify(error, null, 2));
      return FALLBACK_CANDIDATES;
    }

    if (data && data.length > 0) {
      // Mapping pour s'assurer que les champs correspondent au format front-end
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        region: item.region,
        // Sécurité : si photo_url est vide ou null, on met le placeholder
        photoUrl: (item.photo_url && item.photo_url.length > 5) ? item.photo_url : 'LOGO_PLACEHOLDER',
        age: item.age || 20,
        height: item.height || 170,
        bio: item.bio || "Candidate Miss France"
      }));
    }
    
    return FALLBACK_CANDIDATES;
  } catch (err) {
    console.error("Unexpected error fetching candidates:", err);
    return FALLBACK_CANDIDATES;
  }
};
