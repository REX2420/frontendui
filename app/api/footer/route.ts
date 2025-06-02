import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Footer from "@/lib/database/models/footer.model";

export async function GET() {
    try {
        await connectToDatabase();

        const footer = await Footer.findOne({ "settings.isActive": true });

        if (!footer) {
            // Return default footer data if none exists
            return NextResponse.json({
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
            });
        }

        return NextResponse.json({
            success: true,
            footer: JSON.parse(JSON.stringify(footer)),
            message: "Footer data retrieved successfully",
        });
    } catch (error: any) {
        console.error("Error fetching footer data:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                footer: null,
            },
            { status: 500 }
        );
    }
} 