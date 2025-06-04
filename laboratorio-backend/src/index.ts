// src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes"; // <- importamos las rutas

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 5000;

app.use(cors());
app.use(express.json());

// Rutas
app.use("/api", authRoutes); // todas las rutas comienzan con /api

// Servidor
app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});
