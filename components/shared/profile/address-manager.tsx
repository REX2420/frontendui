import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Phone, MapPin, Mail, Home, Building, Globe, Edit, Trash2, Plus, Star } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useForm } from "@mantine/form";
import { toast } from "sonner";
import { addUserAddress, updateUserAddress, deleteUserAddress, setDefaultAddress } from "@/lib/database/actions/address.actions";

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

interface AddressManagerProps {
  userId: string;
  addresses: Address[];
  onAddressUpdate: () => void;
}

const AddressManager: React.FC<AddressManagerProps> = ({ userId, addresses, onAddressUpdate }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    initialValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      state: "",
      city: "",
      zipCode: "",
      address1: "",
      address2: "",
      country: "",
    },
    validate: {
      firstName: (value) =>
        value.trim().length < 2 ? "First name must be at least 2 letters" : null,
      lastName: (value) =>
        value.trim().length < 2 ? "Last name must be at least 2 letters" : null,
      phoneNumber: (value) =>
        value.trim().length < 7 ? "Phone number must be at least 7 digits" : 
        value.trim().length > 15 ? "Phone number must not exceed 15 digits" : null,
      state: (value) =>
        value.length < 2 ? "State must be at least 2 letters" : null,
      city: (value) =>
        value.length < 2 ? "City must be at least 2 letters" : null,
      zipCode: (value) =>
        value.length < 3 ? "Zip Code must be at least 3 characters" : 
        value.length > 20 ? "Zip Code must not exceed 10 characters" : null,
      address1: (value) =>
        value.length > 100 ? "Address 1 must not exceed 100 characters" : 
        value.length < 5 ? "Address must be at least 5 characters" : null,
      address2: (value) =>
        value.length > 100 ? "Address 2 must not exceed 100 characters" : null,
      country: (value) =>
        value.length < 2 ? "Country must be at least 2 letters" : null,
    },
  });

  const resetForm = () => {
    form.reset();
    setEditingAddress(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    form.setValues({
      firstName: address.firstName,
      lastName: address.lastName,
      phoneNumber: address.phoneNumber,
      state: address.state,
      city: address.city,
      zipCode: address.zipCode,
      address1: address.address1,
      address2: address.address2 || "",
      country: address.country,
    });
    setIsEditDialogOpen(true);
  };

  const handleAddAddress = async (values: any) => {
    if (addresses.length >= 2) {
      toast.error("You can only save up to 2 addresses");
      return;
    }

    setIsLoading(true);
    try {
      const isFirstAddress = addresses.length === 0;
      await addUserAddress(
        { ...values, isDefault: isFirstAddress },
        userId
      );
      toast.success("Address added successfully!");
      setIsAddDialogOpen(false);
      resetForm();
      onAddressUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add address");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAddress = async (values: any) => {
    if (!editingAddress) return;

    setIsLoading(true);
    try {
      await updateUserAddress(
        editingAddress._id,
        { ...values, isDefault: editingAddress.isDefault },
        userId
      );
      toast.success("Address updated successfully!");
      setIsEditDialogOpen(false);
      resetForm();
      onAddressUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update address");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string, isDefault: boolean) => {
    if (addresses.length === 1) {
      toast.error("You must have at least one address");
      return;
    }

    setIsLoading(true);
    try {
      await deleteUserAddress(addressId, userId);
      toast.success("Address deleted successfully!");
      onAddressUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete address");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setIsLoading(true);
    try {
      await setDefaultAddress(addressId, userId);
      toast.success("Default address updated!");
      onAddressUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Failed to set default address");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Billing Addresses</h2>
          <p className="text-gray-600">Manage your saved addresses for faster checkout</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openAddDialog}
              disabled={addresses.length >= 2}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={form.onSubmit(handleAddAddress)}
              className="space-y-6"
            >
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Personal Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <div className="relative">
                      <Input
                        id="firstName"
                        placeholder="Enter your first name"
                        {...form.getInputProps("firstName")}
                        className="pl-10"
                      />
                      <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                    {form.errors.firstName && (
                      <p className="text-sm text-red-600">{form.errors.firstName}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <div className="relative">
                      <Input
                        id="lastName"
                        placeholder="Enter your last name"
                        {...form.getInputProps("lastName")}
                        className="pl-10"
                      />
                      <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                    {form.errors.lastName && (
                      <p className="text-sm text-red-600">{form.errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      placeholder="Enter your phone number"
                      {...form.getInputProps("phoneNumber")}
                      type="tel"
                      className="pl-10"
                    />
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
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

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address1">Address Line 1 *</Label>
                    <div className="relative">
                      <Input
                        id="address1"
                        placeholder="House/Flat number, Building name, Street"
                        {...form.getInputProps("address1")}
                        className="pl-10"
                      />
                      <Home className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                    {form.errors.address1 && (
                      <p className="text-sm text-red-600">{form.errors.address1}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address2">Address Line 2 (Optional)</Label>
                    <div className="relative">
                      <Input
                        id="address2"
                        placeholder="Landmark, Area (optional)"
                        {...form.getInputProps("address2")}
                        className="pl-10"
                      />
                      <Building className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <div className="relative">
                        <Input
                          id="city"
                          placeholder="Enter your city"
                          {...form.getInputProps("city")}
                          className="pl-10"
                        />
                        <Building className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      </div>
                      {form.errors.city && (
                        <p className="text-sm text-red-600">{form.errors.city}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <div className="relative">
                        <Input
                          id="state"
                          placeholder="Enter your state"
                          {...form.getInputProps("state")}
                          className="pl-10"
                        />
                        <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      </div>
                      {form.errors.state && (
                        <p className="text-sm text-red-600">{form.errors.state}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code / Postal Code *</Label>
                      <div className="relative">
                        <Input
                          id="zipCode"
                          placeholder="Enter postal code"
                          {...form.getInputProps("zipCode")}
                          className="pl-10"
                        />
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      </div>
                      {form.errors.zipCode && (
                        <p className="text-sm text-red-600">{form.errors.zipCode}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <div className="relative">
                        <Input
                          id="country"
                          placeholder="Enter your country"
                          {...form.getInputProps("country")}
                          className="pl-10"
                        />
                        <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      </div>
                      {form.errors.country && (
                        <p className="text-sm text-red-600">{form.errors.country}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Adding..." : "Add Address"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Address Limit Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 mt-0.5">ℹ️</div>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Address Management</p>
            <p>
              You can save up to 2 addresses for faster checkout. You currently have {addresses.length}/2 addresses saved.
            </p>
          </div>
        </div>
      </div>

      {/* Addresses List */}
      <div className="grid gap-4">
        {addresses.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">No addresses saved</h3>
                  <p className="text-gray-500">Add your first address to get started</p>
                </div>
                <Button onClick={openAddDialog} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your First Address
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          addresses.map((address) => (
            <Card key={address._id} className={address.isDefault ? "border-blue-500 bg-blue-50" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {address.firstName} {address.lastName}
                      </h3>
                      {address.isDefault && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Default
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-700">
                      <p>📞 {address.phoneNumber}</p>
                      <p className="font-medium">{address.address1}</p>
                      {address.address2 && <p>{address.address2}</p>}
                      <p>{address.city}, {address.state} {address.zipCode}</p>
                      <p>{address.country}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(address)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    
                    {!address.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address._id)}
                        disabled={isLoading}
                        className="flex items-center gap-1"
                      >
                        <Star className="w-3 h-3" />
                        Set Default
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAddress(address._id, address.isDefault || false)}
                      disabled={isLoading || addresses.length === 1}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Address Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.onSubmit(handleEditAddress)}
            className="space-y-6"
          >
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name *</Label>
                  <div className="relative">
                    <Input
                      id="edit-firstName"
                      placeholder="Enter your first name"
                      {...form.getInputProps("firstName")}
                      className="pl-10"
                    />
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  </div>
                  {form.errors.firstName && (
                    <p className="text-sm text-red-600">{form.errors.firstName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name *</Label>
                  <div className="relative">
                    <Input
                      id="edit-lastName"
                      placeholder="Enter your last name"
                      {...form.getInputProps("lastName")}
                      className="pl-10"
                    />
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  </div>
                  {form.errors.lastName && (
                    <p className="text-sm text-red-600">{form.errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number *</Label>
                <div className="relative">
                  <Input
                    id="edit-phone"
                    placeholder="Enter your phone number"
                    {...form.getInputProps("phoneNumber")}
                    type="tel"
                    className="pl-10"
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
                {form.errors.phoneNumber && (
                  <p className="text-sm text-red-600">{form.errors.phoneNumber}</p>
                )}
              </div>
            </div>

            {/* Address Information - same as add form */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Address Information</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-address1">Address Line 1 *</Label>
                  <div className="relative">
                    <Input
                      id="edit-address1"
                      placeholder="House/Flat number, Building name, Street"
                      {...form.getInputProps("address1")}
                      className="pl-10"
                    />
                    <Home className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  </div>
                  {form.errors.address1 && (
                    <p className="text-sm text-red-600">{form.errors.address1}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-address2">Address Line 2 (Optional)</Label>
                  <div className="relative">
                    <Input
                      id="edit-address2"
                      placeholder="Landmark, Area (optional)"
                      {...form.getInputProps("address2")}
                      className="pl-10"
                    />
                    <Building className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-city">City *</Label>
                    <div className="relative">
                      <Input
                        id="edit-city"
                        placeholder="Enter your city"
                        {...form.getInputProps("city")}
                        className="pl-10"
                      />
                      <Building className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                    {form.errors.city && (
                      <p className="text-sm text-red-600">{form.errors.city}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-state">State *</Label>
                    <div className="relative">
                      <Input
                        id="edit-state"
                        placeholder="Enter your state"
                        {...form.getInputProps("state")}
                        className="pl-10"
                      />
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                    {form.errors.state && (
                      <p className="text-sm text-red-600">{form.errors.state}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-zipCode">Zip Code / Postal Code *</Label>
                    <div className="relative">
                      <Input
                        id="edit-zipCode"
                        placeholder="Enter postal code"
                        {...form.getInputProps("zipCode")}
                        className="pl-10"
                      />
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                    {form.errors.zipCode && (
                      <p className="text-sm text-red-600">{form.errors.zipCode}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-country">Country *</Label>
                    <div className="relative">
                      <Input
                        id="edit-country"
                        placeholder="Enter your country"
                        {...form.getInputProps("country")}
                        className="pl-10"
                      />
                      <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                    {form.errors.country && (
                      <p className="text-sm text-red-600">{form.errors.country}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Updating..." : "Update Address"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddressManager; 