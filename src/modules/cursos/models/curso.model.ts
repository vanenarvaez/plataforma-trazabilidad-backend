import mongoose from "mongoose";

const cursoSchema = new mongoose.Schema(
  {
    nombreCurso: {
      type: String,
      required: true,
      trim: true,
    },

    numeroModulos: {
      type: Number,
      required: true,
    },

    tipoFormacion: {
      type: String,
      enum: ["presencial", "virtual", "mixto"],
      required: true,
    },

    duracionHoras: {
      type: Number,
      required: true,
    },

    descripcion: {
      type: String,
      trim: true,
    },

    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Curso", cursoSchema);