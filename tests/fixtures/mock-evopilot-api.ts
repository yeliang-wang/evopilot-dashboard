import type { Page, Route } from "@playwright/test";

export type MockEvoPilotScenario = "happy-path" | "blocked-preflight";

export interface MockEvoPilotApi {
  calls: string[];
}

interface JsonResponse {
  status?: number;
  body: unknown;
  requestId: string;
}

export async function mockEvoPilotApi(
  page: Page,
  scenario: MockEvoPilotScenario = "happy-path"
): Promise<MockEvoPilotApi> {
  const calls: string[] = [];

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const key = `${method} ${url.pathname}`;
    calls.push(key);

    if (method === "GET" && url.pathname === "/api/v1/auth/bootstrap") {
      return fulfill(route, ok({ schema: "evopilot-auth-bootstrap/v1" }, "req-auth-bootstrap"));
    }

    if (method === "POST" && url.pathname === "/api/v1/auth/login") {
      return fulfill(route, ok({
        token: "mock-session-token",
        user: {
          username: "project-owner",
          role: "operator",
          tenantId: "tenant-production",
          workspaceId: "workspace-agent-products",
          displayName: "Project Owner",
          platformAdmin: false
        }
      }, "req-auth-login"));
    }

    if (method === "POST" && url.pathname === "/api/v1/onboarding/project/checklist") {
      if (scenario === "blocked-preflight") {
        return fulfill(route, {
          status: 409,
          requestId: "req-project-preflight-blocked",
          body: {
            schema: "evopilot-project-onboarding-checklist/v1",
            status: "BLOCKED",
            nextAction: "connect-github-account",
            blockers: ["missing-source-credential-ref"],
            message: "Server-side tokenRef is required before writeback or release readiness."
          }
        });
      }

      return fulfill(route, ok({
        schema: "evopilot-project-onboarding-checklist/v1",
        status: "READY",
        nextAction: "generate-harness-profile",
        blockers: []
      }, "req-project-preflight-ready"));
    }

    if (method === "POST" && /\/api\/v1\/projects\/[^/]+\/harness-profiles\/generate$/.test(url.pathname)) {
      return fulfill(route, ok({
        schema: "evopilot-project-harness-profile-generation/v1",
        profile: {
          profileId: "default",
          version: 1,
          status: "DRAFT",
          templateRef: "database-product-harness@2.2.0",
          sourceDigest: "sha256:mock-source-digest",
          compiledDigest: "sha256:mock-compiled-digest",
          policyRefs: ["release-governance@1", "observability-required@1"],
          sourceContent: {
            schema: "evopilot-project-harness-profile/v1",
            profileId: "default",
            template: { templateId: "database-product-harness", version: "2.2.0" },
            runtime: {
              harnessLayer: "domain",
              domain: "database-product",
              compatibilityProfiles: [
                { id: "postgres-compatible", role: "compatibility-oracle" },
                { id: "mysql-compatible", role: "compatibility-oracle" },
                { id: "ansi-sql", role: "standards-baseline" }
              ],
              architectureProfiles: [
                { id: "distributed" },
                { id: "htap" }
              ],
              runtimeProfiles: ["java", "go", "rust", "generic"],
              referenceBoundary: {
                allowedRoles: ["compatibility corpus", "differential oracle"],
                forbiddenRoles: ["replace the owner's product"]
              }
            },
            validation: {
              requiredActions: [
                "declare-database-product-boundary",
                "map-engine-module-boundaries",
                "bind-sql-compatibility-suite",
                "bind-correctness-and-recovery-suite"
              ],
              missingModuleBoundaries: []
            },
            evidence: {
              evidenceAdapters: [
                { artifact: "sql-compatibility-report", commandGroup: "functional" },
                { artifact: "differential-oracle-report", commandGroup: "functional" },
                { artifact: "crash-recovery-log", commandGroup: "functional" },
                { artifact: "benchmark-summary", commandGroup: "functional" }
              ]
            },
            rules: {
              domainHarnessRequiredActions: [
                { id: "declare-database-product-boundary" },
                { id: "map-engine-module-boundaries" },
                { id: "bind-sql-compatibility-suite" },
                { id: "bind-correctness-and-recovery-suite" }
              ],
              domainHarnessReleaseBlockers: [
                "missing product boundary declaration",
                "missing module boundary map",
                "missing SQL compatibility report",
                "missing crash recovery proof"
              ]
            },
            governance: {
              profileActivationRequiresApproval: true,
              promotionRequiresReleaseDecision: true
            },
            metadata: {
              repoProbe: {
                schema: "evopilot-domain-harness-repo-probe/v1",
                status: "PROBED",
                domain: "database-product",
                missingModuleBoundaries: [],
                moduleSignals: [
                  { id: "planner", matchedPaths: ["src/planner"] },
                  { id: "storage", matchedPaths: ["src/storage"] }
                ]
              }
            }
          },
          compiledContent: "compiled v2 domain harness profile",
          generatedBy: {
            evidence: ["templateSelection=auto-match", "domain=database-product", "domainSignal=database product"],
            selectionReasons: ["matches database product domain and compatibility requirements"]
          },
          validation: {
            status: "READY",
            checks: ["source-coverage", "policy-refs", "owner-review-pack"]
          },
          diffFromActive: {
            status: "DRAFT_ONLY",
            changes: ["new active harness candidate"]
          }
        }
      }, "req-harness-generate"));
    }

    if (method === "POST" && /\/api\/v1\/projects\/[^/]+\/harness-profiles\/[^/]+\/activate$/.test(url.pathname)) {
      return fulfill(route, ok({
        schema: "evopilot-project-harness-profile-activation/v1",
        status: "ACTIVE",
        profileId: "default",
        version: 1
      }, "req-harness-activate"));
    }

    if (method === "POST" && url.pathname === "/api/v1/goals") {
      return fulfill(route, ok({
        schema: "evopilot-goal/v1",
        id: "goal-mock-ga"
      }, "req-goal-create"));
    }

    if (method === "POST" && /\/api\/v1\/goals\/[^/]+\/plan$/.test(url.pathname)) {
      return fulfill(route, ok({
        schema: "evopilot-goal-phase-plan/v1",
        status: "REVIEW",
        nextAction: "approve-goal-plan"
      }, "req-goal-plan"));
    }

    if (method === "POST" && /\/api\/v1\/goals\/[^/]+\/approve-plan$/.test(url.pathname)) {
      return fulfill(route, ok({
        schema: "evopilot-goal-phase-plan-approval/v1",
        status: "APPROVED"
      }, "req-goal-plan-approve"));
    }

    if (method === "POST" && /\/api\/v1\/goals\/[^/]+\/advance$/.test(url.pathname)) {
      return fulfill(route, ok({
        schema: "evopilot-goal-advance/v1",
        status: "RUNNING",
        nextAction: "poll-run-status"
      }, "req-goal-advance"));
    }

    if (method === "POST" && url.pathname === "/api/v1/harness/template-matches") {
      return fulfill(route, ok(templateMatchProjection(), "req-harness-template-match"));
    }

    if (method === "POST" && url.pathname === "/api/v1/harness/template-evolutions/evolve") {
      return fulfill(route, {
        status: 201,
        requestId: "req-harness-evolve",
        body: {
          data: harnessEvolveProjection()
        }
      });
    }

    if (method === "POST" && url.pathname === "/api/v1/harness/catalogs") {
      return fulfill(route, {
        status: 201,
        requestId: "req-harness-catalog-mount",
        body: {
          data: {
            schema: "evopilot-harness-catalog-mount-result/v1",
            mount: harnessCatalogProjection().mounts[0],
            scan: harnessCatalogScanProjection(),
            templates: harnessTemplateProjection().templates,
            nextAction: "use-catalog-harness-for-project-auto-match"
          }
        }
      });
    }

    if (method === "POST" && /^\/api\/v1\/harness\/catalogs\/[^/]+\/scan$/.test(url.pathname)) {
      return fulfill(route, ok({
        schema: "evopilot-harness-catalog-scan-result/v1",
        scan: harnessCatalogScanProjection(),
        mount: harnessCatalogProjection().mounts[0],
        catalog: harnessCatalogProjection().catalogs[0],
        templates: harnessTemplateProjection().templates,
        nextAction: "use-catalog-harness-for-project-auto-match"
      }, "req-harness-catalog-scan"));
    }

    if (method === "POST" && url.pathname === "/api/v1/harness/template-evolutions") {
      return fulfill(route, {
        status: 201,
        requestId: "req-harness-template-evolution-create",
        body: {
          data: {
            schema: "evopilot-harness-template-evolution-create-result/v1",
            status: "CREATED",
            evolution: {
              schema: "evopilot-harness-template-evolution-run/v1",
              evolutionId: "distributed-cache-harness-0.1.0-mock",
              status: "CREATED",
              baseTemplateRef: { templateId: "go-middleware-harness", version: "1.1.0", digest: "sha256:mock-go-template" },
              targetTemplateId: "distributed-cache-harness",
              targetVersion: "0.1.0",
              sources: [],
              snapshots: [],
              autoMatch: templateMatchProjection().match,
              blockers: [],
              warnings: []
            },
            autoMatch: templateMatchProjection().match,
            nextAction: "advance-template-evolution"
          }
        }
      });
    }

    return fulfill(route, ok(defaultProjection(url.pathname), requestIdFrom(key)));
  });

  return { calls };
}

