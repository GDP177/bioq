// src/pages/login/Login.tsx - VERSIÓN CORREGIDA PARA REDIRECCIÓN ADMIN

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

import fondo from "../../assets/inicio-fondo.jpg";
import logoBQ from "../../assets/logo-BQ.jpg";

interface LoginResponse {
  success: boolean;
  requiere_completar_perfil?: boolean; 
  message: string;
  usuario: {
    rol: string;
    id: number | string;
    nombre?: string;
    apellido?: string;
    email: string;
    id_usuario?: number;
    username?: string;
    matricula?: string;
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
        "http://localhost:5000/api/login", 
        {
          email: email.trim(),
          password: password
        }
      );

      console.log("✅ Respuesta del servidor:", response.data);

      if (response.status === 200 && response.data.success) {
        const { usuario, requiere_completar_perfil } = response.data;

        if (!usuario) {
          console.error("❌ No se recibieron datos del usuario");
          setError("Error: No se recibieron datos del usuario");
          return;
        }

        // Guardar usuario en localStorage
        localStorage.setItem("usuario", JSON.stringify(usuario));
        console.log("💾 Usuario guardado en localStorage");

        // MANEJAR PERFIL INCOMPLETO
        if (requiere_completar_perfil) {
          console.log(`👤 Usuario ${usuario.rol} requiere completar perfil`);
          
          switch (usuario.rol) {
            case 'medico':
              navigate("/completar-perfil-medico");
              break;
            case 'bioquimico':
              navigate("/completar-perfil-bioquimico");
              break;
            case 'admin':
              // ✅ Redirección consistente con App.tsx
              navigate("/admin/dashboard"); 
              break;
            default:
              setError("Rol de usuario no reconocido");
              return;
          }
          return;
        }

        // PERFIL COMPLETO - REDIRECCIONAR AL DASHBOARD
        switch (usuario.rol) {
          case 'medico':
            navigate(`/dashboard/medico/${usuario.id}`);
            break;
          case 'bioquimico':
            navigate(`/dashboard/bioquimico/${usuario.matricula || usuario.id}`);
            break;
          case 'admin':
            // ✅ Aseguramos que use la ruta registrada en App.tsx
            console.log("👑 Redirigiendo a Panel Administrativo");
            navigate("/admin/dashboard");
            break;
          default:
            setError("Rol de usuario no reconocido");
            return;
        }

      } else {
        setError(response.data.message || "Error en el login");
      }

    } catch (error: any) {
      console.error("❌ Error en login:", error);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 401) {
        setError("Credenciales incorrectas");
      } else if (error.response?.status === 404) {
        setError("Servicio no disponible. Verifica que el servidor esté funcionando.");
      } else if (error.code === 'ECONNREFUSED') {
        setError("No se puede conectar al servidor.");
      } else {
        setError("Error de conexión. Intenta nuevamente.");
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
      </div>
    </div>
  );
}