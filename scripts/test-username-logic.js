// Test the username generation logic directly
function generateUsername(username, firstName, lastName, email, clerkId) {
  // If username is provided by Clerk, use it
  if (username && username.trim().length > 0) {
    console.log("🔤 Using provided username:", username);
    return username.trim();
  }

  // For Google logins, create username from first_name + last_name
  if (firstName || lastName) {
    const firstPart = firstName ? firstName.trim().toLowerCase() : '';
    const lastPart = lastName ? lastName.trim().toLowerCase() : '';
    
    if (firstPart && lastPart) {
      const fullName = `${firstPart}.${lastPart}`;
      console.log("🔤 Generated username from full name:", fullName);
      return fullName;
    } else if (firstPart) {
      const nameWithId = `${firstPart}.${clerkId.slice(-4)}`;
      console.log("🔤 Generated username from first name:", nameWithId);
      return nameWithId;
    } else if (lastPart) {
      const nameWithId = `${lastPart}.${clerkId.slice(-4)}`;
      console.log("🔤 Generated username from last name:", nameWithId);
      return nameWithId;
    }
  }

  // Fallback: use email prefix + clerk ID suffix
  const emailPrefix = email.split('@')[0].toLowerCase();
  const cleanEmailPrefix = emailPrefix.replace(/[^a-z0-9]/g, ''); // Remove special chars
  const fallbackUsername = `${cleanEmailPrefix}.${clerkId.slice(-4)}`;
  console.log("🔤 Generated fallback username from email:", fallbackUsername);
  return fallbackUsername;
}

// Test cases
const testCases = [
  {
    name: "Full name Google login",
    username: null,
    firstName: "John",
    lastName: "Smith", 
    email: "john.smith@gmail.com",
    clerkId: "user_google_123456789",
    expected: "john.smith"
  },
  {
    name: "First name only Google login",
    username: null,
    firstName: "Jane",
    lastName: null,
    email: "jane.doe123@gmail.com", 
    clerkId: "user_google_987654321",
    expectedPattern: /jane\.\w{4}/
  },
  {
    name: "No name Google login (email only)",
    username: null,
    firstName: null,
    lastName: null,
    email: "cooluser99@gmail.com",
    clerkId: "user_google_555666777",
    expectedPattern: /cooluser99\.\w{4}/
  },
  {
    name: "Complex email Google login",
    username: null,
    firstName: "Test",
    lastName: "User",
    email: "test.user+shopping@gmail.com",
    clerkId: "user_google_111222333",
    expected: "test.user"
  },
  {
    name: "Email with special characters",
    username: null,
    firstName: null,
    lastName: null,
    email: "user.name+tag@example.com",
    clerkId: "user_test_888999000",
    expectedPattern: /username\.\w{4}/
  },
  {
    name: "Existing username provided",
    username: "existinguser123",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@gmail.com", 
    clerkId: "user_existing_123",
    expected: "existinguser123"
  }
];

console.log('🧪 Testing Username Generation Logic\n');

testCases.forEach((testCase, index) => {
  console.log(`\n📧 Test ${index + 1}: ${testCase.name}`);
  console.log(`📦 Email: ${testCase.email}`);
  console.log(`👤 Name: ${testCase.firstName || 'null'} ${testCase.lastName || 'null'}`);
  console.log(`🆔 Username provided: ${testCase.username || 'null'}`);
  
  const result = generateUsername(
    testCase.username,
    testCase.firstName, 
    testCase.lastName,
    testCase.email,
    testCase.clerkId
  );
  
  console.log(`🔤 Generated Username: ${result}`);
  
  if (testCase.expected) {
    const match = result === testCase.expected;
    console.log(`✅ Expected: ${testCase.expected} | ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
  } else if (testCase.expectedPattern) {
    const match = testCase.expectedPattern.test(result);
    console.log(`✅ Pattern: ${testCase.expectedPattern} | ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
  }
  
  console.log('─'.repeat(50));
});

console.log('\n🎉 Username Generation Testing Completed!'); 