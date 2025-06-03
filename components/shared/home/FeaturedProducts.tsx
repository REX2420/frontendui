"use client";

import React, { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { Star, ShoppingBag, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const ProductCarousel = ({ products }: { products: any[] }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Update selected index when the slide changes
  useEffect(() => {
    if (emblaApi) {
      const onSelect = () => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
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

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

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
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 section-slide-up">
      <div className="flex justify-center items-center gap-3 mb-8 sm:mb-12">
        <Sparkles className="w-8 h-8 text-orange-600" />
        <div className="heading text-center uppercase">
          FEATURED PRODUCTS
        </div>
        <Sparkles className="w-8 h-8 text-orange-600" />
      </div>

      <div className="relative">
        {/* Navigation Buttons */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border-2 border-orange-200 hover:border-orange-400 disabled:opacity-50"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
        >
          <ChevronLeft className="w-5 h-5 text-orange-600" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border-2 border-orange-200 hover:border-orange-400 disabled:opacity-50"
          onClick={scrollNext}
          disabled={!canScrollNext}
        >
          <ChevronRight className="w-5 h-5 text-orange-600" />
        </Button>

        <div className="embla overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex">
            {transformedProducts.map((product, index) => (
              <div
                key={index}
                className="embla__slide flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_25%] min-w-0 px-2"
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div className="w-full flex-shrink-0 mb-2 group justify-center border border-gray-300 rounded-[10px] p-3 hover-lift transition-all duration-300 bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl">
                  <div className="relative overflow-hidden rounded-[10px]">
                    <Link href={`/product/${product.slug}?style=0`}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover mb-4 transition-transform duration-700 ease-in-out transform group-hover:scale-110 rounded-[10px]"
                      />
                    </Link>
                    <div className="absolute top-2 left-2 flex gap-2">
                      {product.isBestseller && (
                        <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                          ⭐ FEATURED
                        </span>
                      )}
                      {product.isSale && (
                        <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          🔥 SALE
                        </span>
                      )}
                    </div>
                    {typeof product?.discount !== "undefined" && product?.discount > 0 && (
                      <span className="absolute bottom-2 left-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        -{product.discount}% OFF
                      </span>
                    )}

                    {/* Quick view overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[10px] flex items-center justify-center">
                      <div className="text-white text-sm font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        Quick View
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-1 textGap text-[10px] font-medium">
                    {product.category.length > 25
                      ? product.category.substring(0, 25) + "..."
                      : product.category}
                  </div>
                  <h3 className="font-bold text-[13px] sm:text-sm mb-2 sm:textGap group-hover:text-orange-600 transition-colors duration-300">
                    {product.name.length > 20
                      ? product.name.substring(0, 20) + "..."
                      : product.name}
                  </h3>
                  <div className="flex items-center mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold ml-1">{product.rating}</span>
                    <span className="text-xs text-gray-500 ml-2 font-medium">
                      ({product.reviews} Reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="font-bold text-[13px] sm:text-sm text-gray-900 dark:text-white">
                      {product.prices.length === 1
                        ? `MVR${
                            product.prices[0] - (product.prices[0] * product.discount) / 100
                          }`
                        : `From MVR${
                            product.prices[0] - (product.prices[0] * product.discount) / 100
                          } to MVR${
                            product.prices[product.prices.length - 1] -
                            (product.prices[product.prices.length - 1] * product.discount) /
                              100
                          }`}
                    </span>
                  </div>
                  <Link href={`/product/${product.slug}?style=0`}>
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group/btn">
                      <ShoppingBag className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                      VIEW PRODUCT
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced navigation dots */}
      <div className="flex justify-center space-x-3 pt-8">
        {transformedProducts.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${
              selectedIndex === index 
                ? "bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg scale-125" 
                : "bg-gray-300 hover:bg-gray-400"
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
