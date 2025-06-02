# VibeCart Address Management System

## Overview

The VibeCart address management system provides a comprehensive solution for storing and managing user addresses with support for multiple addresses per user, default address selection, and seamless integration with the checkout process.

## Database Structure

### Address Model (`lib/database/models/address.model.ts`)

The Address model provides a dedicated collection for storing address data with the following features:

#### Schema Fields:
- `userId`: Reference to the User who owns this address
- `firstName` & `lastName`: User's name for delivery
- `phoneNumber`: Contact number (7-15 digits, international support)
- `address1`: Primary address line (required)
- `address2`: Secondary address line (optional)
- `city`, `state`, `zipCode`, `country`: Location details
- `isDefault`: Boolean flag for default address
- `isActive`: Soft delete flag
- `type`: Address type (home, work, other)
- `fullAddress`: Auto-generated formatted address string
- `createdAt` & `updatedAt`: Timestamps

#### Features:
- **Address Limit**: Maximum 2 addresses per user
- **Default Management**: Automatic default address handling
- **Soft Delete**: Addresses are marked inactive rather than deleted
- **Full-Text Search**: Searchable by address components
- **Auto-Formatting**: Automatically generates formatted address strings

#### Static Methods:
- `getUserAddressCount(userId)`: Count active addresses for user
- `getUserDefaultAddress(userId)`: Get user's default address
- `getUserAddresses(userId)`: Get all user addresses (sorted by default, then creation date)

#### Instance Methods:
- `setAsDefault()`: Set this address as default (automatically unsets others)

## Database Actions

### Core Address Actions (`lib/database/actions/address.actions.ts`)

#### Functions Available:

1. **getUserAddresses(userId)**
   ```typescript
   const result = await getUserAddresses(userId);
   // Returns: { success: boolean, addresses: Address[], count: number }
   ```

2. **getUserDefaultAddress(userId)**
   ```typescript
   const result = await getUserDefaultAddress(userId);
   // Returns: { success: boolean, address: Address | null }
   ```

3. **addUserAddress(addressData, userId)**
   ```typescript
   const addressData = {
     firstName: "John",
     lastName: "Doe",
     phoneNumber: "1234567890",
     address1: "123 Main St",
     city: "Anytown",
     state: "CA",
     zipCode: "12345",
     country: "USA"
   };
   const result = await addUserAddress(addressData, userId);
   ```

4. **updateUserAddress(addressId, addressData, userId)**
   ```typescript
   const result = await updateUserAddress(addressId, updatedData, userId);
   ```

5. **deleteUserAddress(addressId, userId)**
   ```typescript
   const result = await deleteUserAddress(addressId, userId);
   ```

6. **setDefaultAddress(addressId, userId)**
   ```typescript
   const result = await setDefaultAddress(addressId, userId);
   ```

7. **getAddressById(addressId, userId)**
   ```typescript
   const result = await getAddressById(addressId, userId);
   ```

8. **searchUserAddresses(userId, searchQuery)**
   ```typescript
   const result = await searchUserAddresses(userId, "california");
   ```

9. **validateAddressData(addressData)**
   ```typescript
   const { isValid, errors } = validateAddressData(addressData);
   ```

### Enhanced User Actions (`lib/database/actions/user.actions.enhanced.ts`)

Provides backward compatibility with the old address system while using the new Address model:

- `getUserWithAddresses(userId)`: Get user with all addresses
- `getUserDefaultAddressEnhanced(userId)`: Get default address (with legacy fallback)
- `getUserAddressesEnhanced(userId)`: Get all addresses (with legacy fallback)
- `addUserAddressEnhanced(addressData, userId)`: Add address with backward compatibility
- `updateUserAddressEnhanced(addressId, addressData, userId)`: Update with sync to legacy
- `deleteUserAddressEnhanced(addressId, userId)`: Delete with legacy sync
- `setDefaultAddressEnhanced(addressId, userId)`: Set default with legacy sync

## Migration System

### Migration Functions (`lib/database/migrations/migrate-addresses.ts`)

#### 1. Migrate Existing Addresses
```typescript
import { migrateUserAddresses } from "@/lib/database/migrations/migrate-addresses";

const result = await migrateUserAddresses();
// Migrates addresses from User.address to Address collection
```

