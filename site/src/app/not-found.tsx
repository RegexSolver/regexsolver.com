import type { Metadata } from "next";
import { NotFound } from "@/views/NotFound";

export const metadata: Metadata = {
  title: "Page not found",
  robots: null,
  alternates: { canonical: null },
};

export default function NotFoundPage() {
  return <NotFound />;
}
