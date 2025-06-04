"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClientCacheUtils } from '@/lib/cache/client-utils';
import { toast } from 'sonner';

interface CacheInvalidationButtonProps {
  type?: 'products' | 'blogs' | 'homepage' | 'categories' | 'blog-categories';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
}

export default function CacheInvalidationButton({ 
  type = 'products', 
  variant = 'outline',
  size = 'sm',
  children 
}: CacheInvalidationButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleInvalidate = async () => {
    setLoading(true);
    
    try {
      let result;
      
      switch (type) {
        case 'products':
          result = await ClientCacheUtils.invalidateProducts();
          break;
        case 'blogs':
          result = await ClientCacheUtils.invalidateBlogs();
          break;
        case 'homepage':
          result = await ClientCacheUtils.invalidateHomepage();
          break;
        case 'categories':
          result = await ClientCacheUtils.invalidateCategories();
          break;
        case 'blog-categories':
          result = await ClientCacheUtils.invalidateBlogCategories();
          break;
        default:
          result = { success: false, message: 'Invalid cache type' };
      }
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
      toast.error('Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (children) return children;
    
    switch (type) {
      case 'products':
        return 'Clear Product Cache';
      case 'blogs':
        return 'Clear Blog Cache';
      case 'homepage':
        return 'Clear Homepage Cache';
      case 'categories':
        return 'Clear Category Cache';
      case 'blog-categories':
        return 'Clear Blog Category Cache';
      default:
        return 'Clear Cache';
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      disabled={loading}
      onClick={handleInvalidate}
    >
      {loading ? 'Clearing...' : getButtonText()}
    </Button>
  );
} 