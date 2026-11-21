import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import Boton from '../components/Boton';
import Etiqueta from '../components/Etiqueta';
import { cerrarSesion } from '../lib/auth';
import { avisar } from '../lib/avisar';
import { estilos } from '../lib/estilos';
import { obtenerPeliculas, rentarPelicula, type Pelicula } from '../lib/peliculas';
import { obtenerPerfil, subirFoto, tarjetaEnmascarada, urlFoto, type Perfil } from '../lib/perfil';

export default function Peliculas() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [lista, setLista] = useState<Pelicula[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    const p = await obtenerPerfil();
    setPerfil(p);
    setFoto(await urlFoto(p?.foto_path ?? null));
    setLista(await obtenerPeliculas());
    setCargando(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  async function rentar(p: Pelicula) {
    const error = await rentarPelicula(p.id);
    if (error) {
      avisar('No se pudo rentar', error);
      return;
    }
    avisar('Listo', `Rentaste ${p.titulo}. Puedes verla en Mis rentas.`);
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
      {!cargando && !perfil && (
        <Text>Tu usuario no tiene perfil. Regístrate de nuevo o pide al administrador que lo cree.</Text>
      )}
      {perfil && (
        <View style={[estilos.tarjeta, { alignItems: 'center' }]}>
          {foto ? (
            <Image source={{ uri: foto }} style={{ width: 96, height: 96, borderRadius: 48 }} />
          ) : (
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#e5e7eb' }} />
          )}
          <Text style={{ fontSize: 20, fontWeight: '600' }}>{perfil.nombre}</Text>
          <Text>Edad: {perfil.edad} años</Text>
          <Text>Tarjeta: {tarjetaEnmascarada(perfil.tarjeta_ultimos4)}</Text>
          {perfil.rol === 'admin' && <Etiqueta texto='Administrador' color='#7c3aed' />}
          <Boton titulo='Cambiar foto' onPress={cambiarFoto} />
        </View>
      )}
      {perfil && <Boton titulo='Mis rentas' onPress={() => router.push('/misrentas')} />}
      {perfil?.rol === 'admin' && <Boton titulo='Panel de administrador' onPress={() => router.push('/admin')} />}

      <Text style={estilos.titulo}>Películas</Text>
      {lista.map((p) => (
        <View key={p.id} style={estilos.tarjeta}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>{p.titulo}</Text>
          <Text>{p.genero} - {p.anio}</Text>
          <Text>Precio: ${Number(p.precio).toFixed(2)}</Text>
          <Boton titulo='Rentar' onPress={() => rentar(p)} />
        </View>
      ))}
      <Boton titulo='Cerrar sesión' onPress={salir} />
    </ScrollView>
  );
}