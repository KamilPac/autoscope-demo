import { readFile } from "node:fs/promises";
import path from "node:path";

const thresholdArg = process.argv[2];
const threshold = Number.isFinite(Number(thresholdArg)) ? Number(thresholdArg) : 95;
const junitPath = path.resolve(process.cwd(), "test-results", "junit.xml");

function extractAttribute(tagText, name) {
  const match = tagText.match(new RegExp(`${name}="(\\d+)"`));
  return match ? Number(match[1]) : 0;
}

async function main() {
  const raw = await readFile(junitPath, "utf8");
  const suitesTagMatch = raw.match(/<testsuites[^>]*>/i);

  if (!suitesTagMatch) {
    throw new Error("Cannot find <testsuites> tag in junit.xml");
  }

  const suitesTag = suitesTagMatch[0];
  const total = extractAttribute(suitesTag, "tests");
  const failures = extractAttribute(suitesTag, "failures");
  const skipped = extractAttribute(suitesTag, "skipped");
  const passed = Math.max(0, total - failures - skipped);
  const passRate = total > 0 ? (passed / total) * 100 : 0;

  const summary = [
    `P0 stability summary`,
    `- total: ${total}`,
    `- passed: ${passed}`,
    `- failed: ${failures}`,
    `- skipped: ${skipped}`,
    `- pass rate: ${passRate.toFixed(2)}%`,
    `- threshold: ${threshold.toFixed(2)}%`,
  ].join("\n");

  console.log(summary);

  if (passRate < threshold) {
    process.exitCode = 1;
    console.error(`Pass rate below threshold.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
