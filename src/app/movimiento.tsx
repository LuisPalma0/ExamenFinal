import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import Boton from '../components/Boton';
import { estilos } from '../lib/estilos';
import { registrarMovimiento } from '../lib/productos';

export default function Movimiento() {
  const { id, tipo, nombre } = useLocalSearchParams<{ id: string; tipo: string; nombre: string }>();
  const [cantidad, setCantidad] = useState('');
  const [enviando, setEnviando] = useState(false);
  const esSalida = tipo === 'salida';

  async function guardar() {
    const n = Number(cantidad);
    if (!Number.isInteger(n) || n <= 0) {
      Alert.alert('Cantidad inválida', 'Escribe un número entero mayor que cero');
      return;
    }
    setEnviando(true);
    const error = await registrarMovimiento(Number(id), esSalida ? 'salida' : 'entrada', n);
    setEnviando(false);
    if (error) {
      Alert.alert('No se pudo registrar', error);
      return;
    }
    Alert.alert('Listo', 'Movimiento registrado');
    router.back();
  }

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.titulo}>{esSalida ? 'Salida' : 'Entrada'}</Text>
      <Text>Producto: {nombre}</Text>
      <TextInput
        style={estilos.input}
        placeholder='Cantidad'
        keyboardType='numeric'
        value={cantidad}
        onChangeText={setCantidad}
      />
      <Boton titulo={enviando ? 'Guardando...' : 'Confirmar'} onPress={guardar} deshabilitado={enviando} />
    </View>
  );
}