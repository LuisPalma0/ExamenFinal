import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { haySesion } from '../lib/auth';

export default function Inicio() {
  const [sesion, setSesion] = useState<boolean | null>(null);

  useEffect(() => {
    haySesion().then(setSesion);
  }, []);

  if (sesion === null) {
    return <ActivityIndicator style={{ marginTop: 80 }} />;
  }
  return <Redirect href={sesion ? '/peliculas' : '/login'} />;
}