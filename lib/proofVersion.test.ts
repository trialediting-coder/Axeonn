import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROOF_V2_AGREEMENT_VERSION, proofVersionFor } from './proofVersion';
import { AGREEMENT_VERSION } from '../data/agreementTemplate';
import { DASHBOARD_VERSIONS, isProofVersion } from '../data/dashboardVersions';

test('an old agreement keeps the client on PROOF v1', () => {
  assert.equal(proofVersionFor({ tier: 'axeoncore', agreementVersion: '2026-10-06' }), 1);
  assert.equal(proofVersionFor({ tier: 'axeongrowth', agreementVersion: '2026-10-06' }), 1);
});

test('the 2026-10-19 agreement (and later) puts a CORE/GROWTH client on v2', () => {
  assert.equal(proofVersionFor({ tier: 'axeoncore', agreementVersion: '2026-10-19' }), 2);
  assert.equal(proofVersionFor({ tier: 'axeongrowth', agreementVersion: '2027-01-02' }), 2);
});

test('the current agreement version is the v2 one', () => {
  assert.ok(AGREEMENT_VERSION >= PROOF_V2_AGREEMENT_VERSION);
  assert.equal(proofVersionFor({ tier: 'axeoncore', agreementVersion: AGREEMENT_VERSION }), 2);
});

test('no agreement on a new CORE/GROWTH mint means v2; Website and Essentials always v1', () => {
  assert.equal(proofVersionFor({ tier: 'axeoncore' }), 2);
  assert.equal(proofVersionFor({ tier: 'axeoncore', agreementVersion: null }), 2);
  assert.equal(proofVersionFor({ tier: 'essentials', agreementVersion: '2026-10-19' }), 1);
  assert.equal(proofVersionFor({ tier: 'website' }), 1);
});

test('a quiet (already-live, legacy) mint stays on v1', () => {
  assert.equal(proofVersionFor({ tier: 'axeoncore', legacy: true }), 1);
  assert.equal(proofVersionFor({ tier: 'axeongrowth', agreementVersion: '2026-10-19', legacy: true }), 1);
});

test('a malformed agreement version is ignored rather than trusted', () => {
  assert.equal(proofVersionFor({ tier: 'axeoncore', agreementVersion: 'zzz' }), 2);
});

test('version labels exist for every dashboard', () => {
  assert.equal(DASHBOARD_VERSIONS.proof[1].label, 'PROOF v1.9');
  assert.equal(DASHBOARD_VERSIONS.proof[2].label, 'PROOF v2.0');
  assert.match(DASHBOARD_VERSIONS.setup.label, /^Setup v\d+\.\d+$/);
  assert.match(DASHBOARD_VERSIONS.admin.label, /^Admin v\d+\.\d+$/);
  assert.ok(isProofVersion(2) && isProofVersion(1) && !isProofVersion(3));
});
