import dotenv from "dotenv";
import { crearServidor } from "./server.js";

dotenv.config();

const puerto = Number(process.env.PORT) || 3000;
const servidor = crearServidor();

servidor.listen(puerto, () => {
  console.log(`API lista en http://localhost:${puerto}`);
});
