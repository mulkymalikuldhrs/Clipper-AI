## Pull Request

### Description
<!-- Explain the user-visible outcome, source boundaries, and why this is the smallest safe change. -->

### Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Test addition/update

### Safety checklist
- [ ] No credentials, cookies, private crawl data, or provider secrets are committed.
- [ ] External actions are bounded, source-aware, and review-gated where consequential.
- [ ] Unknown/missing data is represented honestly.
- [ ] Relevant Markdown documentation is updated.
- [ ] `bun tsc -b --noEmit`, `bun run typecheck:scripts`, `bun test`, and `git diff --check` pass.

### Related Issues
<!-- Link any related issues here: Fixes #123, Closes #456 -->

### Screenshots (if applicable)
<!-- Add screenshots to help explain your changes -->

### Verification
<!-- List commands run, preview status, and any known limitation. -->
