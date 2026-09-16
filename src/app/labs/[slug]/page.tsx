import { notFound } from "next/navigation";
import GuidedLab from "@/components/lab/GuidedLab";
import EngineGuidedRunner from "@/components/lab/EngineGuidedRunner";
import { guidedBySlug } from "@/lib/content/guided";
import { engineGuidedBySlug } from "@/lib/content/guided-engine";

export default async function GuidedLabPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (guidedBySlug(slug)) return <GuidedLab slug={slug} />;
  if (engineGuidedBySlug(slug)) return <EngineGuidedRunner slug={slug} />;
  notFound();
}
