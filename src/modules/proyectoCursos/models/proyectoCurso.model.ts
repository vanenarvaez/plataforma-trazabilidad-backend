import mongoose from "mongoose";

const proyectoCursoSchema = new mongoose.Schema(
  {
    proyectoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proyecto",
      required: true,
    },

    cursoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Curso",
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

proyectoCursoSchema.index({ proyectoId: 1, cursoId: 1 }, { unique: true });

export default mongoose.model("ProyectoCurso", proyectoCursoSchema);