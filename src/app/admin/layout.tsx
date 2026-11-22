import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminNav } from "./_components/nav";
import { editorEnabled } from "@/lib/editor";

export const metadata: Metadata = { title: "Editar a wiki", robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!editorEnabled()) notFound();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <AdminNav />
      <div className="min-w-0 px-4 py-6 md:px-8">{children}</div>
    </div>
  );
}
