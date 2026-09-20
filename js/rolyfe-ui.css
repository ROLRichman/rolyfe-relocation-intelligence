/* =========================================================
   RO'LYFE RELOCATION INTELLIGENCE CENTER
   UI SYSTEM
   Phase 1 — Visual Foundation
   ========================================================= */

:root {
  --rl-bg: #070b16;
  --rl-bg-2: #0b1020;
  --rl-panel: rgba(15, 22, 40, 0.82);
  --rl-panel-solid: #10182b;
  --rl-panel-soft: rgba(20, 29, 50, 0.72);

  --rl-text: #f5f7ff;
  --rl-text-soft: #b8c1d9;
  --rl-text-muted: #7f8aa6;

  --rl-border: rgba(255, 255, 255, 0.10);
  --rl-border-strong: rgba(255, 255, 255, 0.18);

  --rl-blue: #38bdf8;
  --rl-cyan: #22d3ee;
  --rl-violet: #8b5cf6;
  --rl-purple: #a855f7;
  --rl-green: #34d399;
  --rl-amber: #fbbf24;
  --rl-orange: #fb923c;
  --rl-red: #f87171;
  --rl-pink: #ec4899;

  --rl-radius-sm: 10px;
  --rl-radius-md: 16px;
  --rl-radius-lg: 22px;
  --rl-radius-xl: 28px;

  --rl-shadow:
    0 18px 55px rgba(0, 0, 0, 0.28);

  --rl-glow:
    0 0 30px rgba(56, 189, 248, 0.10);

  --rl-max-width: 1180px;

  --rl-transition:
    180ms ease;
}

/* =========================================================
   RESET
   ========================================================= */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  background: var(--rl-bg);
}

body {
  margin: 0;
  min-width: 320px;
  background:
    radial-gradient(
      circle at 15% 5%,
      rgba(56, 189, 248, 0.08),
      transparent 30%
    ),
    radial-gradient(
      circle at 85% 15%,
      rgba(139, 92, 246, 0.09),
      transparent 28%
    ),
    radial-gradient(
      circle at 50% 80%,
      rgba(52, 211, 153, 0.045),
      transparent 35%
    ),
    var(--rl-bg);

  color: var(--rl-text);

  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  line-height: 1.5;
  overflow-x: hidden;
}

