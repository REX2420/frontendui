"use server";

import { connectToDatabase } from "@/lib/database/connect";
import Marquee from "@/lib/database/models/marquee.model";
import { unstable_cache } from "next/cache";

// get active marquee texts for frontend with caching
export const getActiveMarqueeTexts = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      const marqueeTexts = await Marquee.find({ isActive: true }).sort({ order: 1 }).lean();
      return {
        marqueeTexts: JSON.parse(JSON.stringify(marqueeTexts)),
        success: true,
        message: "Successfully fetched active marquee texts",
      };
    } catch (error: any) {
      console.log(error);
      return {
        marqueeTexts: [],
        success: false,
        message: "Error fetching marquee texts",
      };
    }
  },
  ["active_marquee_texts"],
  {
    revalidate: 1800, // Cache for 30 minutes
    tags: ["marquee_texts"],
  }
); 