import { Platform } from 'react-native';
import { supabase } from './supabase';

export type Perfil = {
  id: string;
  nombre: string;
  carnet: string;
  carrera: string;
  rol: 'estudiante' | 'admin';
  foto_path: string | null;
};

export async function obtenerPerfil(): Promise<Perfil | null> {
  const { data: sesion } = await supabase.auth.getUser();
  const id = sesion.user?.id;
  if (!id) return null;
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, carnet, carrera, rol, foto_path')
    .eq('id', id)
    .maybeSingle();
  if (error) console.log(error.message);
  return (data as Perfil | null) ?? null;
}

export async function urlFoto(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from('fotos').createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function subirFoto(uri: string, tipo: string): Promise<string | null> {
  const { data: sesion } = await supabase.auth.getUser();
  const id = sesion.user?.id;
  if (!id) return 'No hay sesión';
  const ruta = `${id}/perfil.jpg`;

  // En web se sube el archivo como "blob"; en celular se usa FormData
  let cuerpo: any;
  if (Platform.OS === 'web') {
    cuerpo = await (await fetch(uri)).blob();
  } else {
    const formulario = new FormData();
    formulario.append('file', { uri, name: 'perfil.jpg', type: tipo } as any);
    cuerpo = formulario;
  }

  const { error } = await supabase.storage
    .from('fotos')
    .upload(ruta, cuerpo, { upsert: true, contentType: tipo });
  if (error) return error.message;
  const { error: errorRuta } = await supabase.rpc('guardar_foto', { p_path: ruta });
  return errorRuta ? errorRuta.message : null;
}
