// data/dashboardVersions.ts
// The version label shown in the corner of every dashboard (components/common/VersionTag.tsx),
// and the short "What's new" list behind it. Owner 2026-10-19: "lets begin putting
// versions for each dashboard in the corner".
//
// How the numbers move:
//   - major: a different dashboard a client is put on (PROOF v1 -> v2 is per client,
//     onboardings.proof_version; old clients stay on v1 until the admin switches them).
//   - minor: a visible feature added to that dashboard.
//   - patch: fixes and copy only.
// Bump the label here in the same commit that ships the change, and add one line to `notes`.
//
// Starting points (2026-10-19), counted from what each dashboard has shipped so far:
//   PROOF v1.9  the current client dashboard (overview, leads inbox, calls, bookings, reviews,
//               ads/reels, receptionist, email, billing, ranking scans) - kept as is for v1 clients.
//   PROOF v2.0  v1.9 plus the 180-day Value-Staged Delivery program (milestone tracker,
//               staged approvals, DBR sprint, review + citation engine, page program,
//               SABR, monthly executive summary). New AxeonCORE / AxeonGROWTH clients only.
//   Setup v2.0  the /welcome/<token> setup portal (email-code device check, rounds, PROOF password).
//   Admin v3.0  the team admin (onboarding board, client panels, calls, audits, agreements, partners).

export type ProofVersion = 1 | 2;

export interface DashboardVersion {
  label: string;
  /** Newest first, one short line each. */
  notes: readonly string[];
}

export const DASHBOARD_VERSIONS = {
  proof: {
    1: {
      label: 'PROOF v1.9',
      notes: ['Leads inbox with text replies', 'Calls, bookings and reviews tabs', 'Google ranking scans', 'Monthly reports'],
    },
    2: {
      label: 'PROOF v2.0',
      notes: [
        'Your 180-day milestone tracker',
        'Approve designs and copy with pins',
        'Pipeline revenue tracker',
        'Front-desk routine and monthly summary link',
      ],
    },
  } satisfies Record<ProofVersion, DashboardVersion>,
  setup: { label: 'Setup v2.0', notes: ['Two setup rounds', 'Email code on each new device', 'Set your AxeonPROOF password here'] } satisfies DashboardVersion,
  admin: { label: 'Admin v3.0', notes: ['PROOF v1/v2 switch per client', 'v2 program panel', 'Version labels on every dashboard'] } satisfies DashboardVersion,
} as const;

export const isProofVersion = (v: unknown): v is ProofVersion => v === 1 || v === 2;
export const proofVersionInfo = (v: ProofVersion): DashboardVersion => DASHBOARD_VERSIONS.proof[v];
