"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, User, ArrowRight, Eye, Heart, Search } from "lucide-react";
import Link from "next/link";
import MobileBlogList, { MobileBlogListLoading } from "@/components/shared/home/MobileBlogList";

interface Blog {
  _id: string;
  title: string;
  excerpt: string;
  featuredImage: {
    url: string;
    public_id: string;
  };
  category: string;
  categoryName: string;
  authorName: string;
  publishedAt: string;
  views: number;
  likes: number;
  featured: boolean;
  slug: string;
  tags: string[];
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalBlogs: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const BlogListingPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("publishedAt");

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, selectedCategory, searchQuery, showFeaturedOnly, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();

      if (data.success && data.categories) {
        const categoryNames = data.categories.map((cat: any) => cat.name);
        setCategories(categoryNames);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "9",
      });

      if (selectedCategory) {
        params.append("category", selectedCategory);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      if (showFeaturedOnly) {
        params.append("featured", "true");
      }

      if (sortBy) {
        params.append("sort", sortBy);
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
    setSelectedCategory(selectedCategory === category ? "" : category);
    setCurrentPage(1);
  };

  const getCategoryColor = (category: string) => {
    // Generate color based on category name hash for consistency
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
    
    // Simple hash function for consistent color assignment
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  if (loading && blogs.length === 0) {
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

          {/* Loading State */}
          <div className="mb-8">
            {/* Desktop Loading */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(9)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>

            {/* Mobile Loading */}
            <div className="md:hidden px-2">
              <MobileBlogListLoading items={9} />
            </div>
          </div>
        </div>
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

          {/* Filter Controls */}
          <div className="flex flex-wrap justify-center gap-4 items-center">
            {/* Featured Posts Toggle */}
            <Button
              variant={showFeaturedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              className="text-xs"
            >
              ⭐ Featured Posts
            </Button>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="publishedAt">Latest</option>
              <option value="views">Most Viewed</option>
              <option value="likes">Most Liked</option>
              <option value="title">Alphabetical</option>
            </select>

            {/* Clear Filters */}
            {(selectedCategory || searchQuery || showFeaturedOnly || sortBy !== "publishedAt") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory("");
                  setSearchQuery("");
                  setSearchInput("");
                  setShowFeaturedOnly(false);
                  setSortBy("publishedAt");
                  setCurrentPage(1);
                }}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Clear All
              </Button>
            )}
          </div>

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
            <div>
              Showing {blogs.length} of {pagination.totalBlogs} blog posts
              {selectedCategory && ` in "${selectedCategory}"`}
              {searchQuery && ` for "${searchQuery}"`}
              {showFeaturedOnly && ` (featured only)`}
            </div>
            {(selectedCategory || searchQuery || showFeaturedOnly || sortBy !== "publishedAt") && (
              <div className="text-xs mt-1">
                {sortBy !== "publishedAt" && `Sorted by ${sortBy === "views" ? "most viewed" : sortBy === "likes" ? "most liked" : sortBy === "title" ? "alphabetical" : "latest"}`}
              </div>
            )}
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
          <>
            {/* Desktop Grid View */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {blogs.map((blog) => (
                <Card key={blog._id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={blog.featuredImage.url}
                      alt={blog.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge className={getCategoryColor(blog.categoryName || blog.category)}>
                        {blog.categoryName || blog.category}
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

            {/* Mobile List View */}
            <div className="md:hidden mb-12">
              <MobileBlogList 
                blogs={blogs.map(blog => ({
                  ...blog,
                  category: blog.categoryName || blog.category
                }))} 
                maxItems={blogs.length}
                showCategory={true}
                className="px-2"
              />
            </div>
          </>
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