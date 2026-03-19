import mongoose from "mongoose";

const docenteSchema = new mongoose.Schema(
  {
    tipoDocumento: {
      type: String,
      required: true,
      trim: true,
    },
    numeroDocumento: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    nombres: {
      type: String,
      required: true,
      trim: true,
    },
    apellidos: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    telefono: {
      type: String,
      trim: true,
    },
    institucionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institucion",
      required: true,
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

export default mongoose.model("Docente", docenteSchema);