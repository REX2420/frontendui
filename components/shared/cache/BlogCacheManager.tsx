"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CacheInvalidationButton from './CacheInvalidationButton';
import { ClientCacheUtils } from '@/lib/cache/client-utils';
import { toast } from 'sonner';

interface BlogCacheManagerProps {
  className?: string;
}

export default function BlogCacheManager({ className }: BlogCacheManagerProps) {
  
  const handleSpecificBlogInvalidation = async (blogId: string, slug: string) => {
    const result = await ClientCacheUtils.invalidateBlog(blogId, slug);
    if (result.success) {
      toast.success(`Blog "${slug}" cache cleared successfully`);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Blog Cache Management</CardTitle>
        <CardDescription>
          Manually clear caches when you update blog content outside the normal flow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Individual cache options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div className="space-y-2">
            <h4 className="font-medium">All Blogs</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Clear all blog listings and homepage blog sections
            </p>
            <CacheInvalidationButton 
              type="blogs" 
              variant="destructive" 
              size="sm"
            />
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Blog Categories</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Clear blog category filters and navigation
            </p>
            <CacheInvalidationButton 
              type="blog-categories" 
              variant="destructive" 
              size="sm"
            />
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Homepage</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Clear featured blogs and recent posts on homepage
            </p>
            <CacheInvalidationButton 
              type="homepage" 
              variant="outline" 
              size="sm"
            />
          </div>
        </div>

        {/* Usage examples */}
        <div className="border-t pt-4 mt-6">
          <h4 className="font-medium mb-2">When to use each option:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2"></span>
              <div>
                <strong>All Blogs:</strong> Use after publishing/unpublishing multiple blogs, changing blog status, or bulk operations
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2"></span>
              <div>
                <strong>Blog Categories:</strong> Use after adding/removing blog categories or changing category assignments
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
              <div>
                <strong>Homepage:</strong> Use after changing featured blog settings or updating blogs that appear on homepage
              </div>
            </div>
          </div>
        </div>

        {/* Automatic invalidation info */}
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            ✅ Automatic Cache Invalidation
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            The following actions automatically clear relevant caches:
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
            <li>• Creating a new blog post</li>
            <li>• Updating an existing blog post</li>
            <li>• Publishing/unpublishing blogs</li>
            <li>• Deleting blog posts</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 