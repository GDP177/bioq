import React, { useState } from 'react';
import type { Orden } from './types';

interface Props {
  orden: Orden;
  onActualizar: () => void;
}

const estadosPermitidos = ['pendiente', 'en proceso', 'finalizada'] as const;
type Estado = typeof estadosPermitidos[number];

const OrdenItem: React.FC<Props> = ({ orden, onActualizar }) => {
  const [resultado, setResultado] = useState(orden.resultado || '');
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState('');

  const [estado, setEstado] = useState<Estado>(orden.estado as Estado);

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
    <tr>
      <td>{orden.paciente_nombre}</td>
      <td>{new Date(orden.fecha_orden).toLocaleDateString()}</td>
      <td>{orden.examen}</td>
      <td>
        {editando ? (
          <textarea
            value={resultado}
            onChange={e => setResultado(e.target.value)}
            rows={3}
            style={{ width: '100%' }}
          />
        ) : (
          orden.resultado || '—'
        )}
      </td>
      <td>
        {editando ? (
          <select
            value={estado}
            onChange={e => setEstado(e.target.value as Estado)}
          >
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
      <td>
        {editando ? (
          <>
            <button onClick={handleGuardar} style={{ marginRight: 8 }}>
              Guardar
            </button>
            <button onClick={() => setEditando(false)}>Cancelar</button>
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
