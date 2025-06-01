import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import User from "@/lib/database/models/user.model";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import EmailTemplate from "@/lib/emails/index";

export async function POST(req: Request) {
  if (req.method !== "POST") {
    return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
  }

  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  if (!signature) {
    console.error("Missing Stripe signature");
    return new Response("Missing Stripe signature", { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_SECRET_WEBHOOK as string
    );
  } catch (error: unknown) {
    console.error("Webhook signature verification failed:", error);
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  console.log(`Received Stripe webhook: ${event.type}`);

  try {
    await connectToDatabase();

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;
      
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        // Handle subscription events if needed
        console.log(`Subscription event: ${event.type}`);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  console.log("Processing checkout.session.completed:", session.id);
  
  if (!session.metadata?.orderId) {
    console.error("No orderId in session metadata");
    return;
  }

  try {
    const order = await Order.findById(session.metadata.orderId).populate('user');
    
    if (!order) {
      console.error(`Order not found: ${session.metadata.orderId}`);
      return;
    }

    if (order.isPaid) {
      console.log(`Order ${order._id} already marked as paid`);
      return;
    }

    // Update order status
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = {
      id: session.payment_intent,
      status: session.payment_status,
      email: session.customer_email
    };

    await order.save();

    // Send confirmation email
    await sendOrderConfirmationEmail(order);

    // Update inventory (if needed)
    await updateInventory(order.products);

    console.log(`Order ${order._id} successfully processed`);

  } catch (error) {
    console.error("Error handling checkout session completed:", error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log("Processing payment_intent.succeeded:", paymentIntent.id);
  
  // Additional logic for successful payments
  // This can be used for logging, analytics, etc.
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log("Processing payment_intent.payment_failed:", paymentIntent.id);
  
  // Handle failed payments
  // You might want to notify the user or update order status
  try {
    // Find order by payment intent ID if stored
    const order = await Order.findOne({ 
      'paymentResult.id': paymentIntent.id 
    }).populate('user');

    if (order && !order.isPaid) {
      // Send payment failure notification
      await sendPaymentFailureEmail(order, paymentIntent.last_payment_error?.message);
    }
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log("Processing invoice.payment_succeeded:", invoice.id);
  // Handle subscription payments if applicable
}

async function sendOrderConfirmationEmail(order: any) {
  try {
    const config = {
      service: "gmail",
      auth: {
        user: "raghunadhwinwin@gmail.com",
        pass: process.env.GOOGLE_APP_PASSWORD as string,
      },
    };

    const transporter = nodemailer.createTransport(config);
    
    const emailHtml = await render(EmailTemplate(order));
    
    const mailOptions = {
      from: config.auth.user,
      to: order.user.email,
      subject: "Order Confirmation - VibeCart",
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${order.user.email}`);
    
  } catch (error) {
    console.error("Error sending confirmation email:", error);
  }
}

async function sendPaymentFailureEmail(order: any, errorMessage: string) {
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
      subject: "Payment Failed - VibeCart",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Payment Failed</h2>
          <p>Dear ${order.user.username || 'Customer'},</p>
          <p>We were unable to process your payment for order #${order._id}.</p>
          <p><strong>Error:</strong> ${errorMessage || 'Payment processing failed'}</p>
          <p>Please try again or contact our support team.</p>
          <a href="${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://vibecart-alpha.vercel.app'}/checkout" 
             style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Retry Payment
          </a>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Payment failure email sent to ${order.user.email}`);
    
  } catch (error) {
    console.error("Error sending payment failure email:", error);
  }
}

async function updateInventory(products: any[]) {
  // This function would update product inventory
  // Implementation depends on your product model structure
  console.log("Updating inventory for products:", products.length);
  
  // Example implementation:
  // for (const item of products) {
  //   await Product.findByIdAndUpdate(item.product, {
  //     $inc: { stock: -item.qty }
  //   });
  // }
}
