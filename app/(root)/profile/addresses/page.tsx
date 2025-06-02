"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getUserById, getUserAddresses } from "@/lib/database/actions/user.actions";
import AddressManager from "@/components/shared/profile/address-manager";
import { Loader } from "lucide-react";

export default function AddressesPage() {
  const { userId } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserAndAddresses = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const userResult = await getUserById(userId);
      if (userResult.success) {
        setUser(userResult.user);
        
        const addressesResult = await getUserAddresses(userResult.user._id);
        if (addressesResult.success) {
          setAddresses(addressesResult.addresses);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndAddresses();
  }, [userId]);

  const handleAddressUpdate = () => {
    fetchUserAndAddresses();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading your addresses...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Please sign in to manage your addresses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 lg:py-12 max-w-4xl">
        <AddressManager
          userId={user._id}
          addresses={addresses}
          onAddressUpdate={handleAddressUpdate}
        />
      </div>
    </div>
  );
} 