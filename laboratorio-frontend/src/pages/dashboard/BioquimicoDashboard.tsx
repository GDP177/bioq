import React, { useState } from 'react';
import type { Orden } from '@/components/ui/types';

interface Props {
  orden: Orden;
  onActualizar: () => void;
}

const estadosPermitidos = ['pendiente', 'en proceso', 'finalizada'] as const;

const OrdenItem: React.FC<Props> = ({ orden, onActualizar }) => {
  const [resultado, setResultado] = useState(orden.resultado || '');
  const [estado, setEstado] = useState<typeof estadosPermitidos[number]>(orden.estado);
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState('');

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
      const res = await fetch(`/bioquimico/resultado/${orden.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultado, estado }),
      });

      if (!res.ok) {
        throw new Error('Error al guardar resultado');
      }

      setEditando(false);
      onActualizar();
    } catch {
      setError('Error al guardar resultado');
    }
  };

  return (
    <tr>
      <td className="border p-2">{orden.paciente_nombre}</td>
      <td className="border p-2">{new Date(orden.fecha_orden).toLocaleDateString()}</td>
      <td className="border p-2">{orden.examen}</td>
      <td className="border p-2">
        {editando ? (
          <textarea
            value={resultado}
            onChange={e => setResultado(e.target.value)}
            rows={3}
            style={{ width: '100%' }}
          />
        ) : (
          resultado || '—'
        )}
      </td>
      <td className="border p-2">
        {editando ? (
          <select value={estado} onChange={e => setEstado(e.target.value as typeof estadosPermitidos[number])}>
            {estadosPermitidos.map(e => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        ) : (
          estado
        )}
      </td>
      <td className="border p-2">
        {editando ? (
          <>
            <button onClick={handleGuardar} style={{ marginRight: 8 }}>
              Guardar
            </button>
            <button onClick={() => { setEditando(false); setError(''); }}>
              Cancelar
            </button>
            {error && <div style={{ color: 'red', marginTop: 4 }}>{error}</div>}
          </>
        ) : (
          <button onClick={() => setEditando(true)}>Editar</button>
        )}
      </td>
    </tr>
  );
};

export default OrdenItem;
