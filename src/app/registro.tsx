import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput } from 'react-native';
import Boton from '../components/Boton';
import { registrarUsuario } from '../lib/auth';
import { estilos } from '../lib/estilos';

export default function Registro() {
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [tarjeta, setTarjeta] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function crear() {
    const edadNum = Number(edad);
    const digitos = tarjeta.replace(/[^0-9]/g, '');
    if (!nombre.trim() || !email.trim() || !password) {
      Alert.alert('Faltan datos', 'Completa nombre, correo y contraseña');
      return;
    }
    if (!Number.isInteger(edadNum) || edadNum < 1 || edadNum > 120) {
      Alert.alert('Edad inválida', 'Escribe una edad entre 1 y 120');
      return;
    }
    if (digitos.length < 13 || digitos.length > 19) {
      Alert.alert('Tarjeta inválida', 'El número debe tener entre 13 y 19 dígitos');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña corta', 'Usa al menos 6 caracteres');
      return;
    }
    setEnviando(true);
    const error = await registrarUsuario({ email, password, nombre, edad: edadNum, tarjeta: digitos });
    setEnviando(false);
    if (error) {
      Alert.alert('No se pudo crear la cuenta', error);
      return;
    }
    Alert.alert('Cuenta creada', 'Ya puedes iniciar sesión');
    router.replace('/login');
  }

  return (
    <ScrollView contentContainerStyle={estilos.pantalla}>
      <Text style={estilos.titulo}>Crear cuenta</Text>
      <TextInput style={estilos.input} placeholder='Nombre completo' value={nombre} onChangeText={setNombre} />
      <TextInput style={estilos.input} placeholder='Edad' keyboardType='numeric' value={edad} onChangeText={setEdad} />
      <TextInput
        style={estilos.input}
        placeholder='Número de tarjeta (de prueba)'
        keyboardType='numeric'
        value={tarjeta}
        onChangeText={setTarjeta}
      />
      <TextInput
        style={estilos.input}
        placeholder='Correo'
        autoCapitalize='none'
        keyboardType='email-address'
        value={email}
        onChangeText={setEmail}
      />
      <TextInput style={estilos.input} placeholder='Contraseña' secureTextEntry value={password} onChangeText={setPassword} />
      <Boton titulo={enviando ? 'Creando...' : 'Registrarme'} onPress={crear} deshabilitado={enviando} />
    </ScrollView>
  );
}