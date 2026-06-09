import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await pool.query(
      `
      DELETE FROM messages
      WHERE conversation_id = $1
      `,
      [id]
    );

    await pool.query(
      `
      DELETE FROM conversations
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
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}