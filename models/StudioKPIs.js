import mongoose from "mongoose";

const StudioKPISchema = new mongoose.Schema({
  totalRevenue30: Number,
  bookingCount30: Number,
  avgBookingValue: Number,
  activeCustomers: Number,
  inactiveCustomers: Number,
  utilizationRate: Number
});

export default mongoose.model("StudioKPI", StudioKPISchema);
