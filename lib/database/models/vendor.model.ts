import mongoose from "mongoose";

// Dynamically import bcrypt and jwt only when available
let bcrypt: any = null;
let jwt: any = null;

try {
  bcrypt = require("bcrypt");
} catch (error) {
  console.warn("bcrypt not available - password methods will be disabled");
}

try {
  jwt = require("jsonwebtoken");
} catch (error) {
  console.warn("jsonwebtoken not available - JWT methods will be disabled");
}

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  description: {
    type: String,
  },
  address: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    default: "vendor",
  },
  zipCode: {
    type: Number,
    required: true,
  },
  availableBalance: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  commission: {
    type: Number,
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

// Sign in vendor with JWT - only if jwt is available
vendorSchema.methods.getJWTToken = function () {
  if (!jwt) {
    throw new Error("JWT functionality not available - install jsonwebtoken package");
  }
  console.log(process.env.JWT_SECRET);
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "5d",
  });
};

// Comparing the password for vendor - only if bcrypt is available
vendorSchema.methods.comparePassword = async function (
  enteredPassword: string
) {
  if (!bcrypt) {
    throw new Error("Password comparison not available - install bcrypt package");
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
export default Vendor;
