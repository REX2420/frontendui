# VibeCart Payment Setup Guide

## Overview
This guide explains the payment system configuration for VibeCart, which now supports Cash on Delivery (COD) payments.

## Prerequisites

### Required Environment Variables
Create a `.env.local` file in your project root with the following variables:

```env
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

## Payment Method: Cash on Delivery (COD)

### Implementation Details
VibeCart now supports only Cash on Delivery (COD) payments, which provides:

- **Immediate Order Creation**: Orders are created instantly without payment gateway processing
- **Email Confirmation**: Automatic order confirmation emails sent to customers
- **Order Tracking**: Full order status tracking system
- **Simple Checkout**: Streamlined checkout process for customers

### COD Order Flow
1. **Cart Management**: Users add products to cart
2. **Address Entry**: Customers provide delivery address
3. **Coupon Application**: Optional discount coupons can be applied
4. **Order Placement**: Order is created immediately upon confirmation
5. **Email Notification**: Confirmation email sent to customer
6. **Order Tracking**: Real-time order status updates

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

## Testing the Order System

### 1. Test COD Order Flow

1. **Create Test Order**:
   - Add products to cart
   - Fill in delivery address
   - Apply coupon (optional)
   - Place order with COD

2. **Verify Order Processing**:
   - Check order creation in database
   - Verify email notification is sent
   - Confirm order status tracking works

## Monitoring and Debugging

### 1. Order Logs

Monitor order processing in your application logs:

```bash
# View order processing logs
tail -f logs/order.log

# Check for errors
grep "ERROR" logs/order.log
```

### 2. Database Monitoring

Monitor order creation and status:

```javascript
// Check recent orders
db.orders.find().sort({ createdAt: -1 }).limit(10)

// Check order status
db.orders.find({ paymentMethod: "cod" })

// Check email confirmations
db.orders.find({ createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) } })
```

## Production Deployment

### 1. Environment Variables

Set production environment variables in your hosting platform:

```env
# Production URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database
MONGODB_URI=mongodb+srv://...

# Email
GOOGLE_APP_PASSWORD=your_production_app_password
```

### 2. SSL Certificate

Ensure your production domain has a valid SSL certificate for secure communications.

## Security Best Practices

### 1. Data Validation

Always validate order data:

```typescript
// Validate order data before creation
const validateOrderData = (orderData) => {
  // Check required fields
  // Validate product data
  // Verify user information
  // Confirm address details
}
```

### 2. Error Handling

Implement proper error handling and logging:

```typescript
try {
  // Process order
} catch (error) {
  console.error("Order processing error:", error);
  // Return appropriate error response
  return { success: false, message: "Failed to create order" };
}
```

## Troubleshooting

### Common Issues

1. **Email Delivery Issues**:
   - Verify Gmail app password
   - Check spam folders
   - Monitor email service logs

2. **Database Connection Issues**:
   - Verify MongoDB connection string
   - Check database permissions
   - Monitor connection pool

3. **Order Creation Failures**:
   - Check required order fields
   - Verify user authentication
   - Validate product data

### Debug Commands

```bash
# Test email configuration
node -e "
const nodemailer = require('nodemailer');
const config = {
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: process.env.GOOGLE_APP_PASSWORD
  }
};
const transporter = nodemailer.createTransport(config);
transporter.verify((error, success) => {
  console.log(error ? 'Email config error:' + error : 'Email config OK');
});
"

# Test database connection
mongosh $MONGODB_URI --eval "db.runCommand('ping')"
```

## Support and Resources

- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Clerk Documentation](https://clerk.com/docs)

For additional support, check the project's documentation or contact the development team. 