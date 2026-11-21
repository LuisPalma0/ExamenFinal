import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput } from 'react-native';
import Boton from '../components/Boton';
import { avisar } from '../lib/avisar';
import { haySesion, registrarUsuario } from '../lib/auth';
import { estilos } from '../lib/estilos';

export default function Registro() {
  const [nombre, setNombre] = useState('');
  const [carnet, setCarnet] = useState('');
  const [carrera, setCarrera] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function crear() {
    if (!nombre.trim() || !carnet.trim() || !carrera.trim() || !email.trim() || !password) {
      avisar('Faltan datos', 'Completa nombre, carnet, carrera, correo y contraseña');
      return;
    }
    if (password.length < 6) {
      avisar('Contraseña corta', 'Usa al menos 6 caracteres');
      return;
    }
    setEnviando(true);
    try {
      const error = await registrarUsuario({ email, password, nombre, carnet, carrera });
      if (error) {
        avisar('No se pudo crear la cuenta', error);
        return;
      }
      if (await haySesion()) {
        router.replace('/equipos');
      } else {
        avisar('Cuenta creada', 'Revisa tu correo para confirmar la cuenta e inicia sesión');
        router.replace('/login');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={estilos.pantalla}>
      <Text style={estilos.titulo}>Registro de estudiante</Text>
      <TextInput style={estilos.input} placeholder='Nombre completo' value={nombre} onChangeText={setNombre} />
      <TextInput style={estilos.input} placeholder='Carnet' autoCapitalize='characters' value={carnet} onChangeText={setCarnet} />
      <TextInput style={estilos.input} placeholder='Carrera' value={carrera} onChangeText={setCarrera} />
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
        placeholder='Contraseña (mínimo 6 caracteres)'
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Boton titulo={enviando ? 'Creando...' : 'Registrarme'} onPress={crear} deshabilitado={enviando} />
    </ScrollView>
  );
}
