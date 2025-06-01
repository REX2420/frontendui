"use server";

import { handleError } from "@/lib/utils";
import { connectToDatabase } from "../connect";
import Product from "../models/product.model";
import User from "../models/user.model";
import Cart from "../models/cart.model";

// Cart operations for user:
export async function saveCartForUser(cart: any, clerkId: string) {
  try {
    await connectToDatabase();
    
    if (!clerkId) {
      return { success: false, message: "User not authenticated" };
    }
    
    let user = await User.findOne({ clerkId });
    
    if (!user) {
      return { success: false, message: "User not found" };
    }
    
    // Always delete existing cart first
    await Cart.deleteOne({ user: user._id });

    // If cart is empty, just delete and return success (user cleared their cart)
    if (!cart || cart.length === 0) {
      return { success: true, message: "Empty cart saved (cart cleared)" };
    }
    
    let products = [];

    for (let i = 0; i < cart.length; i++) {
      try {
        let dbProduct: any = await Product.findById(cart[i]._id).lean();
        
        if (!dbProduct) {
          console.warn(`Product not found: ${cart[i]._id}`);
          continue; // Skip this product instead of failing entirely
        }
        
        if (!dbProduct.subProducts || !dbProduct.subProducts[cart[i].style]) {
          console.warn(`SubProduct not found for style: ${cart[i].style}`);
          continue;
        }
        
        let subProduct = dbProduct.subProducts[cart[i].style];
        
        if (!subProduct.sizes) {
          console.warn(`No sizes found for product: ${cart[i]._id}`);
          continue;
        }
        
        let sizeData = subProduct.sizes.find((p: any) => p.size == cart[i].size);
        if (!sizeData) {
          console.warn(`Size not found: ${cart[i].size} for product: ${cart[i]._id}`);
          continue;
        }
        
        let tempProduct: any = {};
        tempProduct.name = dbProduct.name;
        tempProduct.product = dbProduct._id;
        tempProduct.color = {
          color: cart[i].color?.color || "",
          image: cart[i].color?.image || "",
        };
        tempProduct.image = subProduct.images?.[0]?.url || "";
        tempProduct.qty = Number(cart[i].qty);
        tempProduct.size = cart[i].size;
        tempProduct.vendor = cart[i].vendor ? cart[i].vendor : {};
        tempProduct.vendorId =
          cart[i].vendor && cart[i].vendor._id ? cart[i].vendor._id : "";

        let price = Number(sizeData.price);
        tempProduct.price =
          subProduct.discount > 0
            ? (price - (price * Number(subProduct.discount)) / 100).toFixed(2)
            : price.toFixed(2);
        products.push(tempProduct);
      } catch (productError) {
        console.error(`Error processing product ${cart[i]._id}:`, productError);
        continue; // Skip this product instead of failing entirely
      }
    }
    
    if (products.length === 0) {
      return { success: true, message: "Empty cart saved (no valid products)" };
    }
    
    let cartTotal = 0;
    for (let i = 0; i < products.length; i++) {
      cartTotal = cartTotal + Number(products[i].price) * products[i].qty;
    }
    
    await new Cart({
      products,
      cartTotal: cartTotal.toFixed(2),
      user: user._id,
    }).save();
    
    return { success: true, message: "Cart saved successfully" };
  } catch (error) {
    console.error("Error in saveCartForUser:", error);
    handleError(error);
    return { success: false, message: "Failed to save cart to database" };
  }
}

