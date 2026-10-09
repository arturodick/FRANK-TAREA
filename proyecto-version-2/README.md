# Catálogo de productos

API sencilla con Express, TypeScript y MySQL2.

## Pasos

1. Ejecutar `database.sql` en MySQL.
2. Copiar `.env.example` como `.env` y completar los datos de MySQL.
3. Ejecutar `npm install` y `npm run dev`.

Las rutas empiezan con `/api/v1/products`. Para usar la versión compilada: `npm run build` y `npm start`. Importa `coleccion-postman.json` en Postman. Después de crear el producto, cambia `idProducto` por el id que recibiste y sigue las peticiones en orden.
