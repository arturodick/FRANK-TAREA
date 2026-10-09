import { Router } from "express";
import productos from "./products.routes.js";

const rutas = Router();
rutas.use("/products", productos);

export default rutas;
