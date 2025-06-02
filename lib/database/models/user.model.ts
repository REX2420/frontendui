import { Schema, model, models } from "mongoose";

// Address schema for reusability
const AddressSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  address1: {
    type: String,
    required: true,
  },
  address2: {
    type: String,
    default: "",
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const UserSchema = new Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      required: false,
      default: "",
    },
    username: {
      type: String,
      required: false,
      default: "",
    },
    role: {
      type: String,
      default: "user",
    },
    defaultPaymentMethod: {
      type: String,
      default: "",
    },
    // Legacy single address field (for backward compatibility)
    address: {
      firstName: {
        type: String,
      },
      lastName: {
        type: String,
      },
      phoneNumber: {
        type: String,
      },
      address1: {
        type: String,
      },
      address2: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      zipCode: {
        type: String,
      },
      country: {
        type: String,
      },
      active: {
        type: Boolean,
        default: true,
      },
    },
    // New multiple addresses field (max 2 addresses)
    addresses: {
      type: [AddressSchema],
      validate: {
        validator: function(addresses: any[]) {
          return addresses.length <= 2;
        },
        message: "You can only save up to 2 addresses"
      },
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre('save', function(next) {
  if (!this.username || this.username.trim() === '') {
    console.log("🔤 Generating username for user:", this.email);
    
    const emailParts = this.email ? this.email.split('@') : ['user'];
    const emailPrefix = emailParts[0].toLowerCase();
    
    const cleanEmailPrefix = emailPrefix
      .replace(/^\d+/, '')
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15);
    
    const idSuffix = this.clerkId ? this.clerkId.slice(-4) : Math.random().toString(36).slice(-4);
    
    this.username = `${cleanEmailPrefix || 'user'}.${idSuffix}`;
    
    console.log("🔤 Generated username:", this.username);
  }
  
  if (!this.image || this.image.trim() === '') {
    console.log("🖼️ Generating avatar for user:", this.username);
    
    const displayName = this.username || this.email || 'user';
    
    const avatarName = displayName.includes('.') 
      ? displayName.split('.')[0]
      : displayName.split('@')[0];
    
    this.image = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=000000&color=fff&size=200&font-size=0.6`;
    
    console.log("🖼️ Generated avatar URL:", this.image);
  }
  
  // Ensure only one default address exists
  if (this.addresses && this.addresses.length > 0) {
    const defaultAddresses = this.addresses.filter((addr: any) => addr.isDefault);
    if (defaultAddresses.length > 1) {
      // If multiple default addresses exist, keep only the first one as default
      this.addresses.forEach((addr: any, index: number) => {
        addr.isDefault = index === 0;
      });
    } else if (defaultAddresses.length === 0) {
      // If no default address exists, make the first one default
      this.addresses[0].isDefault = true;
    }
  }
  
  next();
});

const User = models?.User || model("User", UserSchema);
export default User;
