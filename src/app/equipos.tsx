import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, Text, TextInput, View } from 'react-native';
import Boton from '../components/Boton';
import Etiqueta from '../components/Etiqueta';
import { cerrarSesion } from '../lib/auth';
import { avisar } from '../lib/avisar';
import { obtenerEquipos, type Equipo } from '../lib/equipos';
import { estilos } from '../lib/estilos';
import { obtenerPerfil, subirFoto, urlFoto, type Perfil } from '../lib/perfil';
import { solicitarPrestamo } from '../lib/prestamos';

export default function Equipos() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [lista, setLista] = useState<Equipo[]>([]);
  const [dias, setDias] = useState('3');
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    const p = await obtenerPerfil();
    setPerfil(p);
    setFoto(await urlFoto(p?.foto_path ?? null));
    setLista(await obtenerEquipos());
    setCargando(false);
  }, []);

  // Se recarga cada vez que la pantalla vuelve a mostrarse
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  async function solicitar(e: Equipo) {
    const d = Number(dias);
    if (!Number.isInteger(d) || d < 1 || d > 14) {
      avisar('Días inválidos', 'Escribe un número de días entre 1 y 14');
      return;
    }
    const error = await solicitarPrestamo(e.id, d);
    if (error) {
      avisar('No se pudo solicitar', error);
      return;
    }
    avisar('Solicitud enviada', `Solicitaste ${e.nombre}. Queda pendiente hasta que el administrador la apruebe.`);
  }

  async function cambiarFoto() {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (r.canceled) return;
    const archivo = r.assets[0];
    const error = await subirFoto(archivo.uri, archivo.mimeType ?? 'image/jpeg');
    if (error) {
      avisar('No se pudo subir la foto', error);
      return;
    }
    await cargar();
  }

  async function salir() {
    await cerrarSesion();
    router.replace('/login');
  }

  return (
    <ScrollView contentContainerStyle={estilos.pantalla}>
      {cargando && <Text>Cargando...</Text>}
      {!cargando && !perfil && <Text>Tu usuario no tiene perfil. Contacta al administrador.</Text>}
      {perfil && (
        <View style={[estilos.tarjeta, { alignItems: 'center' }]}>
          {foto ? (
            <Image source={{ uri: foto }} style={{ width: 96, height: 96, borderRadius: 48 }} />
          ) : (
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#e5e7eb' }} />
          )}
          <Text style={{ fontSize: 20, fontWeight: '600' }}>{perfil.nombre}</Text>
          <Text>Carnet: {perfil.carnet}</Text>
          <Text>Carrera: {perfil.carrera}</Text>
          {perfil.rol === 'admin' && <Etiqueta texto='Administrador' color='#7c3aed' />}
          <Boton titulo='Cambiar foto' onPress={cambiarFoto} />
        </View>
      )}
      {perfil && <Boton titulo='Mis préstamos' onPress={() => router.push('/misprestamos')} />}
      {perfil?.rol === 'admin' && <Boton titulo='Panel de administrador' onPress={() => router.push('/admin')} />}

      <Text style={estilos.titulo}>Catálogo de equipos</Text>
      <Text>Días de préstamo (1 a 14):</Text>
      <TextInput style={estilos.input} keyboardType='numeric' value={dias} onChangeText={setDias} />

      {lista.map((e) => (
        <View key={e.id} style={estilos.tarjeta}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>{e.nombre}</Text>
          <Text>{e.descripcion}</Text>
          <Etiqueta
            texto={e.disponible ? 'Disponible' : 'No disponible'}
            color={e.disponible ? '#16a34a' : '#dc2626'}
          />
          <Boton titulo='Solicitar préstamo' onPress={() => solicitar(e)} deshabilitado={!e.disponible} />
        </View>
      ))}
      <Boton titulo='Cerrar sesión' onPress={salir} />
    </ScrollView>
  );
}
