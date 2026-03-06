import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  service: String,
  price: Number,
  duration: Number,
  date: Date
});

export default mongoose.model("Appointment", AppointmentSchema);