function ok(data: unknown, requestId: string): JsonResponse {
  return { status: 200, requestId, body: { data } };
}

function defaultProjection(pathname: string): unknown {
  if (pathname === "/api/v1/harness/catalogs") {
    return harnessCatalogProjection();
  }
  if (pathname === "/api/v1/harness/templates") {
    return harnessTemplateProjection();
  }
  if (pathname === "/api/v1/harness/template-evolutions") {
    return {
      schema: "evopilot-harness-template-evolution-list/v1",
      evolutions: [{
        evolutionId: "database-knowledge-factory-v2",
        status: "REVIEW_REQUIRED",
        targetTemplateId: "database-product-harness",
        targetVersion: "2.2.0",
        sourceCount: 4,
        snapshotCount: 4,
        sourceTypes: ["source-project", "source-corpus", "production-log", "evopilot-history"],
        autoMatch: templateMatchProjection().match,
        domainSignals: ["database-product-domain", "distributed-cache-domain", "scheduler-domain"],
        gapClassifications: ["harness-template", "project-profile", "tenant-policy"],
        nextAction: "review-approve-template-evolution"
      }]
    };
  }
  return {
    schema: "evopilot-dashboard-projection/v1",
    path: pathname,
    items: [],
    status: "READY",
    nextAction: "none",
    blockers: []
  };
}

