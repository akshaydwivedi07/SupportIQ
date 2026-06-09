import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT *
      FROM documents
      ORDER BY uploaded_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}