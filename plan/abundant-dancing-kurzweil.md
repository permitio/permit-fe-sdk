# Permit FE SDK - Comprehensive Modernization Plan

## Executive Summary

27 individual PRs identified across 5 phases to modernize the SDK following current TypeScript/Frontend standards.

**Current State:** Functional but using deprecated tooling (TSLint), has security vulnerabilities, and missing CI/CD.

**Timeline:** 2-3 weeks (aggressive) - Focus on Phase 1 + critical Phase 2 items
**Version Strategy:** Major version bump to v1.0.0 (bundle all breaking changes)

---

## Priority for 2-3 Week Sprint

### Week 1: Critical Security & Infrastructure

1. PR #1: Security Fix - Upgrade Dependencies (CRITICAL)
2. PR #7: Migrate TSLint to ESLint (HIGH)
3. PR #10: Add CI Pipeline (HIGH)
4. PR #11: Security Scanning Workflow (HIGH)

### Week 2: Modernization Essentials

5. PR #2: Upgrade TypeScript to 5.x (HIGH)
6. PR #16: Expand Test Coverage (HIGH)
7. PR #6: Add Contributing Guidelines (MEDIUM)
8. PR #5: Enhance README (MEDIUM)

### Week 3: Polish & Release

9. PR #15: Remove Global State (MEDIUM) - breaking change
10. PR #8: Add Pre-commit Hooks (MEDIUM)
11. PR #27: Improve Package Metadata (LOW)
12. Final: Bump to v1.0.0, update CHANGELOG

**Remaining PRs:** Backlog for future sprints

---

## Critical Issues Requiring Immediate Action

| Issue                                    | Severity | Impact                                  |
|------------------------------------------|----------|-----------------------------------------|
| Security vulnerabilities (babel, braces) | CRITICAL | Production risk                         |
| TSLint deprecated since 2019             | HIGH     | Unmaintained tooling                    |
| No CI/CD for PRs                         | HIGH     | No automated quality gates              |
| Global mutable state                     | HIGH     | Prevents multiple instances, SSR issues |

---

## Phase 1: Critical Security & Infrastructure (Week 1-2)

### PR #1: Security Fix - Upgrade Dependencies

**Priority: CRITICAL**

- Run `npm audit fix`
- Upgrade axios `0.30.x` → `1.7.x`
- Fix babel, braces vulnerabilities
- **Breaking:** Axios 1.x has different error handling

### PR #7: Migrate TSLint to ESLint

**Priority: HIGH**

- Remove `tslint`, `tslint-config-prettier`
- Install ESLint 9.x with TypeScript plugins
- Create `eslint.config.js` (flat config)
- Update all `// tslint:disable` comments

### PR #10: Add CI Pipeline

**Priority: HIGH**

- Create `.github/workflows/ci.yml`
- Test on Node 18, 20, 22
- Add type check, lint, format check, tests
- Add coverage reporting

### PR #11: Security Scanning Workflow

**Priority: HIGH**

- Weekly automated `npm audit`
- Run on PRs and main branch

### PR #25: Security Hardening

**Priority: HIGH**

- Add URL validation (HTTPS enforcement)
- Add request timeouts (default 30s)
- Sanitize inputs before logging

---

## Phase 2: Modernization (Week 3-4)

### PR #2: Upgrade TypeScript to 5.x

**Priority: HIGH**

- Upgrade `typescript` 4.7 → 5.9
- Enable stricter compiler options
- **May expose hidden type errors**

### PR #3: Upgrade Jest to 30.x

**Priority: MEDIUM**

- Upgrade `jest` 28 → 30, `ts-jest` 28 → 29
- Update test configuration

### PR #16: Expand Test Coverage

**Priority: HIGH**

- Move `src/tests/` to `src/__tests__/`
- Add tests for main `Permit` class (currently untested)
- Add coverage thresholds (80%)
- Test error scenarios

### PR #20: Modernize TypeScript Config

**Priority: MEDIUM**

- Target ES2020 (from ES2015)
- Add source maps, declaration maps
- Enable `noUnusedLocals`, `noImplicitReturns`

---

## Phase 3: Code Quality (Week 5-6)

### PR #14: Refactor to Modular Architecture

**Priority: MEDIUM**

```
src/
├── index.ts              # Public exports only
├── core/
│   ├── Permit.ts         # Main class
│   └── PermitState.ts    # State management
├── services/
│   └── http.service.ts   # HTTP calls
├── utils/
│   └── state-key.ts      # Helpers
└── __tests__/
```

