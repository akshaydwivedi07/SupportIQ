import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { createEmbedding } from "@/lib/embeddings";
import { pineconeIndex } from "@/lib/pinecone";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
    try {
        const { message, conversationId } = await req.json();

        const questionEmbedding = await createEmbedding(message);

        const results = await pineconeIndex.query({
            vector: questionEmbedding,
            topK: 5,
            includeMetadata: true,
        });

        const context = results.matches
            .map((match: any) => match.metadata?.text)
            .join("\n\n");

        const hasDocumentContext =
            context.trim().length > 0 &&
            results.matches.length > 0 &&
            (results.matches[0].score ?? 0) > 0.7;

        console.log("Top Score:", results.matches[0]?.score);
        console.log("Using Document Mode:", hasDocumentContext);

        console.log("CONTEXT:");
        console.log(context);

        console.log("RESULTS:");
        console.dir(results, { depth: null });






        console.log("User Message:", message);

        // Save user message
        await pool.query(
            `
      INSERT INTO messages
      (conversation_id, role, content)
      VALUES ($1, $2, $3)
      `,
            [conversationId, "user", message]
        );

        await pool.query(
            `
  UPDATE conversations
  SET title = $1
  WHERE id = $2
  AND title = 'New Chat'
  `,
            [message.slice(0, 50), conversationId]
        );

        let prompt = "";


        if (hasDocumentContext) {
            prompt = `
You are SupportIQ.

Answer using the uploaded document context.

If the answer is not found in the document, reply:

"I could not find that information in the uploaded document."

DOCUMENT CONTEXT:
${context}

QUESTION:
${message}
`;
        } else {
            prompt = `
You are SupportIQ, a friendly AI assistant.

Answer naturally and have normal conversations.

USER:
${message}
`;
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        console.log("Response Text:", response.text);

        // Save AI response
        await pool.query(
            `
      INSERT INTO messages
      (conversation_id, role, content)
      VALUES ($1, $2, $3)
      `,
            [conversationId, "assistant", response.text]
        );

        return NextResponse.json({
            reply: response.text,
        });
    } catch (error: any) {
        console.error("CHAT ERROR:", error);

        return NextResponse.json(
            {
                reply: "AI service is temporarily unavailable.",
                error: error?.message || String(error),
            },
            { status: 500 }
        );
    }
}