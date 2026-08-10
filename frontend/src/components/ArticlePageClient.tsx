"use client";
import { useTheme } from "@/lib/ThemeContext";
import ArticleReader from "./ArticleReader";

// Client wrapper: hands ArticleReader the USER'S active theme (from ThemeContext),
// not a static magazine->theme map. User choice always wins; falls back to the
// magazine default if no explicit choice is stored (ThemeContext handles that).
type PArticle = {
  id: string; title: string; headline?: string | null; sourceUrl?: string | null;
  imageUrl?: string | null; efx?: string | null; summary?: string | null; commentary?: string | null;
  subcategory?: string | null; publishedAt?: string | null;
};
type PMag = { id: string; name: string; agentName?: string | null; agentModel?: string | null } | null;

export default function ArticlePageClient({ article, magazine }: { article: PArticle; magazine: PMag }) {
  const { currentTheme } = useTheme();
  return <ArticleReader article={article} magazine={magazine} themeId={currentTheme.id} />;
}