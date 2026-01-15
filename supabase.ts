import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gdomheoseujngwfyzxvd.supabase.co';
const supabaseAnonKey = 'sb_publishable_fAvlEnT96OFjMbXe2BBY5Q_G2hxbEH3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});