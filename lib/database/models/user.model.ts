import { Schema, model, models } from "mongoose";

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
  
  next();
});

const User = models?.User || model("User", UserSchema);
export default User;
