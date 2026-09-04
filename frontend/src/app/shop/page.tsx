"use client";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/ThemeContext";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceCents: number;
  salePriceCents: number | null;
  imageUrl: string | null;
  category: string;
  tags: any;
};

function fmtPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ShopPage() {
  const { currentTheme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setErr(j.error);
        else setProducts(j.products || []);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "var(--accent, #ffd700)", fontWeight: 800, marginBottom: 4 }}>
          Swag Store
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.05, margin: 0, letterSpacing: -0.5 }}>
          🛍️ Catboy Gear
        </h1>
        <p style={{ fontSize: 15, opacity: 0.7, marginTop: 8, lineHeight: 1.5 }}>
          Show your cryptid pride. Mugs, sweatshirts, and more — all officially licensed by CATBOY Industries™.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: 60, opacity: 0.5, fontSize: 14 }}>
          Loading products…
        </div>
      )}

      {/* Error */}
      {err && (
        <div style={{ padding: 14, borderRadius: 8, background: "#3a0a0a", marginBottom: 14, fontSize: 13, color: "#f87171" }}>
          ⚠ {err}
        </div>
      )}

      {/* Product grid */}
      {!loading && !err && products.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, opacity: 0.5 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🧶</div>
          <div style={{ fontSize: 14 }}>No products yet. Check back soon!</div>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {products.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid rgba(150,150,150,.15)",
                borderRadius: 10,
                padding: 16,
                background: "var(--card-bg, rgba(255,255,255,.03))",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {/* Product image */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 48,
                  opacity: 0.8,
                }}
              >
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 1 }}
                    loading="lazy"
                  />
                ) : (
                  (p.category === "swag" ? "🧢" : "📦")
                )}
              </div>

              {/* Category badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: "rgba(255,215,0,.12)", color: "var(--accent, #ffd700)", textTransform: "uppercase", letterSpacing: 1 }}>
                  {p.category}
                </span>
              </div>

              {/* Name */}
              <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{p.name}</div>

              {/* Description */}
              {p.description && (
                <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.4, flex: 1 }}>{p.description}</div>
              )}

              {/* Price */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                {p.salePriceCents ? (
                  <>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "var(--accent, #ffd700)" }}>{fmtPrice(p.salePriceCents)}</span>
                    <span style={{ fontSize: 14, opacity: 0.4, textDecoration: "line-through" }}>{fmtPrice(p.priceCents)}</span>
                  </>
                ) : (
                  <span style={{ fontSize: 20, fontWeight: 900 }}>{fmtPrice(p.priceCents)}</span>
                )}
              </div>

              {/* Buy button — placeholder until Stripe */}
              <button
                disabled
                style={{
                  padding: "10px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13,
                  border: "1px solid rgba(150,150,150,.2)", background: "rgba(150,150,150,.1)",
                  color: "#999", cursor: "not-allowed", marginTop: 4,
                }}
              >
                Coming Soon — Stripe
              </button>
            </div>
          ))}
        </div>
      )}

      {/* How it works */}
      <div style={{
        marginTop: 32, padding: 20, borderRadius: 10,
        border: "1px solid rgba(150,150,150,.1)",
        background: "var(--card-bg, rgba(255,255,255,.02))",
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>About the store</h3>
        <ol style={{ fontSize: 13, lineHeight: 1.7, opacity: 0.8, margin: 0, paddingLeft: 20 }}>
          <li><strong>Catboy gear</strong> — officially licensed by CATBOY Industries™</li>
          <li><strong>AI-themed</strong> — all proceeds support the Anteroom project</li>
          <li><strong>Stripe checkout</strong> — payment processing coming soon (zero PCI, handled by Stripe)</li>
        </ol>
      </div>
    </div>
  );
}