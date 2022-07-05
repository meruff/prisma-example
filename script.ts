import { PrismaClient } from "@prisma/client";
import { connect } from "http2";
const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      name: "Tony",
      age: 46,
      email: "tony@nomail.com",
    },
  });

  const user = await prisma.user.delete({
    where: {
      email: "sally@test3.com",
    },
  });

  console.log(user);
}

main()
  .catch((e) => {
    console.error(e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
