import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";

let pat = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;
if (!pat && existsSync(".env.local")) {
  const envContent = readFileSync(".env.local", "utf8");
  pat = envContent.match(/GITHUB_PAT=(.+)/)?.[1]?.trim();
}

if (pat) {
  process.env.GITHUB_TOKEN = pat;
}

const prTitle = process.argv[2] || "fix: tool testing and real file validation improvements";
const prBody = process.argv[3] || "Automated PR via Qofeno dev scripts for Mohd Zaheer Uddin";
const branch = process.argv[4] || `fix/tools-${Date.now()}`;
const baseBranch = "main";

try {
  console.log(`Creating branch ${branch}...`);
  execSync(`git checkout -b ${branch}`, { stdio: "inherit" });
  execSync("git add .", { stdio: "inherit" });
  execSync(`git commit -m "${prTitle}"`, { stdio: "inherit" });
  execSync(`git push origin ${branch}`, { stdio: "inherit" });
  
  console.log(`Creating PR on GitHub...`);
  execSync(
    `gh pr create --title "${prTitle}" --body "${prBody}" --base ${baseBranch} --head ${branch}`,
    { stdio: "inherit" }
  );

  console.log(`\n✅ PR created: ${prTitle}`);
  console.log(`   Branch: ${branch} → ${baseBranch}`);
} catch (err) {
  console.error("❌ PR creation failed:", err.message);
}