// Convert database cart format to frontend cart format
export async function convertDbCartToFrontendFormat(dbCart: any): Promise<any[]> {
  try {
    if (!dbCart || !dbCart.products || dbCart.products.length === 0) {
      return [];
    }

    const frontendCartItems: any[] = [];

    for (const dbProduct of dbCart.products) {
      try {
        // Get the full product details from database
        const fullProduct: any = await Product.findById(dbProduct.product).lean();
        
        if (!fullProduct || !fullProduct.subProducts) {
          console.warn(`Product not found or missing subProducts: ${dbProduct.product}`);
          continue;
        }

        // Find the right style based on the stored data
        let subProductIndex = 0;
        let subProduct = fullProduct.subProducts[subProductIndex];
        
        // Try to find the matching subProduct based on color or image
        if (dbProduct.color && dbProduct.color.color) {
          const matchingIndex = fullProduct.subProducts.findIndex((sp: any) => 
            sp.color && sp.color.color === dbProduct.color.color
          );
          if (matchingIndex !== -1) {
            subProductIndex = matchingIndex;
            subProduct = fullProduct.subProducts[matchingIndex];
          }
        }

        if (!subProduct || !subProduct.sizes) {
          console.warn(`SubProduct or sizes not found for product: ${dbProduct.product}`);
          continue;
        }

        // Find the size data
        const sizeData = subProduct.sizes.find((s: any) => s.size === dbProduct.size);
        if (!sizeData) {
          console.warn(`Size ${dbProduct.size} not found for product: ${dbProduct.product}`);
          continue;
        }

        // Create the frontend cart item format
        const frontendItem = {
          _id: fullProduct._id.toString(),
          _uid: `${fullProduct._id}_${subProductIndex}_${dbProduct.size}`,
          name: fullProduct.name,
          price: parseFloat(dbProduct.price),
          qty: parseInt(dbProduct.qty),
          size: dbProduct.size,
          images: subProduct.images || [],
          quantity: sizeData.qty,
          discount: subProduct.discount || 0,
          style: subProductIndex,
          color: dbProduct.color || { color: "", image: "" },
          vendor: dbProduct.vendor || {},
        };

        frontendCartItems.push(frontendItem);
      } catch (itemError) {
        console.error(`Error converting cart item:`, itemError);
        continue;
      }
    }

    return frontendCartItems;
  } catch (error) {
    console.error("Error converting cart format:", error);
    return [];
  }
}

export async function getSavedCartForUser(clerkId: string) {
  try {
    await connectToDatabase();
    
    if (!clerkId) {
      return { success: false, message: "User not authenticated", cartItems: [] };
    }
    
    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return { success: false, message: "User not found", cartItems: [] };
    }
    
    const cart = await Cart.findOne({ user: user._id });
    
    let cartItems: any[] = [];
    if (cart && cart.products) {
      cartItems = await convertDbCartToFrontendFormat(cart);
    }
    
    return {
      success: true,
      user: JSON.parse(JSON.stringify(user)),
      cart: JSON.parse(JSON.stringify(cart)),
      cartItems: cartItems,
      address: JSON.parse(JSON.stringify(user.address || {})),
    };
  } catch (error) {
    console.error("Error in getSavedCartForUser:", error);
    handleError(error);
    return { success: false, message: "Failed to retrieve cart data", cartItems: [] };
  }
}

// update cart for user
export async function updateCartForUser(products: any) {
  try {
    await connectToDatabase();
    const promises = products.map(async (p: any) => {
      let dbProduct: any = await Product.findById(p._id).lean();
      let originalPrice = dbProduct.subProducts[p.style].sizes.find(
        (x: any) => x.size == p.size
      ).price;
      let quantity = dbProduct.subProducts[p.style].sizes.find(
        (x: any) => x.size == p.size
      ).qty;
      let discount = dbProduct.subProducts[p.style].discount;
      return {
        ...p,
        priceBefore: originalPrice,
        price:
          discount > 0
            ? originalPrice - (originalPrice * discount) / 100
            : originalPrice,
        discount,
        quantity,
        shippingFee: dbProduct.shipping,
      };
    });
    const data = await Promise.all(promises);
    return {
      success: true,
      message: "successfully updated the cart.",
      data: JSON.parse(JSON.stringify(data)),
    };
  } catch (error) {
    handleError(error);
  }
}
