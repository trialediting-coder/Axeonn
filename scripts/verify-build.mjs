// scripts/verify-build.mjs
import { existsSync, readFileSync } from 'node:fs';

const required = ['.next/BUILD_ID'];
const missing = required.filter((f) => !existsSync(f));

if (missing.length > 0) {
  console.error('FAIL: missing build artifacts:', missing);
  process.exit(1);
}

console.log('PASS: build artifacts present');

// Ported client providers must not carry over any react-router-dom
// reference from the old Vite/React Router source they were copied from.
const portedProviderFiles = [
  'components/providers/SmoothScrollProvider.tsx',
  'components/providers/AnalyticsTracker.tsx',
];

const filesWithLeftoverRouterImports = portedProviderFiles.filter((f) => {
  if (!existsSync(f)) return true;
  return readFileSync(f, 'utf8').includes('react-router-dom');
});

if (filesWithLeftoverRouterImports.length > 0) {
  console.error(
    'FAIL: provider files missing or still reference react-router-dom:',
    filesWithLeftoverRouterImports
  );
  process.exit(1);
}

console.log('PASS: ported providers are free of react-router-dom references');
