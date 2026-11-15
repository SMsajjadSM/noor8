"use client";
import { useParams } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  return <ProductForm key={id} id={id} />;
}
