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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ProyectoCurso", proyectoCursoSchema);