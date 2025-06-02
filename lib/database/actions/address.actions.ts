"use server";

import { connectToDatabase } from "../connect";
import Address from "../models/address.model";
import { handleError } from "@/lib/utils";
import { revalidatePath } from "next/cache";

// Interface for address data
interface AddressData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  type?: "home" | "work" | "other";
  isDefault?: boolean;
}

// Get all addresses for a user
export async function getUserAddresses(userId: string) {
  try {
    await connectToDatabase();
    
    console.log("🔍 getUserAddresses called with userId:", userId);
    
    const addresses = await Address.getUserAddresses(userId);
    
    console.log("📋 Found addresses:", addresses.length);
    console.log("📋 Address data:", addresses);
    
    return {
      success: true,
      addresses: JSON.parse(JSON.stringify(addresses)),
      count: addresses.length,
    };
  } catch (error: any) {
    console.error("❌ Error fetching addresses:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch addresses",
      addresses: [],
      count: 0,
    };
  }
}

// Get user's default address
export async function getUserDefaultAddress(userId: string) {
  try {
    await connectToDatabase();
    
    const address = await Address.getUserDefaultAddress(userId);
    
    if (!address) {
      return {
        success: false,
        message: "No default address found",
        address: null,
      };
    }
    
    return {
      success: true,
      address: JSON.parse(JSON.stringify(address)),
    };
  } catch (error: any) {
    console.error("Error fetching default address:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch default address",
      address: null,
    };
  }
}

// Add new address for user
export async function addUserAddress(addressData: AddressData, userId: string) {
  try {
    await connectToDatabase();
    
    console.log("➕ addUserAddress called with:", { addressData, userId });
    
    // Check address limit (max 2 addresses)
    const addressCount = await Address.getUserAddressCount(userId);
    console.log("📊 Current address count:", addressCount);
    
    if (addressCount >= 2) {
      return {
        success: false,
        message: "You can only save up to 2 addresses",
        address: null,
      };
    }
    
    // If this is the first address, make it default
    const isFirstAddress = addressCount === 0;
    const newAddressData = {
      ...addressData,
      userId,
      isDefault: isFirstAddress || addressData.isDefault || false,
    };
    
    console.log("📝 Creating address with data:", newAddressData);
    
    // If setting as default, update other addresses
    if (newAddressData.isDefault) {
      await Address.updateMany(
        { userId, _id: { $ne: null } },
        { isDefault: false }
      );
    }
    
    const address = new Address(newAddressData);
    await address.save();
    
    console.log("✅ Address saved successfully:", address._id);
    
    revalidatePath("/profile");
    revalidatePath("/checkout");
    
    return {
      success: true,
      message: "Address added successfully",
      address: JSON.parse(JSON.stringify(address)),
    };
  } catch (error: any) {
    console.error("❌ Error adding address:", error);
    console.error("📋 Error details:", error.message, error.stack);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => {
        return `${key}: ${error.errors[key].message}`;
      }).join(', ');
      
      return {
        success: false,
        message: `Validation failed: ${validationErrors}`,
        address: null,
      };
    }
    
    return {
      success: false,
      message: error.message || "Failed to add address",
      address: null,
    };
  }
}

// Update existing address
export async function updateUserAddress(
  addressId: string,
  addressData: AddressData,
  userId: string
) {
  try {
    await connectToDatabase();
    
    const address = await Address.findOne({
      _id: addressId,
      userId,
      isActive: true,
    });
    
    if (!address) {
      return {
        success: false,
        message: "Address not found",
        address: null,
      };
    }
    
    // Update address fields
    Object.assign(address, addressData);
    
    // If setting as default, update other addresses
    if (addressData.isDefault) {
      await Address.updateMany(
        { userId, _id: { $ne: addressId } },
        { isDefault: false }
      );
    }
    
    await address.save();
    
    revalidatePath("/profile");
    revalidatePath("/checkout");
    
    return {
      success: true,
      message: "Address updated successfully",
      address: JSON.parse(JSON.stringify(address)),
    };
  } catch (error: any) {
    console.error("Error updating address:", error);
    return {
      success: false,
      message: error.message || "Failed to update address",
      address: null,
    };
  }
}

// Delete address (soft delete)
export async function deleteUserAddress(addressId: string, userId: string) {
  try {
    await connectToDatabase();
    
    const address = await Address.findOne({
      _id: addressId,
      userId,
      isActive: true,
    });
    
    if (!address) {
      return {
        success: false,
        message: "Address not found",
      };
    }
    
    // Check if user has only one address
    const addressCount = await Address.getUserAddressCount(userId);
    if (addressCount <= 1) {
      return {
        success: false,
        message: "You must have at least one address",
      };
    }
    
    // Soft delete the address
    address.isActive = false;
    await address.save();
    
    // If deleted address was default, set another address as default
    if (address.isDefault) {
      const remainingAddress = await Address.findOne({
        userId,
        isActive: true,
        _id: { $ne: addressId },
      });
      
      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await remainingAddress.save();
      }
    }
    
    revalidatePath("/profile");
    revalidatePath("/checkout");
    
    return {
      success: true,
      message: "Address deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting address:", error);
    return {
      success: false,
      message: error.message || "Failed to delete address",
    };
  }
}

// Set address as default
export async function setDefaultAddress(addressId: string, userId: string) {
  try {
    await connectToDatabase();
    
    const address = await Address.findOne({
      _id: addressId,
      userId,
      isActive: true,
    });
    
    if (!address) {
      return {
        success: false,
        message: "Address not found",
      };
    }
    
    // Use the instance method to set as default
    await address.setAsDefault();
    
    revalidatePath("/profile");
    revalidatePath("/checkout");
    
    return {
      success: true,
      message: "Default address updated successfully",
      address: JSON.parse(JSON.stringify(address)),
    };
  } catch (error: any) {
    console.error("Error setting default address:", error);
    return {
      success: false,
      message: error.message || "Failed to set default address",
    };
  }
}

// Get address by ID
export async function getAddressById(addressId: string, userId: string) {
  try {
    await connectToDatabase();
    
    const address = await Address.findOne({
      _id: addressId,
      userId,
      isActive: true,
    });
    
    if (!address) {
      return {
        success: false,
        message: "Address not found",
        address: null,
      };
    }
    
    return {
      success: true,
      address: JSON.parse(JSON.stringify(address)),
    };
  } catch (error: any) {
    console.error("Error fetching address:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch address",
      address: null,
    };
  }
}

// Search addresses by partial match
export async function searchUserAddresses(userId: string, searchQuery: string) {
  try {
    await connectToDatabase();
    
    const addresses = await Address.find({
      userId,
      isActive: true,
      $or: [
        { fullAddress: { $regex: searchQuery, $options: "i" } },
        { city: { $regex: searchQuery, $options: "i" } },
        { state: { $regex: searchQuery, $options: "i" } },
        { country: { $regex: searchQuery, $options: "i" } },
      ],
    }).sort({ isDefault: -1, createdAt: -1 });
    
    return {
      success: true,
      addresses: JSON.parse(JSON.stringify(addresses)),
      count: addresses.length,
    };
  } catch (error: any) {
    console.error("Error searching addresses:", error);
    return {
      success: false,
      message: error.message || "Failed to search addresses",
      addresses: [],
      count: 0,
    };
  }
} 