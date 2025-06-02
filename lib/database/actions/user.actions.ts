"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../connect";
import Coupon from "../models/coupon.model";
import Order from "../models/order.model";
import User from "../models/user.model";
import { handleError } from "@/lib/utils";

// create user
export async function createUser(user: any) {
  try {
    console.log("🔗 Connecting to database...");
    await connectToDatabase();
    
    console.log("👤 Creating user with data:", user);
    const newUser = await User.create(user);
    
    console.log("✅ User created successfully in database:", newUser._id);
    return {
      success: true,
      message: "User created successfully",
      user: JSON.parse(JSON.stringify(newUser)),
      ...JSON.parse(JSON.stringify(newUser))
    };
  } catch (error: any) {
    console.error("❌ Error creating user:", error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      return {
        success: false,
        message: `User with this ${duplicateField} already exists`,
        user: null
      };
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return {
        success: false,
        message: `Validation failed: ${validationErrors.join(', ')}`,
        user: null
      };
    }
    
    return {
      success: false,
      message: error.message || "Failed to create user",
      user: null
    };
  }
}

// get user by id
export async function getUserById(clerkId: string) {
  try {
    await connectToDatabase();
    const user = await User.findOne({ clerkId });
    if (!user) {
      return {
        message: "User not found with this ID!",
        success: false,
        user: null,
      };
    }
    return {
      message: "Successfully fetched User data.",
      success: true,
      user: JSON.parse(JSON.stringify(user)),
    };
  } catch (error: any) {
    console.error("❌ Error getting user:", error);
    return {
      success: false,
      message: error.message || "Failed to get user",
      user: null
    };
  }
}

// update user
export async function updateUser(clerkId: string, user: any) {
  try {
    console.log("🔗 Connecting to database...");
    await connectToDatabase();
    
    console.log("🔄 Updating user:", clerkId, "with data:", user);
    const updatedUser = await User.findOneAndUpdate({ clerkId }, user, {
      new: true,
    });
    
    if (!updatedUser) {
      console.log("❌ User not found for update:", clerkId);
      return {
        message: "User not found with this ID!",
        success: false,
        user: null,
      };
    }
    
    console.log("✅ User updated successfully");
    return {
      success: true,
      message: "User updated successfully",
      user: JSON.parse(JSON.stringify(updatedUser)),
      ...JSON.parse(JSON.stringify(updatedUser))
    };
  } catch (error: any) {
    console.error("❌ Error updating user:", error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return {
        success: false,
        message: `Validation failed: ${validationErrors.join(', ')}`,
        user: null
      };
    }
    
    return {
      success: false,
      message: error.message || "Failed to update user",
      user: null
    };
  }
}

// delete user
export async function deleteUser(clerkId: string) {
  try {
    console.log("🔗 Connecting to database...");
    await connectToDatabase();
    
    console.log("🗑️ Finding user to delete:", clerkId);
    const usertoDelete = await User.findOne({ clerkId });
    if (!usertoDelete) {
      console.log("❌ User not found for deletion:", clerkId);
      return {
        message: "User not found with this ID!",
        success: false,
        user: null,
      };
    }
    
    console.log("🗑️ Deleting user:", usertoDelete._id);
    const deletedUser = await User.findByIdAndDelete(usertoDelete._id);
    revalidatePath("/");
    
    console.log("✅ User deleted successfully");
    return deletedUser
      ? {
          success: true,
          message: "Successfully deleted User",
          user: JSON.parse(JSON.stringify(deletedUser)),
        }
      : {
          success: false,
          message: "Something went wrong during deletion",
          user: null,
        };
  } catch (error: any) {
    console.error("❌ Error deleting user:", error);
    return {
      success: false,
      message: error.message || "Failed to delete user",
      user: null
    };
  }
}

// Address operations of user:
export async function changeActiveAddress(id: any, user_id: any) {
  try {
    await connectToDatabase();
    const user = await User.findById(user_id);
    let user_addresses = user.address;
    let addresses = [];

    for (let i = 0; i < user_addresses.length; i++) {
      let temp_address = {};
      if (user_addresses[i]._id == id) {
        temp_address = { ...user_addresses[i].toObject(), active: true };
        addresses.push(temp_address);
      } else {
        temp_address = { ...user_addresses[i].toObject(), active: false };
        addresses.push(temp_address);
      }
    }
    await user.updateOne(
      {
        address: addresses,
      },
      { new: true }
    );
    return JSON.parse(JSON.stringify({ addresses }));
  } catch (error) {
    handleError(error);
  }
}
export async function deleteAddress(id: any, user_id: any) {
  try {
    await connectToDatabase();
    const user = await User.findById(user_id);
    await user.updateOne(
      {
        $pull: {
          address: { _id: id },
        },
      },
      { new: true }
    );
    return JSON.parse(
      JSON.stringify({
        addresses: user.address.filter((a: any) => a._id != id),
      })
    );
  } catch (error) {
    handleError(error);
  }
}
export async function saveAddress(address: any, user_id: any) {
  try {
    // Find the user by user_id
    const user = await User.findById(user_id);

    if (!user) {
      return "User not found";
    }

    // Check if 'address' property exists and is an array, if not, create it
    if (!user.address || !Array.isArray(user.address)) {
      user.address = [];
    }

    // Use the push method to add the address to the 'address' array
    Object.assign(user.address, address);

    // Save the updated user
    await user.save();
    return JSON.parse(JSON.stringify({ addresses: user.address }));
  } catch (error) {
    handleError(error);
  }
}