img,
svg,
video {
  max-width: 100%;
  height: auto;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

a {
  color: inherit;
}

/* =========================================================
   GLOBAL CONTAINER
   ========================================================= */

.rl-container {
  width: min(
    calc(100% - 32px),
    var(--rl-max-width)
  );

  margin-inline: auto;
}

.rl-section {
  position: relative;
  padding: 72px 0;
}

.rl-section-tight {
  padding: 42px 0;
}

/* =========================================================
   HEADER
   ========================================================= */

.rl-header {
  position: sticky;
  top: 0;
  z-index: 900;

  border-bottom: 1px solid var(--rl-border);

  background:
    rgba(7, 11, 22, 0.82);

  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.rl-header-inner {
  min-height: 72px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 20px;
}

.rl-brand {
  display: flex;
  align-items: center;
  gap: 12px;

  text-decoration: none;
}

.rl-brand-mark {
  width: 42px;
  height: 42px;

  display: grid;
  place-items: center;

  border-radius: 13px;

  background:
    linear-gradient(
      135deg,
      var(--rl-cyan),
      var(--rl-violet)
    );

  color: #fff;

  font-weight: 900;

  box-shadow:
    0 0 24px rgba(56, 189, 248, 0.18);
}

.rl-brand-title {
  font-size: 0.95rem;
  font-weight: 800;
}

.rl-brand-subtitle {
  margin-top: 2px;

  color: var(--rl-text-muted);

  font-size: 0.72rem;
}

/* =========================================================
   NAVIGATION
   ========================================================= */

.rl-nav {
  display: flex;
  align-items: center;
  gap: 6px;

  overflow-x: auto;
  scrollbar-width: none;
}

.rl-nav::-webkit-scrollbar {
  display: none;
}

.rl-nav a,
.rl-nav button {
  border: 0;
  background: transparent;

  color: var(--rl-text-soft);

  padding: 9px 11px;

  border-radius: 10px;

  white-space: nowrap;

  text-decoration: none;

  transition:
    background var(--rl-transition),
    color var(--rl-transition);
}

.rl-nav a:hover,
.rl-nav button:hover {
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
}

/* =========================================================
   STATUS / UTILITY BAR
   ========================================================= */

.rl-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 12px;

  padding: 8px 0;

  color: var(--rl-text-muted);

  font-size: 0.75rem;
}

.rl-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.rl-status-dot {
  width: 8px;
  height: 8px;

  border-radius: 50%;

  background: var(--rl-green);

  box-shadow:
    0 0 12px rgba(52, 211, 153, 0.7);
}

.rl-clock {
  font-variant-numeric: tabular-nums;
}

/* =========================================================
   HERO
   ========================================================= */

.rl-hero {
  position: relative;
  overflow: hidden;

  padding: 88px 0 70px;
}

.rl-hero::before {
  content: "";

  position: absolute;

  width: 420px;
  height: 420px;

  top: -180px;
  right: -100px;

  border-radius: 50%;

  background:
    radial-gradient(
      circle,
      rgba(139, 92, 246, 0.20),
      transparent 68%
    );

  pointer-events: none;
}

.rl-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  margin-bottom: 18px;

  padding: 7px 11px;

  border: 1px solid var(--rl-border);

  border-radius: 999px;

  background:
    rgba(255, 255, 255, 0.035);

  color: var(--rl-cyan);

  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.rl-hero h1 {
  max-width: 900px;

  margin: 0;

  font-size:
    clamp(2.4rem, 7vw, 5.6rem);

  line-height: 0.98;

  letter-spacing: -0.055em;
}

.rl-gradient-text {
  background:
    linear-gradient(
      100deg,
      var(--rl-cyan),
      var(--rl-blue),
      var(--rl-violet),
      var(--rl-pink)
    );

  -webkit-background-clip: text;
  background-clip: text;

  color: transparent;
}

.rl-hero p {
  max-width: 760px;

  margin: 24px 0 0;

  color: var(--rl-text-soft);

  font-size:
    clamp(1rem, 2vw, 1.2rem);
}

/* =========================================================
   BUTTONS
   ========================================================= */

.rl-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  margin-top: 30px;
}

.rl-btn {
  min-height: 46px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  gap: 9px;

  padding: 11px 17px;

  border: 1px solid var(--rl-border-strong);

  border-radius: 13px;

  background:
    rgba(255, 255, 255, 0.055);

  color: var(--rl-text);

  font-weight: 800;

  text-decoration: none;

  transition:
    transform var(--rl-transition),
    border-color var(--rl-transition),
    background var(--rl-transition),
    box-shadow var(--rl-transition);
}

.rl-btn:hover {
  transform: translateY(-2px);

  border-color:
    rgba(255, 255, 255, 0.25);

  background:
    rgba(255, 255, 255, 0.09);
}

.rl-btn-primary {
  border-color: transparent;

  background:
    linear-gradient(
      110deg,
      var(--rl-cyan),
      var(--rl-violet)
    );

  color: #fff;

  box-shadow:
    0 10px 35px rgba(56, 189, 248, 0.16);
}

.rl-btn-primary:hover {
  box-shadow:
    0 14px 42px rgba(139, 92, 246, 0.22);
}

/* =========================================================
   CARDS
   ========================================================= */

.rl-card {
  position: relative;

  padding: 22px;

  border: 1px solid var(--rl-border);

  border-radius: var(--rl-radius-md);

  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.055),
      rgba(255, 255, 255, 0.018)
    );

  box-shadow: var(--rl-shadow);

  overflow: hidden;
}

.rl-card::before {
  content: "";

  position: absolute;

  inset: 0;

  background:
    linear-gradient(
      135deg,
      rgba(56, 189, 248, 0.045),
      transparent 40%,
      rgba(139, 92, 246, 0.04)
    );

  pointer-events: none;
}

.rl-card > * {
  position: relative;
  z-index: 1;
}

.rl-card-title {
  margin: 0;

  font-size: 1.05rem;
  font-weight: 850;
}

.rl-card-text {
  margin: 8px 0 0;

  color: var(--rl-text-soft);

  font-size: 0.9rem;
}

/* =========================================================
   SECTION HEADERS
   ========================================================= */

.rl-section-header {
  margin-bottom: 28px;
}

