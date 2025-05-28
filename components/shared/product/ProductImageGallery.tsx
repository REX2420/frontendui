"use client";

import React, { useState } from "react";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

const ProductImageGallery = ({ images, productName }: ProductImageGalleryProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="w-full">
        <img
          src={images[selectedImageIndex]}
          alt={`${productName} - Main Image`}
          className="w-full h-[500px] object-cover rounded-[10px]"
        />
      </div>
      
      {/* Thumbnail Images */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((imgSrc: string, index: number) => (
            <div 
              key={index} 
              className={`cursor-pointer border-2 rounded-[8px] ${
                index === selectedImageIndex 
                  ? 'border-black' 
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={imgSrc}
                alt={`${productName} - Image ${index + 1}`}
                className="w-full h-24 object-cover rounded-[6px] hover:opacity-80 transition-opacity"
                onClick={() => setSelectedImageIndex(index)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery; 