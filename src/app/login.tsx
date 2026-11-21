import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Boton from '../components/Boton';
import { avisar } from '../lib/avisar';
import { iniciarSesion } from '../lib/auth';
import { estilos } from '../lib/estilos';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    if (!email.trim() || !password) {
      avisar('Faltan datos', 'Escribe tu correo y tu contraseña');
      return;
    }
    setCargando(true);
    try {
      const error = await iniciarSesion(email, password);
      if (error) {
        avisar('No se pudo iniciar sesión', error);
        return;
      }
      router.replace('/equipos');
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.titulo}>Laboratorios - Iniciar sesión</Text>
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
      <Boton titulo='Registrarme como estudiante' onPress={() => router.push('/registro')} />
    </View>
  );
}
