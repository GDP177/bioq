export interface Orden {
  id: number;
  paciente_nombre: string;
  fecha_orden: string;
  examen: string;
  resultado: string | null;
  estado: 'pendiente' | 'en proceso' | 'finalizada';
}
