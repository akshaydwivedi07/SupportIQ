import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST() {
  try {
    const result = await pool.query(
      `
      INSERT INTO conversations (title)
      VALUES ($1)
      RETURNING *
      `,
      ["New Chat"]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT *
      FROM conversations
      ORDER BY created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}