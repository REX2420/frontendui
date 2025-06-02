"use server";

import { connectToDatabase } from "../connect";
import Order from "../models/order.model";
import User from "../models/user.model";
import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import EmailTemplate from "@/lib/emails/index";
import { handleError } from "@/lib/utils";
import mongoose from "mongoose";
import { unstable_cache } from "next/cache";
const { ObjectId } = mongoose.Types;

// create an order
export async function createOrder(
  products: {
    product: string;
    name: string;
    image: string;
    size: string;
    qty: number;
    color: { color: string; image: string };
    price: number;
    status: string;
    productCompletedAt: Date | null;
    _id: string;
  }[],
  shippingAddress: any,
  paymentMethod: string,
  total: number,
  totalBeforeDiscount: number,
  couponApplied: string,
  userId: string,
  totalSaved: number
) {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) {
      return {
        message: "User not found with provided ID!",
        success: false,
        orderId: null,
      };
    }
    const newOrder = await new Order({
      user: user._id,
      products,
      shippingAddress,
      paymentMethod,
      total,
      totalBeforeDiscount,
      couponApplied,
      totalSaved,
      // For COD, mark as not paid initially
      isPaid: false,
    }).save();
    
    // Email sending is optional - don't block order creation if email fails
    try {
      // Only attempt to send email if credentials are available
      if (process.env.GOOGLE_APP_PASSWORD) {
        let config = {
          service: "gmail",
          auth: {
            user: "raghunadhwinwin@gmail.com",
            pass: process.env.GOOGLE_APP_PASSWORD as string,
          },
        };
        let transporter = nodemailer.createTransport(config);
        let dataConfig = {
          from: config.auth.user,
          to: user.email,
          subject: "Order Confirmation - VibeCart",
          html: await render(EmailTemplate(newOrder)),
        };
        await transporter.sendMail(dataConfig);
        console.log("Order confirmation email sent successfully");
      } else {
        console.warn("GOOGLE_APP_PASSWORD not configured - skipping email notification");
      }
    } catch (emailError) {
      // Log email error but don't fail the order
      console.error("Failed to send order confirmation email:", emailError);
    }
    
    return {
      message: "Successfully placed Order.",
      orderId: JSON.parse(JSON.stringify(newOrder._id)),
      success: true,
    };
  } catch (error) {
    handleError(error);
    return {
      message: "Failed to create order",
      success: false,
      orderId: null,
    };
  }
}

// get all the orders for a specific user
export async function getAllUserOrders(userId: string) {
  try {
    await connectToDatabase();
    const userOrders = await Order.find({ user: userId })
      .populate("user")
      .sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(userOrders));
  } catch (error) {
    handleError(error);
    return [];
  }
}

// get an order by its id
export const getOrderById = unstable_cache(
  async (orderId: string) => {
    try {
      await connectToDatabase();
      const orderData = await Order.findById(orderId).populate("user");
      return { orderData: JSON.parse(JSON.stringify(orderData)) };
    } catch (error) {
      handleError(error);
      return null;
    }
  },
  ["order-by-id"],
  {
    tags: ["order"],
    revalidate: 300, // 5 minutes
  }
);
