import { notFound } from "next/navigation";
import SandboxLab from "@/components/lab/SandboxLab";
import { challengeBySlug } from "@/lib/content/challenges";

export default async function ChallengePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const challenge = challengeBySlug(slug);
  if (!challenge) notFound();
  return <SandboxLab challenge={challenge} />;
}
