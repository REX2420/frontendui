const fetch = require('node-fetch');

// Test Google login scenarios
async function testGoogleLoginUsername() {
  const webhookUrl = process.env.NODE_ENV === 'production' 
    ? 'https://vibecart-alpha.vercel.app/api/webhooks/clerk'
    : 'http://localhost:3000/api/webhooks/clerk';

  // Test cases for different Google login scenarios
  const googleLoginTestCases = [
    {
      name: "Full name Google login",
      payload: {
        type: "user.created",
        data: {
          id: "user_google_123456789",
          email_addresses: [{ email_address: "john.smith@gmail.com" }],
          image_url: "https://lh3.googleusercontent.com/a/example",
          username: null, // Google logins often don't have username
          first_name: "John",
          last_name: "Smith"
        }
      },
      expectedUsername: "john.smith"
    },
    {
      name: "First name only Google login",
      payload: {
        type: "user.created",
        data: {
          id: "user_google_987654321",
          email_addresses: [{ email_address: "jane.doe123@gmail.com" }],
          image_url: "https://lh3.googleusercontent.com/a/example2",
          username: null,
          first_name: "Jane",
          last_name: null
        }
      },
      expectedUsernamePattern: "jane.\\d{4}"
    },
    {
      name: "No name Google login (email only)",
      payload: {
        type: "user.created",
        data: {
          id: "user_google_555666777",
          email_addresses: [{ email_address: "cooluser99@gmail.com" }],
          image_url: "https://lh3.googleusercontent.com/a/example3",
          username: null,
          first_name: null,
          last_name: null
        }
      },
      expectedUsernamePattern: "cooluser\\d{2}\\.\\d{4}"
    },
    {
      name: "Complex email Google login",
      payload: {
        type: "user.created",
        data: {
          id: "user_google_111222333",
          email_addresses: [{ email_address: "test.user+shopping@gmail.com" }],
          image_url: "https://lh3.googleusercontent.com/a/example4",
          username: null,
          first_name: "Test",
          last_name: "User"
        }
      },
      expectedUsername: "test.user"
    }
  ];

  console.log('🧪 Testing Google Login Username Generation...\n');

  for (const testCase of googleLoginTestCases) {
    console.log(`📧 Testing: ${testCase.name}`);
    console.log(`📦 Email: ${testCase.payload.data.email_addresses[0].email_address}`);
    console.log(`👤 Name: ${testCase.payload.data.first_name || 'null'} ${testCase.payload.data.last_name || 'null'}`);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'svix-id': `test-google-${Date.now()}`,
          'svix-timestamp': Date.now().toString(),
          'svix-signature': 'test-signature'
        },
        body: JSON.stringify(testCase.payload)
      });

      const result = await response.text();
      
      console.log(`📊 Status: ${response.status}`);
      
      if (response.status === 200) {
        try {
          const jsonResult = JSON.parse(result);
          const generatedUsername = jsonResult.user?.username || 'not found';
          console.log(`🔤 Generated Username: ${generatedUsername}`);
          
          if (testCase.expectedUsername) {
            const match = generatedUsername === testCase.expectedUsername;
            console.log(`✅ Expected: ${testCase.expectedUsername} | ${match ? 'MATCH' : 'NO MATCH'}`);
          } else if (testCase.expectedUsernamePattern) {
            const regex = new RegExp(testCase.expectedUsernamePattern);
            const match = regex.test(generatedUsername);
            console.log(`✅ Pattern: ${testCase.expectedUsernamePattern} | ${match ? 'MATCH' : 'NO MATCH'}`);
          }
        } catch (parseError) {
          console.log(`📄 Response: ${result}`);
        }
      } else {
        console.log(`❌ Failed: ${result}`);
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    console.log('─'.repeat(50));
  }
}

// Test direct database user creation
async function testDirectUserCreation() {
  const debugUrl = process.env.NODE_ENV === 'production' 
    ? null // Don't test in production
    : 'http://localhost:3000/api/debug/create-user';

  if (!debugUrl) {
    console.log('⚠️ Skipping direct test in production');
    return;
  }

  console.log('\n🔧 Testing Direct User Creation...');

  const directTestCases = [
    {
      clerkId: "user_direct_test_1",
      email: "sarah.johnson@gmail.com",
      expectedUsernamePattern: "sarahjohnson\\.\\w{4}"
    },
    {
      clerkId: "user_direct_test_2", 
      email: "mike123@example.com",
      expectedUsernamePattern: "mike\\.\\w{4}"
    }
  ];

  for (const testCase of directTestCases) {
    try {
      console.log(`📧 Testing direct creation: ${testCase.email}`);
      
      const response = await fetch(debugUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase)
      });

      const result = await response.json();
      
      if (result.success) {
        const username = result.result?.username || result.result?.user?.username;
        console.log(`🔤 Generated Username: ${username}`);
        
        const regex = new RegExp(testCase.expectedUsernamePattern);
        const match = regex.test(username);
        console.log(`✅ Pattern: ${testCase.expectedUsernamePattern} | ${match ? 'MATCH' : 'NO MATCH'}`);
      } else {
        console.log(`❌ Failed: ${result.message}`);
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Google Login Username Test Suite\n');
  
  await testGoogleLoginUsername();
  await testDirectUserCreation();
  
  console.log('\n🎉 Testing completed!');
}

if (require.main === module) {
  runAllTests();
}

module.exports = { testGoogleLoginUsername, testDirectUserCreation }; 