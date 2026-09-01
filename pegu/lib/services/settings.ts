import { createClient } from '@/lib/supabase/client';
import type { Settings } from '@/types/database';

export async function getSettings(): Promise<Settings> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user!.id;

  const { data, error } = await supabase.from('settings').select('*').eq('user_id', userId).single();
  if (error) throw error;
  return data as Settings;
}

export async function updateSettings(input: { display_name: string; initial_balance: number }): Promise<Settings> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user!.id;

  const { data, error } = await supabase
    .from('settings')
    .update({
      display_name: input.display_name,
      initial_balance: input.initial_balance,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Settings;
}
