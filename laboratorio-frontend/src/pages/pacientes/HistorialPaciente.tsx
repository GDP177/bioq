// src/pages/pacientes/HistorialPaciente.tsx

import { useState, useEffect } from "react";

const HistorialPaciente = () => {
  const [nroFicha, setNroFicha] = useState<string>("");

  useEffect(() => {
    // Obtener número de ficha de la URL
    const pathParts = window.location.pathname.split('/');
    const fichaIndex = pathParts.indexOf('paciente') + 1;
    if (fichaIndex > 0 && pathParts[fichaIndex]) {
      setNroFicha(pathParts[fichaIndex]);
    }
  }, []);

  const navigateBack = () => {
    window.location.href = '/medico/pacientes';
  };

  const navigateToDashboard = () => {
    window.location.href = '/medico/dashboard';
  };

  const navigateToNuevaOrden = () => {
    window.location.href = '/medico/nueva-solicitud';
  };

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Historial del Paciente</h1>
              <p className="mt-1 text-sm text-gray-500">
                Historial médico completo - Ficha #{nroFicha}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={navigateBack}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← Volver
              </button>
              <button
                onClick={navigateToNuevaOrden}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                🧪 Nueva Orden
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Estado de desarrollo */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center mb-6">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Historial Médico</h2>
          <p className="text-blue-800 mb-6">
            El sistema de historial médico está en desarrollo.
            <br />
            Aquí podrás ver todo el historial de análisis, tratamientos y observaciones médicas.
          </p>
        </div>

        {/* Grid de funcionalidades futuras */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Órdenes de análisis */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🧪</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Órdenes de Análisis</h3>
              <p className="text-sm text-gray-600 mb-4">
                Historial completo de todas las órdenes de laboratorio
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Próximamente disponible</p>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Resultados</h3>
              <p className="text-sm text-gray-600 mb-4">
                Todos los resultados de análisis con gráficos de evolución
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Próximamente disponible</p>
              </div>
            </div>
          </div>

          {/* Observaciones médicas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Observaciones</h3>
              <p className="text-sm text-gray-600 mb-4">
                Notas médicas y observaciones clínicas importantes
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Próximamente disponible</p>
              </div>
            </div>
          </div>

          {/* Tratamientos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-4xl mb-3">💊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tratamientos</h3>
              <p className="text-sm text-gray-600 mb-4">
                Registro de tratamientos y medicaciones indicadas
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Próximamente disponible</p>
              </div>
            </div>
          </div>

          {/* Alergias y condiciones */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Alergias</h3>
              <p className="text-sm text-gray-600 mb-4">
                Registro de alergias y condiciones médicas especiales
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Próximamente disponible</p>
              </div>
            </div>
          </div>

          {/* Cronología */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cronología</h3>
              <p className="text-sm text-gray-600 mb-4">
                Timeline completo de la historia médica del paciente
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Próximamente disponible</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información del paciente placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Información del Paciente
          </h3>
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">👤</div>
            <p className="text-gray-600 mb-2">
              <span className="font-medium">Número de ficha:</span> #{nroFicha}
            </p>
            <p className="text-sm text-gray-500">
              Los datos del paciente y su historial se cargarán automáticamente cuando esta funcionalidad esté disponible.
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={navigateToDashboard}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🏠 Ir al Dashboard
          </button>
          <button
            onClick={navigateBack}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            👥 Ver Pacientes
          </button>
          <button
            onClick={navigateToNuevaOrden}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            🧪 Nueva Orden de Análisis
          </button>
        </div>

      </main>
    </div>
  );
};

export default HistorialPaciente;