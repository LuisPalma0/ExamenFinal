import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import Boton from '../components/Boton';
import { estilos } from '../lib/estilos';
import { crearProducto } from '../lib/productos';

export default function NuevoProducto() {
  const [nombre, setNombre] = useState('');
  const [minimo, setMinimo] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    const stockMinimo = Number(minimo || '0');
    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'Escribe el nombre del producto');
      return;
    }
    if (!Number.isInteger(stockMinimo) || stockMinimo < 0) {
      Alert.alert('Stock mínimo inválido', 'Escribe un número entero, cero o mayor');
      return;
    }
    setGuardando(true);
    const error = await crearProducto(nombre, stockMinimo);
    setGuardando(false);
    if (error) {
      Alert.alert('No se pudo guardar', error);
      return;
    }
    router.back();
  }

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.titulo}>Nuevo producto</Text>
      <TextInput style={estilos.input} placeholder='Nombre' value={nombre} onChangeText={setNombre} />
      <TextInput
        style={estilos.input}
        placeholder='Stock mínimo'
        keyboardType='numeric'
        value={minimo}
        onChangeText={setMinimo}
      />
      <Boton titulo={guardando ? 'Guardando...' : 'Guardar'} onPress={guardar} deshabilitado={guardando} />
    </View>
  );
}