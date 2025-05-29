import mongoose from "mongoose";

const marqueeSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

const Marquee = mongoose.models.Marquee || mongoose.model("Marquee", marqueeSchema);
export default Marquee; 