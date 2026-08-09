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
        nextAction: "create-goal-and-plan-selected-harness",
        blockers: []
      }, "req-project-preflight-ready"));
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
        plan: {
          schema: "evopilot-goal-plan/v1",
          status: "PENDING_APPROVAL",
          selectedHarness: selectedHarnessProjection(),
          planner: {
            evidence: ["selectedHarness=database-product-harness@2.2.0", "catalogDigest=sha256:mock-catalog", "entryDigest=sha256:mock-db-entry"]
          }
        },
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

    if (method === "GET" && url.pathname === "/api/v1/harness/catalogs") {
      return fulfill(route, ok(harnessCatalogProjection(), "req-harness-catalogs"));
    }

    if (method === "GET" && /^\/api\/v1\/harness\/catalogs\/[^/]+$/.test(url.pathname)) {
      const scan = harnessCatalogScanProjection();
      return fulfill(route, ok({
        schema: "evopilot-harness-catalog-inspect-result/v1",
        mount: scan.mount,
        catalog: scan.catalog,
        templates: scan.templates,
        scan,
        nextAction: "use-catalog-harness-for-project-auto-match"
      }, "req-harness-catalog-inspect"));
    }

    return fulfill(route, ok(defaultProjection(url.pathname), requestIdFrom(key)));
  });

  return { calls };
}

function ok(data: unknown, requestId: string): JsonResponse {
  return { status: 200, requestId, body: { data } };
}

function defaultProjection(pathname: string): unknown {
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
    templates: scan.templates,
    nextAction: "use-catalog-harness-for-project-auto-match"
  };
}

function harnessCatalogScanProjection(): Record<string, unknown> & {
  mount: Record<string, unknown>;
  catalog: Record<string, unknown>;
  templates: Record<string, unknown>[];
} {
  const templates = harnessTemplates();
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
      templateCount: templates.length
    },
    catalog: {
      schema: "evopilot-published-harness-catalog/v1",
      catalogId: "evopilot-public-harness-catalog",
      catalogVersion: 1,
      catalogDigest: "sha256:mock-catalog",
      compatibleEvopilot: ">=3.0.0",
      entries: templates.map((template) => ({
        name: template.id,
        version: template.version,
        layer: template.harnessLayer,
        domain: template.domain,
        status: "published",
        path: template.catalogRef.entryPath,
        digest: template.catalogRef.entryDigest,
        tags: [template.domain]
      })),
      warnings: []
    },
    templates,
    entries: [],
    warnings: []
  };
}

function harnessTemplates(): Record<string, unknown>[] {
  return [
    template("database-product-harness", "Database Product Harness", "2.2.0", "database-product", "sha256:mock-db-entry"),
    template("api-gateway-harness", "API Gateway Harness", "2.2.0", "api-gateway", "sha256:mock-gateway-entry"),
    template("distributed-cache-harness", "Distributed Cache Harness", "0.1.0", "distributed-cache", "sha256:mock-cache-entry")
  ];
}

function template(id: string, name: string, version: string, domain: string, entryDigest: string): Record<string, unknown> {
  return {
    id,
    name,
    version,
    harnessLayer: "domain",
    domain,
    digest: entryDigest,
    catalogRef: {
      catalogId: "evopilot-public-harness-catalog",
      catalogDigest: "sha256:mock-catalog",
      entryPath: `./${id}/${version}/template.yaml`,
      entryDigest
    }
  };
}

function selectedHarnessProjection(): Record<string, unknown> {
  return {
    schema: "evopilot-goal-plan-selected-harness-binding/v1",
    harnessId: "database-product-harness",
    version: "2.2.0",
    status: "PUBLISHED",
    domain: "database-product",
    layer: "domain",
    catalogId: "evopilot-public-harness-catalog",
    catalogDigest: "sha256:mock-catalog",
    entryPath: "./database-product-harness/2.2.0/template.yaml",
    entryDigest: "sha256:mock-db-entry",
    evidence: ["catalogDigest=sha256:mock-catalog", "entryDigest=sha256:mock-db-entry"],
    selectionReasons: ["domain=database-product", "goal mentions database product and SQL compatibility"]
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
