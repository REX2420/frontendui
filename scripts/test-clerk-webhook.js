const fetch = require('node-fetch');

// Test the Clerk webhook endpoint
async function testClerkWebhook() {
  const webhookUrl = process.env.NODE_ENV === 'production' 
    ? 'https://vibecart-alpha.vercel.app/api/webhooks/clerk'
    : 'http://localhost:3000/api/webhooks/clerk';

  // Test user creation payload (mimicking Clerk's format)
  const testPayload = {
    type: "user.created",
    data: {
      id: "user_test_123456789",
      email_addresses: [
        {
          email_address: "test@example.com"
        }
      ],
      image_url: "https://example.com/avatar.jpg",
      username: "testuser",
      first_name: "Test",
      last_name: "User"
    }
  };

  try {
    console.log('🧪 Testing Clerk webhook...');
    console.log('📡 Webhook URL:', webhookUrl);
    console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, these headers would be set by Clerk
        'svix-id': 'test-id',
        'svix-timestamp': Date.now().toString(),
        'svix-signature': 'test-signature'
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.text();
    
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Body:', result);

    if (response.status === 200) {
      console.log('✅ Webhook test completed successfully!');
    } else {
      console.log('❌ Webhook test failed');
    }

  } catch (error) {
    console.error('❌ Error testing webhook:', error);
  }
}

// Check environment setup
function checkEnvironment() {
  console.log('🔍 Checking environment setup...');
  
  const requiredVars = [
    'WEBHOOK_SECRET',
    'CLERK_WEBHOOK_SECRET',
    'MONGODB_URI'
  ];

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`${varName}: ${value ? '✅ Set' : '❌ Not set'}`);
  });
}

// Run tests
if (require.main === module) {
  console.log('🔧 Clerk Webhook Test Suite\n');
  checkEnvironment();
  console.log('\n');
  testClerkWebhook();
}

module.exports = { testClerkWebhook, checkEnvironment }; 