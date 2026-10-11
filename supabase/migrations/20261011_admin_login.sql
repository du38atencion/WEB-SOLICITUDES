-- Ejecutar una vez DESPUÉS de schema.sql en la base existente.
-- Conserva todas las solicitudes. Solo ADMIN podrá usar la API.
begin;
drop policy leer_solicitudes on public.solicitudes;
drop policy crear_solicitudes on public.solicitudes;
drop policy leer_comentarios on public.comentarios_solicitud;
drop policy leer_historial on public.historial_estado;
create policy leer_solicitudes on public.solicitudes for select to authenticated using ((select auth.jwt()->>'email')='admin@solicitudes.internal');
create policy crear_solicitudes on public.solicitudes for insert to authenticated with check ((select auth.jwt()->>'email')='admin@solicitudes.internal');
create policy leer_comentarios on public.comentarios_solicitud for select to authenticated using ((select auth.jwt()->>'email')='admin@solicitudes.internal');
create policy leer_historial on public.historial_estado for select to authenticated using ((select auth.jwt()->>'email')='admin@solicitudes.internal');
revoke all on public.solicitudes,public.comentarios_solicitud,public.historial_estado from anon;
revoke insert(departamento_solicitante,nombre_solicitante,area_atiende,tipo_solicitud,prioridad,fecha_requerida,descripcion,ubicacion,observaciones) on public.solicitudes from anon;
-- El procedimiento original queda inaccesible desde la API pública.
alter function public.registrar_seguimiento(uuid,text,text,text,text) rename to registrar_seguimiento_interno;
revoke all on function public.registrar_seguimiento_interno(uuid,text,text,text,text) from public,anon,authenticated;
create function public.registrar_seguimiento(p_solicitud_id uuid,p_estado text,p_estado_esperado text,p_comentario text default null,p_autor text default null)
returns void language plpgsql security definer set search_path='' as $$
begin
 if (auth.jwt()->>'email') is distinct from 'admin@solicitudes.internal' then
  raise exception 'Debes iniciar sesión como ADMIN' using errcode='42501';
 end if;
 perform public.registrar_seguimiento_interno(p_solicitud_id,p_estado,p_estado_esperado,p_comentario,p_autor);
end; $$;
revoke all on function public.registrar_seguimiento(uuid,text,text,text,text) from public,anon;
grant execute on function public.registrar_seguimiento(uuid,text,text,text,text) to authenticated;
commit;
