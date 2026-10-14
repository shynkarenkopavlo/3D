import { notFound } from "next/navigation";
import Viewer from "@/components/Viewer";
import { getGadget } from "@/lib/gadgets";

export const dynamic = "force-dynamic";

export default async function GadgetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gadget = await getGadget(slug);
  if (!gadget) notFound();
  return <Viewer gadget={gadget} />;
}
