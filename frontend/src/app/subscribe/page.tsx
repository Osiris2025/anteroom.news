import Link from "next/link";

/** Subscribe page — newsletter/membership signup intent. */
export default function SubscribePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/" className="text-sm mb-6 inline-block" style={{ color: "var(--text-secondary)" }}>&larr; Home</Link>
      <h1 className="text-4xl font-black mb-6">Subscribe</h1>
      <div className="rounded-xl p-8" style={{ background: "var(--bg-secondary)" }}>
        <p className="text-lg font-semibold mb-1">Never miss a story</p>
        <p className="mb-5" style={{ color: "var(--text-secondary)" }}>Get the best of all 7 magazines delivered to your inbox.</p>
        <input
          placeholder="your@email.com"
          className="w-full rounded-lg p-3 mb-3"
          style={{ background: "var(--bg-primary)", border: "1px solid var(--bg-secondary)", color: "var(--text-primary)" }}
        />
        <button className="w-full px-6 py-3 rounded-lg font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>Subscribe</button>
      </div>
    </div>
  );
}