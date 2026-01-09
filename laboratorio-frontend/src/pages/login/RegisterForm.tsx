import type { ChangeEvent, FormEvent } from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    rol: "bioquimico", // ✅ CAMBIO: Valor inicial que coincida con la primera opción del select
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      // ✅ CAMBIO: Endpoint corregido de /api/register a /api/auth/register (según tu configuración de rutas)
      // O simplemente /api/register si así lo definiste en authRoutes.ts
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          rol: formData.rol,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`Error: ${data.message || "Error en el registro"}`);
        setIsSuccess(false);
        return;
      }

      setMessage(data.message || "Usuario registrado con éxito");
      setIsSuccess(true);
      setFormData({ username: "", email: "", password: "", rol: "bioquimico" });
    } catch (error) {
      setMessage("Error de conexión con el servidor");
      setIsSuccess(false);
      console.error("Error en fetch:", error);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url('/src/assets/inicio-fondo.jpg')` }}
    >
      <div className="bg-white bg-opacity-90 p-10 rounded-2xl shadow-lg w-full max-w-md relative">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-800">
          Registro de Usuario
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Nombre de usuario
            </label>
            <input
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Usuario"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Correo electrónico
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="usuario@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Tipo de usuario
            </label>
            <select
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="bioquimico">Bioquímico</option>
              <option value="medico">Médico</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg font-semibold transition duration-200"
          >
            Registrar
          </button>
        </form>

        {message && !isSuccess && (
          <p className="mt-4 text-center text-red-600 font-medium">{message}</p>
        )}

        {isSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-80 text-center shadow-lg relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto mb-4 h-16 w-16 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <h2 className="text-2xl font-semibold mb-2 text-green-600">
                ¡Registro exitoso!
              </h2>
              <p className="mb-4">{message}</p>
              <p className="text-gray-500">Redirigiendo al login...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}