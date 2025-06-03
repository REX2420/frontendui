"use client";

import React from "react";
import { Rabbit, Droplet, Wallet, Users } from "lucide-react";

const NeedOfWebsite = () => {
  const features = [
    {
      icon: Rabbit,
      title: "CRUELTY FREE",
      description:
        "Compassion in every drop: Our promise of ethical, cruelty-free products.",
      color: "from-emerald-400 to-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      icon: Droplet,
      title: "FRAGRANCE FORWARD",
      description: "Opulent and imported fragrance oils in each creation.",
      color: "from-blue-400 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: Wallet,
      title: "AFFORDABLE LUXURY",
      description:
        "Delivering Exceptional Quality and Sophistication at an Affordable Price.",
      color: "from-purple-400 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
      icon: Users,
      title: "GENDER NEUTRAL",
      description:
        "Enhance your self-care ritual with bath, body, and personal care products for everyone.",
      color: "from-orange-400 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400"
    },
  ];

  return (
    <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16 section-fade-in">
      <div className="text-center mb-8 sm:mb-12 md:mb-16">
        <h2 className="heading mb-4">WHY VIBECART</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
          Discover what makes our products special and why thousands of customers trust us for their fragrance needs.
        </p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <div 
              key={index} 
              className={`group feature-card-hover ${feature.bgColor} border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl cursor-pointer`}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="relative mb-4 sm:mb-5 md:mb-6">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center icon-bounce shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                  <IconComponent className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white`} />
                </div>
                
                {/* Alternative: Use custom images if available */}
                {/* <img
                  src={`/images/features/${index + 1}.png`}
                  alt={feature.title}
                  className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 object-contain dark:brightness-0 dark:invert transition-all duration-200 icon-bounce"
                /> */}
              </div>
              
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-2 sm:mb-3 md:mb-4 textGap text-foreground leading-tight group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
                {feature.title}
              </h3>
              
              <p className="text-xs sm:text-sm md:text-sm textGap text-muted-foreground leading-relaxed text-center group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                {feature.description}
              </p>

              {/* Subtle gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl pointer-events-none`}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NeedOfWebsite;
