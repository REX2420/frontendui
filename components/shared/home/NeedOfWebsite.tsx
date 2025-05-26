import React from "react";
import { Rabbit, Droplet, Wallet, Users } from "lucide-react";

const NeedOfWebsite = () => {
  const features = [
    {
      icon: Rabbit,
      title: "CRUELTY FREE",
      description:
        "Compassion in every drop: Our promise of ethical, cruelty-free products.",
    },
    {
      icon: Droplet,
      title: "FRAGRANCE FORWARD",
      description: "Opulent and imported fragrance oils in each creation.",
    },
    {
      icon: Wallet,
      title: "AFFORDABLE LUXURY",
      description:
        "Delivering Exceptional Quality and Sophistication at an Affordable Price.",
    },
    {
      icon: Users,
      title: "GENDER NEUTRAL",
      description:
        "Enhance your self-care ritual with bath, body, and personal care products for everyone.",
    },
  ];

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
      <h2 className="heading text-center mb-6 sm:mb-8 md:mb-12">WHY VIBECART</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="flex flex-col items-center text-center p-2 sm:p-3 md:p-4 lg:p-6 rounded-lg hover:bg-muted/30 transition-colors duration-200"
          >
            <div className="relative mb-2 sm:mb-3 md:mb-4 lg:mb-6">
              <img
                src={`/images/features/${index + 1}.png`}
                alt={feature.title}
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 object-contain dark:brightness-0 dark:invert transition-all duration-200"
              />
            </div>
            
            <h3 className="text-xs sm:text-xs md:text-sm lg:text-base font-semibold mb-1 sm:mb-2 md:mb-3 textGap text-foreground leading-tight">
              {feature.title}
            </h3>
            
            <p className="text-xs sm:text-xs md:text-sm textGap text-muted-foreground leading-relaxed text-center">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NeedOfWebsite;
