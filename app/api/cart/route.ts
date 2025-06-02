import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRedisClient } from '@/lib/redis/connect';

interface CartItem {
  _id: string;
  _uid: string;
  name: string;
  price: number;
  qty: number;
  size: string;
  images: any[];
  quantity: number;
  discount?: number;
  style?: number;
  color?: {
    color: string;
    image: string;
  };
  vendor?: any;
  createdAt?: string;
  updatedAt?: string;
}

// GET /api/cart - Retrieve cart
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    // Use the requested userId if provided, otherwise use the authenticated userId
    const targetUserId = requestedUserId || userId;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, message: 'User ID required' },
        { status: 400 }
      );
    }

    try {
      const client = await getRedisClient();
      if (!client) {
        return NextResponse.json({
          success: true,
          cart: {
            items: [],
            total: 0,
            itemCount: 0
          }
        });
      }
      
      const cartData = await client.get(`cart:${targetUserId}`);
      
      if (cartData) {
        const cart = JSON.parse(cartData);
        return NextResponse.json({
          success: true,
          cart: {
            items: cart.items || [],
            total: cart.total || 0,
            itemCount: cart.itemCount || 0
          }
        });
      } else {
        return NextResponse.json({
          success: true,
          cart: {
            items: [],
            total: 0,
            itemCount: 0
          }
        });
      }
    } catch (redisError) {
      console.warn('Redis unavailable, returning empty cart:', redisError);
      return NextResponse.json({
        success: true,
        cart: {
          items: [],
          total: 0,
          itemCount: 0
        }
      });
    }
  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Update cart
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { items, operation = 'SYNC_CART' } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { success: false, message: 'Items must be an array' },
        { status: 400 }
      );
    }

    // Validate and sanitize items
    const validItems = items.filter((item: CartItem) => 
      item._id && item._uid && item.qty > 0
    ).map((item: CartItem) => ({
      ...item,
      qty: Number(item.qty),
      price: Number(item.price),
      updatedAt: new Date().toISOString()
    }));

    const cartData = {
      items: validItems,
      total: validItems.reduce((sum: number, item: CartItem) => sum + (item.price * item.qty), 0),
      itemCount: validItems.reduce((sum: number, item: CartItem) => sum + item.qty, 0),
      updatedAt: new Date().toISOString()
    };

    try {
      const client = await getRedisClient();
      if (!client) {
        return NextResponse.json({
          success: false,
          message: 'Failed to save cart to server'
        }, { status: 503 });
      }
      
      await client.setEx(`cart:${userId}`, 86400, JSON.stringify(cartData)); // 24 hours TTL
      
      console.log(`🔥 Cart saved to Redis for user ${userId} (${operation})`);
      return NextResponse.json({
        success: true,
        cart: cartData,
        message: 'Cart updated successfully'
      });
    } catch (redisError) {
      console.warn('Redis unavailable for cart update:', redisError);
      return NextResponse.json({
        success: false,
        message: 'Failed to save cart to server'
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Cart POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update cart' },
      { status: 500 }
    );
  }
} 