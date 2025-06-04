import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

import fondo from "@assets/inicio-fondo.jpg";
import logoBQ from "@assets/logo-BQ.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/medico/login", {
        email,
        password,
      });

      if (response.status === 200) {
        // Si querés guardar el usuario en el localStorage
        localStorage.setItem("medico", JSON.stringify(response.data.medico));

        // Redirige al dashboard del médico
        navigate("/medico-dashboard");
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Error de servidor. Intentá más tarde.");
      }
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
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg font-semibold transition duration-200"
          >
            Iniciar sesión
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
