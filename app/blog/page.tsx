"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, User, ArrowRight, Eye, Heart, Search } from "lucide-react";
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

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalBlogs: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const categories = [
  "All",
  "Fragrance Tips",
  "Product Reviews", 
  "Lifestyle",
  "Beauty",
  "Fashion",
  "Health & Wellness"
];

const BlogListingPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, selectedCategory, searchQuery]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "9",
      });

      if (selectedCategory !== "All") {
        params.append("category", selectedCategory);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/blogs?${params}`);
      const data = await response.json();

      if (data.success) {
        setBlogs(data.blogs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
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

  if (loading && blogs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Our Blog
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover expert fragrance tips, in-depth product reviews, and lifestyle content 
            to help you find your perfect scent and enhance your fragrance journey.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search blogs..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-4 py-2"
              />
              <Button 
                type="submit" 
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8"
                size="sm"
              >
                Search
              </Button>
            </div>
          </form>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(category)}
                className="text-xs"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        {pagination && (
          <div className="mb-6 text-center text-gray-600 dark:text-gray-400">
            Showing {blogs.length} of {pagination.totalBlogs} blog posts
            {selectedCategory !== "All" && ` in "${selectedCategory}"`}
            {searchQuery && ` for "${searchQuery}"`}
          </div>
        )}

        {/* Blog Grid */}
        {blogs.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No blogs found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
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
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.hasPrev || loading}
            >
              Previous
            </Button>
            
            <div className="flex gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  disabled={loading}
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.hasNext || loading}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogListingPage; 