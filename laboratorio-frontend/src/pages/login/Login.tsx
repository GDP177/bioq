// src/pages/login/Login.tsx - VERSIÓN CORREGIDA Y OPTIMIZADA

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

import fondo from "../../assets/inicio-fondo.jpg";
import logoBQ from "../../assets/logo-BQ.jpg";

interface LoginResponse {
  success: boolean;
  medico: {
    rol: string;
    id: number;
    nombre: string;
    email: string;
  };
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    console.log("🚀 Iniciando login para:", email);

    try {
      const response = await axios.post<LoginResponse>(
        "http://localhost:5000/api/medico/login", 
        {
          email: email.trim(),
          password: password
        }
      );

      console.log("✅ Respuesta completa del servidor:", response);
      console.log("📦 Data del servidor:", response.data);

      if (response.status === 200 && response.data.success) {
        const { medico } = response.data;

        if (!medico) {
          console.error("❌ No se recibieron datos del médico");
          setError("Error: No se recibieron datos del usuario");
          return;
        }

        console.log("👨‍⚕️ Datos del médico:", medico);

        // Validar que tenemos los datos necesarios
        if (!medico.id || !medico.nombre || !medico.email) {
          console.error("❌ Datos del médico incompletos:", medico);
          setError("Error: Datos de usuario incompletos");
          return;
        }

        // Guardar en localStorage
        localStorage.setItem("usuario", JSON.stringify(medico));
        console.log("💾 Usuario guardado en localStorage");

        // Verificar que se guardó correctamente
        const verificacion = localStorage.getItem("usuario");
        console.log("🔍 Verificación localStorage:", verificacion);

        // Navegar según el rol
        if (medico.rol === "medico" || !medico.rol) {
          console.log("🏥 Navegando a MedicoDashboard...");
          navigate("/MedicoDashboard");
        } else if (medico.rol === "bioquimico") {
          console.log("🔬 Navegando a BioquimicoDashboard...");
          navigate("/BioquimicoDashboard");
        } else {
          console.warn("⚠️ Rol no reconocido:", medico.rol);
          // Si no hay rol específico, asumir que es médico
          navigate("/MedicoDashboard");
        }
      } else {
        console.error("❌ Respuesta del servidor no exitosa");
        setError("Error en el servidor. Intenta nuevamente.");
      }
    } catch (err: any) {
      console.error("❌ Error en login:", err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError("Credenciales incorrectas");
      } else if (err.response?.status >= 500) {
        setError("Error del servidor. Intenta más tarde.");
      } else if (err.code === 'ECONNREFUSED') {
        setError("No se puede conectar al servidor. Verifica que esté funcionando.");
      } else {
        setError("Error de conexión. Intenta más tarde.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <div className="bg-white bg-opacity-90 p-10 rounded-2xl shadow-lg w-full max-w-md">
        <img
          src={logoBQ}
          alt="Logo del laboratorio"
          className="mx-auto mb-4 w-24 h-auto"
        />

        <h1 className="text-3xl font-bold text-center mb-6 text-blue-800">
          Sistema de Laboratorio Bioquímico
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 border border-red-300 p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Contraseña
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          ¿No tenés cuenta?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Registrate acá
          </Link>
        </p>

        {/* Debug info en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <p><strong>Debug:</strong> Backend: http://localhost:5000</p>
            <p><strong>LocalStorage:</strong> {localStorage.getItem('usuario') ? '✅ Tiene datos' : '❌ Vacío'}</p>
            <p><strong>Email test:</strong> med1@gmail.com</p>
          </div>
        )}
      </div>
    </div>
  );
}