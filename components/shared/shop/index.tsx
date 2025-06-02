"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getAllCategories } from "@/lib/database/actions/categories.actions";
import { getAllSubCategoriesByParentId } from "@/lib/database/actions/subCategory.actions";
import { handleError } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShoppingBag } from "lucide-react";
import { useSearchParams } from "next/navigation";

const ShopPageComponent = () => {
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        await getAllCategories().then((res) => {
          if (res?.success) {
            setAllCategories(res?.categories || []);
            
            // Check if there's a category parameter in the URL
            const categoryFromUrl = searchParams.get('category');
            if (categoryFromUrl && res?.categories?.some((cat: any) => cat._id === categoryFromUrl)) {
              setSelectedCategoryId(categoryFromUrl);
            } else {
              setSelectedCategoryId(res?.categories[0]?._id || "");
            }
          }
        });
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [searchParams]);

  useEffect(() => {
    async function fetchSubCategories() {
      if (selectedCategoryId === "") return;
      try {
        setSubCategoriesLoading(true);
        await getAllSubCategoriesByParentId(selectedCategoryId)
          .then((res) => {
            setSubCategories(res?.subCategories || []);
          })
          .catch((err) => {
            toast.error(err);
            console.log(err);
          });
      } finally {
        setSubCategoriesLoading(false);
      }
    }
    fetchSubCategories();
  }, [selectedCategoryId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <ShoppingBag className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-4xl font-bold text-foreground">
            {searchParams.get('name') ? `${searchParams.get('name')} Products` : 'Shop All Categories'}
          </h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {searchParams.get('name') 
            ? `Browse all subcategories and products in ${searchParams.get('name')}.`
            : 'Discover our wide range of products across different categories. Choose a category below to explore subcategories and find exactly what you\'re looking for.'
          }
        </p>
      </div>

      <RadioGroup
        value={selectedCategoryId}
        onValueChange={setSelectedCategoryId}
        className="w-full"
      >
        {/* Category Selection */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">Choose a Category</h2>
          <div className="flex flex-wrap justify-center items-center gap-6">
            {allCategories.map((category: any) => (
              <div 
                key={category._id} 
                className="flex items-center space-x-3 p-4 rounded-lg border-2 border-muted hover:border-primary transition-colors cursor-pointer bg-card hover:bg-accent"
              >
                <RadioGroupItem value={category._id} id={category._id} className="w-5 h-5" />
                <Label 
                  htmlFor={category._id} 
                  className="text-base font-medium cursor-pointer capitalize"
                >
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Subcategories Grid */}
        <div className="mt-8">
          {subCategoriesLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : subCategories.length > 0 ? (
            <>
              {(() => {
                const selectedCategory = allCategories.find((cat: any) => cat._id === selectedCategoryId);
                const categoryName = selectedCategory ? selectedCategory.name : "Products";
                return (
                  <h2 className="text-2xl font-semibold mb-8 text-center">
                    {categoryName} Subcategories
                  </h2>
                );
              })()}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {subCategories.map((item: any, index: number) => (
                  <div 
                    key={index} 
                    className="group bg-card rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <Link href={`/shop/subCategory/${item._id}?name=${item.name}`}>
                      <div className="aspect-square relative overflow-hidden">
                        <Image
                          src={item.images?.[0]?.url || "/placeholder.jpg"}
                          alt={item.name}
                          width={450}
                          height={320}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                      </div>
                    </Link>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-3 capitalize text-center">{item.name}</h3>
                      <Link href={`/shop/subCategory/${item._id}?name=${item.name}`}>
                        <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          Browse Products
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-muted-foreground mb-2">No subcategories found</h3>
              <p className="text-muted-foreground">
                This category doesn't have any subcategories yet. Check back later!
              </p>
            </div>
          )}
        </div>
      </RadioGroup>
    </div>
  );
};

export default ShopPageComponent;
