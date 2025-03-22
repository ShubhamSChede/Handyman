import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  address: { type: String },
  landmark: { type: String },
  role: { type: String, enum: ["user", "vendor"], default: "user" },
  isAvailable: { type: Boolean, default: true },
  servicesOffered: [{ type: String }],
  pricing: { type: Number },
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }
  },
  availability: {
    startTime: { type: String },
    endTime: { type: String }
  },
  bookedSlots: [{
    date: { type: String },
    time: { type: String }
  }],
  reviews: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.index({ location: "2dsphere" });
UserSchema.index({ phoneNumber: 1 }, { unique: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);