#### 2. Cleanup Old Data
```typescript
import { cleanupOldAddresses } from "@/lib/database/migrations/migrate-addresses";

const result = await cleanupOldAddresses();
// Removes old address data from User model after successful migration
```

#### 3. Rollback Migration
```typescript
import { rollbackAddressMigration } from "@/lib/database/migrations/migrate-addresses";

const result = await rollbackAddressMigration();
// Restores data from Address collection back to User.address
```

## Component Integration

### Components Using the Address System:

1. **AddressManager** (`components/shared/profile/address-manager.tsx`)
   - Full CRUD operations for address management
   - Visual address cards with actions
   - Address limit enforcement

2. **AddressSelector** (`components/shared/checkout/address-selector.tsx`)
   - Checkout address selection interface
   - Quick continue or edit options
   - Add new address during checkout

3. **DeliveryAddressForm** (`components/shared/checkout/delivery.address.form.tsx`)
   - Address form with validation
   - Support for both add and edit modes
   - Status indicators for existing addresses

## Usage Examples

### Frontend Component Usage

```typescript
// In a React component
import { getUserAddresses, addUserAddress } from "@/lib/database/actions/address.actions";

const MyAddressComponent = () => {
  const [addresses, setAddresses] = useState([]);
  
  useEffect(() => {
    const loadAddresses = async () => {
      const result = await getUserAddresses(userId);
      if (result.success) {
        setAddresses(result.addresses);
      }
    };
    loadAddresses();
  }, [userId]);

  const handleAddAddress = async (addressData) => {
    const result = await addUserAddress(addressData, userId);
    if (result.success) {
      // Refresh addresses
      const updatedResult = await getUserAddresses(userId);
      setAddresses(updatedResult.addresses);
    }
  };
};
```

### Checkout Integration

```typescript
// In checkout process
const checkoutWithAddress = async (selectedAddressId) => {
  const addressResult = await getAddressById(selectedAddressId, userId);
  
  if (addressResult.success) {
    // Proceed with order using addressResult.address
    await createOrder(cartItems, addressResult.address, paymentMethod);
  }
};
```

## Validation Rules

### Address Data Validation:
- **firstName**: Min 2 characters
- **lastName**: Min 2 characters  
- **phoneNumber**: 7-15 digits (international support)
- **address1**: Min 5 characters, max 100 characters
- **address2**: Optional, max 100 characters
- **city**: Min 2 characters
- **state**: Min 2 characters
- **zipCode**: Min 3 characters, max 10 characters (international postal codes)
- **country**: Min 2 characters

## Error Handling

All database functions return standardized responses:

```typescript
// Success response
{
  success: true,
  data: {...}, // Address data or other relevant data
  message: "Operation completed successfully"
}

// Error response
{
  success: false,
  message: "Error description",
  errors?: {...} // Validation errors if applicable
}
```

## Database Indexes

The Address model includes optimized indexes for:
- User address lookups: `{ userId: 1, isActive: 1 }`
- Default address queries: `{ userId: 1, isDefault: 1 }`
- General user queries: `{ userId: 1 }`

## Best Practices

1. **Always use the enhanced functions** for backward compatibility
2. **Run migration** before switching to new system
3. **Test thoroughly** in development before production deployment
4. **Monitor address counts** to ensure 2-address limit enforcement
5. **Use soft deletes** to maintain data integrity
6. **Validate on both client and server** sides
7. **Handle legacy data gracefully** during transition period

## Troubleshooting

### Common Issues:

1. **Migration fails**: Check for incomplete address data in User model
2. **Address limit not enforced**: Ensure using correct action functions
3. **Default address not updating**: Check for multiple default addresses
4. **Legacy fallback not working**: Verify enhanced functions are being used

### Debug Tools:

```typescript
// Check address count for user
const count = await Address.getUserAddressCount(userId);

// Find all addresses for debugging
const allAddresses = await Address.find({ userId, isActive: true });

// Check for multiple defaults (shouldn't happen)
const defaultAddresses = await Address.find({ userId, isDefault: true, isActive: true });
```

## Future Enhancements

Planned features for future versions:
- Address validation with external APIs
- Geocoding integration
- Address type-specific handling
- Bulk address operations
- Address sharing between family members
- International address format support 