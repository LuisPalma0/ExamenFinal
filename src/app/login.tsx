import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import Boton from '../components/Boton';
import { iniciarSesion } from '../lib/auth';
import { estilos } from '../lib/estilos';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    if (!email.trim() || !password) {
      Alert.alert('Faltan datos', 'Escribe tu correo y tu contraseña');
      return;
    }
    setCargando(true);
    const ok = await iniciarSesion(email, password);
    setCargando(false);
    if (ok) {
      router.replace('/peliculas');
    } else {
      Alert.alert('Error', 'Correo o contraseña incorrectos');
    }
  }

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.titulo}>Iniciar sesión</Text>
      <TextInput
        style={estilos.input}
        placeholder='Correo'
        autoCapitalize='none'
        keyboardType='email-address'
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={estilos.input}
        placeholder='Contraseña'
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Boton titulo={cargando ? 'Entrando...' : 'Entrar'} onPress={entrar} deshabilitado={cargando} />
      <Boton titulo='Crear cuenta' onPress={() => router.push('/registro')} />
    </View>
  );
}