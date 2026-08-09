import { useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { configuredHarnessHubUrl } from "../../api";

export function TemplatesPage() {
  const [frameKey, setFrameKey] = useState(0);
  const hubUrl = configuredHarnessHubUrl || "http://127.0.0.1:4176";

  return (
    <main className="management-workspace harness-frame-workspace">
      <section className="harness-frame-shell">
        <header className="harness-frame-header">
          <div>
            <span>External Hub</span>
            <h3>evopilot-harness Hub / 专家市场</h3>
            <p>此页面嵌入独立运行的 evopilot-harness；Harness 管理、进化、审批、发布、Catalog 维护和 CLI 都不属于 Dashboard。</p>
          </div>
          <div className="panel-actions">
            <button className="btn ghost" type="button" onClick={() => setFrameKey((value) => value + 1)}>
              <RefreshCw size={15} aria-hidden="true" /> 刷新
            </button>
            <a className="btn ghost" href={hubUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={15} aria-hidden="true" /> 打开独立 Hub
            </a>
          </div>
        </header>
        <div className="harness-frame-meta">
          <span>iframe source</span>
          <code>{hubUrl}</code>
        </div>
        <iframe
          key={frameKey}
          className="harness-hub-frame"
          src={hubUrl}
          title="evopilot-harness Hub"
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
        />
      </section>
    </main>
  );
}
