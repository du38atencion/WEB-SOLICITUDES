-- Restaurar el flujo sin login. Conserva las solicitudes y su historial.
-- Puede ejecutarse si se aplicó la migración ADMIN o si sigue el esquema original.
begin;
do $$
begin
 if to_regprocedure('public.registrar_seguimiento_interno(uuid,text,text,text,text)') is not null then
  drop function if exists public.registrar_seguimiento(uuid,text,text,text,text);
  alter function public.registrar_seguimiento_interno(uuid,text,text,text,text) rename to registrar_seguimiento;
 end if;
end; $$;
drop policy if exists leer_solicitudes on public.solicitudes;
drop policy if exists crear_solicitudes on public.solicitudes;
drop policy if exists leer_comentarios on public.comentarios_solicitud;
drop policy if exists leer_historial on public.historial_estado;
create policy leer_solicitudes on public.solicitudes for select to anon,authenticated using(true);
create policy crear_solicitudes on public.solicitudes for insert to anon,authenticated with check(true);
create policy leer_comentarios on public.comentarios_solicitud for select to anon,authenticated using(true);
create policy leer_historial on public.historial_estado for select to anon,authenticated using(true);
grant select on public.solicitudes,public.comentarios_solicitud,public.historial_estado to anon,authenticated;
grant insert(departamento_solicitante,nombre_solicitante,area_atiende,tipo_solicitud,prioridad,fecha_requerida,descripcion,ubicacion,observaciones) on public.solicitudes to anon,authenticated;
revoke all on function public.registrar_seguimiento(uuid,text,text,text,text) from public;
grant execute on function public.registrar_seguimiento(uuid,text,text,text,text) to anon,authenticated;
commit;
