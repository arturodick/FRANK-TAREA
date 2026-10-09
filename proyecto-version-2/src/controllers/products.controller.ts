import type { Request, Response } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import conexion from "../conf/dbConnection.js";

function errorDePrecio(precio: unknown): string | null {
  if (typeof precio !== "number" || !Number.isFinite(precio) || precio <= 0) {
    return "El precio debe ser un número mayor que cero";
  }
  if (precio > 99999999.99) {
    return "El precio supera el máximo permitido";
  }
  if (!/^\d+(\.\d{1,2})?$/.test(String(precio))) {
    return "El precio debe tener máximo dos decimales";
  }
  return null;
}

function revisarProducto(cuerpo: unknown): string | null {
  if (cuerpo === null || typeof cuerpo !== "object" || Array.isArray(cuerpo)) {
    return "Envía un producto en formato JSON";
  }

  const datos = cuerpo as Record<string, unknown>;
  if (typeof datos.name !== "string" || datos.name.trim() === "" || datos.name.length > 100) {
    return "El nombre es obligatorio y debe tener hasta 100 caracteres";
  }

  const problemaPrecio = errorDePrecio(datos.price);
  if (problemaPrecio !== null) return problemaPrecio;

  if (typeof datos.stock !== "number" || !Number.isSafeInteger(datos.stock) ||
      datos.stock < 0 || datos.stock > 2147483647) {
    return "El stock debe ser un entero igual o mayor que cero";
  }
  if (typeof datos.description !== "string" || datos.description.trim() === "") {
    return "La descripción es obligatoria";
  }
  if (datos.brand !== undefined && datos.brand !== null &&
      (typeof datos.brand !== "string" || datos.brand.length > 100)) {
    return "La marca debe ser texto de hasta 100 caracteres";
  }
  if (datos.img !== undefined && datos.img !== null && typeof datos.img !== "string") {
    return "La imagen debe ser texto";
  }
  return null;
}

// Primero se crea un producto; así se puede usar su id en las otras peticiones.
export async function crear(req: Request, res: Response) {
  const mensaje = revisarProducto(req.body);
  if (mensaje !== null) {
    res.status(400).json({ error: mensaje });
    return;
  }

  const datos = req.body;
  try {
    const [resultado] = await conexion.execute<ResultSetHeader>(
      "INSERT INTO products (name, price, stock, description, brand, img) VALUES (?, ?, ?, ?, ?, ?)",
      [datos.name, datos.price, datos.stock, datos.description, datos.brand ?? null, datos.img ?? null]
    );
    res.status(201).json({ mensaje: "Nuevo producto guardado", id: resultado.insertId });
  } catch {
    res.status(500).json({ error: "Ocurrió un error al guardar el producto" });
  }
}

export async function listar(req: Request, res: Response) {
  const filtro = req.query.active;
  if (filtro !== undefined && filtro !== "true" && filtro !== "TRUE") {
    res.status(400).json({ error: "El filtro active debe ser true" });
    return;
  }

  try {
    const [productos] = await conexion.execute<RowDataPacket[]>(
      "SELECT * FROM products WHERE active = ? ORDER BY name",
      [1]
    );
    res.json(productos);
  } catch {
    res.status(500).json({ error: "Ocurrió un error al mostrar los productos" });
  }
}

export async function buscarPorId(req: Request, res: Response) {
  const textoId = req.params.id;
  const id = Number(textoId);
  if (typeof textoId !== "string" || !/^[1-9]\d*$/.test(textoId) || !Number.isSafeInteger(id)) {
    res.status(400).json({ error: "Escribe un id entero positivo" });
    return;
  }

  try {
    const [productos] = await conexion.execute<RowDataPacket[]>(
      "SELECT * FROM products WHERE active = ? AND id = ?",
      [1, id]
    );
    if (productos.length === 0) {
      res.status(404).json({ error: "No existe un producto activo con ese id" });
      return;
    }
    res.json(productos[0]);
  } catch {
    res.status(500).json({ error: "Ocurrió un error al buscar el producto" });
  }
}

