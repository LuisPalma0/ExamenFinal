import { supabase } from './supabase';

export async function iniciarSesion(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (!error) return null;
  if (error.message.includes('Email not confirmed')) return 'Debes confirmar tu correo antes de entrar';
  if (error.message.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos';
  return error.message;
}

export async function cerrarSesion() {
  await supabase.auth.signOut();
}

export async function haySesion() {
  const { data } = await supabase.auth.getSession();
  return data.session !== null;
}

export type DatosRegistro = {
  email: string;
  password: string;
  nombre: string;
  edad: number;
  tarjeta: string;
};

export async function registrarUsuario(d: DatosRegistro): Promise<string | null> {
  const digitos = d.tarjeta.replace(/[^0-9]/g, '');
  const { data, error } = await supabase.auth.signUp({
    email: d.email.trim(),
    password: d.password,
    options: {
      data: {
        nombre: d.nombre.trim(),
        edad: d.edad,
        tarjeta_ultimos4: digitos.slice(-4),
      },
    },
  });
  if (error) return error.message;
  // Si el correo ya existe y la confirmación está activa, Supabase no da error: devuelve un usuario "falso"
  if (data.user && data.user.identities?.length === 0) return 'Ese correo ya está registrado';
  return null;
}