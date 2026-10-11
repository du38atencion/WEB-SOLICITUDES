'use client';
import {useState} from 'react';
import {departments,serviceAreas,requestTypes,priorities} from '@/lib/config';
import {supabase,errorMessage} from '@/lib/supabase';
export default function RequestForm({onHome}:{onHome:()=>void}){
 const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [folio,setFolio]=useState('');
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(!supabase)return;setBusy(true);setError('');const data=Object.fromEntries(new FormData(e.currentTarget));try{const {data:row,error}=await supabase.from('solicitudes').insert(data).select('folio').single();if(error)throw error;setFolio(row.folio);}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
 if(folio)return <section className="panel success"><span className="eyebrow">SOLICITUD REGISTRADA</span><h2>{folio}</h2><p>Tu solicitud se guardó y está pendiente de atención.</p><div className="actions"><button onClick={()=>setFolio('')}>Crear otra solicitud</button><button className="secondary" onClick={onHome}>Ir al inicio</button></div></section>;
 return <section className="panel"><h2>Nueva solicitud</h2><p className="muted">Describe lo que necesita tu área. Los campos con * son obligatorios.</p><form onSubmit={submit}><div className="form-grid">
 <Select label="Departamento" name="departamento_solicitante" options={departments}/><label>Nombre de quien solicita *<input name="nombre_solicitante" required maxLength={120}/></label>
 <Select label="Área a atender" name="area_atiende" options={serviceAreas}/><Select label="Tipo de solicitud" name="tipo_solicitud" options={requestTypes}/><Select label="Prioridad" name="prioridad" options={[...priorities]}/><label>Fecha requerida *<input name="fecha_requerida" type="date" required/></label>
 <label className="full">Descripción del problema o necesidad *<textarea name="descripcion" required maxLength={5000} rows={5}/></label><label className="full">Ubicación / línea / máquina / área *<input name="ubicacion" required maxLength={200}/></label><label className="full">Observaciones<textarea name="observaciones" rows={3} maxLength={5000}/></label></div>
 {error&&<p role="alert" className="error">{error}</p>}<div className="actions"><button disabled={busy||!supabase}>{busy?'Guardando…':'Registrar solicitud'}</button><button type="button" className="secondary" onClick={onHome}>Cancelar</button></div></form></section>;
}
export function Select({label,name,options}:{label:string;name:string;options:string[]}){return <label>{label} *<select name={name} required defaultValue=""><option value="" disabled>Selecciona una opción</option>{options.map(v=><option key={v}>{v}</option>)}</select></label>;}
