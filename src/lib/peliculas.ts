import { supabase } from './supabase';

export type Pelicula = {
  id: number;
  titulo: string;
  genero: string;
  anio: number;
  precio: number;
  activa: boolean;
};

export type Renta = {
  id: number;
  precio: number;
  rentada_en: string;
  vence_en: string;
  peliculas: { titulo: string } | null;
  perfiles?: { nombre: string } | null;
};

function mensajeError(error: { code?: string; message: string }) {
  if (error.code === '42501') return 'No tienes permiso para hacer esto';
  if (error.code === '23503') return 'Tu usuario no tiene perfil o la película ya no existe';
  return error.message;
}

export async function obtenerPeliculas(): Promise<Pelicula[]> {
  const { data, error } = await supabase
    .from('peliculas')
    .select('id, titulo, genero, anio, precio, activa')
    .eq('activa', true)
    .order('titulo');
  if (error) console.log(error.message);
  return (data ?? []) as Pelicula[];
}

export async function rentarPelicula(id: number): Promise<string | null> {
  const { error } = await supabase.rpc('rentar_pelicula', { p_pelicula: id });
  return error ? mensajeError(error) : null;
}

export async function agregarPelicula(
  titulo: string,
  genero: string,
  anio: number,
  precio: number
): Promise<string | null> {
  const { data, error } = await supabase
    .from('peliculas')
    .insert({ titulo: titulo.trim(), genero: genero.trim(), anio, precio })
    .select();
  if (error) return mensajeError(error);
  if (!data || data.length === 0) return 'No tienes permiso para hacer esto';
  return null;
}

export async function eliminarPelicula(id: number): Promise<string | null> {
  const { data, error } = await supabase
    .from('peliculas')
    .update({ activa: false })
    .eq('id', id)
    .select();
  if (error) return mensajeError(error);
  if (!data || data.length === 0) return 'No tienes permiso para hacer esto';
  return null;
}

export async function misRentas(): Promise<Renta[]> {
  const { data, error } = await supabase
    .from('rentas')
    .select('id, precio, rentada_en, vence_en, peliculas(titulo)')
    .order('rentada_en', { ascending: false });
  if (error) console.log(error.message);
  return (data ?? []) as unknown as Renta[];
}

export async function informeRentas(): Promise<Renta[]> {
  const { data, error } = await supabase
    .from('rentas')
    .select('id, precio, rentada_en, vence_en, peliculas(titulo), perfiles(nombre)')
    .order('rentada_en', { ascending: false });
  if (error) console.log(error.message);
  return (data ?? []) as unknown as Renta[];
}