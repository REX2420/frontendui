import mongoose from "mongoose";

const socialMediaSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ["facebook", "instagram", "youtube", "twitter", "linkedin", "tiktok", "pinterest"],
  },
  url: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const navigationLinkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  url: {
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
});

const navigationSectionSchema = new mongoose.Schema({
  sectionTitle: {
    type: String,
    required: true,
  },
  links: [navigationLinkSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
});

const footerSchema = new mongoose.Schema({
  // Company Information
  companyInfo: {
    name: {
      type: String,
      required: true,
      default: "VIBECART",
    },
    description: {
      type: String,
      default: "",
    },
    logo: {
      url: String,
      public_id: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    contact: {
      email: String,
      phone: String,
      website: String,
    },
  },
  
  // Social Media Links
  socialMedia: [socialMediaSchema],
  
  // Navigation Sections (Company, Shop, Help, etc.)
  navigationSections: [navigationSectionSchema],
  
  // Newsletter
  newsletter: {
    title: {
      type: String,
      default: "SUBSCRIBE",
    },
    description: {
      type: String,
      default: "Be the first to get the latest news about trends, promotions, new arrivals, discounts and more!",
    },
    buttonText: {
      type: String,
      default: "JOIN",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  
  // Footer Bottom
  copyright: {
    text: {
      type: String,
      default: "© 2025 VIBECART",
    },
    showYear: {
      type: Boolean,
      default: true,
    },
  },
  
  // Language and Currency Settings
  localization: {
    language: {
      type: String,
      default: "English",
    },
    country: {
      type: String,
      default: "United States",
    },
    currency: {
      type: String,
      default: "USD",
    },
    showLanguage: {
      type: Boolean,
      default: true,
    },
    showCurrency: {
      type: Boolean,
      default: true,
    },
  },
  
  // Additional Settings
  settings: {
    showSecurePayments: {
      type: Boolean,
      default: true,
    },
    securePaymentsText: {
      type: String,
      default: "Secure Payments",
    },
    backgroundColor: {
      type: String,
      default: "#1c1c1c",
    },
    textColor: {
      type: String,
      default: "#ffffff",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
}, {
  timestamps: true,
});

// Ensure only one active footer configuration exists
footerSchema.pre('save', async function(next) {
  try {
    // Type assertion to help TypeScript understand the structure
    const doc = this as any;
    
    if (doc.settings && doc.settings.isActive === true) {
      const FooterModel = mongoose.models.Footer || mongoose.model('Footer', footerSchema);
      await FooterModel.updateMany(
        { _id: { $ne: doc._id } },
        { 'settings.isActive': false }
      );
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

const Footer = mongoose.models.Footer || mongoose.model("Footer", footerSchema);
export default Footer; 