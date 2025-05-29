import React from "react";
import Marquee from "react-fast-marquee";
import { getActiveMarqueeTexts } from "@/lib/database/actions/marquee.actions";

interface MarqueeText {
  _id: string;
  text: string;
  isActive: boolean;
  order: number;
}

interface MarqueeComponentProps {
  marqueeTexts: MarqueeText[];
}

const MarqueeComponent: React.FC<MarqueeComponentProps> = ({ marqueeTexts }) => {
  if (!marqueeTexts || marqueeTexts.length === 0) {
    return null;
  }

  return (
    <Marquee 
      className="bg-orange-600 py-2 px-1 sm:py-2 sm:px-2" 
      speed={50}
      gradient={false}
      pauseOnHover={true}
    >
      {marqueeTexts.map((marquee: MarqueeText, index: number) => (
        <React.Fragment key={marquee._id || index}>
          <span className="text-sm sm:text-base md:text-lg font-extrabold text-white whitespace-nowrap mx-8 sm:mx-12 md:mx-16 lg:mx-20">
            {marquee.text}
          </span>
          {index < marqueeTexts.length - 1 && (
            <span className="text-white mx-8 sm:mx-12 md:mx-16 lg:mx-20">•</span>
          )}
        </React.Fragment>
      ))}
    </Marquee>
  );
};

export default MarqueeComponent; 