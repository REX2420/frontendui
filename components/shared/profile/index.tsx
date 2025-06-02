"use client";

import { useEffect, useState } from "react";
import { CreditCard, LogOut, User, MapPin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth, useClerk, UserProfile } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getAllUserOrdersProfile,
  getUserById,
  saveAddress,
} from "@/lib/database/actions/user.actions";
import { getUserAddresses } from "@/lib/database/actions/address.actions";
import AddressManager from "@/components/shared/profile/address-manager";

import Link from "next/link";
import { useForm } from "@mantine/form";
import { toast } from "sonner";

export default function MyProfileComponent() {
  const { userId } = useAuth();
  const [orders, setOrders] = useState<any[]>();
  const [address, setAddress] = useState<any>();
  const { signOut } = useClerk();
  const [addresses, setAddresses] = useState<any[]>([]);

  const [user, setUser] = useState({
    name: "",
    email: "",
    avatar: "",
    id: "",
  });

  useEffect(() => {
    async function fetchAllUserOrders() {
      try {
        if (!userId) return;
        await getAllUserOrdersProfile(userId)
          .then((res) => {
            setOrders(res);
          })
          .catch((err) => {
            console.log(err);
            toast.error(err);
          });
      } catch (error: any) {
        console.log(error);
      }
    }

    async function fetchUserAddresses() {
      if (user?.id) {
        try {
          const addressResult = await getUserAddresses(user.id);
          if (addressResult.success) {
            setAddresses(addressResult.addresses);
          }
        } catch (error) {
          console.error("Error fetching addresses:", error);
        }
      }
    }

    if (userId) {
      fetchAllUserOrders();
      fetchUserAddresses();
    }
  }, [userId, user]);

  useEffect(() => {
    if (userId) {
      getUserById(userId).then((res) => {
        if (res?.success) {
          setUser({
            ...user,
            name: res.user.username,
            email: res.user.email,
            avatar: res.user.image,
            id: res.user._id,
          });
        } else {
          console.log(res?.message);
          toast.error(res?.message);
        }
      });
    }
  }, [userId]);

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
        value.trim().length < 2
          ? "First name must be at least 2 letters"
          : null,
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
        value.length > 100
          ? "Address 1 must not exceed 100 characters."
          : value.length < 5 ? "Address must be at least 5 characters" : null,
      address2: (value) =>
        value.length > 100
          ? "Address 2 must not exceed 100 characters."
          : null,
      country: (value) =>
        value.length < 2 ? "Country must be at least 2 letters" : null,
    },
  });
  // form.setErrors({ firstName: "Too short", lastName: "Invalid email" });

  useEffect(() => {
    if (address && Object.keys(address).length > 0) {
      form.setValues({
        firstName: address.firstName || "",
        lastName: address.lastName || "",
        phoneNumber: address.phoneNumber || "",
        state: address.state || "",
        city: address.city || "",
        zipCode: address.zipCode || "",
        address1: address.address1 || "",
        address2: address.address2 || "",
        country: address.country || "",
      });
    }
  }, [address]);

  const handleAddressUpdate = async () => {
    if (user?.id) {
      try {
        const addressResult = await getUserAddresses(user.id);
        if (addressResult.success) {
          setAddresses(addressResult.addresses);
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="font-bold text-2xl text-center mb-[50px]">MY PROFILE</div>
      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-1/4 lg:sticky top-[1rem] self-start">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="capitalize">{user.name}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardFooter>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => signOut({ redirectUrl: "/sign-in" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </CardFooter>
          </Card>
        </aside>
        <main className="flex-1">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your profile details here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 m-0 sm:p-auto sm:m-auto">
                  <UserProfile />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>
                    View your past orders and their status.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders &&
                      orders.map((order) => (
                        <div
                          key={order.id}
                          className="flex-row items-center justify-between  border-b pb-2"
                        >
                          <div>
                            <p className="font-medium">{order.id}</p>
                            <p className="text-sm text-gray-500">
                              {order.date}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              MVR{order.total.toFixed(2)}
                            </p>
                            <Link
                              href={`/order/${order.id}`}
                              className="text-blue-500 underline text-sm flex items-center gap-[0px]"
                            >
                              See Details <ChevronRight size={15} />
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle>Billing Addresses</CardTitle>
                  <CardDescription>
                    Manage your saved addresses for faster checkout.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AddressManager
                    userId={user.id}
                    addresses={addresses}
                    onAddressUpdate={handleAddressUpdate}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
