"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, Eye, Heart, ArrowLeft, Share2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Blog {
  _id: string;
  title: string;
  content: string;
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
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
}

interface BlogPostClientProps {
  slug: string;
}

const BlogPostClient = ({ slug }: BlogPostClientProps) => {
  const router = useRouter();
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(0);

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  useEffect(() => {
    if (blog) {
      setCurrentLikes(blog.likes);
      fetchRelatedBlogs();
    }
  }, [blog]);

  const fetchBlog = async () => {
    try {
      const response = await fetch(`/api/blogs/${slug}`);
      const data = await response.json();

      if (data.success) {
        setBlog(data.blog);
      } else {
        router.push('/blog');
      }
    } catch (error) {
      console.error("Error fetching blog:", error);
      router.push('/blog');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBlogs = async () => {
    if (!blog) return;
    
    try {
      const response = await fetch(`/api/blogs?category=${blog.category}&limit=3`);
      const data = await response.json();

      if (data.success) {
        // Filter out current blog
        const filtered = data.blogs.filter((b: Blog) => b.slug !== blog.slug);
        setRelatedBlogs(filtered.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching related blogs:", error);
    }
  };

  const handleLike = async () => {
    if (liking) return;
    
    setLiking(true);
    try {
      const response = await fetch(`/api/blogs/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'like' }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentLikes(data.likes);
      }
    } catch (error) {
      console.error("Error liking blog:", error);
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog?.title,
          text: blog?.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog not found</h1>
          <Link href="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/blog">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>

        {/* Article Header */}
        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Featured Image */}
          <div className="relative aspect-video">
            <img
              src={blog.featuredImage.url}
              alt={blog.title}
              className="w-full h-full object-cover"
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

          {/* Article Content */}
          <div className="p-8">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {blog.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {blog.authorName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(blog.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {blog.views} views
              </span>
            </div>

            {/* Excerpt */}
            <div className="text-lg text-gray-600 dark:text-gray-300 mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-orange-500">
              {blog.excerpt}
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none dark:prose-invert">
              {blog.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLike}
                  disabled={liking}
                  className="flex items-center gap-2"
                >
                  <Heart className={`w-4 h-4 ${liking ? 'animate-pulse' : ''}`} />
                  {currentLikes} {currentLikes === 1 ? 'Like' : 'Likes'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedBlogs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Related Posts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <Card key={relatedBlog._id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={relatedBlog.featuredImage.url}
                      alt={relatedBlog.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className={`${getCategoryColor(relatedBlog.category)} text-xs`}>
                        {relatedBlog.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {relatedBlog.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-3 line-clamp-2">
                      {relatedBlog.excerpt}
                    </p>
                    
                    <Link href={`/blog/${relatedBlog.slug}`}>
                      <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 p-0 text-xs">
                        Read More
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPostClient; 