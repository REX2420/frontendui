import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import User from "@/lib/database/models/user.model";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import nodemailer from "nodemailer";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    await connectToDatabase();
    
    const order = await Order.findById(orderId)
      .populate({ path: "user", model: User })
      .lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if user owns this order
    if ((order as any).user._id.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      order: {
        _id: (order as any)._id,
        status: getOrderStatus(order as any),
        isPaid: (order as any).isPaid,
        paidAt: (order as any).paidAt,
        deliveredAt: (order as any).deliveredAt,
        products: (order as any).products.map((product: any) => ({
          ...product,
          statusHistory: getProductStatusHistory(product)
        })),
        createdAt: (order as any).createdAt,
        updatedAt: (order as any).updatedAt
      }
    });

  } catch (error) {
    console.error("Error fetching order status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, productId, status, adminUpdate = false } = await req.json();

    if (!orderId || !productId || !status) {
      return NextResponse.json({ 
        error: "Order ID, Product ID, and status are required" 
      }, { status: 400 });
    }

    await connectToDatabase();
    
    const order = await Order.findById(orderId).populate('user');

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check authorization
    if (!adminUpdate && (order as any).user._id.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update product status
    const productIndex = (order as any).products.findIndex(
      (p: any) => p._id.toString() === productId
    );

    if (productIndex === -1) {
      return NextResponse.json({ error: "Product not found in order" }, { status: 404 });
    }

    const oldStatus = (order as any).products[productIndex].status;
    (order as any).products[productIndex].status = status;

    if (status === "Completed") {
      (order as any).products[productIndex].productCompletedAt = new Date();
    }

    await order.save();

    // Send status update email
    await sendStatusUpdateEmail(order as any, (order as any).products[productIndex], oldStatus, status);

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      order: {
        _id: (order as any)._id,
        status: getOrderStatus(order as any),
        products: (order as any).products
      }
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getOrderStatus(order: any) {
  if (!order.isPaid) {
    return "Payment Pending";
  }

  const allCompleted = order.products.every((p: any) => p.status === "Completed");
  const anyInProgress = order.products.some((p: any) => 
    p.status === "Processing" || p.status === "Shipped"
  );

  if (allCompleted) {
    return "Delivered";
  } else if (anyInProgress) {
    return "In Progress";
  } else {
    return "Confirmed";
  }
}

function getProductStatusHistory(product: any) {
  const history = [
    { status: "Not Processed", date: product.createdAt || new Date() }
  ];

  if (product.status !== "Not Processed") {
    history.push({ status: product.status, date: new Date() });
  }

  if (product.productCompletedAt) {
    history.push({ status: "Completed", date: product.productCompletedAt });
  }

  return history;
}

async function sendStatusUpdateEmail(order: any, product: any, oldStatus: string, newStatus: string) {
  try {
    const config = {
      service: "gmail",
      auth: {
        user: "raghunadhwinwin@gmail.com",
        pass: process.env.GOOGLE_APP_PASSWORD as string,
      },
    };

    const transporter = nodemailer.createTransport(config);
    
    const mailOptions = {
      from: config.auth.user,
      to: order.user.email,
      subject: `Order Update - ${product.name} - VibeCart`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Status Update</h2>
          <p>Dear ${order.user.username || 'Customer'},</p>
          <p>Your order #${order._id} has been updated.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>${product.name}</h3>
            <p><strong>Status changed from:</strong> ${oldStatus}</p>
            <p><strong>Status changed to:</strong> ${newStatus}</p>
            <p><strong>Size:</strong> ${product.size}</p>
            <p><strong>Quantity:</strong> ${product.qty}</p>
          </div>
          
          <p>You can track your order status at any time by visiting:</p>
          <a href="${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://vibecart-alpha.vercel.app'}/order/${order._id}" 
             style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Track Order
          </a>
          
          <p style="margin-top: 20px;">Thank you for shopping with VibeCart!</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Status update email sent to ${order.user.email}`);
    
  } catch (error) {
    console.error("Error sending status update email:", error);
  }
} 