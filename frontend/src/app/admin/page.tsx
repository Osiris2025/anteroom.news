import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import AdminHome from "./AdminHome";

const ADMIN_ROLES = ["superadmin", "admin"];

export default async function AdminPage() {
  let role = "";
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    role = (session?.user as any)?.role || "";
  } catch {}
  if (!ADMIN_ROLES.includes(role)) redirect("/profile?msg=Admin only");
  return <AdminHome />;
}
