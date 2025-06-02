import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MapPin, Edit, Plus, Home, Building } from "lucide-react";
import React, { useState } from "react";

interface Address {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddressId: string;
  onAddressSelect: (addressId: string) => void;
  onAddNewAddress: () => void;
  onEditAddress: (address: Address) => void;
  onContinue: () => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  addresses,
  selectedAddressId,
  onAddressSelect,
  onAddNewAddress,
  onEditAddress,
  onContinue,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    await onContinue();
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <MapPin className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Choose Delivery Address</h2>
          <p className="text-gray-600">Select from your saved addresses or add a new one</p>
        </div>
      </div>

      {/* Address Selection */}
      <div className="space-y-4">
        <RadioGroup value={selectedAddressId} onValueChange={onAddressSelect}>
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`
                border rounded-xl p-4 transition-all duration-200 cursor-pointer
                ${selectedAddressId === address._id 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <RadioGroupItem 
                    value={address._id} 
                    id={address._id}
                    className="mt-1"
                  />
                  <Label htmlFor={address._id} className="flex-1 cursor-pointer">
                    <div className="space-y-2">
                      {/* Name and Default Badge */}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {address.firstName} {address.lastName}
                        </span>
                        {address.isDefault && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      
                      {/* Phone */}
                      <p className="text-sm text-gray-600">
                        📞 {address.phoneNumber}
                      </p>
                      
                      {/* Address */}
                      <div className="text-sm text-gray-700">
                        <p className="font-medium">{address.address1}</p>
                        {address.address2 && <p>{address.address2}</p>}
                        <p>{address.city}, {address.state} {address.zipCode}</p>
                        <p>{address.country}</p>
                      </div>
                    </div>
                  </Label>
                </div>
                
                {/* Edit Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditAddress(address)}
                  className="ml-3 p-2 h-8 w-8"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </RadioGroup>

        {/* Add New Address Option */}
        {addresses.length < 2 && (
          <div
            onClick={onAddNewAddress}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-gray-100 rounded-full">
                <Plus className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Add New Address</p>
                <p className="text-sm text-gray-500">
                  You can save up to 2 addresses ({2 - addresses.length} remaining)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Maximum Addresses Info */}
        {addresses.length >= 2 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-amber-500 mt-0.5">ℹ️</div>
              <div className="text-sm text-amber-700">
                <p className="font-medium mb-1">Address Limit Reached</p>
                <p>You have reached the maximum of 2 saved addresses. You can edit existing addresses or manage them in your profile.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!selectedAddressId || isLoading}
        className="w-full h-12 text-lg font-medium bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Confirming Address...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Continue with Selected Address
          </div>
        )}
      </Button>
    </div>
  );
};

export default AddressSelector; 