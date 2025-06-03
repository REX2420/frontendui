"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

const fallbackMobileImages = [
  "https://placehold.co/400x200/ea580c/ffffff?text=Mobile+Slide+1",
  "https://placehold.co/400x200/f97316/ffffff?text=Mobile+Slide+2",
  "https://placehold.co/400x200/fb923c/ffffff?text=Mobile+Slide+3",
  "https://placehold.co/400x200/fdba74/ffffff?text=Mobile+Slide+4",
];

const fallbackDesktopImages = [
  "https://placehold.co/800x400/ea580c/ffffff?text=Desktop+Slide+1",
  "https://placehold.co/800x400/f97316/ffffff?text=Desktop+Slide+2",
  "https://placehold.co/800x400/fb923c/ffffff?text=Desktop+Slide+3",
  "https://placehold.co/800x400/fdba74/ffffff?text=Desktop+Slide+4",
];

const BannerCarousel = ({ 
  desktopImages, 
  mobileImages 
}: { 
  desktopImages: any;
  mobileImages?: string[];
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [imageLoaded, setImageLoaded] = useState<boolean[]>([]);
  const [imageError, setImageError] = useState<boolean[]>([]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };
  
  const prevSlide = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(nextSlide, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, [isPlaying]);

  // Improved image processing to handle different data formats
  const processImageData = (imageData: any): string[] => {
    if (!imageData) return [];
    
    // If it's already an array of strings, return it
    if (Array.isArray(imageData) && typeof imageData[0] === 'string') {
      return imageData;
    }
    
    // If it's an array of objects, extract URLs
    if (Array.isArray(imageData)) {
      return imageData
        .filter(item => item && (item.url || item.image))
        .map(item => item.url || item.image);
    }
    
    return [];
  };

  // Process the incoming image data
  const processedDesktopImages = processImageData(desktopImages);
  const processedMobileImages = processImageData(mobileImages);

  // Improved image selection logic with better fallbacks
  const getImages = () => {
    if (isMobile) {
      // For mobile: use mobile images, fallback to desktop, then fallback mobile images
      if (processedMobileImages.length > 0) {
        return processedMobileImages;
      } else if (processedDesktopImages.length > 0) {
        return processedDesktopImages;
      } else {
        return fallbackMobileImages;
      }
    } else {
      // For desktop: use desktop images, fallback to fallback desktop images
      if (processedDesktopImages.length > 0) {
        return processedDesktopImages;
      } else {
        return fallbackDesktopImages;
      }
    }
  };

  const images = getImages();

  // Initialize loaded and error states for images
  useEffect(() => {
    const initialLoadedState = new Array(images.length).fill(false);
    const initialErrorState = new Array(images.length).fill(false);
    
    setImageLoaded(initialLoadedState);
    setImageError(initialErrorState);
    
    // Preload images to trigger onLoad events
    images.forEach((src, index) => {
      const img = new Image();
      img.onload = () => handleImageLoad(index);
      img.onerror = () => handleImageError(index);
      img.src = src;
    });
    
  }, [images.length, images.join(',')]);

  const handleImageLoad = (index: number) => {
    setImageLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  const handleImageError = (index: number) => {
    setImageError(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  // Don't render if no images available
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div
      className={`relative w-full ${
        isMobile ? "h-[300px] sm:h-[400px]" : "h-[400px] md:h-[500px]"
      } overflow-hidden mb-[20px] section-fade-in rounded-lg shadow-2xl`}
    >
      {/* Image Container */}
      {images.map((src, index) => (
        <div
          key={`${src}-${index}`}
          className={`absolute top-0 left-0 w-full h-full transition-all duration-700 ease-in-out ${
            index === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
        >
          {/* Loading skeleton - show while image is loading and no error */}
          {!imageLoaded[index] && !imageError[index] && (
            <div className="absolute inset-0 bg-gradient-to-r from-orange-100 via-orange-200 to-orange-100 animate-pulse flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <div className="text-orange-700 text-sm font-medium">Loading banner...</div>
              </div>
            </div>
          )}

          {/* Error state - show if image failed to load */}
          {imageError[index] && (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <div className="text-center text-orange-700">
                <div className="text-lg font-semibold mb-2">🖼️ Banner Unavailable</div>
                <div className="text-sm">Slide {index + 1}</div>
              </div>
            </div>
          )}
          
          <img
            src={src}
            alt={`Banner slide ${index + 1}`}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              imageLoaded[index] ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => handleImageLoad(index)}
            onError={() => handleImageError(index)}
          />
          
          {/* Gradient overlay for better text readability - only show when image is loaded */}
          {imageLoaded[index] && (
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
          )}
        </div>
      ))}

      {/* Enhanced Navigation Buttons */}
      <Button
        variant={"outline"}
        size={"icon"}
        onClick={prevSlide}
        aria-label="Previous slide"
        className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white border-2 border-orange-200 hover:border-orange-400 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
      >
        <ChevronLeft className="w-6 h-6 text-orange-600" />
      </Button>
      
      <Button
        variant={"outline"}
        size={"icon"}
        onClick={nextSlide}
        aria-label="Next slide"
        className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white border-2 border-orange-200 hover:border-orange-400 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
      >
        <ChevronRight className="w-6 h-6 text-orange-600" />
      </Button>

      {/* Play/Pause Button */}
      <Button
        variant={"outline"}
        size={"icon"}
        onClick={togglePlayPause}
        aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
        className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm hover:bg-white border-2 border-orange-200 hover:border-orange-400 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 text-orange-600" />
        ) : (
          <Play className="w-4 h-4 text-orange-600" />
        )}
      </Button>

      {/* Enhanced Dots Navigation */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {images.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${
              index === currentIndex 
                ? "bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg scale-125" 
                : "bg-white/60 hover:bg-white/80 backdrop-blur-sm"
            }`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300"
          style={{ 
            width: `${((currentIndex + 1) / images.length) * 100}%` 
          }}
        />
      </div>

      {/* Slide Counter */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>
      
    </div>
  );
};

export default BannerCarousel;
