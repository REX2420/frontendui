import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Phone, MapPin, Mail, Home, Building, Globe, Edit } from "lucide-react";
import React from "react";
import { useFormStatus } from "react-dom";

const DeliveryAddressForm = ({ form, hasExistingAddress }: { form: any, hasExistingAddress: boolean }) => {
  const { pending } = useFormStatus();

  return (
    <div className="space-y-6">
      {/* Address Status Indicator */}
      {hasExistingAddress && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="text-green-500 mt-0.5">✅</div>
            <div className="text-sm text-green-700">
              <p className="font-medium mb-1">Address Found</p>
              <p>We found your saved address. You can update it below if needed, or continue with the current address.</p>
            </div>
          </div>
        </div>
      )}

      {!hasExistingAddress && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-500 mt-0.5">📍</div>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Add Delivery Address</p>
              <p>Please provide your delivery address to proceed with the order.</p>
            </div>
          </div>
        </div>
      )}

      {/* Personal Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Personal Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="firstName"
                placeholder="Enter your first name"
                {...form.getInputProps("firstName")}
                required
                className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-4" />
            </div>
            {form.errors.firstName && (
              <p className="text-sm text-red-600">{form.errors.firstName}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="lastName"
                placeholder="Enter your last name"
                {...form.getInputProps("lastName")}
                required
                className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-4" />
            </div>
            {form.errors.lastName && (
              <p className="text-sm text-red-600">{form.errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              id="phone"
              placeholder="Enter your phone number"
              {...form.getInputProps("phoneNumber")}
              required
              type="tel"
              className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
            />
            <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-4" />
          </div>
          {form.errors.phoneNumber && (
            <p className="text-sm text-red-600">{form.errors.phoneNumber}</p>
          )}
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Address Information</h3>
        </div>

        <div className="space-y-2">
          <label htmlFor="address1" className="block text-sm font-medium text-gray-700">
            Address Line 1 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              id="address1"
              placeholder="House/Flat number, Building name, Street"
              {...form.getInputProps("address1")}
              required
              className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
            />
            <Home className="w-4 h-4 text-gray-400 absolute left-3 top-4" />
          </div>
          {form.errors.address1 && (
            <p className="text-sm text-red-600">{form.errors.address1}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="address2" className="block text-sm font-medium text-gray-700">
            Address Line 2 <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="relative">
            <Input
              id="address2"
              placeholder="Landmark, Area (optional)"
              {...form.getInputProps("address2")}
              className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
            />
            <Building className="w-4 h-4 text-gray-400 absolute left-3 top-4" />
          </div>
          {form.errors.address2 && (
            <p className="text-sm text-red-600">{form.errors.address2}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="city"
                placeholder="Enter your city"
                {...form.getInputProps("city")}
                required
                className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              />
              <Building className="w-4 h-4 text-gray-400 absolute left-3 top-4" />
            </div>
            {form.errors.city && (
              <p className="text-sm text-red-600">{form.errors.city}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">
              State <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="state"
                placeholder="Enter your state"
                {...form.getInputProps("state")}
                required
                className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              />
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-4" />
            </div>
            {form.errors.state && (
              <p className="text-sm text-red-600">{form.errors.state}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
              Zip Code / Postal Code <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="zipCode"
                placeholder="Enter postal code"
                {...form.getInputProps("zipCode")}
                required
                className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-4" />
            </div>
            {form.errors.zipCode && (
              <p className="text-sm text-red-600">{form.errors.zipCode}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
              Country <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="country"
                placeholder="Enter your country"
                {...form.getInputProps("country")}
                required
                className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              />
              <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-4" />
            </div>
            {form.errors.country && (
              <p className="text-sm text-red-600">{form.errors.country}</p>
            )}
          </div>
        </div>
      </div>

      {/* Address Security Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 mt-0.5">ℹ️</div>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Address Security</p>
            <p>
              {hasExistingAddress 
                ? "Your address will be updated securely. You can manage your addresses anytime from your profile."
                : "Your address will be securely saved for faster checkout in future orders. You can update or delete it anytime from your profile."
              }
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Button Based on Address Status */}
      <Button 
        type="submit" 
        disabled={pending}
        className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {pending ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {hasExistingAddress ? "Updating Address..." : "Saving Address..."}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {hasExistingAddress ? (
              <>
                <Edit className="w-5 h-5" />
                Update Address & Continue
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                Save Address & Continue
              </>
            )}
          </div>
        )}
      </Button>
    </div>
  );
};

export default DeliveryAddressForm;
