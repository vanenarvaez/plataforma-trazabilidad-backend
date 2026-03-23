import mongoose from "mongoose";

const preguntaSchema = new mongoose.Schema(
  {
    numero: {
      type: Number,
      required: true,
    },
    bloque: {
      type: String,
      trim: true,
      default: "",
    },
    texto: {
      type: String,
      required: true,
      trim: true,
    },
    tipoRespuesta: {
      type: String,
      required: true,
      enum: ["texto", "numero", "si_no", "opcion_unica", "multiple", "likert"],
    },
    opciones: {
      type: [String],
      default: [],
    },
    obligatoria: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const encuestaSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    tipo: {
      type: String,
      required: true,
      enum: ["caracterizacion", "satisfaccion", "diagnostica"],
    },
    descripcion: {
      type: String,
      trim: true,
      default: "",
    },
    mensajeInicial: {
      type: String,
      trim: true,
      default: "",
    },
    activa: {
      type: Boolean,
      default: true,
    },
    preguntas: {
      type: [preguntaSchema],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Encuesta", encuestaSchema);