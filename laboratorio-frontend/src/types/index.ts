// Tipos principales del sistema

export interface Usuario {
  id: number;
  username: string;
  email: string;
  rol: 'medico' | 'bioquimico' | 'admin';
}

export interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  dni: number;
  email?: string;
  telefono?: string;
  especialidad?: string;
}

export interface Paciente {
  nro_ficha: number;
  Nombre_paciente: string;  // Coincide con tu BD
  Apellido_paciente: string; // Coincide con tu BD
  fecha_alta: string;
  fecha_nacimiento: string;
  edad: number;
  sexo: 'M' | 'F';
  estado: string;
  mutual: string;
  nro_afiliado?: number;
  grupo_sanguineo: string;
  DNI: number; // Coincide con tu BD
  CP?: number;
  direccion?: string;
  telefono?: number;
}

export interface Analisis {
  'CODIGO DE PRACTICA': number; // Coincide con tu BD
  DESCRIPCION_DE_PRACTICA: string; // Coincide con tu BD
  CODIGO_DE_MODULO: number; // Coincide con tu BD
  DESCRIPCION_DE_MODULO: string; // Coincide con tu BD
  INICIO_DE_VIGENCIA: string; // Coincide con tu BD
  HONORARIOS: number; // Coincide con tu BD
  GASTOS: number; // Coincide con tu BD
  TIPO: string; // Coincide con tu BD
}

export interface Orden {
  id_orden: number;
  urgente: boolean;
  id_medico_solicitante: number;
  id_bq_efectua?: number;
  fecha_ingreso_orden: string;
  nro_ficha_paciente: number;
  // Datos que vienen del JOIN con otras tablas
  Nombre_paciente?: string;    // Del JOIN con paciente
  Apellido_paciente?: string;  // Del JOIN con paciente
  medico_nombre?: string;
  total_analisis?: number;
  analisis_completados?: number;
  analisis_solicitados?: string;
}

export interface OrdenAnalisis {
  'Codigo_de_practica': number; // Coincide con tu BD
  id_orden: number;
  fecha_realizacion_analisis?: string;
}

export interface EstadisticasMedico {
  solicitudes_pendientes: number;
  resultados_listos: number;
  total_ordenes: number;
  total_pacientes: number;
}

export interface AnalisisPopular {
  DESCRIPCION_DE_PRACTICA: string; // Coincide con tu BD
  cantidad: number;
}

export interface DashboardMedicoData {
  medico: Medico;
  estadisticas: EstadisticasMedico;
  ordenes_recientes: Orden[];
  analisis_populares: AnalisisPopular[];
  notificaciones: string[];
}

// Estados de la aplicación
export type EstadoOrden = 'pendiente' | 'en_proceso' | 'completada' | 'cancelada';
export type EstadoAnalisis = 'pendiente' | 'en_proceso' | 'finalizado';