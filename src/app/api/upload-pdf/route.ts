import { NextResponse } from "next/server";
import { extractPdfText } from "@/lib/pdf";
import { chunkText } from "@/lib/chunk";
import { createEmbedding } from "@/lib/embeddings";
import { pineconeIndex } from "@/lib/pinecone";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF
    const text = await extractPdfText(buffer);

    // Split into chunks
    const chunks = chunkText(text);

    console.log("PDF TEXT:");
    console.log(text);

    // Create vectors
    const vectors = [];

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await createEmbedding(chunks[i]);

      vectors.push({
        id: `${file.name}-${i}-${Date.now()}`,
        values: embedding,
        metadata: {
          text: chunks[i],
          fileName: file.name,
          chunkIndex: i,
        },
      });
    }

    console.log("CHUNKS:", chunks.length);
    console.log("VECTORS:", vectors.length);
    console.log(vectors);

    if (vectors.length === 0) {
      return NextResponse.json(
        {
          error: "No text found in PDF",
        },
        { status: 400 }
      );
    }

    // Store in Pinecone
    await pineconeIndex.upsert({
      records: vectors,
    });

    await pool.query(
      `
  INSERT INTO documents (file_name)
  VALUES ($1)
  `,
      [file.name]
    );

    return NextResponse.json({
      success: true,
      fileName: file.name,
      textLength: text.length,
      chunks: chunks.length,
      vectorsStored: vectors.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}