### PR #15: Remove Global State

**Priority: MEDIUM**

- Remove module-level `permitLocalState`, `permitState`, `permitCaslState`
- Move to instance properties
- **Breaking:** Removes `permitState` export

### PR #22: Refactor to Class-Based Architecture

**Priority: MEDIUM**

```typescript
export class PermitClient {
  private localState: PermitStateSchema = {};

  constructor(config: PermitConfig) { ...
  }
}

// Keep factory for backward compatibility
export const Permit = (config) => new PermitClient(config);
```

### PR #23: Add Error Handling & Logging

**Priority: MEDIUM**

- Create `PermitError`, `PermitNetworkError` classes
- Add optional logger interface
- Replace `console.error` calls

### PR #8: Add Pre-commit Hooks

**Priority: MEDIUM**

- Install husky + lint-staged
- Auto-run ESLint + Prettier on staged files
- Add `.editorconfig`

---

## Phase 4: Documentation & Community (Week 7-8)

### PR #5: Enhance README

**Priority: MEDIUM**

- Add badges (npm version, downloads, build status)
- Add complete API reference
- Add TypeScript examples
- Add troubleshooting section

### PR #6: Add Contributing Guidelines

**Priority: MEDIUM**

- Create `CONTRIBUTING.md`
- Create PR template
- Create issue templates (bug, feature)
- Create `CODE_OF_CONDUCT.md`

### PR #12: Add Dependabot

**Priority: MEDIUM**

- Weekly dependency updates
- Auto-label PRs
- Ignore major versions by default

### PR #27: Improve Package Metadata

**Priority: LOW**

- Add keywords, description
- Add `engines.node >= 18`
- Add `sideEffects: false` for tree-shaking

---

## Phase 5: Advanced Features (Week 9+)

### PR #21: Dual Package Support (ESM + CJS)

**Priority: MEDIUM**

- Build both ESM and CommonJS
- Configure `exports` in package.json
- Better tree-shaking support

### PR #4 & #9: Prettier Upgrade & Config

**Priority: LOW**

- Upgrade Prettier 2 → 3
- Change `printWidth` 160 → 100

### PR #13: Semantic Release

**Priority: MEDIUM**

- Automated versioning from commits
- Auto-generate CHANGELOG

### PR #17: E2E Tests

**Priority: LOW**

- Test with real demo server

### PR #18 & #19: Demo Improvements

**Priority: LOW**

- Add `.env` support to demo server
- Create framework examples (React/Vite, Vue, Angular, Next.js)

### PR #24 & #26: API Improvements

**Priority: LOW**

- Add input validation
- Add `isReady` property
- Add builder pattern (optional)

---

## Breaking Changes Summary

| PR  | Change                       | Mitigation                  |
|-----|------------------------------|-----------------------------|
| #1  | Axios error handling         | Document in CHANGELOG       |
| #2  | New TS errors may surface    | Fix incrementally           |
| #14 | Import paths change          | Keep old paths deprecated   |
| #15 | `permitState` export removed | Major version bump          |
| #21 | Package structure changes    | Backward compatible exports |

---

## Success Metrics

| Metric         | Current    | Target            |
|----------------|------------|-------------------|
| Test Coverage  | Unknown    | >80%              |
| Security Score | F (vulns)  | A (clean)         |
| Code Quality   | C (TSLint) | A (ESLint strict) |
| Documentation  | B-         | A                 |
| CI/CD          | Partial    | Full              |

---

## Files to Modify (Critical)

- `package.json` - Dependencies, scripts, metadata
- `tsconfig.json` - Modern TypeScript config
- `tslint.json` → `eslint.config.js` - Linting migration
- `src/index.ts` - Main refactoring
- `src/service.ts` - HTTP service
- `.github/workflows/` - CI/CD pipelines
- `README.md` - Documentation
- New: `CONTRIBUTING.md`, `.editorconfig`, `.github/ISSUE_TEMPLATE/`

---

## Estimated Effort

- **Phase 1:** 1-2 weeks (critical, do first)
- **Phase 2:** 1-2 weeks
- **Phase 3:** 2 weeks
- **Phase 4:** 1 week
- **Phase 5:** 2+ weeks (nice to have)

**Total:** 8-10 weeks with 1-2 developers
