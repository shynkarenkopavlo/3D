import { demoPhone, type GadgetData } from "@/data/demo-phone";
import { prisma } from "./prisma";

/** Берёт гаджет из PostgreSQL; если базы нет, отдаёт демо-данные. */
export async function getGadget(slug: string): Promise<GadgetData | null> {
  if (process.env.DATABASE_URL) {
    try {
      const gadget = await prisma.gadget.findFirst({
        where: { slug, published: true },
        include: {
          parts: {
            orderBy: { sortOrder: "asc" },
            include: { specs: { orderBy: { sortOrder: "asc" } } },
          },
        },
      });
      if (gadget) return gadget;
    } catch {
      console.warn("База недоступна, используются демо-данные");
    }
  }
  return slug === demoPhone.slug ? demoPhone : null;
}
