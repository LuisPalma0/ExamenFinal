import { Platform, Share } from 'react-native';
import type { Prestamo } from './prestamos';

// Fecha de hoy según la hora del dispositivo, en formato AAAA-MM-DD
function fechaLocal() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// Cuenta los préstamos por estado, los vencidos y los equipos más solicitados
export function resumen(lista: Prestamo[]) {
  const hoy = fechaLocal();
  const conteo = { pendiente: 0, aprobado: 0, rechazado: 0, devuelto: 0 };
  const porEquipo: Record<string, number> = {};
  let vencidos = 0;

  for (const p of lista) {
    conteo[p.estado] += 1;
    const nombre = p.equipos?.nombre ?? 'Desconocido';
    porEquipo[nombre] = (porEquipo[nombre] ?? 0) + 1;
    if (p.estado === 'aprobado' && p.fecha_devolucion < hoy) vencidos += 1;
  }

  const top = Object.entries(porEquipo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return { total: lista.length, ...conteo, vencidos, top };
}

// Convierte el historial a texto CSV (se abre en Excel)
export function aCsv(lista: Prestamo[]) {
  const filas = lista.map((p) =>
    [
      p.id,
      p.perfiles?.nombre ?? '',
      p.perfiles?.carnet ?? '',
      p.equipos?.nombre ?? '',
      p.fecha_prestamo,
      p.fecha_devolucion,
      p.estado,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  return ['id,estudiante,carnet,equipo,fecha_prestamo,fecha_devolucion,estado', ...filas].join('\n');
}

// Web: descarga un archivo .csv. Celular: abre el menú de compartir.
export async function compartirReporte(texto: string) {
  if (Platform.OS === 'web') {
    const blob = new Blob([texto], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'reporte-prestamos.csv';
    enlace.click();
    URL.revokeObjectURL(url);
  } else {
    await Share.share({ message: texto, title: 'Reporte de préstamos' });
  }
}
