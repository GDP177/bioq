import React, { useState } from 'react';
import type { Orden } from './types';

interface Props {
  orden: Orden;
  onActualizar: () => void;
}

const OrdenItem: React.FC<Props> = ({ orden, onActualizar }) => {
  const [resultado, setResultado] = useState(orden.resultado || '');
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState('');
  const estadosPermitidos: Orden['estado'][] = ['pendiente', 'en proceso', 'finalizada'];
  const [estado, setEstado] = useState<Orden['estado']>(orden.estado);

  const handleGuardar = async () => {
    if (!resultado.trim()) {
      setError('El resultado no puede estar vacío');
      return;
    }
    if (!estadosPermitidos.includes(estado)) {
      setError('Estado inválido');
      return;
    }

    try {
      setError('');
      await fetch(`/bioquimico/ordenes/${orden.id}/resultado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultado, estado }),
      });
      setEditando(false);
      onActualizar();
    } catch {
      setError('Error al guardar resultado');
    }
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-2">{orden.paciente_nombre}</td>
      <td className="px-4 py-2">{new Date(orden.fecha_orden).toLocaleDateString()}</td>
      <td className="px-4 py-2">{orden.examen}</td>
      <td className="px-4 py-2">
        {editando ? (
          <textarea
            value={resultado}
            onChange={e => setResultado(e.target.value)}
            rows={2}
            className="w-full border rounded px-2 py-1"
          />
        ) : (
          <span>{orden.resultado || '—'}</span>
        )}
      </td>
      <td className="px-4 py-2">
        {editando ? (
          <select
            value={estado}
            onChange={e => setEstado(e.target.value as Orden['estado'])}
            className="border rounded px-2 py-1"
          >
            {estadosPermitidos.map(e => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        ) : (
          <span className="capitalize">{estado}</span>
        )}
      </td>
      <td className="px-4 py-2">
        {editando ? (
          <div className="flex flex-col gap-1">
            <button
              onClick={handleGuardar}
              className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            >
              Guardar
            </button>
            <button
              onClick={() => setEditando(false)}
              className="text-sm text-gray-600 underline"
            >
              Cancelar
            </button>
            {error && <div className="text-red-500 text-sm">{error}</div>}
          </div>
        ) : (
          <button
            onClick={() => setEditando(true)}
            className="text-blue-500 underline"
          >
            Editar
          </button>
        )}
      </td>
    </tr>
  );
};

export default OrdenItem;
