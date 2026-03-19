import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI as string;

    await mongoose.connect(mongoURI);

    console.log("MongoDB conectado correctamente");
  } catch (error) {
    console.error("Error conectando MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;