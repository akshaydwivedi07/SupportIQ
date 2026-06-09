import { NextResponse } from "next/server";
import { pineconeIndex } from "@/lib/pinecone";
import { createEmbedding } from "@/lib/embeddings";

export async function GET() {
  const embedding = await createEmbedding(
    "SupportIQ test document"
  );

  return NextResponse.json({
    dimensions: embedding.length,
  });
}