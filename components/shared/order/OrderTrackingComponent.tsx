import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Truck, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface OrderTrackingProps {
  orderId: string;
  initialOrderData?: any;
}

const OrderTrackingComponent: React.FC<OrderTrackingProps> = ({ 
  orderId, 
  initialOrderData 
}) => {
  const [orderData, setOrderData] = useState(initialOrderData);
  const [loading, setLoading] = useState(!initialOrderData);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrderStatus = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true);
      
      const response = await fetch(`/api/orders/status?orderId=${orderId}`);
      const data = await response.json();

      if (data.success) {
        setOrderData(data.order);
        if (showRefreshToast) {
          toast.success('Order status updated');
        }
      } else {
        toast.error(data.error || 'Failed to fetch order status');
      }
    } catch (error) {
      console.error('Error fetching order status:', error);
      toast.error('Failed to fetch order status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!initialOrderData) {
      fetchOrderStatus();
    }
  }, [orderId, initialOrderData]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'not processed':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'payment pending':
        return 'bg-red-100 text-red-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status.toLowerCase()) {
      case 'payment pending':
        return 0;
      case 'confirmed':
        return 25;
      case 'in progress':
        return 50;
      case 'delivered':
        return 100;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
        <p className="text-gray-600">Unable to find order with ID: {orderId}</p>
      </div>
    );
  }

  const progressPercentage = getProgressPercentage(orderData.status);

  return (
    <div className="space-y-6">
      {/* Order Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Order Status</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchOrderStatus(true)}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Order #{orderId}</span>
              <Badge className={getStatusColor(orderData.status)}>
                {orderData.status}
              </Badge>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>Order Placed</span>
              <span>Processing</span>
              <span>Shipped</span>
              <span>Delivered</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            {orderData.isPaid ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-600 font-medium">Payment Confirmed</span>
                {orderData.paidAt && (
                  <span className="text-sm text-gray-500">
                    on {new Date(orderData.paidAt).toLocaleDateString()}
                  </span>
                )}
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-600 font-medium">Payment Pending</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Product Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orderData.products?.map((product: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-gray-600">
                      Size: {product.size} • Qty: {product.qty}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      {getStatusIcon(product.status)}
                      <span className="text-sm font-medium">{product.status}</span>
                      {product.productCompletedAt && (
                        <span className="text-xs text-gray-500">
                          Completed on {new Date(product.productCompletedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Product Status Timeline */}
                {product.statusHistory && product.statusHistory.length > 1 && (
                  <div className="mt-4 pl-4 border-l-2 border-gray-200">
                    <h5 className="text-sm font-medium mb-2">Status History</h5>
                    <div className="space-y-2">
                      {product.statusHistory.map((history: any, historyIndex: number) => (
                        <div key={historyIndex} className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>{history.status}</span>
                          <span className="text-gray-500">
                            {new Date(history.date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Information */}
      {orderData.deliveredAt && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-600 font-medium">
                Delivered on {new Date(orderData.deliveredAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderTrackingComponent; 