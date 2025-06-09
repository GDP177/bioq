import React, { useEffect, useState } from 'react';
import type { Orden } from './types';
import { fetchOrdenesPendientes, actualizarOrdenResultado } from './api';
import OrdenItem from './OrdenItem';

const paleta = {
  fondo: '#f4f7fa',
  texto: '#0a3d62',
  botonPrimario: '#2980b9',
  botonHover: '#1c5980',
  borde: '#dcdde1',
};

const OrdenesPendientes: React.FC = () => {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarOrdenes = async () => {
    setCargando(true);
    setError('');
    try {
      const data = await fetchOrdenesPendientes();
      setOrdenes(data);
    } catch {
      setError('No se pudieron cargar las órdenes.');
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarOrdenes();
  }, []);

  return (
    <main
      style={{
        backgroundColor: paleta.fondo,
        minHeight: '100vh',
        padding: '2rem',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: paleta.texto,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <section
        style={{
          maxWidth: 900,
          width: '100%',
          backgroundColor: 'white',
          borderRadius: 8,
          boxShadow: '0 4px 10px rgb(0 0 0 / 0.1)',
          padding: '1.5rem',
        }}
      >
        <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Órdenes Pendientes</h1>
        {cargando ? (
          <p style={{ textAlign: 'center' }}>Cargando órdenes...</p>
        ) : error ? (
          <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>
        ) : ordenes.length === 0 ? (
          <p style={{ textAlign: 'center' }}>No hay órdenes pendientes.</p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr>
                <th style={{ borderBottom: `2px solid ${paleta.borde}`, padding: 12, textAlign: 'left' }}>
                  Paciente
                </th>
                <th style={{ borderBottom: `2px solid ${paleta.borde}`, padding: 12, textAlign: 'left' }}>
                  Fecha Orden
                </th>
                <th style={{ borderBottom: `2px solid ${paleta.borde}`, padding: 12, textAlign: 'left' }}>
                  Examen
                </th>
                <th style={{ borderBottom: `2px solid ${paleta.borde}`, padding: 12, textAlign: 'left' }}>
                  Resultado
                </th>
                <th style={{ borderBottom: `2px solid ${paleta.borde}`, padding: 12, textAlign: 'left' }}>
                  Estado
                </th>
                <th style={{ borderBottom: `2px solid ${paleta.borde}`, padding: 12, textAlign: 'center' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map(o => (
                <OrdenItem
                  key={o.id}
                  orden={o}
                  onActualizar={cargarOrdenes}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
};

export default OrdenesPendientes;
