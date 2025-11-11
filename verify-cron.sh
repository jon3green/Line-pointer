#!/bin/bash

echo "════════════════════════════════════════════════════"
echo "  Verifying Cron Job Execution"
echo "════════════════════════════════════════════════════"
echo ""

# Check database count
echo "📊 Checking database..."
POSTGRES_PRISMA_URL="postgres://postgres.rtjkntyeqymjjuppackk:qiRSPse2WjJvDKMK@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require" npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.oddsHistory.count();
  const latest = await prisma.oddsHistory.findMany({
    take: 3,
    orderBy: { timestamp: 'desc' },
    select: { homeTeam: true, awayTeam: true, timestamp: true, bookmaker: true }
  });

  console.log('Total odds snapshots:', count);
  console.log('');
  console.log('Latest 3 snapshots:');
  latest.forEach((snap, i) => {
    const time = new Date(snap.timestamp).toLocaleString();
    console.log(\`\${i+1}. \${snap.awayTeam} @ \${snap.homeTeam}\`);
    console.log(\`   \${snap.bookmaker} - \${time}\`);
  });

  await prisma.\$disconnect();
}

check();
" 2>&1

echo ""
echo "════════════════════════════════════════════════════"
echo "  Expected Results:"
echo "════════════════════════════════════════════════════"
echo "  • Total snapshots should increase by ~20 each run"
echo "  • Latest timestamps should be recent"
echo "  • Multiple bookmakers (DraftKings, FanDuel, etc.)"
echo "════════════════════════════════════════════════════"
