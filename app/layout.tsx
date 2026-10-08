import type { Metadata } from 'next';
import './globals.css';
import { siteName } from '@/lib/config';
export const metadata: Metadata = {title:siteName,description:'Registro y seguimiento de solicitudes entre áreas de planta'};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="es"><body>{children}</body></html>;}
