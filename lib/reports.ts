import type { Request } from './config';
export const reportTimeZone = 'America/Mexico_City';
export type Cutoff = { mode: 'daily' | 'monthly' | 'historical'; day: string; month: string };
export type BoardFilters = { folio: string; departamento_solicitante: string; area_atiende: string; prioridad: string; estado: string };
export function plantDay(value: string | Date = new Date()): string {
 const parts = new Intl.DateTimeFormat('en-US', {timeZone:reportTimeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
 const get = (name:string) => parts.find(part=>part.type===name)!.value;
 return `${get('year')}-${get('month')}-${get('day')}`;
}
export function matchesCutoff(request: Request, cutoff: Cutoff): boolean {
 if(cutoff.mode==='historical') return true;
 const date = plantDay(request.created_at);
 return cutoff.mode==='daily' ? !!cutoff.day && date===cutoff.day : !!cutoff.month && date.slice(0,7)===cutoff.month;
}
export function filterRequests(rows:Request[],filters:BoardFilters,cutoff:Cutoff):Request[]{
 return rows.filter(row=>matchesCutoff(row,cutoff)&&row.folio.toLowerCase().includes(filters.folio.trim().toLowerCase())&&Object.entries(filters).every(([key,value])=>key==='folio'||!value||row[key as keyof Request]===value));
}
export function cutoffLabel(cutoff:Cutoff):string {
 return cutoff.mode==='daily'?`Diario · ${cutoff.day}`:cutoff.mode==='monthly'?`Mensual · ${cutoff.month}`:'Histórico · todas las fechas';
}
export function reportFilename(cutoff:Cutoff):string {
 return `solicitudes-${cutoff.mode==='daily'?`diario-${cutoff.day}`:cutoff.mode==='monthly'?`mensual-${cutoff.month}`:'historico'}.xlsx`;
}
