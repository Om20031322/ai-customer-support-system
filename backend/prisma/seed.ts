import bcrypt from "bcrypt";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@example.com";
  const passwordHash = await bcrypt.hash("Admin@123", 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      name: "Admin",
      role: Role.ADMIN
    },
    create: {
      name: "Admin",
      email,
      passwordHash,
      role: Role.ADMIN
    }
  });

  console.log("Seeded default admin user admin@example.com");
}

main()
  .catch((error) => {
    console.error("Failed to seed admin user", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
