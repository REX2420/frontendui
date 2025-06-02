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

// Validate address data
export function validateAddressData(data: Partial<AddressData>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  
  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.firstName = "First name must be at least 2 characters";
  }
  
  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.lastName = "Last name must be at least 2 characters";
  }
  
  if (!data.phoneNumber || data.phoneNumber.trim().length < 7) {
    errors.phoneNumber = "Phone number must be at least 7 digits";
  }
  
  if (data.phoneNumber && data.phoneNumber.trim().length > 15) {
    errors.phoneNumber = "Phone number must not exceed 15 digits";
  }
  
  if (!data.address1 || data.address1.trim().length < 5) {
    errors.address1 = "Address must be at least 5 characters";
  }
  
  if (!data.city || data.city.trim().length < 2) {
    errors.city = "City must be at least 2 characters";
  }
  
  if (!data.state || data.state.trim().length < 2) {
    errors.state = "State must be at least 2 characters";
  }
  
  if (!data.zipCode || data.zipCode.trim().length < 3) {
    errors.zipCode = "Zip code must be at least 3 characters";
  }
  
  if (data.zipCode && data.zipCode.trim().length > 10) {
    errors.zipCode = "Zip code must not exceed 20 characters";
  }
  
  if (!data.country || data.country.trim().length < 2) {
    errors.country = "Country must be at least 2 characters";
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Helper function to format address for display
export function formatAddress(address: AddressData): string {
  const parts = [
    address.address1,
    address.address2,
    `${address.city}, ${address.state} ${address.zipCode}`,
    address.country
  ].filter(Boolean);
  
  return parts.join(", ");
}

// Helper function to get address type label
export function getAddressTypeLabel(type: string): string {
  switch (type) {
    case "home":
      return "🏠 Home";
    case "work":
      return "🏢 Work";
    case "other":
      return "📍 Other";
    default:
      return "📍 Address";
  }
}

// Helper function to validate phone number format
export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");
  
  // Check if it's between 7-15 digits
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

// Helper function to format phone number for display
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");
  
  // Format based on length
  if (digitsOnly.length === 10) {
    // US format: (XXX) XXX-XXXX
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    // US format with country code: +1 (XXX) XXX-XXXX
    return `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
  } else {
    // International format: just add spaces every 3-4 digits
    return digitsOnly.replace(/(\d{3,4})(?=\d)/g, "$1 ");
  }
} 