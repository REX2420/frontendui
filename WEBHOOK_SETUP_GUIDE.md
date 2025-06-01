# VibeCart Webhook Setup Guide

## Overview
This guide explains how to set up and configure the improved webhook system for VibeCart, including Stripe webhooks and Clerk authentication webhooks.

## Prerequisites

### Required Environment Variables
Create a `.env.local` file in your project root with the following variables:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_WEBHOOK=whsec_...

# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
WEBHOOK_SECRET=whsec_...

# Database Configuration
MONGODB_URI=mongodb://...

# Email Configuration
GOOGLE_APP_PASSWORD=your_app_password

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_APP_URL=https://your-domain.com  # Production
```

## Stripe Webhook Configuration

### 1. Create Stripe Webhook Endpoint

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Enter your webhook URL:
   - **Development**: `https://your-ngrok-url.ngrok.io/api/webhooks/stripe`
   - **Production**: `https://your-domain.com/api/webhooks/stripe`

### 2. Configure Webhook Events

Select the following events to listen for:

#### **Required Events**
- `checkout.session.completed` - Payment completion
- `payment_intent.succeeded` - Successful payment
- `payment_intent.payment_failed` - Failed payment
- `invoice.payment_succeeded` - Subscription payments (if applicable)

#### **Optional Events** (for future enhancements)
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `payment_method.attached`
- `setup_intent.succeeded`

### 3. Get Webhook Secret

1. After creating the webhook, click on it to view details
2. Copy the **Signing secret** (starts with `whsec_`)
3. Add it to your `.env.local` file as `STRIPE_SECRET_WEBHOOK`

### 4. Test Webhook Locally

For local development, use ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js development server
npm run dev

# In another terminal, expose port 3000
ngrok http 3000

# Use the HTTPS URL for your webhook endpoint
```

## Clerk Webhook Configuration

### 1. Create Clerk Webhook

1. Log in to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks**
3. Click **Add Endpoint**
4. Enter your webhook URL:
   - **Development**: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
   - **Production**: `https://your-domain.com/api/webhooks/clerk`

### 2. Configure Clerk Events

Select the following events:
- `user.created` - New user registration
- `user.updated` - User profile updates
- `user.deleted` - User account deletion

### 3. Get Clerk Webhook Secret

1. After creating the webhook, copy the **Signing Secret**
2. Add it to your `.env.local` file as `WEBHOOK_SECRET`

## Database Setup

### 1. MongoDB Configuration

Ensure your MongoDB database is set up with the following collections:
- `users` - User profiles and addresses
- `orders` - Order information and status
- `products` - Product catalog
- `carts` - User cart data

### 2. Database Indexes

Create the following indexes for optimal performance:

```javascript
// Orders collection
db.orders.createIndex({ "user": 1 })
db.orders.createIndex({ "createdAt": -1 })
db.orders.createIndex({ "isPaid": 1 })
db.orders.createIndex({ "paymentResult.id": 1 })

// Users collection
db.users.createIndex({ "clerkId": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
```

## Email Configuration

### 1. Gmail App Password Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Add the app password to your `.env.local` file as `GOOGLE_APP_PASSWORD`

### 2. Email Templates

The system uses React Email templates located in `/lib/emails/`. Customize these templates as needed for your brand.

## Testing the Webhook System

### 1. Test Stripe Webhooks

Use Stripe CLI to test webhooks locally:

```bash
# Install Stripe CLI
# Follow instructions at https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward events to your local webhook endpoint
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

### 2. Test Order Flow

1. **Create Test Order**:
   ```bash
   # Add products to cart
   # Proceed to checkout
   # Complete payment with test card: 4242 4242 4242 4242
   ```

2. **Verify Webhook Processing**:
   - Check server logs for webhook events
   - Verify order status updates in database
   - Confirm email notifications are sent

3. **Test Payment Failures**:
   ```bash
   # Use test card that triggers failure: 4000 0000 0000 0002
   # Verify cart restoration
   # Check error handling
   ```

## Monitoring and Debugging

### 1. Webhook Logs

Monitor webhook processing in your application logs:

```bash
# View webhook processing logs
tail -f logs/webhook.log

# Check for errors
grep "ERROR" logs/webhook.log
```

### 2. Stripe Dashboard

Monitor webhook delivery in Stripe Dashboard:
- Go to **Developers** → **Webhooks**
- Click on your webhook endpoint
- View **Recent deliveries** for success/failure status

### 3. Database Monitoring

Monitor order status changes:

```javascript
// Check recent orders
db.orders.find().sort({ createdAt: -1 }).limit(10)

// Check payment status
db.orders.find({ isPaid: false })

// Check webhook processing
db.orders.find({ "paymentResult.id": { $exists: true } })
```

## Production Deployment

### 1. Environment Variables

Set production environment variables in your hosting platform:

```env
# Stripe Production Keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_WEBHOOK=whsec_...

# Production URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Webhook URLs

Update webhook URLs in both Stripe and Clerk dashboards to use your production domain.

### 3. SSL Certificate

Ensure your production domain has a valid SSL certificate for webhook security.

### 4. Rate Limiting

Consider implementing rate limiting for webhook endpoints:

```typescript
// Example rate limiting middleware
import rateLimit from 'express-rate-limit'

const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
```

## Security Best Practices

### 1. Webhook Signature Verification

Always verify webhook signatures:

```typescript
// Stripe signature verification
const signature = headers.get("Stripe-Signature");
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

// Clerk signature verification
const evt = wh.verify(body, headers) as WebhookEvent;
```

### 2. Idempotency

Implement idempotency to handle duplicate webhook deliveries:

```typescript
// Check if order is already processed
if (order.isPaid) {
  console.log(`Order ${order._id} already marked as paid`);
  return;
}
```

### 3. Error Handling

Implement proper error handling and logging:

```typescript
try {
  // Process webhook
} catch (error) {
  console.error("Webhook processing error:", error);
  // Return appropriate HTTP status
  return new Response("Internal Server Error", { status: 500 });
}
```

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**:
   - Check webhook URL is correct
   - Verify SSL certificate is valid
   - Check firewall settings

2. **Signature Verification Fails**:
   - Verify webhook secret is correct
   - Check for extra characters in environment variables
   - Ensure raw body is used for verification

3. **Database Connection Issues**:
   - Verify MongoDB connection string
   - Check database permissions
   - Monitor connection pool

4. **Email Delivery Issues**:
   - Verify Gmail app password
   - Check spam folders
   - Monitor email service logs

### Debug Commands

```bash
# Test webhook endpoint
curl -X POST https://your-domain.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Check environment variables
echo $STRIPE_SECRET_WEBHOOK

# Test database connection
mongosh $MONGODB_URI --eval "db.runCommand('ping')"
```

## Support and Resources

- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [Clerk Webhook Documentation](https://clerk.com/docs/integrations/webhooks)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [MongoDB Documentation](https://docs.mongodb.com/)

For additional support, check the project's GitHub issues or contact the development team. 