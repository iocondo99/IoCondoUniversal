import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/*
  Client Supabase UNIVERSALE (iOS / Android / Web).
  - Le chiavi arrivano da variabili EXPO_PUBLIC_* (file .env).
  - La sessione viene persistita:
      * su mobile con AsyncStorage
      * su web con localStorage (gestito in automatico da supabase-js)
  - detectSessionInUrl attivo SOLO su web (per eventuali magic-link / OAuth).
*/

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anonKey);

const isWeb = Platform.OS === 'web';

export const supabase = isConfigured
  ? createClient(url, anonKey, {
      auth: {
        // Su web lascia gestire lo storage di default (localStorage);
        // su mobile usa AsyncStorage.
        ...(isWeb ? {} : { storage: AsyncStorage }),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: isWeb,
      },
    })
  : null;
