// ISR(CACHE) - 12 HOURS (43200 seconds)
import BannerCarousel from "@/components/shared/home/BannerCarousel";
import BlogSection from "@/components/shared/home/BlogImages";
import FeaturedProducts from "@/components/shared/home/FeaturedProducts";
import ProductCard from "@/components/shared/home/ProductCard";
import { fetchAllWebsiteBanners, fetchAllAppBanners } from "@/lib/database/actions/banners.actions";
import {
  getAllFeaturedProducts,
  getNewArrivalProducts,
} from "@/lib/database/actions/product.actions";

// Enable ISR with 12-hour revalidation
export const revalidate = 43200; // 12 hours in seconds

const HomePage = async () => {
  const desktopImages: any = await fetchAllWebsiteBanners().catch((err) =>
    console.log(err)
  );
  const appBanners: any = await fetchAllAppBanners().catch((err) =>
    console.log(err)
  );
  const mobileImages = appBanners ? appBanners.map((banner: any) => banner.url) : [];

  const newArrivalProducts = await getNewArrivalProducts().catch((err) =>
    console.log(err)
  );

  const transformedNewArrivalProducts = newArrivalProducts?.products.map(
    (product: any) => ({
      id: product._id,
      name: product.name,
      category: typeof product.category === 'object' && product.category?.name ? product.category.name : "Electronics",
      image: product.subProducts[0]?.images[0].url || "",
      rating: product.rating,
      reviews: product.numReviews,
      price: product.subProducts[0]?.price || 0,
      originalPrice: product.subProducts[0]?.originalPrice || 0,
      discount: product.subProducts[0]?.discount || 0,
      isBestseller: product.featured,
      isSale: product.subProducts[0]?.isSale || false,
      slug: product.slug,
      prices: product.subProducts[0]?.sizes
        .map((s: any) => {
          return s.price;
        })
        .sort((a: any, b: any) => {
          return a - b;
        }),
    })
  );
  const featuredProducts: any = await getAllFeaturedProducts().catch((err) =>
    console.log(err)
  );
  return (
    <div>
      <BannerCarousel desktopImages={desktopImages} mobileImages={mobileImages} />
      <FeaturedProducts products={featuredProducts.featuredProducts} />
      <ProductCard
        heading="NEW ARRIVALS"
        products={transformedNewArrivalProducts}
      />
      <BlogSection />
    </div>
  );
};

export default HomePage;
