#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const version = packageJson.version;

function run(command, args, options = {}) {
  const output = execFileSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
    ...options
  });
  return output == null ? "" : output.trim();
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "evopilot-dashboard-distribution-"));
const runDir = path.join(tempRoot, "runner");
const installDir = path.join(tempRoot, "install-script");

const help = run("node", ["scripts/run-dashboard-container.mjs", "--help"]);
assert.match(help, /EvoPilot Dashboard runner/);
assert.match(help, new RegExp(`evopilot-dashboard:${escapeRegExp(version)}`));

run("node", [
  "scripts/run-dashboard-container.mjs",
  "--dir",
  runDir,
  "--api-url",
  "http://127.0.0.1:19876",
  "--network",
  "evopilot_default",
  "--port",
  "18080"
]);
verifyGeneratedRun(runDir, "http://127.0.0.1:19876", "18080", "evopilot_default");

run("bash", [
  "install.sh",
  "--dir",
  installDir,
  "--api-url",
  "http://127.0.0.1:19876",
  "--network",
  "evopilot_default",
  "--port",
  "18081"
]);
verifyGeneratedRun(installDir, "http://127.0.0.1:19876", "18081", "evopilot_default");

console.log("Dashboard distribution verification passed.");

function verifyGeneratedRun(dir, apiUrl, port, network) {
  for (const relativePath of ["compose.yaml", "README.md", "verify.sh"]) {
    const filePath = path.join(dir, relativePath);
    assert.ok(fs.existsSync(filePath), `${relativePath} should be generated`);
    assert.ok(fs.statSync(filePath).size > 0, `${relativePath} should not be empty`);
  }
  const compose = fs.readFileSync(path.join(dir, "compose.yaml"), "utf8");
  assert.match(compose, new RegExp(`ghcr\\.io/yeliang-wang/evopilot-dashboard:${escapeRegExp(version)}`));
  assert.ok(compose.includes(apiUrl), "compose.yaml should include the configured API URL");
  assert.ok(compose.includes(network), "compose.yaml should include the configured Docker network");
  assert.ok(
    compose.includes(`:-${port}}:8080`) || compose.includes(`${port}:8080`),
    "compose.yaml should include the configured Dashboard port"
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
