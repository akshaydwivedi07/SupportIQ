import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

export async function GET() {
    try {
        const result = await ai.models.embedContent({
            model: "gemini-embedding-001",
            contents: "SupportIQ is an AI customer support platform",
        });
        return NextResponse.json({
            success: true,
            dimension: result.embeddings?.[0]?.values?.length,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                error: "Embedding failed",
            },
            { status: 500 }
        );
    }
}