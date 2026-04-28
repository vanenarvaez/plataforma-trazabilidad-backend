import express from "express";
import cors from "cors";
import path from "path";
import swaggerUi from "swagger-ui-express";
import routes from "./routes";
import swaggerSpec from "./docs/swagger";

const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos de la carpeta uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Servir frontend estático sin cargar index.html automáticamente
app.use(
  express.static(path.join(__dirname, "../src/frontend"), {
    index: false,
  })
);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verificar estado de la API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API funcionando correctamente
 */
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "API de trazabilidad funcionando",
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", routes);

// Ruta principal del frontend
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../src/frontend/home.html"));
});

export default app;