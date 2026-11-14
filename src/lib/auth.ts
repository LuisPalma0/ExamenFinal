import { supabase } from './supabase';

export async function iniciarSesion(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  return error === null;
}

export async function cerrarSesion() {
  await supabase.auth.signOut();
}

export async function haySesion() {
  const { data } = await supabase.auth.getSession();
  return data.session !== null;
}