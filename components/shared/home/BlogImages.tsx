"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight, Eye, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Blog {
  _id: string;
  title: string;
  excerpt: string;
  featuredImage: {
    url: string;
    public_id: string;
  };
  category: string;
  authorName: string;
  publishedAt: string;
  views: number;
  likes: number;
  featured: boolean;
  slug: string;
}

// Real API function to fetch published blogs
const getPublishedBlogs = async () => {
  try {
    const response = await fetch('/api/blogs?limit=6');
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        blogs: data.blogs
      };
    } else {
      return {
        success: false,
        blogs: []
      };
    }
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return {
      success: false,
      blogs: []
    };
  }
};

const BlogSection = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await getPublishedBlogs();
      if (response.success) {
        setBlogs(response.blogs);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Fragrance Tips": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "Product Reviews": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "Lifestyle": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      "Beauty": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      "Fashion": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      "Health & Wellness": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    };
    return colors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="heading uppercase mb-4">Latest From Our Blog</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover expert fragrance tips, in-depth product reviews, and lifestyle content 
            to help you find your perfect scent and enhance your fragrance journey.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  // If no blogs are available, show a message encouraging vendors to create content
  if (blogs.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="heading uppercase mb-4">Latest From Our Blog</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover expert fragrance tips, in-depth product reviews, and lifestyle content 
            to help you find your perfect scent and enhance your fragrance journey.
          </p>
        </div>
        <div className="text-center py-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No blog posts yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Our vendors are working on creating amazing content for you. Check back soon!
            </p>
            <Link href="/blog">
              <Button variant="outline">
                Visit Blog Page
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="heading uppercase mb-4">Latest From Our Blog</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Discover expert fragrance tips, in-depth product reviews, and lifestyle content 
          to help you find your perfect scent and enhance your fragrance journey.
        </p>
      </div>

      {/* Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {blogs.map((blog) => (
          <Card key={blog._id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
            <div className="relative aspect-video overflow-hidden">
              <img
                src={blog.featuredImage.url}
                alt={blog.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className={getCategoryColor(blog.category)}>
                  {blog.category}
                </Badge>
                {blog.featured && (
                  <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                    Featured
                  </Badge>
                )}
              </div>
            </div>
            
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-3 line-clamp-2 group-hover:text-orange-600 transition-colors">
                {blog.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                {blog.excerpt}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {blog.authorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(blog.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {blog.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {blog.likes}
                  </span>
                </div>
                
                <Link href={`/blog/${blog.slug}`}>
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 p-0">
                    Read More
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center">
        <Link href="/blog">
          <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3">
            View All Blog Posts
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default BlogSection;