.rl-section-header h2 {
  margin: 0;

  font-size:
    clamp(1.7rem, 4vw, 2.7rem);

  letter-spacing: -0.035em;
}

.rl-section-header p {
  max-width: 720px;

  margin: 9px 0 0;

  color: var(--rl-text-muted);
}

/* =========================================================
   WORKFLOW
   ========================================================= */

.rl-workflow {
  display: grid;

  grid-template-columns:
    repeat(6, minmax(0, 1fr));

  gap: 10px;
}

.rl-step {
  min-width: 0;

  padding: 18px;

  border: 1px solid var(--rl-border);

  border-radius: 15px;

  background:
    rgba(255, 255, 255, 0.035);
}

.rl-step-number {
  color: var(--rl-cyan);

  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.rl-step-title {
  margin-top: 9px;

  font-size: 0.95rem;
  font-weight: 800;
}

.rl-step-text {
  margin-top: 5px;

  color: var(--rl-text-muted);

  font-size: 0.78rem;
}

/* =========================================================
   INTELLIGENCE GRID
   ========================================================= */

.rl-grid {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 16px;
}

.rl-intel-card {
  min-height: 180px;

  display: flex;
  flex-direction: column;

  justify-content: space-between;
}

.rl-intel-icon {
  width: 44px;
  height: 44px;

  display: grid;
  place-items: center;

  border-radius: 13px;

  background:
    rgba(255, 255, 255, 0.06);

  font-size: 1.3rem;
}

.rl-intel-card.location {
  border-color: rgba(56, 189, 248, 0.28);
}

.rl-intel-card.climate {
  border-color: rgba(251, 191, 36, 0.28);
}

.rl-intel-card.risk {
  border-color: rgba(248, 113, 113, 0.28);
}

.rl-intel-card.housing {
  border-color: rgba(52, 211, 153, 0.28);
}

.rl-intel-card.financial {
  border-color: rgba(139, 92, 246, 0.28);
}

.rl-intel-card.opportunity {
  border-color: rgba(236, 72, 153, 0.28);
}

/* =========================================================
   WORKSPACE
   ========================================================= */

.rl-workspace {
  display: grid;

  grid-template-columns:
    minmax(0, 0.9fr)
    minmax(0, 1.1fr);

  gap: 18px;
}

.rl-form {
  display: grid;
  gap: 15px;
}

.rl-field {
  display: grid;
  gap: 7px;
}

.rl-field label {
  color: var(--rl-text-soft);

  font-size: 0.78rem;
  font-weight: 750;
}

.rl-field input,
.rl-field select,
.rl-field textarea {
  width: 100%;

  min-height: 46px;

  padding: 11px 13px;

  border: 1px solid var(--rl-border);

  border-radius: 12px;

  outline: none;

  background:
    rgba(0, 0, 0, 0.24);

  color: var(--rl-text);

  transition:
    border-color var(--rl-transition),
    box-shadow var(--rl-transition);
}

.rl-field textarea {
  min-height: 110px;
  resize: vertical;
}

.rl-field input:focus,
.rl-field select:focus,
.rl-field textarea:focus {
  border-color:
    rgba(56, 189, 248, 0.65);

  box-shadow:
    0 0 0 3px rgba(56, 189, 248, 0.09);
}

.rl-checkbox-grid {
  display: grid;

  grid-template-columns:
    repeat(2, minmax(0, 1fr));

  gap: 8px;
}

.rl-checkbox {
  display: flex;
  align-items: center;

  gap: 8px;

  padding: 10px;

  border: 1px solid var(--rl-border);

  border-radius: 11px;

  background:
    rgba(255, 255, 255, 0.025);

  color: var(--rl-text-soft);

  font-size: 0.82rem;
}

/* =========================================================
   ACCORDIONS
   ========================================================= */

.rl-accordion {
  border: 1px solid var(--rl-border);

  border-radius: 14px;

  background:
    rgba(255, 255, 255, 0.025);

  overflow: hidden;
}

.rl-accordion + .rl-accordion {
  margin-top: 10px;
}

.rl-accordion summary {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 12px;

  padding: 17px;

  cursor: pointer;

  list-style: none;

  font-weight: 800;
}

.rl-accordion summary::-webkit-details-marker {
  display: none;
}

.rl-accordion summary::after {
  content: "+";

  color: var(--rl-cyan);

  font-size: 1.1rem;
}

.rl-accordion[open] summary::after {
  content: "−";
}

.rl-accordion-content {
  padding: 0 17px 18px;

  color: var(--rl-text-soft);

  font-size: 0.88rem;
}

/* =========================================================
   MODAL / DRAWER
   ========================================================= */

.rl-overlay {
  position: fixed;

  inset: 0;

  z-index: 2000;

  display: none;

  align-items: center;
  justify-content: center;

  padding: 18px;

  background:
    rgba(0, 0, 0, 0.70);

  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.rl-overlay.is-open {
  display: flex;
}

.rl-modal {
  width: min(
    760px,
    100%
  );

  max-height:
    min(86vh, 900px);

  overflow: auto;

  border: 1px solid var(--rl-border-strong);

  border-radius: var(--rl-radius-lg);

  background:
    linear-gradient(
      145deg,
      rgba(16, 24, 43, 0.98),
      rgba(9, 14, 28, 0.98)
    );

  box-shadow:
    0 30px 100px rgba(0, 0, 0, 0.55);

  animation:
    rlModalIn 180ms ease both;
}

@keyframes rlModalIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.rl-modal-header {
  position: sticky;

  top: 0;

  z-index: 2;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 12px;

  padding: 17px 18px;

  border-bottom: 1px solid var(--rl-border);

  background:
    rgba(10, 16, 31, 0.94);

  backdrop-filter: blur(12px);
}

.rl-modal-title {
  margin: 0;

  font-size: 1.05rem;
}

.rl-modal-close {
  width: 38px;
  height: 38px;

  display: grid;
  place-items: center;

  border: 1px solid var(--rl-border);

  border-radius: 11px;

  background:
    rgba(255, 255, 255, 0.05);

  color: var(--rl-text);

  font-size: 1.1rem;
}

.rl-modal-body {
  padding: 20px;
}

/* =========================================================
   DRAWER
   ========================================================= */

.rl-drawer {
  position: fixed;

  z-index: 2100;

  top: 0;
  right: 0;
  bottom: 0;

  width: min(
    480px,
    94vw
  );

  transform: translateX(105%);

  border-left: 1px solid var(--rl-border);

  background:
    linear-gradient(
      160deg,
      #10182b,
      #080d1b
    );

  box-shadow:
    -25px 0 80px rgba(0, 0, 0, 0.42);

  transition:
    transform 240ms ease;

  overflow-y: auto;
}

.rl-drawer.is-open {
  transform: translateX(0);
}

.rl-drawer-header {
  position: sticky;

  top: 0;

  z-index: 2;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 17px;

  border-bottom: 1px solid var(--rl-border);

  background:
    rgba(9, 14, 28, 0.94);

  backdrop-filter: blur(12px);
}

.rl-drawer-body {
  padding: 18px;
}

/* =========================================================
   UTILITY RAIL
   ========================================================= */

.rl-utility-rail {
  position: fixed;

  right: 18px;
  bottom: 22px;

  z-index: 1800;

  display: grid;

  gap: 9px;
}

.rl-utility-btn {
  width: 50px;
  height: 50px;

  display: grid;
  place-items: center;

  border: 1px solid var(--rl-border-strong);

  border-radius: 16px;

  background:
    rgba(13, 20, 37, 0.92);

  color: #fff;

  box-shadow:
    0 12px 30px rgba(0, 0, 0, 0.32);

  backdrop-filter: blur(14px);

  transition:
    transform var(--rl-transition),
    border-color var(--rl-transition);
}

.rl-utility-btn:hover {
  transform: translateY(-3px);

  border-color:
    rgba(255, 255, 255, 0.28);
}

.rl-utility-btn.ai {
  background:
    linear-gradient(
      135deg,
      rgba(34, 211, 238, 0.24),
      rgba(139, 92, 246, 0.30)
    );
}

/* =========================================================
   AI WELCOME
   ========================================================= */

.rl-ai-welcome {
  position: fixed;

  right: 18px;
  bottom: 88px;

  z-index: 1790;

  width: min(
    340px,
    calc(100vw - 36px)
  );

  padding: 18px;

  border: 1px solid
    rgba(139, 92, 246, 0.38);

  border-radius: 20px;

  background:
    linear-gradient(
      145deg,
      rgba(19, 28, 51, 0.97),
      rgba(12, 17, 33, 0.97)
    );

  box-shadow:
    0 20px 65px rgba(0, 0, 0, 0.48),
    0 0 45px rgba(139, 92, 246, 0.10);

  animation:
    rlAiWelcomeIn 260ms ease both;
}

@keyframes rlAiWelcomeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rl-ai-welcome.hidden {
  display: none;
}

.rl-ai-orb {
  width: 52px;
  height: 52px;

  display: grid;
  place-items: center;

  margin-bottom: 12px;

  border-radius: 50%;

  background:
    radial-gradient(
      circle at 30% 30%,
      #fff,
      var(--rl-cyan) 18%,
      var(--rl-violet) 58%,
      #24134d 100%
    );

  box-shadow:
    0 0 30px rgba(139, 92, 246, 0.32);
}

/* =========================================================
   PROGRESS / CHECKLIST
   ========================================================= */

.rl-progress {
  height: 8px;

  overflow: hidden;

  border-radius: 999px;

  background:
    rgba(255, 255, 255, 0.07);
}

.rl-progress-bar {
  height: 100%;

  width: 0;

  border-radius: inherit;

  background:
    linear-gradient(
      90deg,
      var(--rl-cyan),
      var(--rl-violet)
    );

  transition:
    width 300ms ease;
}

.rl-checklist {
  display: grid;
  gap: 9px;
}

.rl-check-item {
  display: flex;
  align-items: flex-start;

  gap: 10px;

  padding: 12px;

  border: 1px solid var(--rl-border);

  border-radius: 12px;

  background:
    rgba(255, 255, 255, 0.025);
}

.rl-check-item input {
  margin-top: 3px;
}

.rl-check-item.complete {
  opacity: 0.62;
}

.rl-check-item.complete .rl-check-label {
  text-decoration: line-through;
}

.rl-check-label {
  color: var(--rl-text-soft);

  font-size: 0.85rem;
}

/* =========================================================
   STATS
   ========================================================= */

.rl-stats {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 12px;
}

.rl-stat {
  padding: 18px;

  border: 1px solid var(--rl-border);

  border-radius: 15px;

  background:
    rgba(255, 255, 255, 0.035);
}

.rl-stat-value {
  font-size: 1.65rem;
  font-weight: 900;

  letter-spacing: -0.04em;
}

.rl-stat-label {
  margin-top: 4px;

  color: var(--rl-text-muted);

  font-size: 0.76rem;
}

/* =========================================================
   MEDIA
   ========================================================= */

.rl-media-grid {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 14px;
}

.rl-media-card {
  min-height: 170px;

  display: flex;
  flex-direction: column;

  justify-content: space-between;
}

.rl-media-tag {
  display: inline-flex;

  width: fit-content;

  padding: 5px 8px;

  border-radius: 999px;

  background:
    rgba(255, 255, 255, 0.06);

  color: var(--rl-text-muted);

  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
}

/* =========================================================
   FUNDING
   ========================================================= */

.rl-funding-grid {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 14px;
}

.rl-funding-card {
  min-height: 190px;
}

.rl-funding-icon {
  font-size: 1.45rem;
}

/* =========================================================
   TOOLBAR
   ========================================================= */

.rl-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;

  flex-wrap: wrap;

  gap: 10px;
}

.rl-toolbar-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* =========================================================
   CALCULATOR
   ========================================================= */

.rl-calculator {
  display: grid;
  gap: 12px;
}

.rl-calc-display {
  min-height: 78px;

  display: flex;
  align-items: flex-end;
  justify-content: flex-end;

  padding: 14px;

  border: 1px solid var(--rl-border);

  border-radius: 14px;

  background:
    rgba(0, 0, 0, 0.28);

  font-size: 2rem;
  font-weight: 800;

  font-variant-numeric: tabular-nums;
}

.rl-calc-grid {
  display: grid;

  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  gap: 8px;
}

.rl-calc-btn {
  min-height: 52px;

  border: 1px solid var(--rl-border);

  border-radius: 12px;

  background:
    rgba(255, 255, 255, 0.05);

  color: var(--rl-text);

  font-weight: 800;
}

.rl-calc-btn:hover {
  background:
    rgba(255, 255, 255, 0.09);
}

.rl-calc-btn.operator {
  color: var(--rl-cyan);
}

.rl-calc-btn.equals {
  background:
    linear-gradient(
      135deg,
      var(--rl-cyan),
      var(--rl-violet)
    );
}

/* =========================================================
   THREE-TIER OFFERS
   ========================================================= */

.rl-offer-grid {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 12px;
}

.rl-offer-card {
  padding: 18px;

  border: 1px solid var(--rl-border);

  border-radius: 16px;

  background:
    rgba(255, 255, 255, 0.035);
}

.rl-offer-card.cash {
  border-color:
    rgba(52, 211, 153, 0.35);
}

.rl-offer-card.carry {
  border-color:
    rgba(56, 189, 248, 0.35);
}

.rl-offer-card.finance {
  border-color:
    rgba(168, 85, 247, 0.35);
}

.rl-offer-value {
  margin-top: 8px;

  font-size: 1.55rem;
  font-weight: 900;
}

/* =========================================================
   CALENDAR
   ========================================================= */

.rl-calendar {
  display: grid;
  gap: 14px;
}

.rl-calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 10px;
}

