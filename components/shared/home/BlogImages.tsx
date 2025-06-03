"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight, Eye, Heart, BookOpen, Sparkles } from "lucide-react";
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

// Enhanced fallback blogs with better content
const fallbackBlogs = [
  {
    _id: "fallback-1",
    title: "The Art of Fragrance Layering: Create Your Signature Scent",
    excerpt: "Discover the secrets of professional perfumers and learn how to layer different fragrances to create a unique scent that's entirely your own.",
    featuredImage: {
      url: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1000",
      public_id: "fallback-1"
    },
    category: "Fragrance Tips",
    authorName: "Vibecart Team",
    publishedAt: new Date().toISOString(),
    views: 1250,
    likes: 89,
    featured: true,
    slug: "art-of-fragrance-layering"
  },
  {
    _id: "fallback-2",
    title: "5 Must-Have Fragrances for Every Season",
    excerpt: "From fresh spring scents to warm winter fragrances, discover the perfect perfumes to match every season and mood.",
    featuredImage: {
      url: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?q=80&w=1000",
      public_id: "fallback-2"
    },
    category: "Product Reviews",
    authorName: "Sarah Johnson",
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    views: 892,
    likes: 67,
    featured: false,
    slug: "must-have-fragrances-every-season"
  },
  {
    _id: "fallback-3",
    title: "The Psychology of Scent: How Fragrances Affect Your Mood",
    excerpt: "Explore the fascinating connection between scent and emotion, and learn how to choose fragrances that enhance your wellbeing.",
    featuredImage: {
      url: "https://images.unsplash.com/photo-1594736797933-d0c6d7688d95?q=80&w=1000",
      public_id: "fallback-3"
    },
    category: "Lifestyle",
    authorName: "Dr. Emma Wilson",
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    views: 1456,
    likes: 123,
    featured: false,
    slug: "psychology-of-scent-mood"
  }
];

// Real API function to fetch published blogs
const getPublishedBlogs = async () => {
  try {
    const response = await fetch('/api/blogs?limit=6');
    const data = await response.json();
    
    if (data.success && data.blogs.length > 0) {
      return {
        success: true,
        blogs: data.blogs
      };
    } else {
      return {
        success: true,
        blogs: fallbackBlogs
      };
    }
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return {
      success: true,
      blogs: fallbackBlogs
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
      setBlogs(fallbackBlogs);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Fragrance Tips": "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg",
      "Product Reviews": "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg",
      "Lifestyle": "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg",
      "Beauty": "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg",
      "Fashion": "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg",
      "Health & Wellness": "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg",
    };
    return colors[category] || "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg";
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-12 section-fade-in">
        <div className="text-center mb-12">
          <h2 className="heading uppercase mb-4">Latest From Our Blog</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover expert fragrance tips, in-depth product reviews, and lifestyle content 
            to help you find your perfect scent and enhance your fragrance journey.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700"></div>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12 section-fade-in">
      {/* Enhanced Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BookOpen className="w-8 h-8 text-orange-600" />
          <h2 className="heading uppercase">Latest From Our Blog</h2>
          <Sparkles className="w-8 h-8 text-orange-600" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
          Discover expert fragrance tips, in-depth product reviews, and lifestyle content 
          to help you find your perfect scent and enhance your fragrance journey.
        </p>
      </div>

      {/* Enhanced Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {blogs.slice(0, 3).map((blog, index) => (
          <Card 
            key={blog._id} 
            className="overflow-hidden hover:shadow-2xl transition-all duration-500 group hover-lift border-0 shadow-lg"
            style={{
              animationDelay: `${index * 0.1}s`
            }}
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={blog.featuredImage.url}
                alt={blog.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className={`${getCategoryColor(blog.category)} font-semibold px-3 py-1 text-sm hover:scale-105 transition-transform`}>
                  {blog.category}
                </Badge>
                {blog.featured && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg font-semibold px-3 py-1 hover:scale-105 transition-transform">
                    ⭐ Featured
                  </Badge>
                )}
              </div>

              {/* Enhanced engagement stats on image */}
              <div className="absolute bottom-4 right-4 flex gap-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-1 text-sm backdrop-blur-sm">
                  <Eye className="w-4 h-4" />
                  {blog.views.toLocaleString()}
                </span>
                <span className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-1 text-sm backdrop-blur-sm">
                  <Heart className="w-4 h-4 text-red-400" />
                  {blog.likes}
                </span>
              </div>
            </div>
            
            <CardContent className="p-6 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <h3 className="font-bold text-xl mb-3 line-clamp-2 group-hover:text-orange-600 transition-colors duration-300 leading-tight">
                {blog.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                {blog.excerpt}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 font-medium">
                    <User className="w-4 h-4 text-orange-600" />
                    {blog.authorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    {new Date(blog.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1 font-semibold">
                    <Eye className="w-4 h-4 text-blue-500" />
                    {blog.views.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Heart className="w-4 h-4 text-red-500" />
                    {blog.likes}
                  </span>
                </div>
                
                <Link href={`/blog/${blog.slug}`}>
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 group/btn">
                    Read More
                    <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced View All Button */}
      <div className="text-center">
        <Link href="/blog">
          <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-12 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full hover:scale-105">
            Explore All Articles
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default BlogSection;
