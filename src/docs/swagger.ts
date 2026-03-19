import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "API Plataforma de Trazabilidad Educativa",
    version: "1.0.0",
    description: "Documentación de la API del proyecto de trazabilidad educativa",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor local",
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./src/modules/**/*.ts", "./src/app.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;