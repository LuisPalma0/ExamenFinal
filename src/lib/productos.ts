import { supabase } from './supabase';

export type Producto = {
  id: number;
  nombre: string;
  cantidad: number;
  stock_minimo: number;
};

function mensajeError(error: { code?: string; message: string }) {
  if (error.code === '23505') return 'Ese valor ya existe';
  if (error.code === '42501') return 'No tienes permiso para hacer esto';
  if (error.code === '23514') return 'No hay existencias suficientes';
  return error.message;
}

export async function obtenerProductos(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, cantidad, stock_minimo')
    .order('nombre');
  if (error) console.log(error.message);
  return (data ?? []) as Producto[];
}

export async function crearProducto(nombre: string, stockMinimo: number): Promise<string | null> {
  const { data, error } = await supabase
    .from('productos')
    .insert({ nombre: nombre.trim(), stock_minimo: stockMinimo })
    .select();
  if (error) return mensajeError(error);
  if (!data || data.length === 0) return 'No tienes permiso para hacer esto';
  return null;
}

export async function registrarMovimiento(
  productoId: number,
  tipo: 'entrada' | 'salida',
  cantidad: number
): Promise<string | null> {
  const { error } = await supabase.rpc('registrar_movimiento', {
    p_producto: productoId,
    p_tipo: tipo,
    p_cantidad: cantidad,
  });
  return error ? mensajeError(error) : null;
}