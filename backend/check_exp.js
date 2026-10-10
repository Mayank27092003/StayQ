const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Experience'
    ORDER BY ordinal_position;
  `;
  console.log('Columns in Experience table:', cols);
}

main().catch(console.error).finally(() => prisma.$disconnect());