function harnessCatalogProjection(): {
  schema: string;
  catalogs: Record<string, unknown>[];
  mounts: Record<string, unknown>[];
  scans: Record<string, unknown>[];
  templates: Record<string, unknown>[];
  nextAction: string;
} {
  const scan = harnessCatalogScanProjection();
  return {
    schema: "evopilot-harness-catalog-list/v1",
    catalogs: [scan.catalog],
    mounts: [scan.mount],
    scans: [scan],
    templates: harnessTemplateProjection().templates,
    nextAction: "use-catalog-harness-for-project-auto-match"
  };
}

function harnessCatalogScanProjection(): Record<string, unknown> & {
  mount: Record<string, unknown>;
  catalog: Record<string, unknown>;
  templates: Record<string, unknown>[];
} {
  return {
    schema: "evopilot-harness-catalog-scan-result/v1",
    status: "READY",
    scannedAt: "2026-08-09T00:00:00.000Z",
    mount: {
      schema: "evopilot-harness-catalog-mount/v1",
      catalogId: "evopilot-public-harness-catalog",
      name: "EvoPilot Public Harness Catalog",
      source: "/opt/evopilot-harness/published",
      status: "ACTIVE",
      lastReadStatus: "READY",
      catalogDigest: "sha256:mock-catalog",
      templateCount: 3
    },
    catalog: {
      schema: "evopilot-published-harness-catalog/v1",
      catalogId: "evopilot-public-harness-catalog",
      catalogVersion: 1,
      catalogDigest: "sha256:mock-catalog",
      compatibleEvopilot: ">=2.5.0",
      entries: [
        { name: "database-product-harness", version: "2.2.0", layer: "domain", domain: "database-product", status: "published", path: "./database-product-harness/2.2.0/template.yaml", digest: "sha256:mock-db-entry", tags: ["database"] },
        { name: "api-gateway-harness", version: "2.2.0", layer: "domain", domain: "api-gateway", status: "published", path: "./api-gateway-harness/2.2.0/template.yaml", digest: "sha256:mock-gateway-entry", tags: ["gateway"] },
        { name: "distributed-cache-harness", version: "0.1.0", layer: "domain", domain: "distributed-cache", status: "published", path: "./distributed-cache-harness/0.1.0/template.yaml", digest: "sha256:mock-cache-entry", tags: ["cache"] }
      ],
      warnings: []
    },
    templates: harnessTemplateProjection().templates,
    entries: [],
    warnings: []
  };
}

