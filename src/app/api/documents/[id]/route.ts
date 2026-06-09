import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { pineconeIndex } from "@/lib/pinecone";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get filename first
        const result = await pool.query(
            `
      SELECT file_name
      FROM documents
      WHERE id = $1
      `,
            [id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Document not found" },
                { status: 404 }
            );
        }

        const fileName = result.rows[0].file_name;

        console.log("Deleting:", fileName);

        // Delete vectors from Pinecone
        await pineconeIndex.deleteMany({
            filter: {
                fileName: { $eq: fileName },
            },
        });
        // Delete document record
        await pool.query(
            `
      DELETE FROM documents
      WHERE id = $1
      `,
            [id]
        );

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Failed to delete document" },
            { status: 500 }
        );
    }
}