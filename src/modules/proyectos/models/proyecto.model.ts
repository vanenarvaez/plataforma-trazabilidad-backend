import mongoose from "mongoose";

const proyectoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    fuenteFinanciacion: {
      type: String,
      trim: true,
    },
    cliente: {
      type: String,
      trim: true,
    },
    fechaInicio: {
      type: Date,
    },
    fechaFin: {
      type: Date,
    },
    estado: {
      type: String,
      enum: ["planeacion", "ejecucion", "finalizado"],
      default: "planeacion",
    },
    cantidadMunicipios: {
      type: Number,
      default: 0,
      min: 0,
    },
    cantidadIE: {
      type: Number,
      default: 0,
      min: 0,
    },
    cantidadSedes: {
      type: Number,
      default: 0,
      min: 0,
    },
    cantidadDocentes: {
      type: Number,
      default: 0,
      min: 0,
    },
    cantidadEstudiantes: {
      type: Number,
      default: 0,
      min: 0,
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

export default mongoose.model("Proyecto", proyectoSchema);