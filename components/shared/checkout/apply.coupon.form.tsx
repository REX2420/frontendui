import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag, Gift, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { useFormStatus } from "react-dom";

const ApplyCouponForm = ({
  setCoupon,
  couponError,
}: {
  setCoupon: any;
  couponError: string;
}) => {
  const { pending } = useFormStatus();
  const [couponCode, setCouponCode] = useState("");

  const handleCouponChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCouponCode(value);
    setCoupon(value);
  };

  return (
    <div className="space-y-6">
      {/* Coupon Input Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Gift className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Have a Coupon Code?</h3>
            <p className="text-sm text-gray-600">Enter your coupon code to get additional discounts</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coupon" className="block text-sm font-medium text-gray-700">
              Coupon Code
            </Label>
            <div className="relative">
              <Input
                onChange={handleCouponChange}
                value={couponCode}
                id="coupon"
                placeholder="Enter coupon code"
                className="pl-10 h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg uppercase"
                required
              />
              <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-4" />
            </div>
            {couponError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <span className="text-red-500">❌</span>
                <span>{couponError}</span>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={pending || !couponCode.trim()}
            className="w-full h-12 text-lg font-medium bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {pending ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Applying Coupon...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Apply Coupon Code
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Skip Option */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">
          Don't have a coupon code? No worries!
        </p>
        <Button 
          type="button"
          variant="outline"
          onClick={() => {
            // This will be handled by the parent component's navigation
            const nextButton = document.querySelector('[data-step-nav="next"]') as HTMLButtonElement;
            if (nextButton) {
              nextButton.click();
            }
          }}
          className="flex items-center gap-2 px-6 h-10 border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
        >
          <ChevronRight className="w-4 h-4" />
          Skip & Continue to Payment
        </Button>
      </div>
    </div>
  );
};

export default ApplyCouponForm;
