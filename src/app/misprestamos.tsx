import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Etiqueta from '../components/Etiqueta';
import { estilos } from '../lib/estilos';
import { colorEstado, misPrestamos, type Prestamo } from '../lib/prestamos';

export default function MisPrestamos() {
  const [lista, setLista] = useState<Prestamo[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      misPrestamos().then((l) => {
        setLista(l);
        setCargando(false);
      });
    }, [])
  );

  return (
    <ScrollView contentContainerStyle={estilos.pantalla}>
      <Text style={estilos.titulo}>Mis préstamos</Text>
      {cargando && <Text>Cargando...</Text>}
      {!cargando && lista.length === 0 && <Text>Todavía no has solicitado ningún equipo.</Text>}
      {lista.map((p) => (
        <View key={p.id} style={estilos.tarjeta}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>{p.equipos?.nombre}</Text>
          <Text>Préstamo: {p.fecha_prestamo}</Text>
          <Text>Devolución: {p.fecha_devolucion}</Text>
          <Etiqueta texto={p.estado} color={colorEstado[p.estado]} />
        </View>
      ))}
    </ScrollView>
  );
}
