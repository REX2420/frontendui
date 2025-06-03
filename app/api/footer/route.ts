import { NextRequest, NextResponse } from "next/server";
import { getFooterData } from "@/lib/database/actions/footer.actions";

export async function GET() {
    try {
        const result = await getFooterData();
        
        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.message,
                    footer: null,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            footer: result.footer,
            message: result.message,
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