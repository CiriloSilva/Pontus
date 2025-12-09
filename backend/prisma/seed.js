const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function main(){
  const hash = await bcrypt.hash('pontusadmin123',10);
  await prisma.user.upsert({
    where:{ email:'admin@pontus.local' },
    update:{},
    create:{ name:'Admin', email:'admin@pontus.local', password:hash, role:'admin' }
  });
  console.log("Admin created: admin@pontus.local / pontusadmin123");
}
main().finally(()=>prisma.$disconnect());
