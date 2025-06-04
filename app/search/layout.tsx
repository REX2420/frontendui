import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Products, Blogs & Vendors | VibeCart",
  description: "Search and discover amazing products, insightful blogs, and trusted vendors on VibeCart. Find exactly what you're looking for with our advanced search and filtering options.",
  keywords: "search, products, blogs, vendors, fragrance, perfume, skincare, beauty, ecommerce",
  openGraph: {
    title: "Search | VibeCart",
    description: "Search and discover amazing products, insightful blogs, and trusted vendors on VibeCart.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Search | VibeCart",
    description: "Search and discover amazing products, insightful blogs, and trusted vendors on VibeCart.",
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
} 