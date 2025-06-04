import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import mongoose, { Model, Document } from "mongoose";

interface VendorDocument extends Document {
  name: string;
  email: string;
  description?: string;
  address: string;
  phoneNumber: number;
  role: string;
  zipCode: number;
  availableBalance: number;
  createdAt: Date;
  commission?: number;
  verified: boolean;
}

// Simple vendor schema for search purposes (without authentication methods)
const searchVendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  description: { type: String },
  address: { type: String, required: true },
  phoneNumber: { type: Number, required: true },
  role: { type: String, default: "vendor" },
  zipCode: { type: Number, required: true },
  availableBalance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  commission: { type: Number },
  verified: { type: Boolean, default: false },
});

// Use existing Vendor model if available, otherwise create a simple one
function getVendorModel(): Model<VendorDocument> {
  if (mongoose.models.Vendor) {
    return mongoose.models.Vendor as Model<VendorDocument>;
  }
  return mongoose.model<VendorDocument>("Vendor", searchVendorSchema);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const sortBy = searchParams.get("sortBy") || "relevance";
    const verified = searchParams.get("verified");
    const location = searchParams.get("location") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    await connectToDatabase();
    const Vendor = getVendorModel();

    // Build search query
    let searchQuery: any = {};

    // Text search across multiple fields
    if (query.trim()) {
      searchQuery.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { address: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ];
    }

    // Verified filter
    if (verified !== null && verified !== undefined) {
      searchQuery.verified = verified === "true";
    }

    // Location filter
    if (location.trim()) {
      searchQuery.address = { $regex: location, $options: "i" };
    }

    // Build sort criteria
    let sortCriteria: any = {};
    switch (sortBy) {
      case "newest":
        sortCriteria = { createdAt: -1 };
        break;
      case "oldest":
        sortCriteria = { createdAt: 1 };
        break;
      case "name":
        sortCriteria = { name: 1 };
        break;
      case "verified":
        sortCriteria = { verified: -1, createdAt: -1 };
        break;
      case "balance":
        sortCriteria = { availableBalance: -1 };
        break;
      case "relevance":
      default:
        if (query.trim()) {
          sortCriteria = { 
            verified: -1,
            createdAt: -1 
          };
        } else {
          sortCriteria = { 
            verified: -1, 
            createdAt: -1 
          };
        }
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute search
    const [vendors, totalCount] = await Promise.all([
      Vendor.find(searchQuery)
        .select('-password') // Exclude password field if it exists
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .lean(),
      Vendor.countDocuments(searchQuery)
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Transform vendors for consistent API response
    const transformedVendors = vendors.map((vendor: any) => ({
      ...vendor,
      joinedDate: new Date(vendor.createdAt).toLocaleDateString(),
      isVerified: vendor.verified,
      contactNumber: vendor.phoneNumber ? `+960 ${vendor.phoneNumber}` : null,
      // Mask sensitive information
      email: maskEmail(vendor.email),
      address: vendor.address,
      description: vendor.description || `Professional vendor offering quality products and services.`
    }));

    return NextResponse.json({
      success: true,
      data: transformedVendors,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      },
      searchInfo: {
        query,
        location,
        sortBy,
        verified: verified === "true" ? true : verified === "false" ? false : null
      }
    });

  } catch (error: any) {
    console.error("Vendor search error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to search vendors",
        data: []
      },
      { status: 500 }
    );
  }
}

// Helper function to mask email for privacy
function maskEmail(email: string): string {
  if (!email) return "";
  
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  
  if (username.length <= 2) {
    return `${username[0]}*@${domain}`;
  }
  
  const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
  return `${maskedUsername}@${domain}`;
} 