'use client';
import {useState} from 'react';
import {supabase} from '@/lib/supabase';
import {adminEmail} from '@/lib/auth';
export default function Login(){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(!supabase)return;const form=event.currentTarget;const values=new FormData(form);setError('');if(String(values.get('usuario')).trim().toUpperCase()!=='ADMIN'){setError('Usuario o contraseña incorrectos.');return;}setBusy(true);try{const {data,error}=await supabase.auth.signInWithPassword({email:adminEmail,password:String(values.get('password'))});if(error||!data.session){
 const code=error?.code;
 setError(code==='email_not_confirmed'?'La cuenta ADMIN no está confirmada. Activa Auto Confirm al crearla en Supabase.':code==='email_provider_disabled'?'El acceso por correo y contraseña está desactivado en Supabase. Actívalo en Authentication.':code==='over_request_rate_limit'||code==='over_email_send_rate_limit'?'Demasiados intentos. Espera unos minutos y vuelve a intentar.':error?.status===0?'No se pudo conectar con Supabase. Revisa tu conexión.':'Usuario o contraseña incorrectos. La cuenta admin@solicitudes.internal debe existir en Authentication → Users de Supabase.');return;
 }form.reset();}catch{setError('No se pudo conectar. Intenta de nuevo.');}finally{setBusy(false);}}
 return <section className="panel login-panel"><span className="eyebrow">ACCESO AL SISTEMA</span><h1>Iniciar sesión</h1><p className="muted">Ingresa tus datos para registrar y consultar solicitudes.</p><form onSubmit={submit}><label>Usuario<input name="usuario" autoComplete="username" required maxLength={120}/></label><label>Contraseña<input name="password" type="password" autoComplete="current-password" required maxLength={200}/></label>{error&&<p className="error" role="alert">{error}</p>}<button disabled={busy||!supabase}>{busy?'Ingresando…':'Ingresar'}</button></form></section>;
}