export async function modificar(req: Request, res: Response) {
  const textoId = req.params.id;
  const id = Number(textoId);
  if (typeof textoId !== "string" || !/^[1-9]\d*$/.test(textoId) || !Number.isSafeInteger(id)) {
    res.status(400).json({ error: "Escribe un id entero positivo" });
    return;
  }

  const mensaje = revisarProducto(req.body);
  if (mensaje !== null) {
    res.status(400).json({ error: mensaje });
    return;
  }

  const datos = req.body;
  try {
    const [resultado] = await conexion.execute<ResultSetHeader>(
      "UPDATE products SET description = ?, name = ?, brand = ?, img = ?, stock = ?, price = ? WHERE id = ? AND active = 1",
      [datos.description, datos.name, datos.brand ?? null, datos.img ?? null, datos.stock, datos.price, id]
    );
    if (resultado.affectedRows === 0) {
      const [encontrados] = await conexion.execute<RowDataPacket[]>(
        "SELECT id FROM products WHERE id = ? AND active = 1", [id]
      );
      if (encontrados.length === 0) {
        res.status(404).json({ error: "No existe un producto activo con ese id" });
        return;
      }
    }
    res.json({ mensaje: "Datos del producto cambiados" });
  } catch {
    res.status(500).json({ error: "Ocurrió un error al actualizar el producto" });
  }
}

export async function cambiarPrecio(req: Request, res: Response) {
  const textoId = req.params.id;
  const id = Number(textoId);
  if (typeof textoId !== "string" || !/^[1-9]\d*$/.test(textoId) || !Number.isSafeInteger(id)) {
    res.status(400).json({ error: "Escribe un id entero positivo" });
    return;
  }

  const cuerpo: unknown = req.body;
  if (cuerpo === null || typeof cuerpo !== "object" || Array.isArray(cuerpo) ||
      Object.keys(cuerpo).length !== 1 || !("price" in cuerpo)) {
    res.status(400).json({ error: "Envía solo el campo price" });
    return;
  }
  const datos = cuerpo as Record<string, unknown>;
  const mensaje = errorDePrecio(datos.price);
  if (mensaje !== null) {
    res.status(400).json({ error: mensaje });
    return;
  }
  const precio = datos.price as number;

  try {
    const [resultado] = await conexion.execute<ResultSetHeader>(
      "UPDATE products SET price = ? WHERE id = ? AND active = 1",
      [precio, id]
    );
    if (resultado.affectedRows === 0) {
      const [encontrados] = await conexion.execute<RowDataPacket[]>(
        "SELECT id FROM products WHERE id = ? AND active = 1", [id]
      );
      if (encontrados.length === 0) {
        res.status(404).json({ error: "No existe un producto activo con ese id" });
        return;
      }
    }
    res.json({ mensaje: "Nuevo precio guardado" });
  } catch {
    res.status(500).json({ error: "Ocurrió un error al cambiar el precio" });
  }
}

export async function darDeBaja(req: Request, res: Response) {
  const textoId = req.params.id;
  const id = Number(textoId);
  if (typeof textoId !== "string" || !/^[1-9]\d*$/.test(textoId) || !Number.isSafeInteger(id)) {
    res.status(400).json({ error: "Escribe un id entero positivo" });
    return;
  }

  try {
    const [resultado] = await conexion.execute<ResultSetHeader>(
      "UPDATE products SET active = 0 WHERE id = ? AND active = 1",
      [id]
    );
    if (resultado.affectedRows === 0) {
      res.status(404).json({ error: "No existe un producto activo con ese id" });
      return;
    }
    res.json({ mensaje: "Producto desactivado" });
  } catch {
    res.status(500).json({ error: "Ocurrió un error al dar de baja el producto" });
  }
}
