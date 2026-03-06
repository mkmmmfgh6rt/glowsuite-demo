import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema({
  name: String,
  avgPrice: Number,
  duration: Number,
  bookings30Days: Number,
  revenue30Days: Number
});

export default mongoose.model("Service", ServiceSchema);
