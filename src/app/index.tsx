import { useState } from 'react';
import { Text, View } from 'react-native';
import Boton from '../components/Boton';
import Etiqueta from '../components/Etiqueta';
import { estilos } from '../lib/estilos';

export default function Inicio() {
  const [contador, setContador] = useState(0);

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.titulo}>Mini One Space</Text>
      <Etiqueta texto='Hola' color='#16a34a' />
      <Text>Has tocado {contador} veces</Text>
      <Boton titulo='Sumar' onPress={() => setContador(contador + 1)} />
    </View>
  );
}