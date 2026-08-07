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
          templateRef: "database-product-harness@2.0.0",
          sourceDigest: "sha256:mock-source-digest",
          compiledDigest: "sha256:mock-compiled-digest",
          policyRefs: ["release-governance@1", "observability-required@1"],
          sourceContent: {
            schema: "evopilot-project-harness-profile/v1",
            profileId: "default",
            template: { templateId: "database-product-harness", version: "2.0.0" },
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
            governance: {
              profileActivationRequiresApproval: true,
              promotionRequiresReleaseDecision: true
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
