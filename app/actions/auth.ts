'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server'; // Assuming you have a server client creator

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/home'); // or '/' or '/login' – wherever you want to go after logout
}