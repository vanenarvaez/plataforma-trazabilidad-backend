import mongoose from "mongoose";

const certificadoSchema = new mongoose.Schema(
  {
    docenteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Docente",
      required: true,
    },
    proyectoCursoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProyectoCurso",
      required: true,
    },
    numeroDocumento: {
      type: String,
      required: true,
      trim: true,
    },
    nombreCompleto: {
      type: String,
      required: true,
      trim: true,
    },
    nombreCurso: {
      type: String,
      required: true,
      trim: true,
    },
    porcentajeAsistencia: {
      type: Number,
      required: true,
    },
    archivo: {
      type: String,
      required: true,
    },
    ruta: {
      type: String,
      required: true,
    },
    estado: {
      type: String,
      enum: ["generado", "publicado"],
      default: "generado",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Certificado", certificadoSchema);