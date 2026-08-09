import { type CSSProperties } from "react";
import {
  CheckCircle2,
  Eye,
  LogIn,
  LogOut,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  Wrench
} from "lucide-react";
import {
  apiSurface,
  configuredApiBaseUrl,
  controlPlaneBaseUrl,
  type ApiResult,
  type DashboardActionRequest,
  type DashboardActionResult,
  type DashboardScope,
  type DashboardSession
} from "../../api";
import {
  defaultScope,
  fieldText,
  resultItems,
  roleLabel,
  type ChatMessage,
  type ConsoleStep,
  type DrawerKind,
  type HarnessBindingDraft,
  type PageId,
  type ProjectLoopContext,
  type ReviewStep,
  type TenantForm,
  type UserForm,
  type WorkspaceForm
} from "../model";

export function stageState(step: ConsoleStep) {
  const state = [
    { label: "Project Intake", status: "not started", kind: "" },
    { label: "Template Auto-Match", status: "not started", kind: "" },
    { label: "selectedHarness binding", status: "not started", kind: "" },
    { label: "Owner Review", status: "not started", kind: "" },
    { label: "Loop Execution", status: "not started", kind: "" },
    { label: "Release Decision", status: "not started", kind: "" }
  ];
  const done = (index: number) => {
    state[index] = { ...state[index], status: "done", kind: "done" };
  };
  const current = (index: number, status: string, kind = "current") => {
    state[index] = { ...state[index], status, kind };
  };

  if (step === "intake") current(0, "editing goal");
  if (step === "template-match") {
    done(0);
    current(1, "matching template");
  }
  if (step === "drafting") {
    done(0);
    done(1);
    current(2, "planning binding");
  }
  if (step === "review") {
    done(0);
    done(1);
    done(2);
    current(3, "needs owner review");
  }
  if (step === "changes") {
    done(0);
    done(1);
    done(2);
    current(3, "changes applied");
  }
  if (step === "activated") {
    done(0);
    done(1);
    done(2);
    done(3);
    current(4, "planning");
  }
  if (step === "loop") {
    done(0);
    done(1);
    done(2);
    done(3);
    current(4, "running");
  }
  if (step === "blocker") {
    done(0);
    done(1);
    done(2);
    done(3);
    current(4, "blocked repair", "warn");
  }
  if (step === "release") {
    done(0);
    done(1);
    done(2);
    done(3);
    done(4);
    current(5, "GO review");
  }
  return state;
}
