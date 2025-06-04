"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Eye, Heart, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  _id: string;
  name: string;
  slug: string;
  brand?: string;
  rating: number;
  numReviews: number;
  featured: boolean;
  subProducts: Array<{
    images: Array<{ url: string }>;
    discount: number;
    sizes: Array<{ price: number }>;
  }>;
}

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  authorName: string;
  views: number;
  likes: number;
  featuredImage: { url: string };
}

interface Vendor {
  _id: string;
  name: string;
  description?: string;
  verified: boolean;
}

interface SearchResultsGridProps {
  products?: Product[];
  blogs?: Blog[];
  vendors?: Vendor[];
  viewMode?: "grid" | "list";
  maxItems?: number;
}

export default function SearchResultsGrid({ 
  products = [], 
  blogs = [], 
  vendors = [], 
  viewMode = "grid",
  maxItems 
}: SearchResultsGridProps) {
  
  const ProductCard = ({ product }: { product: Product }) => (
    <Link href={`/product/${product.slug}?style=0`}>
      <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={product.subProducts?.[0]?.images?.[0]?.url || "/placeholder.jpg"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.subProducts?.[0]?.discount > 0 && (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-500">
              -{product.subProducts[0].discount}%
            </Badge>
          )}
          {product.featured && (
            <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-500">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold text-sm truncate mb-1">{product.name}</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-lg">
              MVR {product.subProducts?.[0]?.sizes?.[0]?.price || 0}
            </span>
            {product.subProducts?.[0]?.discount > 0 && (
              <span className="text-sm text-gray-500 line-through">
                MVR {Math.round(product.subProducts[0].sizes[0].price / (1 - product.subProducts[0].discount / 100))}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-current text-yellow-400" />
              <span>{product.rating || 0}</span>
              <span>({product.numReviews || 0})</span>
            </div>
            <span>{product.brand || "VibeCart"}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const ProductListItem = ({ product }: { product: Product }) => (
    <Link href={`/product/${product.slug}?style=0`}>
      <Card className="group hover:shadow-md transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={product.subProducts?.[0]?.images?.[0]?.url || "/placeholder.jpg"}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-base mb-1 truncate">{product.name}</h3>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-lg">
                      MVR {product.subProducts?.[0]?.sizes?.[0]?.price || 0}
                    </span>
                    {product.subProducts?.[0]?.discount > 0 && (
                      <span className="text-sm text-gray-500 line-through">
                        MVR {Math.round(product.subProducts[0].sizes[0].price / (1 - product.subProducts[0].discount / 100))}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current text-yellow-400" />
                      <span>{product.rating || 0}</span>
                      <span>({product.numReviews || 0})</span>
                    </div>
                    <span>{product.brand || "VibeCart"}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {product.subProducts?.[0]?.discount > 0 && (
                    <Badge className="bg-red-500 hover:bg-red-500">
                      -{product.subProducts[0].discount}%
                    </Badge>
                  )}
                  {product.featured && (
                    <Badge className="bg-yellow-500 hover:bg-yellow-500">
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const BlogCard = ({ blog }: { blog: Blog }) => (
    <Link href={`/blog/${blog.slug}`}>
      <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          <Image
            src={blog.featuredImage?.url || "/placeholder.jpg"}
            alt={blog.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <Badge className="mb-2 bg-purple-500 hover:bg-purple-500">
              {blog.category}
            </Badge>
            <h3 className="font-semibold text-white text-sm line-clamp-2">
              {blog.title}
            </h3>
          </div>
        </div>
        <CardContent className="p-3">
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {blog.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{blog.views || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{blog.likes || 0}</span>
              </div>
            </div>
            <span>{blog.authorName}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const VendorCard = ({ vendor }: { vendor: Vendor }) => (
    <Link href={`/vendor/${vendor._id}`}>
      <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300">
        <CardContent className="p-4 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold">
            {vendor.name.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-semibold text-sm mb-1">{vendor.name}</h3>
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {vendor.description || "Professional vendor"}
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <User className="w-3 h-3" />
            <span>Vendor</span>
            {vendor.verified && (
              <Badge className="bg-green-500 hover:bg-green-500 text-xs">
                Verified
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const displayProducts = maxItems ? products.slice(0, maxItems) : products;
  const displayBlogs = maxItems ? blogs.slice(0, maxItems) : blogs;
  const displayVendors = maxItems ? vendors.slice(0, maxItems) : vendors;

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {displayProducts.map((product, index) => (
          <ProductListItem key={`product-${product._id || index}`} product={product} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {displayProducts.length > 0 && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {displayProducts.map((product, index) => (
            <ProductCard key={`product-${product._id || index}`} product={product} />
          ))}
        </div>
      )}
      
      {displayBlogs.length > 0 && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {displayBlogs.map((blog, index) => (
            <BlogCard key={`blog-${blog._id || index}`} blog={blog} />
          ))}
        </div>
      )}
      
      {displayVendors.length > 0 && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {displayVendors.map((vendor, index) => (
            <VendorCard key={`vendor-${vendor._id || index}`} vendor={vendor} />
          ))}
        </div>
      )}
    </div>
  );
} 