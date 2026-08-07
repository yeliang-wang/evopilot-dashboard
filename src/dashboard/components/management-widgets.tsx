import { type ReactNode } from "react";
import {
  Eye,
  Pencil,
  Plus,
  X
} from "lucide-react";
import { type DashboardActionResult } from "../../api";
import { fieldText } from "../model";
import { EvidenceRow } from "./evidence";

type RowRecord = Record<string, unknown>;

export function DataPanel({
  title,
  subtitle,
  rows,
  columns,
  empty,
  toolbar,
  actionLabel,
  actionIcon = "edit",
  onRowAction
}: {
  title: string;
  subtitle: string;
  rows: RowRecord[];
  columns: Array<[string, string[]]>;
  empty: string;
  toolbar?: ReactNode;
  actionLabel?: string;
  actionIcon?: "edit" | "eye" | "plus";
  onRowAction?: (row: RowRecord) => void;
}) {
  const gridTemplateColumns = `repeat(${columns.length + (onRowAction ? 1 : 0)}, minmax(0, 1fr))`;
  return (
    <section className="data-panel">
      <div className="panel-headline">
        <PanelTitle eyebrow="Live projection" title={title} subtitle={subtitle} />
        {toolbar && <div className="panel-actions">{toolbar}</div>}
      </div>
      <div className="table">
        <div className="table-head" style={{ gridTemplateColumns }}>
          {columns.map(([label]) => <strong key={label}>{label}</strong>)}
          {onRowAction && <strong>操作</strong>}
        </div>
        {rows.length === 0 ? (
          <div className="empty-row">{empty}</div>
        ) : rows.map((row, index) => (
          <div key={index} className="table-row" style={{ gridTemplateColumns }}>
            {columns.map(([label, keys]) => <TableCell key={label} label={label} value={fieldText(row, keys)} />)}
            {onRowAction && (
              <span className="row-actions">
                <button className="mini-btn" type="button" onClick={() => onRowAction(row)}>
                  {actionIcon === "eye" ? <Eye size={14} aria-hidden="true" /> : actionIcon === "plus" ? <Plus size={14} aria-hidden="true" /> : <Pencil size={14} aria-hidden="true" />}
                  {actionLabel}
                </button>
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="notice amber">
        <strong>Dashboard 不绕过 EvoPilot 控制面。</strong>
        <span>页面显示的是当前 API projection；最终状态以服务端返回的 requestId、status、nextAction 和 audit 为准。</span>
      </div>
    </section>
  );
}

function TableCell({ label, value }: { label: string; value: string }) {
  if (["Status", "Result"].includes(label) && value !== "-") {
    return <span><span className={`status-pill ${statusClassName(value)}`}>{value}</span></span>;
  }
  return <span>{value}</span>;
}

function statusClassName(value: string) {
  const normalized = value.toUpperCase();
  if (normalized.includes("DRAFT") || normalized.includes("WAITING")) return "draft";
  if (normalized.includes("FAIL") || normalized.includes("BLOCK") || normalized.includes("DISABLED")) return "red";
  return "";
}

function PanelTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="panel-title">
      <span>{eyebrow}</span>
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export function AdminDialog({
  eyebrow,
  title,
  subtitle,
  primaryLabel,
  children,
  busy,
  disabled,
  footerNote,
  lastAction,
  onClose,
  onSubmit
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  primaryLabel: string;
  children: ReactNode;
  busy?: boolean;
  disabled?: boolean;
  footerNote?: string;
  lastAction?: DashboardActionResult;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title">
        <header className="modal-header">
          <div>
            <span>{eyebrow}</span>
            <h3 id="admin-dialog-title">{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-close" type="button" aria-label="关闭" onClick={onClose}><X size={15} aria-hidden="true" /></button>
        </header>
        <div className="modal-body">
          {children}
          <ActionEvidence lastAction={lastAction} />
        </div>
        <footer className="modal-footer">
          <small>{footerNote ?? "保存后仍以 EvoPilot API 返回的 requestId、status、nextAction 为准。"}</small>
          <div className="modal-footer-actions">
            <button className="btn ghost" type="button" onClick={onClose}>取消</button>
            <button className="btn green" type="button" disabled={busy || disabled} onClick={onSubmit}>{busy ? "submitting" : primaryLabel}</button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function ActionEvidence({ lastAction }: { lastAction?: DashboardActionResult }) {
  return (
    <div className="drawer-card">
      <strong>Last action evidence</strong>
      <small>{lastAction ? `${lastAction.actionLabel}: ${lastAction.status}` : "No action on this page yet."}</small>
      <EvidenceRow label="requestId" value={lastAction?.requestId ?? "not returned"} />
      <EvidenceRow label="nextAction" value={lastAction?.nextAction ?? "none"} />
    </div>
  );
}
