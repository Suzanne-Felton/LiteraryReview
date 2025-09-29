import fs from "node:fs";
import path from "node:path";

const deploymentsDir = path.resolve("deployments/sepolia/LiteraryReview.json");
const outDir = path.resolve("../literaryreview-frontend/abi");
fs.mkdirSync(outDir, { recursive: true });

const deployment = JSON.parse(fs.readFileSync(deploymentsDir, "utf-8"));

const abiOut = path.join(outDir, "LiteraryReviewABI.ts");
fs.writeFileSync(
  abiOut,
  `export const LiteraryReviewABI = ${JSON.stringify({ abi: deployment.abi }, null, 2)} as const;\n`
);

const addrOut = path.join(outDir, "LiteraryReviewAddresses.ts");
fs.writeFileSync(
  addrOut,
  `export const LiteraryReviewAddresses = {\n  "11155111": { address: "${deployment.address}" }\n} as const;\n`
);

console.log("ABI and address exported to frontend/abi");


