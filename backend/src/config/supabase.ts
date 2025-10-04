// Supabase configuration

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';
import { logger } from './logger';

let supabase: SupabaseClient;

export function initializeSupabase(): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    logger.error('❌ Supabase credentials not found in environment variables');
    throw new Error('Missing Supabase credentials');
  }

  supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // 서버 사이드에서는 false
      detectSessionInUrl: false,
    },
    db: {
      schema: 'public',
    },
  });

  logger.info('✅ Supabase client initialized');

  return supabase;
}

// Admin client (서비스 역할 키 사용)
export function getSupabaseAdmin(): SupabaseClient {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.error('❌ Supabase service role key not found');
    throw new Error('Missing Supabase service role key');
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    return initializeSupabase();
  }
  return supabase;
}

export { supabase };
