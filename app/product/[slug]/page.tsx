// ISR(CACHE) - 30 MINUTES

import React from "react";
import { Star, Minus, Plus } from "lucide-react";
import ProductReviewComponent from "@/components/shared/product/ProductReviewComponent";
import ProductDetailsAccordian from "@/components/shared/product/ProductDetailsAccordian";
import {
  getRelatedProductsBySubCategoryIds,
  getSingleProduct,
} from "@/lib/database/actions/product.actions";
import { getActiveMarqueeTexts } from "@/lib/database/actions/marquee.actions";
import { Metadata } from "next";
import QtyButtons from "@/components/shared/product/QtyButtons";
import Link from "next/link";
import AddtoCartButton from "@/components/shared/product/AddtoCart";
import ProductCard from "@/components/shared/home/ProductCard";
import { redirect } from "next/navigation";
import IdInvalidError from "@/components/shared/IdInvalidError";
import ProductImageGallery from "../../../components/shared/product/ProductImageGallery";
import MarqueeComponent from "@/components/shared/MarqueeComponent";

// generate meta data coming from database
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const slug = (await params).slug;
  const style = Number((await searchParams).style);
  const size = Number((await searchParams).size) || 0;
  const product = await getSingleProduct(slug, style, size);

  return {
    title: `Buy ${product.name} product | VibeCart`,
    description: product.description,
  };
}
const ProductPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const slug = (await params).slug;
  const style = Number((await searchParams).style);
  const size = Number((await searchParams).size) || 0;
  const sizeforButton = Number((await searchParams).size);
  const product = await getSingleProduct(slug, style, size);
  if (!product.success) {
    return <IdInvalidError />;
  }
  
  // Fetch active marquee texts
  const marqueeData = await getActiveMarqueeTexts();
  const marqueeTexts = marqueeData.success ? marqueeData.marqueeTexts : [];
  
  const images = product.subProducts[0].images.map((image: any) => image.url);
  const subCategoryProducts = product.subCategories.map((i: any) => i._id);
  const relatedProducts = await getRelatedProductsBySubCategoryIds(
    subCategoryProducts
  ).catch((err) => console.log(err));
  const transformedProducts = relatedProducts?.products.map((product: any) => ({
    id: product._id,
    name: product.name,
    category: product.category, // You might need to format this
    image: product.subProducts[0]?.images[0].url || "", // Adjust to match your image structure
    rating: product.rating,
    reviews: product.numReviews,
    price: product.subProducts[0]?.price || 0, // Adjust to match your pricing structure
    originalPrice: product.subProducts[0]?.originalPrice || 0, // Add logic for original price
    discount: product.subProducts[0]?.discount || 0,
    isBestseller: product.featured,
    isSale: product.subProducts[0]?.isSale || false, // Adjust if you have sale logic
    slug: product.slug,
    prices: product.subProducts[0]?.sizes
      .map((s: any) => {
        return s.price;
      })
      .sort((a: any, b: any) => {
        return a - b;
      }),
  }));

  return (
    <div>
      <MarqueeComponent marqueeTexts={marqueeTexts} />
      <div className="max-w-7xl ownContainer pb-6 px-6 pt-2">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 mb-[20px] ">
          <div className="w-full lg:w-1/2">
            <ProductImageGallery images={images} productName={product.name} />
          </div>
          <div className="w-full lg:w-1/2 space-y-4">
            <h1 className="text-2xl lg:subHeading">{product.name}</h1>
            <p className="text-xs lg:text-sm text-gray-500">
              {product.category.name}
            </p>
            <p className="text-xs lg:text-sm text-gray-500">
              {product?.description}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < product.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{product.rating}</span>
              <span className="text-sm text-gray-500">
                ({product.numReviews} Reviews)
              </span>
            </div>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-6 gap-6">
              <div className="w-full lg:w-auto">
                {/* Price Section */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black dark:text-white">
                      MVR {product.price}
                    </span>
                    {product.discount && Number(product.discount) > 0 && (
                      <span className="bg-red-500 text-white px-2 py-1 rounded-md text-sm font-semibold">
                        -{product.discount}% OFF
                      </span>
                    )}
                  </div>
                  
                  {product.discount && Number(product.discount) > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                        MVR {Number(product.priceBefore).toFixed(2)}
                      </span>
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                        You save MVR {(Number(product.priceBefore) - Number(product.price)).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ✓ Inclusive of all taxes • Free shipping on orders above MVR 500
                  </p>
                </div>
              </div>
            </div>
            
            {/* Quantity Counter */}
            <div className="mb-6">
              <QtyButtons product={product} size={size} style={style} />
            </div>
            
            {product.subProducts[0].sizes[size].qty <= 10 && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 rounded-lg p-4 mb-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                      Limited Stock Alert!
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Only <span className="font-bold text-red-600 dark:text-red-400">{product.subProducts[0].sizes[size].qty}</span> items left in stock. Order now to secure yours!
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="animate-pulse">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Color Selection */}
            {product.subProducts && product.subProducts.length > 1 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select Color
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.subProducts.map((subProduct: any, index: number) => (
                    <Link
                      key={index}
                      href={`/product/${product.slug}?style=${index}&size=${size}`}
                    >
                      <div
                        className={`
                          relative h-12 w-12 sm:h-14 sm:w-14 rounded-lg 
                          border-2 cursor-pointer transition-all duration-200
                          shadow-sm hover:shadow-md overflow-hidden
                          ${
                            index === style 
                              ? "border-orange-500 dark:border-orange-400 transform scale-105 ring-2 ring-orange-200 dark:ring-orange-800" 
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                          }
                        `}
                        style={{ backgroundColor: subProduct.color?.color }}
                        title={`Color: ${subProduct.color?.color}`}
                      >
                        {subProduct.color?.image && (
                          <img
                            src={subProduct.color.image}
                            alt={`Color ${subProduct.color.color}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {index === style && (
                          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {/* Size Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Size
              </h3>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((sizes: { size: string }, index: number) => (
                  <Link
                    key={sizes.size}
                    href={`/product/${product.slug}?style=${style}&size=${index}`}
                  >
                    <div
                      className={`
                        relative h-12 w-12 sm:h-14 sm:w-14 rounded-lg 
                        flex items-center justify-center 
                        border-2 cursor-pointer transition-all duration-300 ease-in-out
                        text-sm sm:text-base font-semibold
                        shadow-sm group overflow-hidden
                        ${
                          index === sizeforButton 
                            ? "bg-orange-500 text-white border-orange-500 transform scale-105 shadow-lg ring-2 ring-orange-200 dark:ring-orange-800" 
                            : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:text-orange-600 dark:hover:text-orange-400 hover:scale-105 hover:shadow-md"
                        }
                      `}
                    >
                      {/* Background animation effect */}
                      {index !== sizeforButton && (
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-400/10 to-orange-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                      )}
                      
                      {/* Size text */}
                      <span className="relative z-10 transition-all duration-200">
                        {sizes.size}
                      </span>
                      
                      {/* Selected indicator */}
                      {index === sizeforButton && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Hover glow effect */}
                      {index !== sizeforButton && (
                        <div className="absolute inset-0 rounded-lg bg-orange-400/0 group-hover:bg-orange-400/5 transition-all duration-300"></div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* Size guide hint */}
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Need help with sizing? Check our size guide</span>
              </div>
            </div>
            <AddtoCartButton product={product} size={size} />
            
          </div>
        </div>
        <ProductDetailsAccordian
          description={product.longDescription}
          keyBenefits={product.benefits}
          details={product.details}
        />
        <ProductReviewComponent
          product={product}
          rating={product.rating}
          numofReviews={product.numReviews}
          ratings={product.ratings}
        />
        <ProductCard
          heading="YOU MAY ALSO LIKE"
          products={transformedProducts}
          shop
        />
      </div>
    </div>
  );
};

export default ProductPage;
