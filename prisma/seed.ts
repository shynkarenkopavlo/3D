import { PrismaClient } from "@prisma/client";
import { demoPhone } from "../data/demo-phone";

const prisma = new PrismaClient();

async function main() {
  const { parts, ...gadget } = demoPhone;
  await prisma.gadget.deleteMany({ where: { slug: gadget.slug } });
  await prisma.gadget.create({
    data: {
      ...gadget,
      parts: {
        create: parts.map(({ specs, ...part }, i) => ({
          ...part,
          sortOrder: i,
          specs: { create: specs.map((s, j) => ({ ...s, sortOrder: j })) },
        })),
      },
    },
  });
  console.log("Seeded:", gadget.slug);
}

main().finally(() => prisma.$disconnect());
