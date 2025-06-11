// src/components/layout/Footer.tsx
import { HeartIcon } from '@heroicons/react/24/solid';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-6 px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Información del Sistema */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              🔬 Sistema BioLab
            </h3>
            <p className="text-gray-300 text-sm">
              Sistema integral de gestión para laboratorio bioquímico.
              Desarrollado para optimizar el flujo de trabajo y mejorar 
              la atención médica.
            </p>
          </div>

          {/* Enlaces Rápidos */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/pacientes" className="text-gray-300 hover:text-white transition-colors">
                  Pacientes
                </a>
              </li>
              <li>
                <a href="/ordenes" className="text-gray-300 hover:text-white transition-colors">
                  Órdenes
                </a>
              </li>
              <li>
                <a href="/resultados" className="text-gray-300 hover:text-white transition-colors">
                  Resultados
                </a>
              </li>
            </ul>
          </div>

          {/* Información de Contacto y Versión */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Información</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <p>Versión: 1.0.0</p>
              <p>Soporte: soporte@biolab.com</p>
              <p>Teléfono: +54 (362) 4XX-XXXX</p>
              <div className="flex items-center gap-1 mt-4">
                <span>Hecho con</span>
                <HeartIcon className="h-4 w-4 text-red-500" />
                <span>en Chaco, Argentina</span>
              </div>
            </div>
          </div>
        </div>

        {/* Línea divisora y copyright */}
        <div className="border-t border-gray-700 mt-6 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>
              © {currentYear} Sistema de Laboratorio Bioquímico. 
              Todos los derechos reservados.
            </p>
            <div className="flex space-x-4 mt-2 md:mt-0">
              <a href="/privacy" className="hover:text-white transition-colors">
                Privacidad
              </a>
              <a href="/terms" className="hover:text-white transition-colors">
                Términos
              </a>
              <a href="/help" className="hover:text-white transition-colors">
                Ayuda
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}