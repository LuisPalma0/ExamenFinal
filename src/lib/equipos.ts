import { supabase } from './supabase';

export type Equipo = {
  id: number;
  nombre: string;
  descripcion: string;
  disponible: boolean;
};

export async function obtenerEquipos(): Promise<Equipo[]> {
  const { data, error } = await supabase
    .from('equipos')
    .select('id, nombre, descripcion, disponible')
    .eq('activo', true)
    .order('nombre');
  if (error) console.log(error.message);
  return (data ?? []) as Equipo[];
}
