import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Blog from "../../../../lib/database/models/blog.model";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectToDatabase();
    
    const { slug } = await params;
    
    const blog = await Blog.findOne({ 
      slug: slug, 
      status: "published" 
    })
    .lean();

    if (!blog) {
      return NextResponse.json(
        {
          success: false,
          message: "Blog not found",
        },
        { status: 404 }
      );
    }

    // Increment view count
    await Blog.findByIdAndUpdate((blog as any)._id, { $inc: { views: 1 } });

    return NextResponse.json({
      success: true,
      blog: JSON.parse(JSON.stringify(blog)),
    });
  } catch (error: any) {
    console.error("Get blog by slug error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch blog",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectToDatabase();
    
    const { action } = await request.json();
    const { slug } = await params;
    
    if (action === "like") {
      const blog = await Blog.findOneAndUpdate(
        { slug: slug, status: "published" },
        { $inc: { likes: 1 } },
        { new: true }
      );

      if (!blog) {
        return NextResponse.json(
          {
            success: false,
            message: "Blog not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        likes: blog.likes,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid action",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Blog action error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to perform action",
      },
      { status: 500 }
    );
  }
} 