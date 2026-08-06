import { execSync } from "child_process";
import dotenv from "dotenv";
dotenv.config();

const AZ = '"C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2\\wbin\\az.cmd"';

async function main() {
  const rg = process.env.AZURE_RESOURCE_GROUP || "qofeno-rg-india";
  const email = process.env.ADMIN_EMAIL || "sohailkhannn.0525@gmail.com";

  console.log(`Setting up Azure budget alerts for resource group '${rg}'...`);

  try {
    const startDate = new Date();
    const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-01`;

    const notificationPayload = JSON.stringify([
      {
        enabled: true,
        operator: "GreaterThan",
        threshold: 31.25,
        contactEmails: [email],
        thresholdType: "Actual",
        notificationKey: "alert-25pct"
      },
      {
        enabled: true,
        operator: "GreaterThan",
        threshold: 62.5,
        contactEmails: [email],
        thresholdType: "Actual",
        notificationKey: "alert-50pct"
      },
      {
        enabled: true,
        operator: "GreaterThan",
        threshold: 80,
        contactEmails: [email],
        thresholdType: "Actual",
        notificationKey: "alert-80pct"
      }
    ]);

    execSync(`${AZ} consumption budget create --budget-name "qofeno-student-protect" --amount 80 --category Cost --time-grain Monthly --start-date ${startStr} --end-date ${endStr} --resource-group ${rg} --notifications '${notificationPayload}'`, {
      stdio: "inherit"
    });

    console.log("✓ Budget alerts set at $25, $50, $80 of $100 student credit");
  } catch (err) {
    console.error("Budget alert creation skipped or failed:", err.message);
  }
}

main().catch(console.error);
