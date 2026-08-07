import { readFile } from "node:fs/promises";

const requiredFiles = [
  "LICENSE",
  "NOTICE",
  "AGENTS.md",
  "llms.txt",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  ".github/workflows/release-artifacts.yml",
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/feature_request.yml",
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/pull_request_template.md",
  "docs/assets/agent-console.png",
  "docs/reference/open-source-readiness.md",
  "docs/reference/open-source-maturity-report.md",
  "docs/reference/github-metadata.md",
  "docs/operations/self-hosting.md",
  "docs/operations/release-management.md",
  "docs/releases/2.2.0.md",
  "docs/deployment/cloud.md",
  "deploy/ecs/compose.immutable.yaml",
  "scripts/build-release-artifacts.mjs",
  "scripts/verify-release-artifacts.mjs",
  "docs/workflows/example-project-walkthroughs.md",
];

const requiredReadmeLinkTargets = [
  "LICENSE",
  "CHANGELOG.md",
  "SECURITY.md",
  "docs/assets/agent-console.png",
  "docs/reference/open-source-readiness.md",
  "docs/reference/open-source-maturity-report.md",
  "docs/operations/self-hosting.md",
  "docs/operations/release-management.md",
];

const failures = [];

async function readRequired(path, encoding = "utf8") {
  try {
    const content = await readFile(path, encoding);
    if (encoding === "utf8" && !content.trim()) {
      failures.push(`${path} is empty`);
    }
    if (encoding !== "utf8" && content.byteLength === 0) {
      failures.push(`${path} is empty`);
    }
    return content;
  } catch (error) {
    failures.push(`${path} is missing: ${error.message}`);
    return encoding === "utf8" ? "" : Buffer.alloc(0);
  }
}

for (const file of requiredFiles) {
  await readRequired(file, file.endsWith(".png") ? null : "utf8");
}

const packageJson = JSON.parse(await readRequired("package.json"));
if (packageJson.license !== "Apache-2.0") {
  failures.push(`package.json license must be Apache-2.0, got ${packageJson.license ?? "<missing>"}`);
}

const license = await readRequired("LICENSE");
if (!license.includes("Apache License") || !license.includes("Version 2.0")) {
  failures.push("LICENSE must contain Apache License 2.0 text");
}

const notice = await readRequired("NOTICE");
if (!notice.includes("EvoPilot Dashboard") || !notice.includes("Apache License, Version 2.0")) {
  failures.push("NOTICE must identify EvoPilot Dashboard and the Apache License 2.0 basis");
}

const readme = await readRequired("README.md");
for (const target of requiredReadmeLinkTargets) {
  if (!readme.includes(`(${target})`) && !readme.includes(`(./${target})`)) {
    failures.push(`README.md must link to ${target}`);
  }
}

const readiness = await readRequired("docs/reference/open-source-readiness.md");
for (const phrase of ["Public Trust Assets", "Product Evidence Assets", "Validation Commands", "Top-Tier Open Source Boundary"]) {
  if (!readiness.includes(phrase)) {
    failures.push(`docs/reference/open-source-readiness.md must include ${phrase}`);
  }
}

const maturity = await readRequired("docs/reference/open-source-maturity-report.md");
for (const phrase of ["Conclusion", "Capability Coverage", "Top-Tier Gap Assessment", "Maturity Target"]) {
  if (!maturity.includes(phrase)) {
    failures.push(`docs/reference/open-source-maturity-report.md must include ${phrase}`);
  }
}

const selfHosting = await readRequired("docs/operations/self-hosting.md");
for (const phrase of ["15 Minute Path", "Upgrade Path", "Acceptance Checklist"]) {
  if (!selfHosting.includes(phrase)) {
    failures.push(`docs/operations/self-hosting.md must include ${phrase}`);
  }
}

const releaseManagement = await readRequired("docs/operations/release-management.md");
for (const phrase of ["Release Policy", "Versioning", "Release Checklist", "Tag And Push", "Immutable Release Artifacts"]) {
  if (!releaseManagement.includes(phrase)) {
    failures.push(`docs/operations/release-management.md must include ${phrase}`);
  }
}

const walkthroughs = await readRequired("docs/workflows/example-project-walkthroughs.md");
for (const phrase of ["Node API Service", "EvoPilot Dashboard", "AI Agent Stop Rules"]) {
  if (!walkthroughs.includes(phrase)) {
    failures.push(`docs/workflows/example-project-walkthroughs.md must include ${phrase}`);
  }
}

const metadata = await readRequired("docs/reference/github-metadata.md");
for (const phrase of ["Description", "Topics", "Social Preview", "Update Rule"]) {
  if (!metadata.includes(phrase)) {
    failures.push(`docs/reference/github-metadata.md must include ${phrase}`);
  }
}

if (failures.length > 0) {
  console.error("Open-source governance verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Open-source governance verification passed.");
