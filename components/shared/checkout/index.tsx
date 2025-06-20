"use client";
import { useEffect, useState } from "react";
import { MapPin, Ticket, CreditCard, CheckCircle, Loader, ArrowRight, Tag, Package, User, Phone, Mail } from "lucide-react";
import { useForm } from "@mantine/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { applyCoupon, saveAddress, getUserById } from "@/lib/database/actions/user.actions";
import { getUserAddresses, addUserAddress, updateUserAddress } from "@/lib/database/actions/address.actions";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { FaArrowAltCircleRight } from "react-icons/fa";
import {
  createOrder,
} from "@/lib/database/actions/order.actions";
import DeliveryAddressForm from "./delivery.address.form";
import ApplyCouponForm from "./apply.coupon.form";
import AddressSelector from "./address-selector";

export default function CheckoutComponent() {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>();
  const [address, setAddress] = useState<any>();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [coupon, setCoupon] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponError, setCouponError] = useState("");
  const [totalAfterDiscount, setTotalAfterDiscount] = useState("");
  const [discount, setDiscount] = useState(0);
  const [data, setData] = useState<any>([]);
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
        value.length > 100 ? "Address 1 must not exceed 100 characters" : value.length < 5 ? "Address must be at least 5 characters" : null,
      address2: (value) =>
        value.length > 100 ? "Address 2 must not exceed 100 characters" : null,
    },
  });

  const { userId } = useAuth();
  const router = useRouter();

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const isActiveStep = (stepNumber: number) => step === stepNumber;
  const isStepCompleted = (stepNumber: number) => step > stepNumber;

  // Validation logic for steps
  const canProceedToNextStep = () => {
    if (step === 1) {
      // Must have selected address or completed address form
      return !showAddressForm && (selectedAddress || addresses.length > 0);
    }
    if (step === 2) {
      // Can proceed with or without coupon (coupon is optional)
      return true;
    }
    return false;
  };

  const handleNextStep = () => {
    if (canProceedToNextStep()) {
      nextStep();
    } else {
      // Show appropriate error message
      if (step === 1) {
        toast.error("Please complete your address information to continue");
      }
    }
  };

  // Load user data and addresses
  useEffect(() => {
    const fetchData = async () => {
      if (userId) {
        try {
          // Get user data from database
          const userData = await getUserById(userId);
          if (userData.success) {
            setUser(userData.user);
            
            // Try to load user addresses if user exists
            try {
              const userAddresses = await getUserAddresses(userData.user._id);
              if (userAddresses.success && userAddresses.addresses.length > 0) {
                setAddresses(userAddresses.addresses);
                const defaultAddress = userAddresses.addresses.find((addr: any) => addr.isDefault);
                const addressToSelect = defaultAddress || userAddresses.addresses[0];
                setSelectedAddressId(addressToSelect._id);
                setShowAddressForm(false);
              } else {
                setShowAddressForm(true);
              }
            } catch (error) {
              console.error("Error loading addresses:", error);
              setShowAddressForm(true);
            }
          } else {
            // If user doesn't exist in database, just show address form
            setShowAddressForm(true);
          }
        } catch (error) {
          console.error("Error loading user data:", error);
          setShowAddressForm(true);
        }
        
        // Sync authentication state
        const setAuth = useCartStore.getState().setAuthenticated;
        setAuth(!!userId);
      }
    };
    fetchData();
  }, [userId]);

  const applyCouponHandler = async (e: any) => {
    e.preventDefault();
    
    if (!user?._id) {
      toast.error("User information not available");
      return;
    }
    
    // Pass the client-side cart total to the applyCoupon function
    await applyCoupon(coupon, user._id, calculatedSubtotal)
      .catch((err) => {
        setCouponError(err);
      })
      .then((res) => {
        if (res.success) {
          setTotalAfterDiscount(res.totalAfterDiscount);
          setDiscount(res.discount);
          toast.success(`Applied ${res.discount}% discount successfully!`);
          setCouponError("");
          nextStep();
        } else if (!res.success) {
          toast.error(`No coupon found`);
        }
      });
  };
  
  const cart = useCartStore((state: any) => state.cart.cartItems);
  const emptyCart = useCartStore((state: any) => state.emptyCart);
  const getCartTotal = useCartStore((state: any) => state.getCartTotal);
  const isAuthenticated = useCartStore((state: any) => state.isAuthenticated);
  const setAuthenticated = useCartStore((state: any) => state.setAuthenticated);

  const totalSaved: number = cart.reduce((acc: any, curr: any) => {
    return acc + (curr.saved || 0) * curr.qty;
  }, 0);
  
  // Use client-side cart total instead of database cart total
  const calculatedSubtotal = getCartTotal();
  const finalTotal = Math.max(0, calculatedSubtotal - totalSaved);

  const [placeOrderLoading, setPlaceOrderLoading] = useState<boolean>(false);

  // Get selected address for order placement
  const getSelectedAddressForOrder = () => {
    if (addresses.length > 0 && selectedAddressId) {
      return addresses.find(addr => addr._id === selectedAddressId);
    }
    return user?.address;
  };

  const selectedAddress = getSelectedAddressForOrder();
  const isDisabled = step !== 3 || paymentMethod === "" || !selectedAddress || placeOrderLoading;

  const buttonText = () => {
    if (step !== 3) {
      return "Complete current step to place order";
    }
    if (paymentMethod === "") {
      return "Please select payment method";
    } else if (!selectedAddress) {
      return "Please select an address";
    } else {
      return "Place Order";
    }
  };

  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);
  
  const placeOrderHandler = async () => {
    try {
      setPlaceOrderLoading(true);

      if (paymentMethod === "") {
        toast.error("Please choose a payment method.");
        setPlaceOrderLoading(false);
        return;
      } else if (!selectedAddress) {
        toast.error("Please select an address.");
        setPlaceOrderLoading(false);
        return;
      }

      // Convert client-side cart to order format
      const orderProducts = cart.map((item: any) => ({
        product: item._id,
        name: item.name,
        image: item.images?.[0]?.url || item.images?.[0] || "",
        size: item.size,
        qty: item.qty.toString(),
        color: item.color || { color: "", image: "" },
        price: item.price,
        vendor: item.vendor || {},
      }));

      const orderResponse = await createOrder(
        orderProducts,
        selectedAddress,
        paymentMethod,
        totalAfterDiscount !== "" ? totalAfterDiscount : calculatedSubtotal.toString(),
        calculatedSubtotal.toString(),
        coupon,
        user?._id || userId, // Use userId if user._id not available
        totalSaved
      );
      
      if (orderResponse?.success) {
        emptyCart();
        toast.success("Order placed successfully!");
        router.replace(`/order/${orderResponse.orderId}`);
      } else {
        console.error("Order creation failed:", orderResponse?.message);
        toast.error(orderResponse?.message || "Failed to create order");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setPlaceOrderLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === 'true' || canceled === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const steps = [
    { number: 1, title: 'Delivery Address', icon: MapPin, description: 'Where should we deliver?' },
    { number: 2, title: 'Apply Coupon', icon: Ticket, description: 'Save more with coupons' },
    { number: 3, title: 'Payment Method', icon: CreditCard, description: 'How would you like to pay?' }
  ];

  // Address management handlers
  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    form.reset();
    setShowAddressForm(true);
  };

  const handleEditAddress = (address: any) => {
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
    setShowAddressForm(true);
  };

  const handleAddressContinue = async () => {
    nextStep();
  };

  const handleAddressFormSubmit = async (values: any) => {
    try {
      if (editingAddress) {
        // Update existing address
        await updateUserAddress(editingAddress._id, values, user._id);
        toast.success("Address updated successfully!");
      } else {
        // Add new address
        if (addresses.length >= 2) {
          toast.error("You can only save up to 2 addresses");
          return;
        }
        const result = await addUserAddress(values, user._id);
        if (result.success) {
          toast.success("Address added successfully!");
        }
      }

      // Refresh addresses
      const userAddresses = await getUserAddresses(user._id);
      if (userAddresses.success) {
        setAddresses(userAddresses.addresses);
        if (!editingAddress && userAddresses.addresses.length > 0) {
          // Select the newly added address
          const newAddress = userAddresses.addresses[userAddresses.addresses.length - 1];
          setSelectedAddressId(newAddress._id);
        }
      }

      setShowAddressForm(false);
      setEditingAddress(null);
      form.reset();
      
      if (!editingAddress) {
        nextStep();
      }
    } catch (error: any) {
      console.error("Error saving address:", error);
      toast.error(error.message || "Failed to save address");
    }
  };

  const hasExistingAddress = addresses.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-black">
      <div className="container mx-auto px-4 py-6 lg:py-12">
        {/* Secure Checkout Header */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
              Secure Checkout
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg lg:text-xl leading-relaxed">
              Complete your order in just a few simple steps
            </p>
          </div>
        </div>

        <div className="max-w-8xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 xl:gap-12 enhanced-checkout-mobile">
            {/* Checkout Form */}
            <div className="xl:col-span-7 space-y-6">
              {/* Modern Progress Steps */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/30 p-4 lg:p-6 xl:p-8">
                <div className="mb-6 lg:mb-8">
                  <div className="flex items-center justify-between relative">
                    {/* Progress Line */}
                    <div className="absolute top-5 left-5 right-5 h-1 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full -z-10">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 rounded-full transition-all duration-700 ease-out shadow-lg"
                        style={{ width: `${((step - 1) / 2) * 100}%` }}
                      />
                    </div>
                    
                    {steps.map((stepItem, index) => {
                      const StepIcon = stepItem.icon;
                      return (
                        <div key={stepItem.number} className="relative flex flex-col items-center group">
                          {/* Step Circle */}
                          <div
                            className={`
                              flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 lg:border-3 transition-all duration-300 relative
                              ${isActiveStep(stepItem.number)
                                ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 text-white border-transparent shadow-xl scale-110 ring-2 lg:ring-4 ring-blue-200 dark:ring-blue-400/50"
                                : isStepCompleted(stepItem.number)
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-400 dark:to-emerald-400 text-white border-green-500 dark:border-green-400 shadow-lg"
                                : "bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-300 border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500 shadow-md"
                              }
                            `}
                          >
                            {isStepCompleted(stepItem.number) ? (
                              <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6" />
                            ) : (
                              <StepIcon className="w-5 h-5 lg:w-6 lg:h-6" />
                            )}
                          </div>
                          
                          {/* Step Text */}
                          <div className="mt-4 text-center">
                            <span
                              className={`
                                block text-sm lg:text-base font-semibold transition-colors duration-300
                                ${isActiveStep(stepItem.number)
                                  ? "text-blue-600 dark:text-blue-400"
                                  : isStepCompleted(stepItem.number)
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-gray-500 dark:text-gray-400"
                                }
                              `}
                            >
                              {stepItem.title}
                            </span>
                            <span className="hidden lg:block text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-24 leading-tight">
                              {stepItem.description}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step Content */}
                <div className="min-h-[450px]">
                  {/* Step 1: Delivery Address */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                          <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delivery Address</h2>
                          <p className="text-gray-600 dark:text-gray-300">Where should we deliver your order?</p>
                        </div>
                      </div>
                      
                      {!showAddressForm && hasExistingAddress ? (
                        <AddressSelector
                          addresses={addresses}
                          selectedAddressId={selectedAddressId}
                          onAddressSelect={handleAddressSelect}
                          onAddNewAddress={handleAddNewAddress}
                          onEditAddress={handleEditAddress}
                          onContinue={handleAddressContinue}
                        />
                      ) : (
                        <form
                          onSubmit={form.onSubmit(handleAddressFormSubmit)}
                          className="space-y-6"
                        >
                          <DeliveryAddressForm 
                            form={form} 
                            hasExistingAddress={!!editingAddress}
                          />
                        </form>
                      )}
                    </div>
                  )}

                  {/* Step 2: Apply Coupon */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                          <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Apply Coupon</h2>
                          <p className="text-gray-600 dark:text-gray-300">Have a coupon code? Enter it here to save more</p>
                        </div>
                      </div>
                      
                      <form
                        onSubmit={(e) => {
                          applyCouponHandler(e);
                        }}
                        className="space-y-6"
                      >
                        <ApplyCouponForm
                          setCoupon={setCoupon}
                          couponError={couponError}
                        />
                      </form>
                    </div>
                  )}

                  {/* Step 3: Choose Payment */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                          <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Method</h2>
                          <p className="text-gray-600 dark:text-gray-300">Choose how you'd like to pay for your order</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors bg-white dark:bg-gray-800/50">
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="cod" id="cod" />
                              <Label htmlFor="cod" className="flex-1 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">Cash on Delivery (COD)</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Pay when your order arrives</div>
                                  </div>
                                  <div className="text-2xl">💰</div>
                                </div>
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-blue-500 dark:text-blue-400 mt-0.5">ℹ️</div>
                            <div className="text-sm text-blue-700 dark:text-blue-300">
                              <p className="font-medium mb-1">About Cash on Delivery</p>
                              <p>Pay in cash or transfer when your order is delivered to your doorstep.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                  {step > 1 ? (
                    <Button 
                      onClick={prevStep} 
                      variant="outline"
                      className="flex items-center gap-2 px-6 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 dark:bg-gray-800/50"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Previous
                    </Button>
                  ) : (
                    <div></div>
                  )}
                  
                  {step < 3 && !showAddressForm && (
                    <Button 
                      onClick={handleNextStep} 
                      disabled={!canProceedToNextStep()}
                      className="flex items-center gap-2 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 dark:from-blue-600 dark:to-purple-600 dark:hover:from-blue-700 dark:hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      data-step-nav="next"
                    >
                      {step === 1 && "Continue to Coupon"}
                      {step === 2 && "Continue to Payment"}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Show completion message for step 3 */}
                  {step === 3 && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
                      ✅ Review your order and click "Place Order" to complete your purchase
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary - Enhanced Sticky Sidebar */}
            <div className="xl:col-span-5">
              <div className="sticky top-4 space-y-4">
                {/* Order Summary Card */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl lg:rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/30 overflow-hidden enhanced-order-summary-mobile">
                  {/* Header Section */}
                  <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 dark:from-orange-600 dark:via-red-600 dark:to-pink-600 p-4 lg:p-6 xl:p-8">
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div className="p-2 lg:p-3 bg-white/20 dark:bg-white/30 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                        <Package className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                      </div>
                      <div className="flex-1 text-white">
                        <h2 className="text-lg lg:text-xl xl:text-2xl font-bold">Order Summary</h2>
                        <p className="text-white/90 mt-1 text-sm lg:text-base">
                          {cart.length} {cart.length === 1 ? "item" : "items"} • 
                          Total: MVR {totalAfterDiscount !== "" ? Number(totalAfterDiscount).toFixed(2) : finalTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Products List */}
                  <div className="p-4 lg:p-6 xl:p-8">
                    <div className="space-y-3 lg:space-y-4 mb-6 max-h-60 lg:max-h-80 overflow-y-auto custom-scrollbar">
                      {cart.map((item: any, index: number) => (
                        <div key={index} className="group border border-gray-200 dark:border-gray-700 rounded-xl lg:rounded-2xl p-3 lg:p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg dark:hover:shadow-black/25 transition-all duration-300 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 enhanced-product-card-mobile">
                          <div className="flex gap-3 lg:gap-4">
                            <div className="relative flex-shrink-0">
                              <img
                                src={item.images?.[0]?.url || item.images?.[0] || ""}
                                alt={item.name}
                                className="w-16 h-16 lg:w-20 lg:h-20 object-cover rounded-lg lg:rounded-xl shadow-md group-hover:shadow-lg dark:shadow-black/25 transition-shadow duration-300 enhanced-product-image-mobile"
                              />
                              {item.discount > 0 && (
                                <div className="absolute -top-1 -right-1 lg:-top-2 lg:-right-2 bg-gradient-to-r from-red-500 to-pink-500 dark:from-red-400 dark:to-pink-400 text-white text-xs px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-full shadow-lg">
                                  -{item.discount}%
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{item.name}</h3>
                              
                              {/* Product Details */}
                              <div className="space-y-2 mb-3">
                                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                                  <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center bg-white dark:bg-gray-700 shadow-sm">
                                      {item.color?.color && (
                                        <div 
                                          className="w-2.5 h-2.5 rounded-full"
                                          style={{ backgroundColor: item.color.color.toLowerCase() }}
                                        />
                                      )}
                                    </div>
                                    <span className="font-medium">{item.color?.color || 'Default'}</span>
                                  </span>
                                  <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg font-medium">Size: {item.size}</span>
                                </div>
                                
                                {item.vendor?.name && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1 inline-block">
                                    Sold by: <span className="font-medium text-gray-700 dark:text-gray-300">{item.vendor.name}</span>
                                  </p>
                                )}
                              </div>

                              {/* Pricing */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                      MVR {item.price}
                                    </span>
                                    {item.priceBefore && item.priceBefore !== item.price && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400 line-through bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                        MVR {item.priceBefore}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-white bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 px-3 py-1.5 rounded-full font-semibold shadow-md">
                                    Qty: {item.qty}
                                  </span>
                                </div>
                                
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Item Total:</span>
                                  <span className="font-bold text-gray-900 dark:text-white text-sm">
                                    MVR {(item.price * item.qty).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {/* Items Summary */}
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                          <span>
                            Order Summary ({cart.length} {cart.length === 1 ? "item" : "items"})
                          </span>
                          <span className="text-blue-600 dark:text-blue-400">MVR {calculatedSubtotal.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Detailed Breakdown */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                          <span>Items Total</span>
                          <span className="font-medium">MVR {calculatedSubtotal.toFixed(2)}</span>
                        </div>
                        
                        {totalSaved > 0 && (
                          <div className="flex justify-between text-green-600 dark:text-green-400">
                            <span className="flex items-center gap-2">
                              <span>Product Discount</span>
                              <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-full">
                                Savings
                              </span>
                            </span>
                            <span className="font-medium">- MVR {totalSaved.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span className="flex items-center gap-2">
                            <span>Shipping</span>
                            <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-full">
                              Free
                            </span>
                          </span>
                          <span className="font-medium">MVR 0.00</span>
                        </div>
                        
                        {totalAfterDiscount !== "" && (
                          <>
                            <div className="flex justify-between text-gray-500 dark:text-gray-400">
                              <span>Subtotal before coupon</span>
                              <span className="line-through">MVR {finalTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-green-600 dark:text-green-400">
                              <span className="flex items-center gap-2">
                                <span>Coupon Discount ({discount}%)</span>
                                <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-full">
                                  {coupon}
                                </span>
                              </span>
                              <span className="font-medium">
                                - MVR {(finalTotal - Number(totalAfterDiscount)).toFixed(2)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Final Total */}
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-4 bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-indigo-900/30 rounded-2xl p-4 mt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">Total Amount</span>
                          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            MVR {totalAfterDiscount !== "" ? Number(totalAfterDiscount).toFixed(2) : finalTotal.toFixed(2)}
                          </span>
                        </div>
                        {(totalSaved > 0 || totalAfterDiscount !== "") && (
                          <div className="mt-3 text-sm text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/30 rounded-lg p-2 text-center">
                            🎉 You saved MVR {(
                              totalSaved + 
                              (totalAfterDiscount !== "" ? (finalTotal - Number(totalAfterDiscount)) : 0)
                            ).toFixed(2)} on this order!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Place Order Button - Only show on final step */}
                    {step === 3 && (
                      <Button
                        className="w-full mt-6 h-14 text-lg font-semibold bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 dark:from-green-600 dark:via-emerald-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:via-emerald-700 dark:hover:to-green-800 shadow-2xl hover:shadow-3xl dark:shadow-black/25 transition-all duration-300 transform hover:scale-105"
                        onClick={placeOrderHandler}
                        disabled={isDisabled}
                      >
                        {placeOrderLoading ? (
                          <div className="flex items-center gap-3">
                            <Loader className="w-6 h-6 animate-spin" />
                            Placing Order...
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <FaArrowAltCircleRight className="w-6 h-6" />
                            {buttonText()}
                          </div>
                        )}
                      </Button>
                    )}

                    {/* Step Progress Indicator for non-final steps */}
                    {step < 3 && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">📋</div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            <p className="font-semibold mb-1">Complete Your Information</p>
                            <p>
                              {step === 1 && "Please provide your shipping address to continue"}
                              {step === 2 && "Review your discount options or continue to payment"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Security Badge */}
                    <div className="mt-6 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                        <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                        <span className="font-medium">Secure & encrypted checkout</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
