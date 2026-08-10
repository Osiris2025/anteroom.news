import { NextRequest } from "next/server";
import { eq, and, desc, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { product } from "@/drizzle/schema";

// GET /api/products — public endpoint, returns active products sorted by sortOrder
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(product)
      .where(eq(product.active, true))
      .orderBy(asc(product.sortOrder), asc(product.createdAt))
      .limit(50);

    return Response.json({ products: rows });
  } catch (e: any) {
    console.error("GET /api/products error:", e);
    return Response.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}