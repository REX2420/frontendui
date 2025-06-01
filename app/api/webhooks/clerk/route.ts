import {
  createUser,
  updateUser,
  deleteUser,
} from "@/lib/database/actions/user.actions";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

export async function POST(req: Request) {
  console.log("🔄 Clerk webhook received");
  
  // Check for webhook secret in multiple possible env vars
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 
                        process.env.CLERK_WEBHOOK_SECRET ||
                        process.env.CLERK_SECRET_WEBHOOK;

  if (!WEBHOOK_SECRET) {
    console.error("❌ Missing webhook secret. Checked: WEBHOOK_SECRET, CLERK_WEBHOOK_SECRET, CLERK_SECRET_WEBHOOK");
    return NextResponse.json({ 
      error: "Webhook secret not configured" 
    }, { status: 500 });
  }

  try {
    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    console.log("📝 Webhook headers:", {
      svix_id: svix_id ? "present" : "missing",
      svix_timestamp: svix_timestamp ? "present" : "missing", 
      svix_signature: svix_signature ? "present" : "missing"
    });

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("❌ Missing svix headers");
      return NextResponse.json({ 
        error: "Missing required webhook headers" 
      }, { status: 400 });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    console.log("📦 Webhook payload type:", payload.type);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err);
      return NextResponse.json({ 
        error: "Webhook signature verification failed" 
      }, { status: 400 });
    }

    console.log("✅ Webhook verified successfully");

    // Get the ID and type
    const eventType = evt.type;
    console.log(`🎯 Processing event: ${eventType}`);

    // CREATE USER
    if (eventType === "user.created") {
      try {
        const { id, email_addresses, image_url, username, first_name, last_name } = evt.data;

        console.log("👤 Creating user with data:", {
          id,
          email: email_addresses?.[0]?.email_address,
          image_url: image_url || "no image",
          username: username || "no username",
          first_name: first_name || "no first name",
          last_name: last_name || "no last name"
        });

        // Validate required data
        if (!id || !email_addresses?.[0]?.email_address) {
          console.error("❌ Missing required user data");
          return NextResponse.json({ 
            error: "Missing required user data" 
          }, { status: 400 });
        }

        // Smart username generation for Google logins
        function generateUsername(username: string | null, firstName: string | null, lastName: string | null, email: string, clerkId: string): string {
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

        const userData = {
          clerkId: id,
          email: email_addresses[0].email_address,
          image: image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(first_name || last_name || email_addresses[0].email_address)}&background=000000&color=fff`,
          username: generateUsername(username, first_name, last_name, email_addresses[0].email_address, id),
        };

        console.log("💾 Attempting to create user in database...");
        const result = await createUser(userData);

        if (result?.success === false) {
          console.error("❌ Failed to create user:", result.message);
          return NextResponse.json({ 
            error: result.message || "Failed to create user" 
          }, { status: 500 });
        }

        console.log("✅ User created successfully:", result?._id);
        return NextResponse.json({ 
          message: "User created successfully", 
          user: result, 
          success: true 
        });

      } catch (error) {
        console.error("❌ Error in user.created handler:", error);
        return NextResponse.json({ 
          error: "Failed to process user creation" 
        }, { status: 500 });
      }
    }

    // UPDATE USER
    if (eventType === "user.updated") {
      try {
        const { id, image_url, username, first_name, last_name } = evt.data;

        console.log("🔄 Updating user:", id);

        const updateData: any = {};
        
        if (image_url) updateData.image = image_url;
        if (username) updateData.username = username;
        
        // Improved username generation for updates too
        if (!username && (first_name || last_name)) {
          const firstPart = first_name ? first_name.trim().toLowerCase() : '';
          const lastPart = last_name ? last_name.trim().toLowerCase() : '';
          
          if (firstPart && lastPart) {
            updateData.username = `${firstPart}.${lastPart}`;
          } else if (firstPart) {
            updateData.username = `${firstPart}.${id.slice(-4)}`;
          } else if (lastPart) {
            updateData.username = `${lastPart}.${id.slice(-4)}`;
          }
          
          console.log("🔄 Generated updated username:", updateData.username);
        }

        if (Object.keys(updateData).length === 0) {
          console.log("ℹ️ No fields to update");
          return NextResponse.json({ 
            message: "No fields to update", 
            success: true 
          });
        }

        console.log("💾 Updating user with data:", updateData);
        const result = await updateUser(id, updateData);

        if (result?.success === false) {
          console.error("❌ Failed to update user:", result.message);
          return NextResponse.json({ 
            error: result.message || "Failed to update user" 
          }, { status: 500 });
        }

        console.log("✅ User updated successfully");
        return NextResponse.json({
          message: "User updated successfully",
          user: result,
          success: true,
        });

      } catch (error) {
        console.error("❌ Error in user.updated handler:", error);
        return NextResponse.json({ 
          error: "Failed to process user update" 
        }, { status: 500 });
      }
    }

    // DELETE USER
    if (eventType === "user.deleted") {
      try {
        const { id } = evt.data;

        console.log("🗑️ Deleting user:", id);

        if (!id) {
          console.error("❌ Missing user ID for deletion");
          return NextResponse.json({ 
            error: "Missing user ID" 
          }, { status: 400 });
        }

        const result = await deleteUser(id);

        if (result?.success === false) {
          console.error("❌ Failed to delete user:", result.message);
          return NextResponse.json({ 
            error: result.message || "Failed to delete user" 
          }, { status: 500 });
        }

        console.log("✅ User deleted successfully");
        return NextResponse.json({
          message: "User deleted successfully",
          user: result,
          success: true,
        });

      } catch (error) {
        console.error("❌ Error in user.deleted handler:", error);
        return NextResponse.json({ 
          error: "Failed to process user deletion" 
        }, { status: 500 });
      }
    }

    // Handle other events
    console.log(`ℹ️ Unhandled event type: ${eventType}`);
    return NextResponse.json({ 
      message: `Event ${eventType} received but not handled` 
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Unexpected error in webhook:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
