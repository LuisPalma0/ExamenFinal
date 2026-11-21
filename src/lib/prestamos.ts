import { supabase } from './supabase';

export type Estado = 'pendiente' | 'aprobado' | 'rechazado' | 'devuelto';

export type Prestamo = {
  id: number;
  fecha_prestamo: string;
  fecha_devolucion: string;
  estado: Estado;
  devuelto_en: string | null;
  equipos: { nombre: string } | null;
  perfiles?: { nombre: string; carnet: string } | null;
};

export const colorEstado: Record<Estado, string> = {
  pendiente: '#d97706',
  aprobado: '#16a34a',
  rechazado: '#dc2626',
  devuelto: '#6b7280',
};

function mensajeError(error: { code?: string; message: string }) {
  if (error.code === '23505') return 'Ya tienes una solicitud pendiente de este equipo';
  if (error.code === '42501') return 'No tienes permiso para hacer esto';
  return error.message;
}

// Estudiante: crea una solicitud pendiente
export async function solicitarPrestamo(equipoId: number, dias: number): Promise<string | null> {
  const { error } = await supabase.rpc('solicitar_prestamo', { p_equipo: equipoId, p_dias: dias });
  return error ? mensajeError(error) : null;
}

// Préstamos del usuario que tiene la sesión abierta
export async function misPrestamos(): Promise<Prestamo[]> {
  const { data: sesion } = await supabase.auth.getUser();
  const id = sesion.user?.id;
  if (!id) return [];
  const { data, error } = await supabase
    .from('prestamos')
    .select('id, fecha_prestamo, fecha_devolucion, estado, devuelto_en, equipos(nombre)')
    .eq('usuario_id', id)
    .order('id', { ascending: false });
  if (error) console.log(error.message);
  return (data ?? []) as unknown as Prestamo[];
}

// Admin: todos los préstamos con el nombre del estudiante y su carnet
export async function historial(): Promise<Prestamo[]> {
  const { data, error } = await supabase
    .from('prestamos')
    .select('id, fecha_prestamo, fecha_devolucion, estado, devuelto_en, equipos(nombre), perfiles(nombre, carnet)')
    .order('id', { ascending: false });
  if (error) console.log(error.message);
  return (data ?? []) as unknown as Prestamo[];
}

// Admin: aprobar o rechazar
export async function resolverPrestamo(id: number, aprobar: boolean): Promise<string | null> {
  const { error } = await supabase.rpc('resolver_prestamo', { p_id: id, p_aprobar: aprobar });
  return error ? mensajeError(error) : null;
}

// Admin: marcar como devuelto
export async function marcarDevuelto(id: number): Promise<string | null> {
  const { error } = await supabase.rpc('marcar_devuelto', { p_id: id });
  return error ? mensajeError(error) : null;
}
