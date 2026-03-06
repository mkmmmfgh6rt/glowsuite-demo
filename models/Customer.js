import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: String,
  email: String,
  lastVisit: Date,
  totalVisits: Number,
  notes: String,
  servicesUsed: [String],
  totalRevenue: Number,
  inactiveDays: Number
});

export default mongoose.model("Customer", CustomerSchema);