function harnessTemplateProjection(): { schema: string; templates: Record<string, unknown>[] } {
  return {
    schema: "evopilot-harness-template-set/v1",
    templates: [
      {
        id: "database-product-harness",
        name: "Database Product Harness",
        version: "2.2.0",
        harnessLayer: "domain",
        domain: "database-product",
        digest: "sha256:mock-db-template",
        catalogRef: {
          catalogId: "evopilot-public-harness-catalog",
          catalogDigest: "sha256:mock-catalog",
          entryPath: "./database-product-harness/2.2.0/template.yaml",
          entryDigest: "sha256:mock-db-entry"
        }
      },
      {
        id: "api-gateway-harness",
        name: "API Gateway Harness",
        version: "2.2.0",
        harnessLayer: "domain",
        domain: "api-gateway",
        digest: "sha256:mock-gateway-template",
        catalogRef: {
          catalogId: "evopilot-public-harness-catalog",
          catalogDigest: "sha256:mock-catalog",
          entryPath: "./api-gateway-harness/2.2.0/template.yaml",
          entryDigest: "sha256:mock-gateway-entry"
        }
      },
      {
        id: "distributed-cache-harness",
        name: "Distributed Cache Harness",
        version: "0.1.0",
        harnessLayer: "domain",
        domain: "distributed-cache",
        digest: "sha256:mock-cache-template",
        catalogRef: {
          catalogId: "evopilot-public-harness-catalog",
          catalogDigest: "sha256:mock-catalog",
          entryPath: "./distributed-cache-harness/0.1.0/template.yaml",
          entryDigest: "sha256:mock-cache-entry"
        }
      }
    ]
  };
}

function templateMatchProjection(): { schema: string; match: Record<string, unknown>; nextAction: string } {
  return {
    schema: "evopilot-harness-template-match-result/v1",
    match: {
      schema: "evopilot-harness-template-match-report/v1",
      decision: "CREATE_NEW_FROM_BASE",
      confidence: 0.92,
      baseTemplateRef: { templateId: "go-middleware-harness", version: "1.1.0", digest: "sha256:mock-go-template" },
      targetTemplateId: "distributed-cache-harness",
      targetVersion: "0.1.0",
      targetHarnessLayer: "domain",
      targetDomain: "distributed-cache",
      languageSignals: ["languageSignal=go.mod"],
      runtimeSignals: ["runtime=go", "languageSignal=go.mod"],
      domainSignals: ["domain=distributed-cache", "domainSignal=distributed cache"],
      sourceDigests: ["sha256:mock-source"],
      candidateTemplates: [
        {
          templateRef: { templateId: "go-middleware-harness", version: "1.1.0", digest: "sha256:mock-go-template" },
          harnessLayer: "runtime",
          languageFamily: "go",
          score: 146,
          matchedSignals: ["languageSignal=go.mod"],
          reasons: ["runtimeBase=go"]
        }
      ],
      reasons: ["decision=CREATE_NEW_FROM_BASE", "domain=distributed-cache", "baseTemplate=go-middleware-harness@1.1.0", "target=distributed-cache-harness@0.1.0"],
      llmAdjudication: { used: false, reason: "deterministic matcher used" },
      nextAction: "advance-template-evolution",
      generatedAt: "2026-08-07T00:00:00.000Z"
    },
    nextAction: "advance-template-evolution"
  };
}

function harnessEvolveProjection(): Record<string, unknown> {
  return {
    schema: "evopilot-harness-evolve-result/v1",
    status: "REVIEW_REQUIRED",
    evolutionId: "distributed-cache-harness-0.1.0-mock",
    evolution: {
      schema: "evopilot-harness-template-evolution-run/v1",
      evolutionId: "distributed-cache-harness-0.1.0-mock",
      status: "REVIEW_REQUIRED",
      baseTemplateRef: { templateId: "go-middleware-harness", version: "1.1.0", digest: "sha256:mock-go-template" },
      targetTemplateId: "distributed-cache-harness",
      targetVersion: "0.1.0",
      sources: [],
      snapshots: [{ type: "source-project", contentDigest: "sha256:mock-source" }],
      autoMatch: templateMatchProjection().match,
      blockers: [],
      warnings: []
    },
    autoMatch: templateMatchProjection().match,
    validation: { status: "VALIDATED", blockers: [] },
    workflow: {
      mode: "create",
      defaultStop: "REVIEW_REQUIRED",
      steps: [
        { action: "create", status: "CREATED", nextAction: "advance-template-evolution" },
        { action: "advance", status: "SOURCES_COLLECTED", nextAction: "analyze-template-evolution" },
        { action: "advance", status: "ANALYZED", nextAction: "draft-template-evolution" },
        { action: "advance", status: "REVIEW_REQUIRED", nextAction: "review-approve-template-evolution" }
      ]
    },
    nextAction: "review-approve-template-evolution"
  };
}

async function fulfill(route: Route, response: JsonResponse): Promise<void> {
  await route.fulfill({
    status: response.status ?? 200,
    contentType: "application/json",
    headers: {
      "x-request-id": response.requestId
    },
    body: JSON.stringify(response.body)
  });
}

function requestIdFrom(value: string): string {
  return `req-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}`;
}
