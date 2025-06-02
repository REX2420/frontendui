"use client";

import { Button } from "@/components/ui/button";
import { getAllCategories } from "@/lib/database/actions/categories.actions";
import { handleError } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Grid3X3, ArrowRight } from "lucide-react";

const CategoriesPageComponent = () => {
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        await getAllCategories().then((res) => {
          if (res?.success) {
            setAllCategories(res?.categories || []);
          }
        });
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="flex mb-8" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Home
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-muted-foreground">/</span>
              <span className="text-sm font-medium text-foreground">All Categories</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <Grid3X3 className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-4xl font-bold text-foreground">All Categories</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Explore our complete range of product categories. 
          Click on any category to discover subcategories and products.
        </p>
      </div>

      {/* Categories Grid */}
      {allCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {allCategories.map((category: any) => (
            <div 
              key={category._id} 
              className="group bg-card rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
            >
              <Link href={`/shop?category=${category._id}&name=${category.name}`}>
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src={category.images?.[0]?.url || "/placeholder.jpg"}
                    alt={category.name}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white text-xl font-bold capitalize">
                      {category.name}
                    </h3>
                  </div>
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
                </div>
              </Link>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-3 capitalize text-center group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <Link href={`/shop?category=${category._id}&name=${category.name}`}>
                  <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    Browse Category
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Grid3X3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium text-muted-foreground mb-2">No categories found</h3>
          <p className="text-muted-foreground">
            Categories will appear here once they are added. Check back later!
          </p>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-16 text-center">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Browse all our products or use our search feature to find exactly what you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop">
              <Button variant="default" size="lg">
                Browse All Products
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPageComponent; 