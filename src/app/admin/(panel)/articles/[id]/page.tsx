"use client";
import { useParams } from "next/navigation";
import { ArticleForm } from "@/components/admin/article-form";

export default function EditArticle() {
  const { id } = useParams<{ id: string }>();
  return <ArticleForm key={id} id={id} />;
}
