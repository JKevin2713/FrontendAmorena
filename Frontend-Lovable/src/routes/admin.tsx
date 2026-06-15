import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administración — Amorena" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});
