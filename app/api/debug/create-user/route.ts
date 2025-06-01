import { createUser } from "@/lib/database/actions/user.actions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Debug endpoint not available in production" }, { status: 403 });
  }

  try {
    const { clerkId, email, image, username } = await req.json();

    console.log("🧪 Debug: Creating user with data:", { clerkId, email, image, username });

    const userData = {
      clerkId: clerkId || `debug_${Date.now()}`,
      email: email || "debug@example.com",
      image: image || "",
      username: username || "",
    };

    const result = await createUser(userData);

    return NextResponse.json({
      success: true,
      message: "Debug user creation completed",
      result
    });

  } catch (error) {
    console.error("❌ Debug user creation error:", error);
    return NextResponse.json({
      success: false,
      message: "Debug user creation failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Debug endpoint not available in production" }, { status: 403 });
  }

  return NextResponse.json({
    message: "Debug endpoint for creating users",
    usage: "POST with { clerkId, email, image?, username? }",
    example: {
      clerkId: "user_debug_123",
      email: "test@example.com",
      image: "https://example.com/avatar.jpg",
      username: "testuser"
    }
  });
} 