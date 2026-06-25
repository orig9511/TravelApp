import * as dotenv from "dotenv";
dotenv.config();

import { runSeed } from "../src/admin/seed-runner";

console.log("\n╔═════════════════════════════════════════════════════╗");
console.log("║    PostgreSQL Seed  (Supabase Session Pooler)       ║");
console.log("╚═════════════════════════════════════════════════════╝\n");

runSeed(console.log)
  .then((result) => {
    console.log("\n━━━ SEED COMPLETE ━━━");
    console.log(`  Total records inserted: ${result.total}`);
    console.log(
      `  Target: ${process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ":***@")}`,
    );
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n[fatal]", err);
    process.exit(1);
  });
