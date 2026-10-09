import { Router } from "express";
import {
  buscarPorId,
  cambiarPrecio,
  crear,
  darDeBaja,
  listar,
  modificar
} from "../controllers/products.controller.js";

const productos = Router();

productos.get("/getAll", listar);
productos.get("/getById/:id", buscarPorId);
productos.post("/create", crear);
productos.put("/update/:id", modificar);
productos.delete("/delete/:id", darDeBaja);
productos.patch("/change-price/:id", cambiarPrecio);

export default productos;
