import { supabase } from './supabase';

// Devuelve null si todo salió bien, o el texto del error
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
  carnet: string;
  carrera: string;
};

// Solo se registran estudiantes: el rol lo asigna la base de datos, no la app
export async function registrarUsuario(d: DatosRegistro): Promise<string | null> {
  const { data, error } = await supabase.auth.signUp({
    email: d.email.trim(),
    password: d.password,
    options: {
      data: {
        nombre: d.nombre.trim(),
        carnet: d.carnet.trim(),
        carrera: d.carrera.trim(),
      },
    },
  });
  if (error) {
    if (error.message.includes('Database error')) {
      return 'No se pudo crear el perfil. Revisa que el carnet no esté ya registrado.';
    }
    return error.message;
  }
  // Si el correo ya existe, Supabase no da error pero devuelve un usuario sin identidades
  if (data.user && data.user.identities?.length === 0) return 'Ese correo ya está registrado';
  return null;
}
