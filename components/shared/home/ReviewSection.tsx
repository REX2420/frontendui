"use client";
import { Star } from "lucide-react";
import React from "react";
import { CiInstagram } from "react-icons/ci";

const reviews = [
  {
    id: 1,
    name: "Milinda Thakur",
    instagram: "milli_thanur_123",
    image: "https://placehold.co/200x200",
    rating: 5,
    text: "VIBECART has set a new standard in the fragrance market, offering exceptional quality at remarkably affordable prices.",
  },
  {
    id: 2,
    name: "Shubhman Ravi",
    instagram: "shubhman_92_ravi",
    image: "https://placehold.co/200x200",
    rating: 5,
    text: "Amazed by the lasting power of these scents. VIBECART provides high-end fragrances at unmatched prices.",
  },
  {
    id: 3,
    name: "Raghav varma",
    instagram: "raghav.varma_89",
    image: "https://placehold.co/200x200",
    rating: 5,
    text: "Discovered my signature fragrance with VIBECART. The meticulous craftsmanship in their perfumes is truly impressive.",
  },
  {
    id: 4,
    name: "Priya Sharma",
    instagram: "priya_sharma_01",
    image: "https://placehold.co/200x200",
    rating: 5,
    text: "Love the variety and quality of fragrances. VIBECART has become my go-to for all perfume needs.",
  },
  {
    id: 5,
    name: "Arjun Singh",
    instagram: "arjun_singh_99",
    image: "https://placehold.co/200x200",
    rating: 5,
    text: "Exceptional customer service and premium quality products. Highly recommend VIBECART to everyone.",
  },
  {
    id: 6,
    name: "Neha Gupta",
    instagram: "neha_gupta_22",
    image: "https://placehold.co/200x200",
    rating: 5,
    text: "The fragrances last all day and the packaging is beautiful. VIBECART exceeded my expectations.",
  },
];

const ReviewSection = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <h2 className="mb-8 heading text-center">
        WHAT OUR CUSTOMERS HAVE TO SAY
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-card text-card-foreground rounded-lg p-3 sm:p-4 flex flex-col items-center border border-border">
            <img
              src={review.image}
              alt={`${review.name}'s profile`}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full mb-3 object-cover"
            />
            <div className="flex mb-2">
              {[...Array(5)].map((_, index: number) => (
                <Star
                  key={index}
                  className={`w-3 h-3 sm:w-4 sm:h-4 ${
                    index < review.rating
                      ? "text-yellow-400 fill-current"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <p className="text-center mb-3 text-xs sm:text-sm line-clamp-3">{review.text}</p>
            <p className="font-semibold text-xs sm:text-sm mb-1 text-center">{review.name}</p>
            <p className="text-muted-foreground flex justify-center items-center gap-1 text-xs">
              <CiInstagram size={12} />
              <span className="truncate">{review.instagram}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewSection;
