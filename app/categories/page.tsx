import CategoriesPageComponent from "@/components/shared/categories";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "All Categories | VibeCart",
  description: "Browse all product categories available at VibeCart - Find everything you need in one place",
};

const CategoriesPage = () => {
  return (
    <div>
      <CategoriesPageComponent />
    </div>
  );
};

export default CategoriesPage; 