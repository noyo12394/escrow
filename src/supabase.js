// =============================================================================
// Supabase activity logging for S.T.A.R. Earthquake Rescue Lab
// -----------------------------------------------------------------------------
// Records every player's activity for the weekly exercise. Configured entirely
// through environment variables so no secrets live in the repo:
//
//   VITE_SUPABASE_URL       e.g. https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY  the project's public anon key (safe in the browser
//                           when Row Level Security is enabled - see schema.sql)
//
// If the variables are absent the whole module degrades gracefully: the game
// stays fully playable and logging becomes a no-op. See supabase/schema.sql for
// the tables and policies, and README for setup.
// =============================================================================

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supaEnabled = Boolean(url && anonKey);
export const WEEK = 1; // this is the "week one" activity

const supabase = supaEnabled ? createClient(url, anonKey) : null;

if (supaEnabled) {
  console.info('[supabase] Connected - activity logging is active for week', WEEK);
}

if (!supaEnabled) {
  console.info(
    '[supabase] Not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing). ' +
      'Running in local-only mode; activity will not be recorded.'
  );
}

// Register or recognize a player by name (one-time sign-in).
// Returns { name, returning, offline }.
export async function registerPlayer(name) {
  if (!supaEnabled) return { name, returning: false, offline: true };
  try {
    const { data: existing } = await supabase
      .from('players')
      .select('name')
      .eq('name', name)
      .maybeSingle();

    const returning = Boolean(existing);
    if (returning) {
      await supabase
        .from('players')
        .update({ last_seen: new Date().toISOString() })
        .eq('name', name);
    } else {
      // Idempotent insert - if two tabs race, the unique name constraint wins.
      await supabase.from('players').upsert({ name }, { onConflict: 'name' });
    }
    return { name, returning };
  } catch (err) {
    console.warn('[supabase] registerPlayer failed:', err.message);
    return { name, returning: false, error: true };
  }
}

// Fire-and-forget activity event.
export async function logActivity(name, type, payload = {}) {
  if (!supaEnabled || !name) return;
  try {
    await supabase
      .from('activity')
      .insert({ player_name: name, week: WEEK, type, payload });
  } catch (err) {
    console.warn('[supabase] logActivity failed:', err.message);
  }
}

// Persist a completed ranking submission.
export async function saveSubmission(name, score, ranking, answers) {
  if (!supaEnabled || !name) return;
  try {
    await supabase
      .from('submissions')
      .insert({ player_name: name, week: WEEK, score, ranking, answers });
  } catch (err) {
    console.warn('[supabase] saveSubmission failed:', err.message);
  }
}
