import { useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Boton from '../components/Boton';
import Etiqueta from '../components/Etiqueta';
import { avisar } from '../lib/avisar';
import { estilos } from '../lib/estilos';
import { obtenerPerfil, type Perfil } from '../lib/perfil';
import { colorEstado, historial, marcarDevuelto, resolverPrestamo, type Prestamo } from '../lib/prestamos';
import { aCsv, compartirReporte, resumen } from '../lib/reportes';

type Seccion = 'pendientes' | 'activos' | 'historial' | 'reportes';

// Tarjeta que muestra un préstamo; los botones se pasan como "children"
function TarjetaPrestamo({ p, children }: { p: Prestamo; children?: ReactNode }) {
  return (
    <View style={estilos.tarjeta}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>{p.equipos?.nombre}</Text>
      <Text>
        {p.perfiles?.nombre} (carnet {p.perfiles?.carnet})
      </Text>
      <Text>Préstamo: {p.fecha_prestamo}</Text>
      <Text>Devolución: {p.fecha_devolucion}</Text>
      <Etiqueta texto={p.estado} color={colorEstado[p.estado]} />
      {children}
    </View>
  );
}

export default function Admin() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [lista, setLista] = useState<Prestamo[]>([]);
  const [seccion, setSeccion] = useState<Seccion>('pendientes');
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setPerfil(await obtenerPerfil());
    setLista(await historial());
    setCargando(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  async function resolver(p: Prestamo, aprobar: boolean) {
    const error = await resolverPrestamo(p.id, aprobar);
    if (error) avisar('No se pudo completar', error);
    await cargar();
  }

  async function devolver(p: Prestamo) {
    const error = await marcarDevuelto(p.id);
    if (error) avisar('No se pudo completar', error);
    await cargar();
  }

  if (cargando) return <Text style={{ padding: 24 }}>Cargando...</Text>;
  if (perfil?.rol !== 'admin') {
    return <Text style={{ padding: 24 }}>Solo los administradores pueden ver este panel.</Text>;
  }

  const pendientes = lista.filter((p) => p.estado === 'pendiente');
  const activos = lista.filter((p) => p.estado === 'aprobado');
  const r = resumen(lista);

  return (
    <ScrollView contentContainerStyle={estilos.pantalla}>
      <Text style={estilos.titulo}>Panel de administrador</Text>
      <Boton titulo={`Solicitudes pendientes (${pendientes.length})`} onPress={() => setSeccion('pendientes')} />
      <Boton titulo={`Préstamos activos (${activos.length})`} onPress={() => setSeccion('activos')} />
      <Boton titulo='Historial' onPress={() => setSeccion('historial')} />
      <Boton titulo='Reportes' onPress={() => setSeccion('reportes')} />

      {seccion === 'pendientes' && (
        <>
          <Text style={estilos.titulo}>Solicitudes pendientes</Text>
          {pendientes.length === 0 && <Text>No hay solicitudes pendientes.</Text>}
          {pendientes.map((p) => (
            <TarjetaPrestamo key={p.id} p={p}>
              <Boton titulo='Aprobar' onPress={() => resolver(p, true)} />
              <Boton titulo='Rechazar' onPress={() => resolver(p, false)} />
            </TarjetaPrestamo>
          ))}
        </>
      )}

      {seccion === 'activos' && (
        <>
          <Text style={estilos.titulo}>Préstamos activos</Text>
          {activos.length === 0 && <Text>No hay préstamos activos.</Text>}
          {activos.map((p) => (
            <TarjetaPrestamo key={p.id} p={p}>
              <Boton titulo='Marcar como devuelto' onPress={() => devolver(p)} />
            </TarjetaPrestamo>
          ))}
        </>
      )}

      {seccion === 'historial' && (
        <>
          <Text style={estilos.titulo}>Historial completo</Text>
          {lista.length === 0 && <Text>Todavía no hay registros.</Text>}
          {lista.map((p) => (
            <TarjetaPrestamo key={p.id} p={p} />
          ))}
        </>
      )}

      {seccion === 'reportes' && (
        <>
          <Text style={estilos.titulo}>Reportes</Text>
          <View style={estilos.tarjeta}>
            <Text>Total de solicitudes: {r.total}</Text>
            <Text>Pendientes: {r.pendiente}</Text>
            <Text>Aprobados: {r.aprobado}</Text>
            <Text>Rechazados: {r.rechazado}</Text>
            <Text>Devueltos: {r.devuelto}</Text>
            <Text>Vencidos sin devolver: {r.vencidos}</Text>
          </View>
          <View style={estilos.tarjeta}>
            <Text style={{ fontWeight: '600' }}>Equipos más solicitados</Text>
            {r.top.length === 0 && <Text>Sin datos todavía.</Text>}
            {r.top.map(([nombre, cantidad]) => (
              <Text key={nombre}>
                {nombre}: {cantidad}
              </Text>
            ))}
          </View>
          <Boton titulo='Descargar o compartir reporte (CSV)' onPress={() => compartirReporte(aCsv(lista))} />
        </>
      )}
    </ScrollView>
  );
}