.rl-calendar-title {
  font-weight: 850;
}

.rl-calendar-grid {
  display: grid;

  grid-template-columns:
    repeat(7, minmax(0, 1fr));

  gap: 5px;
}

.rl-calendar-day {
  min-height: 38px;

  display: grid;
  place-items: center;

  border: 1px solid transparent;

  border-radius: 9px;

  color: var(--rl-text-soft);

  font-size: 0.78rem;
}

.rl-calendar-day:hover {
  background:
    rgba(255, 255, 255, 0.07);
}

.rl-calendar-day.today {
  border-color:
    rgba(56, 189, 248, 0.5);

  color: var(--rl-cyan);
}

.rl-calendar-day.selected {
  background:
    linear-gradient(
      135deg,
      var(--rl-cyan),
      var(--rl-violet)
    );

  color: #fff;
}

/* =========================================================
   FOOTER
   ========================================================= */

.rl-footer {
  padding: 45px 0 100px;

  border-top: 1px solid var(--rl-border);

  color: var(--rl-text-muted);

  font-size: 0.78rem;
}

.rl-footer-grid {
  display: grid;

  grid-template-columns:
    1.5fr
    repeat(3, 1fr);

  gap: 24px;
}

.rl-footer a {
  color: var(--rl-text-soft);

  text-decoration: none;
}

