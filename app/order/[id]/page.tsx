import OrderedProductDetailedView from "@/components/shared/order/OrderProductDeatiledView";
import { Button } from "@/components/ui/button";
import { getOrderById } from "@/lib/database/actions/order.actions";
import { ArrowLeft, CheckCircle2, Package, Calendar, Mail, Phone, MapPin, CreditCard, Gift, ShoppingBag, Download, Share } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ObjectId } from "mongodb";
import { Metadata } from "next";
import IdInvalidError from "@/components/shared/IdInvalidError";

export const metadata: Metadata = {
  title: "Order Confirmation | VibeCart",
  description: "Your order has been successfully placed. View order details and tracking information.",
};

const OrderPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  // checking if the ID is valid Object ID
  const id = (await params).id;
  if (!ObjectId.isValid(id)) {
    return <IdInvalidError />;
  }
  const orderData = await getOrderById(id).catch((err: any) => {
    toast.error(err);
  });
  if (!orderData?.orderData) {
    return <IdInvalidError />;
  }
  const date = new Date(orderData?.orderData.createdAt);
  const formattedDate = date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
  
  const totalSavings = orderData?.orderData.totalSaved + 
    (orderData?.orderData.totalBeforeDiscount - orderData?.orderData.total);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-black">
      <div className="container mx-auto px-4 py-6 lg:py-12">
        {/* Header Navigation */}
        <div className="mb-6 lg:mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors duration-200 group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>

        {/* Success Header */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="max-w-3xl mx-auto">
            {/* Success Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 lg:w-24 lg:h-24 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-400 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-2xl dark:shadow-green-500/25">
                <CheckCircle2 className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
              </div>
            </div>
            
            {/* Success Message */}
            <h1 className="text-3xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 dark:from-green-400 dark:via-emerald-400 dark:to-green-500 bg-clip-text text-transparent mb-4">
              Order Confirmed!
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-4">
              Thank you, <span className="font-semibold text-gray-900 dark:text-white capitalize">{orderData?.orderData.user.username}</span>!
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              Your order has been successfully placed and will be delivered within 2-3 business days.
            </p>
            
            {/* Order ID Badge */}
            <div className="mt-6">
              <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 shadow-lg dark:shadow-black/25">
                <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Order ID:</span>
                <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">{orderData?.orderData._id}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
            {/* Main Order Details */}
            <div className="xl:col-span-8 space-y-6">
              {/* Order Information Card */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 dark:border-gray-700/30 overflow-hidden">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 dark:from-blue-600 dark:via-purple-600 dark:to-indigo-600 p-6 lg:p-8">
                  <div className="flex items-center gap-4 text-white">
                    <div className="p-3 bg-white/20 dark:bg-white/30 rounded-2xl backdrop-blur-sm">
                      <Package className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl lg:text-2xl font-bold">Order Details</h2>
                      <p className="text-white/90">Track your order information</p>
                    </div>
                  </div>
                </div>

                {/* Order Info Grid */}
                <div className="p-6 lg:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Order Date</span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">{formattedDate}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800/50 rounded-2xl p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3 mb-2">
                        <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-300">Email</span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{orderData?.orderData.user.email}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/50 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Payment</span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">Cash on Delivery</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/50 dark:to-orange-800/50 rounded-2xl p-4 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-medium text-orange-800 dark:text-orange-300">Total Amount</span>
                      </div>
                      <p className="font-bold text-xl text-gray-900 dark:text-white">MVR {orderData?.orderData.total}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address Card */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 dark:border-gray-700/30 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 dark:from-emerald-600 dark:via-green-600 dark:to-teal-600 p-6 lg:p-8">
                  <div className="flex items-center gap-4 text-white">
                    <div className="p-3 bg-white/20 dark:bg-white/30 rounded-2xl backdrop-blur-sm">
                      <MapPin className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl lg:text-2xl font-bold">Delivery Address</h2>
                      <p className="text-white/90">Order will be delivered to</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 lg:p-8">
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white capitalize mb-1">
                          {orderData?.orderData.user.username}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <Phone className="w-4 h-4" />
                          <span>{orderData?.orderData.user.address.phoneNumber}</span>
                        </div>
                      </div>
                      <div className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                        Primary Address
                      </div>
                    </div>
                    
                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      <p>{orderData?.orderData.user.address.address1}</p>
                      {orderData?.orderData.user.address.address2 && (
                        <p>{orderData?.orderData.user.address.address2}</p>
                      )}
                      <p>
                        {orderData?.orderData.user.address.city}, {orderData?.orderData.user.address.state}
                      </p>
                      <p>
                        {orderData?.orderData.user.address.country} - {orderData?.orderData.user.address.zipCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products List Card */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 dark:border-gray-700/30 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 dark:from-orange-600 dark:via-red-600 dark:to-pink-600 p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-white gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 sm:p-3 bg-white/20 dark:bg-white/30 rounded-2xl backdrop-blur-sm">
                        <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Order Items</h2>
                        <p className="text-white/90 text-sm sm:text-base">
                          {orderData?.orderData.products.length} {orderData?.orderData.products.length === 1 ? "item" : "items"} ordered
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-white/90 text-sm">Total</p>
                      <p className="text-xl sm:text-2xl font-bold">MVR {orderData?.orderData.total}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="space-y-4">
                    {orderData?.orderData.products.map((item: any, index: number) => (
                      <div key={index} className="group border border-gray-200 dark:border-gray-700 rounded-2xl p-3 sm:p-4 lg:p-6 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg dark:hover:shadow-black/25 transition-all duration-300 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700">
                        <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
                          <div className="relative flex-shrink-0 self-center sm:self-start">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-24 h-24 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-cover rounded-xl shadow-md group-hover:shadow-lg dark:shadow-black/25 transition-shadow duration-300 mx-auto sm:mx-0"
                            />
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                              Qty: {item.qty}
                            </div>
                          </div>
                          <div className="flex-1 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                              <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                                {item.name}
                              </h3>
                              <div className="text-center sm:text-right">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Unit Price</p>
                                <p className="font-bold text-gray-900 dark:text-white">MVR {item.price}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                              <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg text-sm font-medium text-center sm:text-left">
                                Size: {item.size}
                              </div>
                              {item.color?.color && (
                                <div className="flex items-center gap-2 justify-center sm:justify-start">
                                  <div 
                                    className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600"
                                    style={{ backgroundColor: item.color.color.toLowerCase() }}
                                  />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.color.color}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-600 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg px-3 py-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Item Total:</span>
                              <span className="font-bold text-lg text-gray-900 dark:text-white">
                                MVR {(item.price * item.qty).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <OrderedProductDetailedView item={item} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="xl:col-span-4">
              <div className="xl:sticky xl:top-6 space-y-6">
                {/* Savings Card */}
                {totalSavings > 0 && (
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 rounded-3xl p-4 sm:p-6 lg:p-8 text-white shadow-xl dark:shadow-green-500/25">
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                      <div className="p-3 bg-white/20 dark:bg-white/30 rounded-2xl backdrop-blur-sm">
                        <Gift className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>
                      <div className="text-center sm:text-left">
                        <h3 className="text-lg sm:text-xl font-bold">Great Savings!</h3>
                        <p className="text-white/90 text-sm sm:text-base">You saved money on this order</p>
                      </div>
                    </div>
                    <div className="text-center bg-white/20 dark:bg-white/30 rounded-2xl p-4 backdrop-blur-sm">
                      <p className="text-white/90 text-sm mb-1">Total Savings</p>
                      <p className="text-2xl sm:text-3xl font-bold">MVR {totalSavings.toFixed(2)}</p>
                      <p className="text-white/90 text-sm mt-1">🎉 Amazing deal!</p>
                    </div>
                  </div>
                )}

                {/* Bill Details Card */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 dark:border-gray-700/30 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800 p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col sm:flex-row items-center gap-4 text-white">
                      <div className="p-3 bg-white/20 dark:bg-white/30 rounded-2xl backdrop-blur-sm">
                        <CreditCard className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>
                      <div className="text-center sm:text-left">
                        <h3 className="text-lg sm:text-xl font-bold">Bill Summary</h3>
                        <p className="text-white/90 text-sm sm:text-base">Detailed price breakdown</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 lg:p-8">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Total MRP</span>
                        <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                          MVR {(orderData?.orderData.totalBeforeDiscount + orderData?.orderData.totalSaved).toFixed(2)}
                        </span>
                      </div>
                      
                      {orderData?.orderData.totalSaved > 0 && (
                        <div className="flex justify-between items-center py-2 text-green-600 dark:text-green-400 border-b border-gray-100 dark:border-gray-700">
                          <span className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-sm sm:text-base">Product Discount</span>
                            <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-full self-start sm:self-auto">
                              Savings
                            </span>
                          </span>
                          <span className="font-medium text-sm sm:text-base">- MVR {orderData?.orderData.totalSaved.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {(orderData?.orderData.totalBeforeDiscount - orderData?.orderData.total) > 0 && (
                        <div className="flex justify-between items-center py-2 text-green-600 dark:text-green-400 border-b border-gray-100 dark:border-gray-700">
                          <span className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-sm sm:text-base">Coupon Discount</span>
                            <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-full self-start sm:self-auto">
                              {orderData?.orderData.couponApplied}
                            </span>
                          </span>
                          <span className="font-medium text-sm sm:text-base">
                            - MVR {(orderData?.orderData.totalBeforeDiscount - orderData?.orderData.total).toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center py-2 text-green-600 dark:text-green-400 border-b border-gray-100 dark:border-gray-700">
                        <span className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="text-sm sm:text-base">Shipping</span>
                          <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-full self-start sm:self-auto">
                            Free
                          </span>
                        </span>
                        <span className="font-medium text-sm sm:text-base">MVR 0.00</span>
                      </div>
                      
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl p-4 gap-2">
                          <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white text-center sm:text-left">Final Total</span>
                          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent text-center sm:text-right">
                            MVR {orderData?.orderData.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <Link href="/" className="block">
                    <Button className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 dark:from-blue-600 dark:via-purple-600 dark:to-indigo-600 dark:hover:from-blue-700 dark:hover:via-purple-700 dark:hover:to-indigo-700 shadow-2xl hover:shadow-3xl dark:shadow-black/25 transition-all duration-300 transform hover:scale-105">
                      <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                      Continue Shopping
                    </Button>
                  </Link>
                  
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <Button variant="outline" className="h-10 sm:h-12 text-sm sm:text-base border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 dark:text-gray-300 dark:bg-gray-800/50 transition-all duration-300">
                      <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Download</span>
                      <span className="sm:hidden">PDF</span>
                    </Button>
                    <Button variant="outline" className="h-10 sm:h-12 text-sm sm:text-base border-2 border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 dark:text-gray-300 dark:bg-gray-800/50 transition-all duration-300">
                      <Share className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
