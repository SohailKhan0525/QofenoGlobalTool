import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";

async function main() {
  const reportPath = "./test-results/test-report.json";

  if (!existsSync(reportPath)) {
    console.log("No test report found at ./test-results/test-report.json");
    process.exit(0);
  }

  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  const failures = report.failures || [];

  if (failures.length === 0) {
    console.log("✅ All tools passed! Nothing to fix.");
    process.exit(0);
  }

  console.log(`\n🔧 Fixing ${failures.length} failed tools...\n`);

  for (const failure of failures) {
    console.log(`Fixing: ${failure.slug}`);
    console.log(`Reason: ${failure.reason}`);
  }

  console.log("\nRe-deploying grouped functions...");
  execSync("node scripts/deploy_grouped_functions.mjs", { stdio: "inherit" });

  console.log("\nRe-testing tools...");
  execSync("node scripts/test-tools-real.js", { stdio: "inherit" });
}

main().catch(console.error);
