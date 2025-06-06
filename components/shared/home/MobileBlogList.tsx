"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight } from "lucide-react";
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

interface MobileBlogListProps {
  blogs: Blog[];
  maxItems?: number;
  showCategory?: boolean;
  className?: string;
}

const MobileBlogList = ({ 
  blogs, 
  maxItems = 4, 
  showCategory = true, 
  className = "" 
}: MobileBlogListProps) => {
  const getCategoryColor = (category: string) => {
    const colors = [
      "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg",
      "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg", 
      "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg",
      "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg",
      "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg",
      "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg",
      "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg",
      "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg",
      "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg",
      "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg",
    ];
    
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {blogs.slice(0, maxItems).map((blog, index) => (
        <Card 
          key={blog._id} 
          className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-border shadow-sm bg-card"
        >
          <div className="flex items-center gap-3 p-3">
            <div className="relative w-16 h-16 flex-shrink-0">
              <img
                src={blog.featuredImage.url}
                alt={blog.title}
                className="w-full h-full object-cover object-center rounded-full"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1 line-clamp-2 leading-tight text-foreground">
                {blog.title}
              </h3>
              
              <p className="text-muted-foreground text-xs mb-2 line-clamp-2 leading-relaxed">
                {blog.excerpt}
              </p>

              {showCategory && (
                <div className="mb-2">
                  <Badge className={`${getCategoryColor(blog.category)} text-xs px-2 py-0.5`}>
                    {blog.category}
                  </Badge>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {blog.authorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(blog.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <Link href={`/blog/${blog.slug}`}>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20">
                    Read <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Loading component for the mobile blog list
export const MobileBlogListLoading = ({ 
  items = 4, 
  className = "" 
}: { 
  items?: number; 
  className?: string; 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {[...Array(items)].map((_, index) => (
        <Card key={index} className="overflow-hidden animate-pulse border border-border bg-card">
          <div className="flex items-center gap-3 p-3">
            <div className="w-16 h-16 bg-muted rounded-full flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded mb-1 w-3/4"></div>
              <div className="h-3 bg-muted rounded mb-2 w-1/2"></div>
              <div className="flex justify-between items-center">
                <div className="h-3 bg-muted rounded w-1/3"></div>
                <div className="h-6 bg-muted rounded w-12"></div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default MobileBlogList; 