.rl-footer a:hover {
  color: #fff;
}

/* =========================================================
   RESPONSIVE
   ========================================================= */

@media (max-width: 980px) {
  .rl-nav {
    display: none;
  }

  .rl-workflow {
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
  }

  .rl-grid,
  .rl-media-grid,
  .rl-funding-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .rl-workspace {
    grid-template-columns: 1fr;
  }

  .rl-footer-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .rl-container {
    width: min(
      calc(100% - 22px),
      var(--rl-max-width)
    );
  }

  .rl-section {
    padding: 52px 0;
  }

  .rl-hero {
    padding: 62px 0 50px;
  }

  .rl-hero h1 {
    font-size: clamp(
      2.25rem,
      13vw,
      4rem
    );
  }

  .rl-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .rl-btn {
    width: 100%;
  }

  .rl-workflow {
    grid-template-columns: 1fr;
  }

  .rl-grid,
  .rl-media-grid,
  .rl-funding-grid,
  .rl-offer-grid {
    grid-template-columns: 1fr;
  }

  .rl-stats {
    grid-template-columns: 1fr;
  }

  .rl-checkbox-grid {
    grid-template-columns: 1fr;
  }

  .rl-footer-grid {
    grid-template-columns: 1fr;
  }

  .rl-utility-rail {
    right: 11px;
    bottom: calc(
      12px + env(safe-area-inset-bottom)
    );
  }

  .rl-utility-btn {
    width: 47px;
    height: 47px;
  }

  .rl-ai-welcome {
    right: 11px;
    bottom: 76px;

    width: calc(100vw - 22px);
  }

  .rl-modal {
    max-height: 90vh;

    border-radius: 18px;
  }
}

/* =========================================================
   ACCESSIBILITY
   ========================================================= */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

:focus-visible {
  outline: 2px solid var(--rl-cyan);
  outline-offset: 3px;
}

/* =========================================================
   SAFE AREA
   ========================================================= */

.rl-safe-bottom {
  padding-bottom:
    env(safe-area-inset-bottom);
    }
