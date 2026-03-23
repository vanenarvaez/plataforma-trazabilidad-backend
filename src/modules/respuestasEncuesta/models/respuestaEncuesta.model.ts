import mongoose from "mongoose";

const respuestaItemSchema = new mongoose.Schema(
  {
    numeroPregunta: {
      type: Number,
      required: true,
    },
    textoPregunta: {
      type: String,
      required: true,
      trim: true,
    },
    respuesta: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

const respuestaEncuestaSchema = new mongoose.Schema(
  {
    encuestaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Encuesta",
      required: true,
    },
    docenteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Docente",
      required: true,
    },
    proyectoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proyecto",
      required: true,
    },
    proyectoCursoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProyectoCurso",
      required: false,
    },
    fechaRespuesta: {
      type: Date,
      default: Date.now,
    },
    respuestas: {
      type: [respuestaItemSchema],
      required: true,
      default: [],
    },
    observaciones: {
      type: String,
      trim: true,
      default: "",
    },
    completada: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("RespuestaEncuesta", respuestaEncuestaSchema);