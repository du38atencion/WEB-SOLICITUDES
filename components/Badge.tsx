const colors:Record<string,string>={'Pendiente':'gray','En revisión':'blue','En proceso':'yellow','Atendida':'green','Cerrada':'darkgreen','Rechazada':'red','Baja':'green','Media':'blue','Alta':'orange','Urgente':'red'};
export default function Badge({value}:{value:string}){return <span className={`badge ${colors[value] || 'gray'}`}>{value}</span>;}
