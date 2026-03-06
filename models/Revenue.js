import mongoose from "mongoose";

const RevenueSchema = new mongoose.Schema({
  date: Date,
  revenue: Number
});

export default mongoose.model("Revenue", RevenueSchema);
