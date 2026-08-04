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
  type HarnessProfileDraft,
  type PageId,
  type ProjectLoopContext,
  type ReviewStep,
  type TemplateEvolutionForm,
  type TenantForm,
  type UserForm,
  type WorkspaceForm
} from "../model";

export function AuthScreen({
  authNotice,
  authLoading,
  loginForm,
  onLoginForm,
  onLogin
}: {
  authNotice: string;
  authLoading: boolean;
  loginForm: { username: string; password: string };
  onLoginForm: (form: { username: string; password: string }) => void;
  onLogin: () => void;
}) {
  return (
    <main className="auth-screen" aria-label="EvoPilot Dashboard sign in">
      <section className="auth-brand">
        <div className="brand-row">
          <span className="brand-mark-small">E</span>
          <strong>EvoPilot</strong>
        </div>
        <div>
          <h1>Control plane access starts here.</h1>
          <p>登录后，Dashboard 会用 EvoPilot 返回的用户身份锁定 tenant、workspace、actor scope，再进入 Agent Console。</p>
        </div>
        <div className="brand-evidence">
          <div><strong>Auth</strong><span>Bearer session token stored in sessionStorage only.</span></div>
          <div><strong>Scope</strong><span>Tenant and workspace come from the signed-in user.</span></div>
          <div><strong>RBAC</strong><span>普通用户只看核心链路，管理员才看平台页面。</span></div>
          <div><strong>Audit</strong><span>Every protected action reports requestId and nextAction.</span></div>
        </div>
      </section>
      <section className="auth-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">EvoPilot Dashboard</span>
            <h2>登录控制台</h2>
          </div>
          <span className="tag amber">API auth required</span>
        </div>
        <label>
          <span>Username</span>
          <input autoFocus value={loginForm.username} onChange={(event) => onLoginForm({ ...loginForm, username: event.currentTarget.value })} />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={loginForm.password} onChange={(event) => onLoginForm({ ...loginForm, password: event.currentTarget.value })} onKeyDown={(event) => {
            if (event.key === "Enter" && loginForm.username && loginForm.password) onLogin();
          }} />
        </label>
        <button className="btn primary wide" type="button" onClick={onLogin} disabled={authLoading || !loginForm.username || !loginForm.password}>
          <LogIn size={15} aria-hidden="true" /> {authLoading ? "Signing in..." : "登录"}
        </button>
        <div className="notice amber">
          <strong>{authNotice}</strong>
          <span>首次部署通常由平台管理员初始化 admin 账号；其他用户由平台管理员或租户管理员创建并分配 tenant/workspace。</span>
        </div>
      </section>
    </main>
  );
}

export function PasswordChangeScreen({
  session,
  authNotice,
  authLoading,
  passwordForm,
  onPasswordForm,
  onChangePassword,
  onSignOut
}: {
  session?: DashboardSession;
  authNotice: string;
  authLoading: boolean;
  passwordForm: { currentPassword: string; newPassword: string };
  onPasswordForm: (form: { currentPassword: string; newPassword: string }) => void;
  onChangePassword: () => void;
  onSignOut: () => void;
}) {
  return (
    <main className="auth-screen centered" aria-label="EvoPilot Dashboard password change">
      <section className="auth-panel lock-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Password change required</span>
            <h2>必须先修改默认密码</h2>
          </div>
          <span className="tag amber">{roleLabel(session)}</span>
        </div>
        <p className="panel-copy">{session?.user?.username ?? "signed-in user"} 已登录，但服务器要求先改密。完成后才能进入 Agent Console 或管理员页面。</p>
        <label>
          <span>Current Password</span>
          <input type="password" value={passwordForm.currentPassword} onChange={(event) => onPasswordForm({ ...passwordForm, currentPassword: event.currentTarget.value })} />
        </label>
        <label>
          <span>New Password</span>
          <input type="password" value={passwordForm.newPassword} onChange={(event) => onPasswordForm({ ...passwordForm, newPassword: event.currentTarget.value })} />
        </label>
        <div className="actions split">
          <button className="btn primary" type="button" onClick={onChangePassword} disabled={authLoading || !passwordForm.currentPassword || !passwordForm.newPassword}>完成改密</button>
          <button className="btn" type="button" onClick={onSignOut}>退出</button>
        </div>
        <div className="notice green"><strong>{authNotice}</strong><span>改密成功后，新的 session token 会替换当前会话。</span></div>
      </section>
    </main>
  );
}

