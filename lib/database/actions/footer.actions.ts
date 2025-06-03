"use server";

import { handleError } from "@/lib/utils";
import { connectToDatabase } from "../connect";
import Footer from "../models/footer.model";
import { unstable_cache } from "next/cache";

// Get footer data with weekly cache
export const getFooterData = unstable_cache(
  async () => {
    try {
      await connectToDatabase();

      const footer = await Footer.findOne({ "settings.isActive": true }).lean();

      if (!footer) {
        // Return default footer data if none exists
        return {
          success: true,
          footer: {
            companyInfo: {
              name: "Iulaanshop",
              description: "",
              address: {
                street: "Majeedheemagu",
                city: "MAle'",
                state: "Maldives",
                zipCode: "20002",
                country: "Maldives",
              },
              contact: {
                email: "iulaanshop@gmail.com",
                phone: "+960 9777302",
              },
            },
            socialMedia: [
              { platform: "facebook", url: "https://facebook.com/vibecart", isActive: true },
              { platform: "instagram", url: "https://instagram.com/vibecart", isActive: true },
              { platform: "youtube", url: "https://youtube.com/vibecart", isActive: true },
              { platform: "twitter", url: "https://twitter.com/vibecart", isActive: true },
            ],
            navigationSections: [
              {
                sectionTitle: "COMPANY",
                links: [
                  { title: "About Us", url: "/about", isActive: true },
                  { title: "Careers", url: "/careers", isActive: true },
                  { title: "Affiliates", url: "/affiliates", isActive: true },
                  { title: "Blog", url: "/blog", isActive: true },
                  { title: "Contact Us", url: "/contact", isActive: true },
                ],
                isActive: true,
              },
              {
                sectionTitle: "SHOP",
                links: [
                  { title: "New Arrivals", url: "/shop/new-arrivals", isActive: true },
                  { title: "Accessories", url: "/shop/accessories", isActive: true },
                  { title: "Men", url: "/shop/men", isActive: true },
                  { title: "Women", url: "/shop/women", isActive: true },
                  { title: "All Products", url: "/shop", isActive: true },
                ],
                isActive: true,
              },
              {
                sectionTitle: "HELP",
                links: [
                  { title: "Customer Service", url: "/help/customer-service", isActive: true },
                  { title: "My Account", url: "/profile", isActive: true },
                  { title: "Find a Store", url: "/stores", isActive: true },
                  { title: "Legal & Privacy", url: "/legal", isActive: true },
                  { title: "Gift Card", url: "/gift-cards", isActive: true },
                ],
                isActive: true,
              },
            ],
            newsletter: {
              title: "SUBSCRIBE",
              description: "Be the first to get the latest news about trends, promotions, new arrivals, discounts and more!",
              buttonText: "JOIN",
              isActive: true,
            },
            copyright: {
              text: "© 2025 VIBECART",
              showYear: true,
            },
            localization: {
              language: "English",
              country: "United States",
              currency: "USD",
              showLanguage: true,
              showCurrency: true,
            },
            settings: {
              showSecurePayments: true,
              securePaymentsText: "Secure Payments",
              backgroundColor: "#1c1c1c",
              textColor: "#ffffff",
              isActive: true,
            },
          },
          message: "Default footer data returned",
        };
      }

      return {
        success: true,
        footer: JSON.parse(JSON.stringify(footer)),
        message: "Footer data retrieved successfully",
      };
    } catch (error) {
      handleError(error);
      return {
        success: false,
        footer: null,
        message: "Failed to fetch footer data",
      };
    }
  },
  ["footer_data"],
  {
    revalidate: 604800, // 7 days (weekly)
  }
);

// Get footer navigation sections with weekly cache
export const getFooterNavigationSections = unstable_cache(
  async () => {
    try {
      await connectToDatabase();

      const footer = await Footer.findOne({ "settings.isActive": true }).lean() as any;

      if (!footer) {
        return {
          success: false,
          navigationSections: [],
          message: "No footer data found",
        };
      }

      return {
        success: true,
        navigationSections: footer.navigationSections || [],
        message: "Successfully fetched footer navigation sections",
      };
    } catch (error) {
      handleError(error);
      return {
        success: false,
        navigationSections: [],
        message: "Failed to fetch footer navigation sections",
      };
    }
  },
  ["footer_navigation"],
  {
    revalidate: 604800, // 7 days (weekly)
  }
);

// Get footer social media links with weekly cache
export const getFooterSocialMedia = unstable_cache(
  async () => {
    try {
      await connectToDatabase();

      const footer = await Footer.findOne({ "settings.isActive": true }).lean() as any;

      if (!footer) {
        return {
          success: false,
          socialMedia: [],
          message: "No footer data found",
        };
      }

      return {
        success: true,
        socialMedia: footer.socialMedia || [],
        message: "Successfully fetched footer social media links",
      };
    } catch (error) {
      handleError(error);
      return {
        success: false,
        socialMedia: [],
        message: "Failed to fetch footer social media links",
      };
    }
  },
  ["footer_social_media"],
  {
    revalidate: 604800, // 7 days (weekly)
  }
); 