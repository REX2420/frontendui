"use server";

import { connectToDatabase } from "../connect";
import User from "../models/user.model";
import Address from "../models/address.model";

// Migration script to move addresses from User model to Address model
export async function migrateUserAddresses() {
  try {
    await connectToDatabase();
    
    console.log("Starting address migration...");
    
    // Find all users with existing address data
    const usersWithAddresses = await User.find({
      address: { $exists: true, $ne: null },
    });
    
    console.log(`Found ${usersWithAddresses.length} users with addresses to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const user of usersWithAddresses) {
      try {
        // Check if user already has addresses in the new collection
        const existingAddresses = await Address.countDocuments({
          userId: user._id,
          isActive: true,
        });
        
        if (existingAddresses > 0) {
          console.log(`User ${user._id} already has migrated addresses, skipping...`);
          continue;
        }
        
        // Create new address from old structure
        const addressData = {
          userId: user._id,
          firstName: user.address.firstName || "",
          lastName: user.address.lastName || "",
          phoneNumber: user.address.phoneNumber || "",
          address1: user.address.address1 || user.address.address || "",
          address2: user.address.address2 || "",
          city: user.address.city || "",
          state: user.address.state || "",
          zipCode: user.address.zipCode || "",
          country: user.address.country || "",
          isDefault: true, // First address is default
          isActive: true,
          type: "home",
        };
        
        // Validate required fields
        if (!addressData.firstName || !addressData.lastName || !addressData.address1 || 
            !addressData.city || !addressData.state || !addressData.zipCode || !addressData.country) {
          console.log(`User ${user._id} has incomplete address data, skipping...`);
          continue;
        }
        
        // Create new address
        const newAddress = new Address(addressData);
        await newAddress.save();
        
        migratedCount++;
        console.log(`Migrated address for user ${user._id}`);
        
      } catch (error) {
        console.error(`Error migrating address for user ${user._id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Migration completed: ${migratedCount} addresses migrated, ${errorCount} errors`);
    
    return {
      success: true,
      migratedCount,
      errorCount,
      message: `Migration completed: ${migratedCount} addresses migrated, ${errorCount} errors`,
    };
    
  } catch (error: any) {
    console.error("Migration failed:", error);
    return {
      success: false,
      message: error.message || "Migration failed",
    };
  }
}

// Clean up old address data (run after confirming migration worked)
export async function cleanupOldAddresses() {
  try {
    await connectToDatabase();
    
    console.log("Starting cleanup of old address data...");
    
    // Find users who have both old and new address data
    const usersWithBothAddresses = await User.find({
      address: { $exists: true, $ne: null },
    });
    
    let cleanedCount = 0;
    
    for (const user of usersWithBothAddresses) {
      try {
        // Check if user has addresses in new collection
        const newAddressCount = await Address.countDocuments({
          userId: user._id,
          isActive: true,
        });
        
        if (newAddressCount > 0) {
          // Remove old address data
          await User.updateOne(
            { _id: user._id },
            { $unset: { address: "" } }
          );
          
          cleanedCount++;
          console.log(`Cleaned old address data for user ${user._id}`);
        }
      } catch (error) {
        console.error(`Error cleaning address for user ${user._id}:`, error);
      }
    }
    
    console.log(`Cleanup completed: ${cleanedCount} old addresses removed`);
    
    return {
      success: true,
      cleanedCount,
      message: `Cleanup completed: ${cleanedCount} old addresses removed`,
    };
    
  } catch (error: any) {
    console.error("Cleanup failed:", error);
    return {
      success: false,
      message: error.message || "Cleanup failed",
    };
  }
}

// Rollback migration (restore from Address collection to User model)
export async function rollbackAddressMigration() {
  try {
    await connectToDatabase();
    
    console.log("Starting address migration rollback...");
    
    // Find all addresses in new collection
    const addresses = await Address.find({ isActive: true, isDefault: true });
    
    let rolledBackCount = 0;
    
    for (const address of addresses) {
      try {
        // Update user with address data
        await User.updateOne(
          { _id: address.userId },
          {
            $set: {
              address: {
                firstName: address.firstName,
                lastName: address.lastName,
                phoneNumber: address.phoneNumber,
                address1: address.address1,
                address2: address.address2,
                city: address.city,
                state: address.state,
                zipCode: address.zipCode,
                country: address.country,
              },
            },
          }
        );
        
        rolledBackCount++;
        console.log(`Rolled back address for user ${address.userId}`);
        
      } catch (error) {
        console.error(`Error rolling back address for user ${address.userId}:`, error);
      }
    }
    
    console.log(`Rollback completed: ${rolledBackCount} addresses restored`);
    
    return {
      success: true,
      rolledBackCount,
      message: `Rollback completed: ${rolledBackCount} addresses restored`,
    };
    
  } catch (error: any) {
    console.error("Rollback failed:", error);
    return {
      success: false,
      message: error.message || "Rollback failed",
    };
  }
} 