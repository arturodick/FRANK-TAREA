import express from "express";
import rutas from "./routes/index.js";

export function crearServidor() {
  const servidor = express();
  servidor.use(express.json());
  servidor.use("/api/v1", rutas);
  return servidor;
}
