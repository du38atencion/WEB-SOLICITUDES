import type {Request} from './config';
import {type BoardFilters,type Cutoff,cutoffLabel,reportTimeZone} from './reports';
export async function createReportWorkbook(rows:Request[],filters:BoardFilters,cutoff:Cutoff){
 const {default:ExcelJS}=await import('exceljs');
 const workbook=new ExcelJS.Workbook();
 workbook.creator='Sistema Web de Solicitudes Internas';workbook.created=new Date();
 const sheet=workbook.addWorksheet('Solicitudes',{views:[{state:'frozen',ySplit:1}]});
 const columns:[string,keyof Request,number][]=[['Folio','folio',24],['Fecha de creación','created_at',28],['Departamento','departamento_solicitante',22],['Solicitante','nombre_solicitante',25],['Área a atender','area_atiende',20],['Tipo de solicitud','tipo_solicitud',24],['Prioridad','prioridad',15],['Fecha requerida','fecha_requerida',18],['Estado','estado',18],['Descripción','descripcion',55],['Ubicación','ubicacion',28],['Observaciones','observaciones',50],['Última actualización','updated_at',28]];
 sheet.columns=columns.map(([header,key,width])=>({header,key,width}));
 const format=(value:string)=>new Intl.DateTimeFormat('es-MX',{timeZone:reportTimeZone,dateStyle:'short',timeStyle:'medium'}).format(new Date(value));
 rows.forEach(row=>sheet.addRow({...row,created_at:format(row.created_at),updated_at:format(row.updated_at),observaciones:row.observaciones||''}));
 sheet.autoFilter={from:'A1',to:'M1'};
 sheet.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};sheet.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF234C63'}};sheet.getRow(1).height=25;
 sheet.eachRow(row=>{row.alignment={vertical:'top',wrapText:true};});
 const info=workbook.addWorksheet('Resumen');info.columns=[{header:'Concepto',key:'label',width:32},{header:'Valor',key:'value',width:55}];
 const add=(label:string,value:string|number)=>info.addRow({label,value});
 add('Corte',cutoffLabel(cutoff));add('Fecha usada para el corte','Fecha de creación');add('Zona horaria',reportTimeZone);add('Generado',format(new Date().toISOString()));
 const names:Record<keyof BoardFilters,string>={folio:'Folio',departamento_solicitante:'Departamento',area_atiende:'Área a atender',prioridad:'Prioridad',estado:'Estado'};
 for(const key of Object.keys(names) as (keyof BoardFilters)[])add(`Filtro: ${names[key]}`,filters[key]||'Todos');
 add('Total de solicitudes',rows.length);add('Pendientes',rows.filter(r=>r.estado==='Pendiente').length);add('En proceso',rows.filter(r=>r.estado==='En proceso').length);add('Atendidas / cerradas',rows.filter(r=>['Atendida','Cerrada'].includes(r.estado)).length);add('Urgentes',rows.filter(r=>r.prioridad==='Urgente').length);
 add('Alcance','Estado actual de las solicitudes filtradas; no es un cierre contable ni un estado guardado de fechas anteriores.');info.getRow(1).font={bold:true};info.eachRow(row=>{row.alignment={wrapText:true,vertical:'top'};});
 return workbook;
}
export async function downloadExcel(rows:Request[],filters:BoardFilters,cutoff:Cutoff,filename:string){
 const workbook=await createReportWorkbook(rows,filters,cutoff);const buffer=await workbook.xlsx.writeBuffer();const bytes=new Uint8Array(buffer.byteLength);bytes.set(new Uint8Array(buffer));
 const url=URL.createObjectURL(new Blob([bytes.buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
