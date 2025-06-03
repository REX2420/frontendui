import { Button } from "@/components/ui/button";
import { Star, ShoppingBag, TrendingUp } from "lucide-react";

import Link from "next/link";
interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  slug: string;
  prices: any[];
  reviews: number;
  price: number;
  originalPrice: number;
  discount: number;
  isBestseller: boolean;
  isSale: boolean;
}

const Card = ({ product, shop, index }: { product: Product; shop?: boolean; index?: number }) => {
  return (
    <div
      className="w-full flex-shrink-0 mb-2 group justify-center border border-gray-300 rounded-[10px] p-3 hover-lift transition-all duration-300"
      key={product.slug}
      style={{
        animationDelay: `${(index || 0) * 0.1}s`
      }}
    >
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
              ⭐ BESTSELLER
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
      {shop ? null : (
        <div className="text-xs text-gray-500 mb-1 textGap text-[10px] font-medium">
          {product.category.length > 25
            ? product.category.substring(0, 25) + "..."
            : product.category}
        </div>
      )}

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
      {!shop && (
        <Link href={`/product/${product.slug}?style=0`}>
          <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group/btn">
            <ShoppingBag className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
            VIEW PRODUCT
          </Button>
        </Link>
      )}
    </div>
  );
};

const ProductCard = ({
  heading,
  shop,
  products,
}: {
  heading: string;
  shop?: boolean;
  products: any[];
}) => {
  const getHeadingIcon = (heading: string) => {
    if (heading.includes("BEST SELLERS") || heading.includes("BESTSELLER")) {
      return <TrendingUp className="w-8 h-8 text-orange-600" />;
    }
    return <ShoppingBag className="w-8 h-8 text-orange-600" />;
  };

  return products.length > 0 ? (
    <div className="ownContainer mx-auto mb-[20px] section-slide-up">
      <div className="flex justify-center items-center gap-3 mb-8 sm:mb-12">
        {getHeadingIcon(heading)}
        <div className="heading ownContainer uppercase text-center">
          {heading}
        </div>
        {getHeadingIcon(heading)}
      </div>
      <div className="relative">
        <div
          className={`${
            shop
              ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
              : "flex overflow-x-auto gap-4 sm:gap-6 scroll-smooth no-scrollbar sm:grid sm:grid-cols-2 lg:grid-cols-4"
          } mb-8 `}
        >
          {products.map((product, index) => (
            <Card key={product.id} product={product} shop={shop} index={index} />
          ))}
        </div>
      </div>
      {!shop && (
        <div className="flex justify-center mt-8">
          <Button
            variant={"outline"}
            className="w-[90%] sm:w-[400px] border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white textGap px-[10px] py-[20px] font-semibold text-lg hover:shadow-lg transition-all duration-300 rounded-full"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            VIEW ALL PRODUCTS
          </Button>
        </div>
      )}
    </div>
  ) : (
    <div className="flex flex-col justify-center items-center h-screen section-fade-in">
      <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-lg max-w-md mx-auto">
        <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h1 className="mb-4 text-xl font-bold text-gray-700 dark:text-gray-300">No Products Found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          We're working on adding amazing products for you. Check back soon!
        </p>
        <Link href={"/shop"}>
          <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Explore Shop
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
