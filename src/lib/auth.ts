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

export type DatosRegistro = {
  email: string;
  password: string;
  nombre: string;
  edad: number;
  tarjeta: string;
};

export async function registrarUsuario(d: DatosRegistro): Promise<string | null> {
  const digitos = d.tarjeta.replace(/[^0-9]/g, '');
  const { error } = await supabase.auth.signUp({
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
  return error ? error.message : null;
}