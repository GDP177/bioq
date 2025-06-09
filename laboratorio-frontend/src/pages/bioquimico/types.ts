export interface Orden {
  id: number;
  paciente_nombre: string;
  fecha_orden: string;  // ISO string
  examen: string;
  estado: 'pendiente' | 'en proceso' | 'finalizada';
  resultado?: string;
}
