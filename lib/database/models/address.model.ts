import { Schema, model, models, Document, Model } from "mongoose";

// Define interface for Address document
interface IAddress extends Document {
  userId: Schema.Types.ObjectId;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  isActive: boolean;
  type: "home" | "work" | "other";
  fullAddress: string;
  setAsDefault(): Promise<IAddress>;
}

// Define interface for Address model with static methods
interface IAddressModel extends Model<IAddress> {
  getUserAddressCount(userId: string): Promise<number>;
  getUserDefaultAddress(userId: string): Promise<IAddress | null>;
  getUserAddresses(userId: string): Promise<IAddress[]>;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      minlength: 7,
      maxlength: 15,
    },
    address1: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
    },
    address2: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    city: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 10,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Address type (home, work, etc.)
    type: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },
    // Full formatted address for display
    fullAddress: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure user can't have more than 2 addresses
AddressSchema.index({ userId: 1, isActive: 1 });

// Index for default address lookups
AddressSchema.index({ userId: 1, isDefault: 1 });

// Pre-save middleware to format full address
AddressSchema.pre("save", function (next) {
  // Create full formatted address
  this.fullAddress = `${this.address1}${this.address2 ? ", " + this.address2 : ""}, ${this.city}, ${this.state} ${this.zipCode}, ${this.country}`;
  next();
});

// Static method to get user's addresses count
AddressSchema.statics.getUserAddressCount = function (userId: string) {
  return this.countDocuments({ userId, isActive: true });
};

// Static method to get user's default address
AddressSchema.statics.getUserDefaultAddress = function (userId: string) {
  return this.findOne({ userId, isDefault: true, isActive: true });
};

// Static method to get all user addresses
AddressSchema.statics.getUserAddresses = function (userId: string) {
  return this.find({ userId, isActive: true }).sort({ isDefault: -1, createdAt: -1 });
};

// Instance method to set as default
AddressSchema.methods.setAsDefault = async function () {
  // Create a reference to the model
  const AddressModel = this.constructor as IAddressModel;
  
  // Remove default from other addresses
  await AddressModel.updateMany(
    { userId: this.userId, _id: { $ne: this._id } },
    { isDefault: false }
  );
  
  // Set this as default
  this.isDefault = true;
  return this.save();
};

const Address = (models?.Address as IAddressModel) || model<IAddress, IAddressModel>("Address", AddressSchema);

export default Address; 