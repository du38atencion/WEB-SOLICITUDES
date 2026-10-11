'use client';
import {useEffect,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import Login from './Login';
import {adminEmail} from '@/lib/auth';
import Image from 'next/image';
import brandLogo from '@/public/stellantis-logo.png';
import {siteName} from '@/lib/config';
import {supabase} from '@/lib/supabase';
import RequestForm from './RequestForm';
import RequestBoard from './RequestBoard';
export default function Platform(){const [view,setView]=useState('home');
 const [session,setSession]=useState<Session|null>(null),[loading,setLoading]=useState(true),[authError,setAuthError]=useState('');
 useEffect(()=>{if(!supabase){setLoading(false);return;}const client=supabase;let active=true;let changed=false;
 const {data:{subscription}}=client.auth.onAuthStateChange((event,next)=>{changed=true;if(active){setSession(next);setLoading(false);if(event==='SIGNED_IN'||event==='SIGNED_OUT')setView('home');}});
 void client.auth.getSession().then(({data,error})=>{if(active&&!changed){setSession(data.session);setLoading(false);if(error)setAuthError('No se pudo verificar la sesión. Vuelve a ingresar.');}}).catch(()=>{if(active&&!changed){setLoading(false);setAuthError('No se pudo verificar la sesión.');}});
 return()=>{active=false;subscription.unsubscribe();};},[]);
 const loggedIn=session?.user.email===adminEmail;
 async function logout(){if(!supabase)return;const {error}=await supabase.auth.signOut();if(error)setAuthError('No se pudo cerrar la sesión. Intenta de nuevo.');else{setSession(null);setView('home');setAuthError('');}}
 return <><header><div className="brand"><Image className="brand-logo" src={brandLogo} alt="Stellantis" priority sizes="(max-width: 600px) 170px, 240px"/><div><strong>{siteName}</strong><small>Comunicación y seguimiento en planta</small></div></div>{loggedIn&&<nav aria-label="Navegación principal"><button className={view==='home'?'active':'secondary'} onClick={()=>setView('home')}>Inicio</button><button className="secondary" onClick={()=>setView('board')}>Solicitudes</button><button className="secondary" onClick={()=>void logout()}>Cerrar sesión</button></nav>}</header><main>{!supabase&&<aside className="configuration" role="status"><strong>Falta conectar Supabase.</strong> Configura las variables de .env.local y ejecuta supabase/schema.sql como indica el README. El registro y la consulta estarán disponibles al conectar la base de datos.</aside>}{authError&&<p className="error" role="alert">{authError}</p>}{loading?<p role="status">Verificando sesión…</p>:!loggedIn?<Login/>:view==='home'?<><section className="hero"><span className="eyebrow">OPERACIONES · SOLICITUDES INTERNAS</span><h1>Una planta conectada.<br/>Cada solicitud, en seguimiento.</h1><p>Registra necesidades de tu área y consulta su avance en un solo lugar.</p></section><div className="home-grid"><button className="home-card" disabled={!supabase} onClick={()=>setView('new')}><span className="card-icon">＋</span><h2>Nueva solicitud</h2><p>Comunica un problema o necesidad al área que debe atenderlo.</p><strong>Registrar solicitud →</strong></button><button className="home-card" disabled={!supabase} onClick={()=>setView('board')}><span className="card-icon">▤</span><h2>Ver solicitudes</h2><p>Consulta prioridades, estados y el historial de seguimiento.</p><strong>Abrir tablero →</strong></button></div><p className="footnote">Registro centralizado · Seguimiento por área · Actualización en tiempo real</p></>:view==='new'?<RequestForm onHome={()=>setView('home')}/>:supabase?<RequestBoard/>:<section className="panel"><h2>Conecta la base de datos para consultar solicitudes</h2><p>Sigue las instrucciones del README para activar este tablero.</p></section>}</main><footer><div>{siteName} · Comunicación entre áreas</div><div>Creado por: Kevin Riojas</div><div>Soporte Creacion: Berenice Zapata</div></footer></>;}
