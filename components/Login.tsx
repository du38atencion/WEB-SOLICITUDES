'use client';
import {useState} from 'react';
import {supabase} from '@/lib/supabase';
import {adminEmail} from '@/lib/auth';
export default function Login(){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(!supabase)return;const form=event.currentTarget;const values=new FormData(form);setError('');if(String(values.get('usuario')).trim().toUpperCase()!=='ADMIN'){setError('Usuario o contraseña incorrectos.');return;}setBusy(true);try{const {data,error}=await supabase.auth.signInWithPassword({email:adminEmail,password:String(values.get('password'))});if(error||!data.session){setError('No se pudo iniciar sesión. Revisa tus datos y que la cuenta ADMIN esté creada en Supabase.');return;}form.reset();}catch{setError('No se pudo conectar. Intenta de nuevo.');}finally{setBusy(false);}}
 return <section className="panel login-panel"><span className="eyebrow">ACCESO AL SISTEMA</span><h1>Iniciar sesión</h1><p className="muted">Ingresa tus datos para registrar y consultar solicitudes.</p><form onSubmit={submit}><label>Usuario<input name="usuario" autoComplete="username" required maxLength={120}/></label><label>Contraseña<input name="password" type="password" autoComplete="current-password" required maxLength={200}/></label>{error&&<p className="error" role="alert">{error}</p>}<button disabled={busy||!supabase}>{busy?'Ingresando…':'Ingresar'}</button></form></section>;
}
