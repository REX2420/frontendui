"use client";

import React, { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import Link from "next/link";

const ProductCarousel = ({ products }: { products: any[] }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Update selected index when the slide changes
  useEffect(() => {
    if (emblaApi) {
      const onSelect = () => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
      };

      // Listen to slide selection events
      emblaApi.on("select", onSelect);

      // Set the initial index
      onSelect();

      return () => {
        emblaApi.off("select", onSelect);
      };
    }
  }, [emblaApi]);

  // Transform products data
  const transformedProducts = products.map((product: any) => ({
    id: product._id,
    name: product.name,
    category: product.category.name,
    image: product.subProducts[0]?.images[0].url || "",
    rating: product.rating,
    reviews: product.numReviews,
    price: product.subProducts[0]?.sizes[0]?.price || 0,
    originalPrice: product.subProducts[0]?.originalPrice || 0,
    discount: product.subProducts[0]?.discount || 0,
    isBestseller: product.featured,
    isSale: product.subProducts[0]?.isSale || false,
    slug: product.slug,
    prices: product.subProducts[0]?.sizes
      .map((s: any) => s.price)
      .sort((a: any, b: any) => a - b),
  }));

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="heading mb-[10px] ownContainer text-center uppercase sm:mb-[40px]">
        FEATURED PRODUCTS
      </div>
      <div className="embla overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex">
          {transformedProducts.map((product, index) => (
            <div
              key={index}
              className="embla__slide flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_25%] min-w-0 px-2"
            >
              <div className="w-full flex-shrink-0 mb-2 group justify-center border border-gray-300 rounded-[10px] p-3">
                <div className="relative overflow-hidden rounded-[10px]">
                  <Link href={`/product/${product.slug}?style=0`}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-auto object-cover mb-4 transition-transform duration-700 ease-in-out transform group-hover:scale-110 rounded-[10px]"
                    />
                  </Link>
                  <div className="absolute top-2 left-2 flex gap-2">
                    {product.isBestseller && (
                      <span className="bg-[#E1B87F] text-white text-xs font-semibold px-2 py-1 rounded">
                        BESTSELLER
                      </span>
                    )}
                    {product.isSale && (
                      <span className="bg-[#7EBFAE] text-white text-xs font-semibold px-2 py-1 rounded">
                        SALE
                      </span>
                    )}
                  </div>
                  {typeof product?.discount !== "undefined" && product?.discount > 0 && (
                    <span className="absolute bottom-2 left-2 bg-[#7EBFAE] text-white text-xs font-semibold px-2 py-1 rounded">
                      {product.discount}% OFF
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mb-1 textGap text-[10px]">
                  {product.category.length > 25
                    ? product.category.substring(0, 25) + "..."
                    : product.category}
                </div>
                <h3 className="font-semibold text-[13px] sm:text-sm mb-2 sm:textGap">
                  {product.name.length > 20
                    ? product.name.substring(0, 20) + "..."
                    : product.name}
                </h3>
                <div className="flex items-center mb-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold ml-1">{product.rating}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({product.reviews} Reviews)
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-semibold text-[13px] sm:text-sm">
                    {product.prices.length === 1
                      ? `₹${
                          product.prices[0] - (product.prices[0] * product.discount) / 100
                        }`
                      : `From ₹${
                          product.prices[0] - (product.prices[0] * product.discount) / 100
                        } to ₹${
                          product.prices[product.prices.length - 1] -
                          (product.prices[product.prices.length - 1] * product.discount) /
                            100
                        }`}
                  </span>
                </div>
                <Link href={`/product/${product.slug}?style=0`}>
                  <Button className="w-full bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-600 dark:text-white dark:hover:bg-orange-700">
                    VIEW PRODUCT
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add navigation dots */}
      <div className="flex justify-center space-x-2 pt-6">
        {transformedProducts.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full ${
              selectedIndex === index ? "bg-gray-800" : "bg-gray-400"
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default function FeaturedProducts({ products }: { products: any[] }) {
  return (
    <div className="space-y-12">
      <ProductCarousel products={products} />
    </div>
  );
}
