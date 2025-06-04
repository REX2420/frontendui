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

// 🚀 OPTIMIZED INDEXES FOR VENDOR SEARCH PERFORMANCE
// Text search index for vendor search capabilities
vendorSchema.index({ 
  name: 'text', 
  description: 'text', 
  address: 'text',
  email: 'text'
}, {
  weights: {
    name: 10,        // Highest priority for vendor name
    description: 6,  // Medium-high priority for description
    address: 4,      // Medium priority for address
    email: 2         // Lower priority for email
  },
  name: 'vendor_text_search'
});

// Index for verified vendors (commonly filtered)
vendorSchema.index({ verified: -1, createdAt: -1 });

// Index for location-based searches
vendorSchema.index({ zipCode: 1, address: 1 });

// Index for email-based queries (login, authentication)
vendorSchema.index({ email: 1 }, { unique: true });

// Index for vendor balance queries (admin operations)
vendorSchema.index({ availableBalance: -1 });

// Index for vendor role queries
vendorSchema.index({ role: 1, verified: -1 });

// Compound index for complex vendor queries
vendorSchema.index({ 
  verified: -1, 
  zipCode: 1, 
  createdAt: -1 
});

const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
export default Vendor;
