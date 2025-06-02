"use client";
import { useEffect, useState } from "react";
import { MapPin, Ticket, CreditCard, CheckCircle, Loader } from "lucide-react";
import { useForm } from "@mantine/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { applyCoupon, saveAddress } from "@/lib/database/actions/user.actions";

import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { FaArrowAltCircleRight } from "react-icons/fa";
import {
  createOrder,
} from "@/lib/database/actions/order.actions";
import { getSavedCartForUser } from "@/lib/database/actions/cart.actions";
import DeliveryAddressForm from "./delivery.address.form";
import ApplyCouponForm from "./apply.coupon.form";

export default function CheckoutComponent() {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>();
  const [address, setAddress] = useState<any>();
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
        value.trim().length < 6
          ? "First name must be at least 6 letters"
          : null,
      lastName: (value) =>
        value.trim().length < 2 ? "Last name must be at least 2 letters" : null,
      phoneNumber: (value) =>
        value.trim().length < 10 && value.trim().length > 10
          ? "Phone Number must be within 10 numbers"
          : null,
      state: (value) =>
        value.length < 2 ? "State must be at least 2 letters" : null,
      city: (value) =>
        value.length < 2 ? "City must be at least 2 letters" : null,
      zipCode: (value) =>
        value.length < 6 ? "Zip Code must be at least 6 characters." : null,
      address1: (value) =>
        value.length > 100 ? "Address 1 must not exceed 100 characters." : null,
      address2: (value) =>
        value.length > 100 ? "Address 2 must not exceed 100 characters." : null,
    },
  });

  const { userId } = useAuth();
  const router = useRouter();

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const isActiveStep = (stepNumber: number) => step === stepNumber;
  const isStepCompleted = (stepNumber: number) => step > stepNumber;

  useEffect(() => {
    const fetchData = async () => {
      if (userId) {
        const savedCart = await getSavedCartForUser(userId);
        setData(savedCart);
        setUser(savedCart.user);
        setAddress(savedCart.user.address);
        if (savedCart.user?.address?.firstName) {
          form.setValues({
            firstName: savedCart.user.address.firstName,
            lastName: savedCart.user.address.lastName,
            phoneNumber: savedCart.user.address.phoneNumber,
            state: savedCart.user.address.state,
            city: savedCart.user.address.city,
            zipCode: savedCart.user.address.zipCode,
            address1: savedCart.user.address.address1,
            address2: savedCart.user.address.address2,
            country: savedCart.user.address.country,
          });
        }
      }
    };
    fetchData();
  }, [userId]);

  const applyCouponHandler = async (e: any) => {
    e.preventDefault();
    await applyCoupon(coupon, user._id)
      .catch((err) => {
        setCouponError(err);
      })
      .then((res) => {
        if (res.success) {
          setTotalAfterDiscount(res.totalAfterDiscount);
          setDiscount(res.discount);
          toast.success(`Applied ${res.discount}% on order successfully.`);
          setCouponError("");
          nextStep();
        } else if (!res.success) {
          toast.error(`No Coupon Found`);
        }
      });
  };
  const cart = useCartStore((state: any) => state.cart.cartItems);
  const emptyCart = useCartStore((state: any) => state.emptyCart);

  const totalSaved: number = cart.reduce((acc: any, curr: any) => {
    // Add the 'saved' property value to the accumulator
    return acc + curr.saved * curr.qty;
  }, 0);
  const [subTotal, setSubtotal] = useState<number>(0);
  const carttotal = Number(subTotal + totalSaved).toFixed(0);

  const [placeOrderLoading, setPlaceOrderLoading] = useState<boolean>(false);
  const isDisabled =
    paymentMethod === "" || user?.address.firstName === "" || placeOrderLoading;

  const buttonText = () => {
    if (paymentMethod === "") {
      return "Please select the payment method";
    } else if (user?.address.firstName === "") {
      return "Please Add Billing Address";
    } else {
      return "Place Order with Cash on Delivery";
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
      } else if (!user?.address.firstName) {
        toast.error("Please fill in all details in the billing address.");
        setPlaceOrderLoading(false);
        return;
      }

      // Only COD payment method
      const orderResponse = await createOrder(
        data?.products,
        user?.address,
        paymentMethod,
        totalAfterDiscount !== "" ? totalAfterDiscount : data?.cartTotal,
        data?.cartTotal,
        coupon,
        user._id,
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
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Calculate subtotal
  useEffect(() => {
    if (data?.products) {
      const calculatedSubtotal = data.products.reduce((acc: number, curr: any) => {
        return acc + (curr.price * curr.qty);
      }, 0);
      setSubtotal(calculatedSubtotal);
    }
  }, [data]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto p-6">
      {/* Checkout Form */}
      <div className="w-full lg:w-2/3">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="relative flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActiveStep(1)
                    ? "bg-primary text-white border-primary"
                    : isStepCompleted(1)
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-gray-200 text-gray-500 border-gray-300"
                }`}
              >
                {isStepCompleted(1) ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <MapPin className="w-5 h-5" />
                )}
              </div>
              <span
                className={`mt-2 text-sm ${
                  isActiveStep(1)
                    ? "text-primary font-semibold"
                    : isStepCompleted(1)
                    ? "text-green-500"
                    : "text-muted-foreground"
                }`}
              >
                <span className="hidden lg:block">Delivery Address</span>
              </span>
            </div>

            <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>

            <div className="relative flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActiveStep(2)
                    ? "bg-primary text-white border-primary"
                    : isStepCompleted(2)
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-gray-200 text-gray-500 border-gray-300"
                }`}
              >
                {isStepCompleted(2) ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Ticket className="w-5 h-5" />
                )}
              </div>
              <span
                className={`mt-2 text-sm ${
                  isActiveStep(2)
                    ? "text-primary font-semibold"
                    : isStepCompleted(2)
                    ? "text-green-500"
                    : "text-muted-foreground"
                }`}
              >
                <span className="hidden lg:block">Apply Coupon</span>
              </span>
            </div>

            <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>

            <div className="relative flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActiveStep(3)
                    ? "bg-primary text-white border-primary"
                    : isStepCompleted(3)
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-gray-200 text-gray-500 border-gray-300"
                }`}
              >
                {isStepCompleted(3) ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <CreditCard className="w-5 h-5" />
                )}
              </div>
              <span
                className={`mt-2 text-sm ${
                  isActiveStep(3)
                    ? "text-primary font-semibold"
                    : isStepCompleted(3)
                    ? "text-green-500"
                    : "text-muted-foreground"
                }`}
              >
                <span className="hidden lg:block">Choose Payment Method</span>
              </span>
            </div>
          </div>

          {/* Step 1: Delivery Address Form */}
          {step === 1 && (
            <form
              onSubmit={form.onSubmit(async (values) => {
                await saveAddress({ ...values, active: true }, user._id)
                  .then((res) => {
                    setAddress(res.addresses);
                    toast.success("Successfully added address");
                    router.refresh();
                    nextStep();
                  })
                  .catch((err) => {
                    console.log(err);
                    toast.error(err);
                  });
              })}
              className="space-y-4"
            >
              <DeliveryAddressForm form={form} />
            </form>
          )}

          {/* Step 2: Apply Coupon */}
          {step === 2 && (
            <form
              onSubmit={(e) => {
                applyCouponHandler(e);
              }}
              className="space-y-4"
            >
              <ApplyCouponForm
                setCoupon={setCoupon}
                couponError={couponError}
              />
            </form>
          )}

          {/* Step 3: Choose Payment */}
          {step === 3 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold mb-4">
                Choose Payment Method
              </h2>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod">Cash on Delivery (COD)</Label>
                </div>
              </RadioGroup>
            </form>
          )}

          <div className="mt-6 flex justify-between">
            {step > 1 && (
              <Button onClick={prevStep} variant="outline">
                Previous
              </Button>
            )}
            {step < 3 && (
              <Button onClick={nextStep} className="ml-auto">
                Continue
              </Button>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full bg-gray-100 lg:w-1/3  lg:sticky top-[1rem] self-start">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-4">
              {data.products?.map((i: any, index: number) => (
                <div className="flex items-center space-x-4" key={index}>
                  <img
                    src={i.image}
                    alt={i.name}
                    className="w-20 h-20 object-cover"
                  />
                  <div>
                    <h3 className="font-medium text-sm">{i.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Size: {i.size}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {i.qty}
                    </p>
                    <p className="font-semibold text-sm">
                      MVR {i.price} * {i.qty} = MVR{i.price * i.qty}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex justify-between">
                <span>
                  Subtotal ({data && data?.products?.length}{" "}
                  {data && data?.products?.length === 1 ? "Item" : "Items"}):
                </span>
                <span>
                  <strong>MVR {carttotal}</strong>
                </span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Cart Discount:</span>
                <span>
                  <strong>- MVR {totalSaved}</strong>
                </span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Shipping Charges:</span>
                <span>Free</span>
              </div>
              <div
                className={`flex justify-between ${
                  totalAfterDiscount !== ""
                    ? "text-sm"
                    : "text-lg font-semibold"
                }`}
              >
                <span>
                  {" "}
                  {totalAfterDiscount !== ""
                    ? "Total: "
                    : "Total before :"}{" "}
                </span>
                <span>MVR {data?.cartTotal}</span>
              </div>
              {totalAfterDiscount !== "" && (
                <div className="flex justify-between">
                  <span>Coupon Discount ({discount}%):</span>
                  <span className="text-green-600">
                    <strong>
                      - MVR {data?.cartTotal - totalAfterDiscount}
                    </strong>
                  </span>
                </div>
              )}
              {totalAfterDiscount !== "" && (
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>MVR {totalAfterDiscount}</span>
                </div>
              )}
            </div>
            <Button
              className="w-full mt-6"
              onClick={placeOrderHandler}
              disabled={isDisabled}
            >
              {placeOrderLoading ? (
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Placing Order...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FaArrowAltCircleRight />
                  {buttonText()}
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
