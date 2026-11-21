CREATE OR REPLACE FUNCTION public.crear_perfil()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.perfiles (id, nombre, edad, tarjeta_ultimos4, rol)
  values (
    new.id,
    new.raw_user_meta_data->>'nombre',
    (new.raw_user_meta_data->>'edad')::int,
    new.raw_user_meta_data->>'tarjeta_ultimos4',
    'cliente'
  );
  return new;
end;
$function$;

CREATE TRIGGER al_crear_usuario 
AFTER INSERT ON auth.users 
FOR EACH ROW EXECUTE FUNCTION crear_perfil()