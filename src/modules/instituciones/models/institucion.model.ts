import mongoose from "mongoose";

const institucionSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    codigoDane: {
      type: String,
      trim: true,
    },
    departamento: {
      type: String,
      trim: true,
    },
    municipio: {
      type: String,
      trim: true,
    },
    zona: {
      type: String,
      trim: true,
      enum: ["urbana", "rural"],
    },
    sector: {
      type: String,
      trim: true,
      enum: ["oficial", "privado"],
    },
    proyectoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proyecto",
      required: true,
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

export default mongoose.model("Institucion", institucionSchema);