// Coupon operations of user:
export async function applyCoupon(coupon: any, user_id: any, cartTotal?: number) {
  try {
    await connectToDatabase();
    const user = await User.findById(user_id);
    const checkCoupon = await Coupon.findOne({ coupon });
    if (!user) {
      return { message: "User not found", success: false };
    }
    if (checkCoupon == null) {
      return { message: "Invalid Coupon", success: false };
    }
    
    // Use cartTotal parameter or fallback to 0 if not provided
    const total = cartTotal || 0;
    
    let totalAfterDiscount =
      total - (total * checkCoupon.discount) / 100;
      
    return JSON.parse(
      JSON.stringify({
        totalAfterDiscount: totalAfterDiscount.toFixed(2),
        discount: checkCoupon.discount,
        message: "Successfully fetched Coupon",
        success: true,
      })
    );
  } catch (error) {
    return { 
      message: "Error applying coupon", 
      success: false 
    };
  }
}

// get all orders of user for their profile:
export async function getAllUserOrdersProfile(clerkId: string) {
  try {
    await connectToDatabase();
    let user = await User.findOne({ clerkId });

    let orders = [];
    orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();
    const filteredOrders = orders.map((order) => ({
      id: order._id,
      date: new Date(order.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      total: order.total,
    }));

    return JSON.parse(JSON.stringify(filteredOrders));
  } catch (error) {
    console.log(error);
  }
}

// Enhanced Address operations for multiple addresses (max 2):

// Add new address for user (max 2 addresses)
export async function addUserAddress(address: any, userId: string) {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Initialize addresses array if it doesn't exist
    if (!user.addresses || !Array.isArray(user.addresses)) {
      user.addresses = [];
    }

    // Check if user already has 2 addresses (maximum limit)
    if (user.addresses.length >= 2) {
      throw new Error("You can only save up to 2 addresses");
    }

    // If this is the first address, make it default
    if (user.addresses.length === 0) {
      address.isDefault = true;
    }

    // Add the new address
    user.addresses.push(address);
    await user.save();

    return {
      success: true,
      message: "Address added successfully",
      addresses: JSON.parse(JSON.stringify(user.addresses))
    };
  } catch (error: any) {
    console.error("Error adding address:", error);
    throw new Error(error.message || "Failed to add address");
  }
}

// Update existing address
export async function updateUserAddress(addressId: string, updatedAddress: any, userId: string) {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.addresses || !Array.isArray(user.addresses)) {
      throw new Error("No addresses found");
    }

    // Find and update the specific address
    const addressIndex = user.addresses.findIndex(
      (addr: any) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      throw new Error("Address not found");
    }

    // Update the address while preserving the _id and isDefault status
    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex],
      ...updatedAddress,
      _id: user.addresses[addressIndex]._id,
    };

    await user.save();

    return {
      success: true,
      message: "Address updated successfully",
      addresses: JSON.parse(JSON.stringify(user.addresses))
    };
  } catch (error: any) {
    console.error("Error updating address:", error);
    throw new Error(error.message || "Failed to update address");
  }
}

// Delete address
export async function deleteUserAddress(addressId: string, userId: string) {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.addresses || !Array.isArray(user.addresses)) {
      throw new Error("No addresses found");
    }

    if (user.addresses.length === 1) {
      throw new Error("You must have at least one address");
    }

    // Find the address to delete
    const addressToDelete = user.addresses.find(
      (addr: any) => addr._id.toString() === addressId
    );

    if (!addressToDelete) {
      throw new Error("Address not found");
    }

    // Remove the address
    user.addresses = user.addresses.filter(
      (addr: any) => addr._id.toString() !== addressId
    );

    // If the deleted address was default, make the first remaining address default
    if (addressToDelete.isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return {
      success: true,
      message: "Address deleted successfully",
      addresses: JSON.parse(JSON.stringify(user.addresses))
    };
  } catch (error: any) {
    console.error("Error deleting address:", error);
    throw new Error(error.message || "Failed to delete address");
  }
}

// Set default address
export async function setDefaultAddress(addressId: string, userId: string) {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.addresses || !Array.isArray(user.addresses)) {
      throw new Error("No addresses found");
    }

    // Find the address to set as default
    const addressExists = user.addresses.some(
      (addr: any) => addr._id.toString() === addressId
    );

    if (!addressExists) {
      throw new Error("Address not found");
    }

    // Update all addresses: set the selected one as default, others as non-default
    user.addresses = user.addresses.map((addr: any) => ({
      ...addr,
      isDefault: addr._id.toString() === addressId
    }));

    await user.save();

    return {
      success: true,
      message: "Default address updated successfully",
      addresses: JSON.parse(JSON.stringify(user.addresses))
    };
  } catch (error: any) {
    console.error("Error setting default address:", error);
    throw new Error(error.message || "Failed to set default address");
  }
}

// Get user addresses
export async function getUserAddresses(userId: string) {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const addresses = user.addresses || [];

    return {
      success: true,
      addresses: JSON.parse(JSON.stringify(addresses))
    };
  } catch (error: any) {
    console.error("Error getting addresses:", error);
    throw new Error(error.message || "Failed to get addresses");
  }
}
