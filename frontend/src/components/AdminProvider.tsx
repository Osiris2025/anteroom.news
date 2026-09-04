"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

// Single shared admin/magazines fetch for the whole page. Every StoryCard and the
// grid consume this instead of firing their own /api/admin/session + /api/magazines
// on mount (which exploded into hundreds of parallel requests on list pages).
type Ctx = {
  isAdmin: boolean;
  magazines: { id: string; name: string }[];
  ready: boolean;
};
const AdminCtx = createContext<Ctx>({ isAdmin: false, magazines: [], ready: false });

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [magazines, setMagazines] = useState<{ id: string; name: string }[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((j) => {
        setIsAdmin(!!j.isAdmin);
        if (j.isAdmin) {
          return fetch("/api/magazines")
            .then((r) => r.json())
            .then((m) => { if (m.magazines) setMagazines(m.magazines.map((x: any) => ({ id: x.id, name: x.name }))); })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  return <AdminCtx.Provider value={{ isAdmin, magazines, ready }}>{children}</AdminCtx.Provider>;
}
export const useAdmin = () => useContext(AdminCtx);