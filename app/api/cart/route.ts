import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SimpleCartManagerService } from '@/lib/services/cart/simple-cart-manager.service';
import { CartItem, CartOperation } from '@/lib/services/cart/types';

const cartManager = SimpleCartManagerService.getInstance();

// GET /api/cart - Retrieve cart
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!userId && !sessionId) {
      return NextResponse.json(
        { success: false, message: 'User ID or session ID required' },
        { status: 400 }
      );
    }

    const result = await cartManager.getCart(userId || undefined, sessionId || undefined);

    return NextResponse.json({
      success: result.success,
      cart: result.cart,
      source: result.source,
      message: result.message
    });
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
    const { items, sessionId, operation = CartOperation.SYNC_CART } = body;

    if (!userId && !sessionId) {
      return NextResponse.json(
        { success: false, message: 'User ID or session ID required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { success: false, message: 'Items must be an array' },
        { status: 400 }
      );
    }

    const result = await cartManager.updateCart(
      { items, userId: userId || undefined, sessionId: sessionId || undefined },
      operation
    );

    return NextResponse.json({
      success: result.success,
      cart: result.cart,
      message: result.message,
      errors: result.errors
    });
  } catch (error) {
    console.error('Cart POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update cart' },
      { status: 500 }
    );
  }
} 