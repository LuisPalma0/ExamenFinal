import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Boton from '../components/Boton';
import Etiqueta from '../components/Etiqueta';
import { cerrarSesion } from '../lib/auth';
import { estilos } from '../lib/estilos';
import { obtenerProductos, type Producto } from '../lib/productos';

export default function Productos() {
  const [lista, setLista] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function cargar() {
        setLista(await obtenerProductos());
        setCargando(false);
      }
      cargar();
    }, [])
  );

  async function salir() {
    await cerrarSesion();
    router.replace('/login');
  }

  return (
    <ScrollView contentContainerStyle={estilos.pantalla}>
      <Text style={estilos.titulo}>Productos</Text>
      <Boton titulo='Nuevo producto' onPress={() => router.push('/nuevo')} />
      {cargando && <Text>Cargando...</Text>}
      {!cargando && lista.length === 0 && <Text>Aún no hay productos.</Text>}
      {lista.map((p) => (
        <View key={p.id} style={estilos.tarjeta}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>{p.nombre}</Text>
          <Text>Existencias: {p.cantidad}</Text>
          {p.cantidad <= p.stock_minimo && <Etiqueta texto='Stock bajo' color='#dc2626' />}
          <Boton
            titulo='Registrar entrada'
            onPress={() => router.push({ pathname: '/movimiento', params: { id: String(p.id), tipo: 'entrada', nombre: p.nombre } })}
          />
          <Boton
            titulo='Registrar salida'
            onPress={() => router.push({ pathname: '/movimiento', params: { id: String(p.id), tipo: 'salida', nombre: p.nombre } })}
          />
        </View>
      ))}
      <Boton titulo='Cerrar sesión' onPress={salir} />
    </ScrollView>
  );
}