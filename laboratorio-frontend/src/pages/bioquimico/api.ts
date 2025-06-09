import type { Orden } from './types';

const API_URL = 'http://localhost:4000/bioquimico'; // ajustar según backend

export async function fetchOrdenesPendientes(): Promise<Orden[]> {
  const res = await fetch(`${API_URL}/ordenes/pendientes`);
  if (!res.ok) throw new Error('Error al obtener órdenes');
  return res.json();
}

export async function actualizarOrdenResultado(id: number, resultado: string, estado: string): Promise<void> {
  const res = await fetch(`${API_URL}/ordenes/${id}/resultado`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resultado, estado }),
  });
  if (!res.ok) throw new Error('Error al actualizar orden');
}
