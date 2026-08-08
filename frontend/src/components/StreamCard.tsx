import Link from "next/link";

interface StreamData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
  accent: string;
}

export default function StreamCard({ stream }: { stream: StreamData }) {
  return (
    <Link
      href={`/streams/${stream.id}`}
      className="stream-card block rounded-2xl p-6"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderLeft: `4px solid ${stream.accent}`,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: stream.accent }}
        />
        <h2 className="text-xl font-bold" style={{ color: stream.accent }}>
          {stream.name}
        </h2>
      </div>
      <p
        className="text-sm font-semibold mb-2"
        style={{ color: stream.color }}
      >
        {stream.tagline}
      </p>
      <p style={{ color: "var(--text-secondary)" }} className="text-sm">
        {stream.description}
      </p>
    </Link>
  );
}
