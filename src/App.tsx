import {
  AuthScreen,
  ChatBubble,
  Composer,
  EvidenceDrawer,
  ManagementPage,
  PasswordChangeScreen,
  Sidebar,
  StageBar,
  Topbar
} from "./dashboard/components";
import { useAgentConsoleController } from "./dashboard/hooks/useAgentConsoleController";

export default function App() {
  const {
    activeDraft,
    activePage,
    apiLoading,
    apiNotice,
    apiSnapshot,
    authLoading,
    authNotice,
    busyAction,
    canEditScope,
    composerGoal,
    consoleStep,
    context,
    demoMode,
    drawer,
    effectiveSession,
    focusedMessages,
    lastAction,
    liveProjectionSummary,
    llmProfileForm,
    loginForm,
    ownerChange,
    passwordForm,
    reviewSteps,
    scope,
    session,
    signedIn,
    stages,
    templateForm,
    tenantForm,
    userForm,
    workspaceForm,
    approvePlanAndAdvance,
    confirmAndActivateHarness,
    performChangePassword,
    performLogin,
    refreshApiSnapshot,
    refreshReleaseEvidence,
    requestProfileChanges,
    runManagementAction,
    setActivePage,
    setDrawer,
    setLoginForm,
    setLlmProfileForm,
    setOwnerChange,
    setPasswordForm,
    setTemplateForm,
    setTenantForm,
    setUserForm,
    setWorkspaceForm,
    signOut,
    startIntake,
    toggleReviewDrawer,
    updateComposerGoal,
    updateScope,
    patchContext
  } = useAgentConsoleController();
  if (!demoMode && !session?.token) {
    return (
      <AuthScreen
        authNotice={authNotice}
        authLoading={authLoading}
        loginForm={loginForm}
        onLoginForm={setLoginForm}
        onLogin={() => void performLogin()}
      />
    );
  }

  if (!demoMode && (session?.mustChangePassword || session?.user?.mustChangePassword)) {
    return (
      <PasswordChangeScreen
        session={session}
        authNotice={authNotice}
        authLoading={authLoading}
        passwordForm={passwordForm}
        onPasswordForm={setPasswordForm}
        onChangePassword={() => void performChangePassword()}
        onSignOut={signOut}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />
      <section className={`console-shell ${activePage === "console" ? "" : "management-mode"}`}>
        <Topbar
          activePage={activePage}
          consoleStep={consoleStep}
          scope={scope}
          session={effectiveSession}
          apiOk={liveProjectionSummary.ok}
          apiFailed={liveProjectionSummary.failed.length}
          onOpenSession={() => setDrawer("session")}
          onRefresh={() => void refreshApiSnapshot()}
          refreshing={apiLoading}
        />
        {activePage === "console" ? (
          <>
            <StageBar stages={stages} />
            <main className={`workspace ${drawer ? "" : "drawer-closed"}`}>
              <section className="conversation" aria-label="EvoPilot Agent Console conversation">
                <div className="thread">
                  {focusedMessages.map((message) => (
                    <ChatBubble
                      key={message.id}
                      message={message}
                      context={context}
                      profileDraft={activeDraft}
                      reviewSteps={reviewSteps}
                      lastAction={lastAction}
                    />
                  ))}
                </div>
                <Composer
                  consoleStep={consoleStep}
                  context={context}
                  goal={composerGoal}
                  ownerChange={ownerChange}
                  busyAction={busyAction}
                  onPatchContext={patchContext}
                  onGoalChange={updateComposerGoal}
                  onOwnerChange={setOwnerChange}
                  onStart={() => void startIntake()}
                  onRequestChanges={() => void requestProfileChanges()}
                  onConfirm={() => void confirmAndActivateHarness()}
                  onApproveAndAdvance={() => void approvePlanAndAdvance()}
                  onViewEvidence={toggleReviewDrawer}
                  onViewRelease={() => void refreshReleaseEvidence()}
                  llmProfilesResult={apiSnapshot.llmProfiles}
                  projectLlmResult={apiSnapshot.projectLlm}
                  onBindProjectLlm={(profileId) => void runManagementAction({
                    id: "project-bind-llm-profile",
                    label: "Bind project LLM profile",
                    method: "POST",
                    path: `/api/v1/projects/${encodeURIComponent(context.projectId)}/llm`,
                    body: { profileId, required: true }
                  })}
                  onManageLlmProfiles={() => setActivePage("llm-profiles")}
                />
              </section>
              {drawer && (
                <EvidenceDrawer
                  kind={drawer}
                  scope={scope}
                  context={context}
                  session={effectiveSession}
                  canEditScope={canEditScope}
                  signedIn={signedIn}
                  authNotice={authNotice}
                  authLoading={authLoading}
                  loginForm={loginForm}
                  passwordForm={passwordForm}
                  apiNotice={apiNotice}
                  apiLoading={apiLoading}
                  snapshot={apiSnapshot}
                  profileDraft={activeDraft}
                  lastAction={lastAction}
                  onLoginForm={setLoginForm}
                  onPasswordForm={setPasswordForm}
                  onLogin={() => void performLogin()}
                  onChangePassword={() => void performChangePassword()}
                  onSignOut={signOut}
                  onScopeChange={updateScope}
                  onPatchContext={patchContext}
                  onRefresh={() => void refreshApiSnapshot()}
                />
              )}
            </main>
          </>
        ) : (
          <ManagementPage
            page={activePage}
            scope={scope}
            session={effectiveSession}
            snapshot={apiSnapshot}
            lastAction={lastAction}
            busyAction={busyAction}
            tenantForm={tenantForm}
            workspaceForm={workspaceForm}
            userForm={userForm}
            templateForm={templateForm}
            llmProfileForm={llmProfileForm}
            onTenantForm={setTenantForm}
            onWorkspaceForm={setWorkspaceForm}
            onUserForm={setUserForm}
            onTemplateForm={setTemplateForm}
            onLlmProfileForm={setLlmProfileForm}
            onRunAction={(action) => void runManagementAction(action)}
            onRefresh={() => void refreshApiSnapshot()}
          />
        )}
      </section>
    </div>
  );
}
