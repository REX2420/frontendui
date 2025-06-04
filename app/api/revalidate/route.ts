import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, productId, slug } = body;

    console.log('🔄 Manual cache revalidation requested:', { type, productId, slug });

    switch (type) {
      case 'product':
        // Invalidate specific product
        revalidateTag('product');
        revalidateTag('products');
        revalidateTag('homepage');
        
        if (slug) {
          revalidatePath(`/product/${slug}`);
        }
        
        console.log(`✅ Product cache invalidated for: ${productId}`);
        break;

      case 'products':
        // Invalidate all product-related caches
        revalidateTag('products');
        revalidateTag('homepage');
        revalidateTag('top-selling');
        revalidateTag('new-arrivals');
        revalidateTag('featured');
        revalidateTag('categories');
        revalidateTag('product');
        
        revalidatePath('/');
        revalidatePath('/shop');
        
        console.log('✅ All product caches invalidated');
        break;

      case 'homepage':
        // Invalidate homepage-specific caches
        revalidateTag('homepage');
        revalidateTag('featured');
        revalidateTag('top-selling');
        revalidateTag('new-arrivals');
        revalidatePath('/');
        
        console.log('✅ Homepage caches invalidated');
        break;

      case 'categories':
        // Invalidate category caches
        revalidateTag('categories');
        revalidatePath('/categories');
        revalidatePath('/shop');
        
        console.log('✅ Category caches invalidated');
        break;

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid revalidation type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Cache invalidated for type: ${type}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error during cache revalidation:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 