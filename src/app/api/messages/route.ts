import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const conversationId = searchParams.get("conversationId");

    const result = await pool.query(
      `
      SELECT *
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      `,
      [conversationId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}