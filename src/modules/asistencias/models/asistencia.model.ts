import mongoose from "mongoose";

const asistenciaSchema = new mongoose.Schema(
  {
    proyectoCursoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProyectoCurso",
      required: true,
    },
    docenteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Docente",
      required: true,
    },
    moduloNumero: {
      type: Number,
      required: true,
      min: 1,
    },
    asistio: {
      type: Boolean,
      required: true,
      default: false,
    },
    fechaRegistro: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Asistencia", asistenciaSchema);