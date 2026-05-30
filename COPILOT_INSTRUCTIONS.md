# GitHub Copilot Implementation Instructions

This repository-level instruction file defines the workflow to follow whenever a change is requested.

## When asked to implement a change

1. Check for an open issue
   - If there is an existing open issue describing the change, use it.
   - If there is no relevant open issue, create one with a concise title and description.

2. Create a new branch for the change
   - Branch name should be descriptive and use a feature or fix prefix, e.g. `feature/...` or `fix/...`.
   - Base the branch off the current `main` branch.

3. Link the issue to the branch
   - Reference the issue in the branch name or commit message when possible.
   - If using GitHub CLI, mention the issue in the PR body.

4. Implement the fix
   - Apply the code change on the new branch.
   - Commit incremental steps with clear messages for each logical change.

5. Review and add unit tests
   - Add or update tests for the changed code if it makes sense.
   - Prefer test coverage for new behavior and edge cases.

6. Update documentation if needed
   - Update `README.md` if the change affects usage, installation, or developer instructions.
   - Update `AGENTS.md` if the change affects AI agent guidance or repository conventions.

7. Validate tests
   - Run the repository test suite and ensure all tests pass.
   - If there is a pipeline or workflow, verify the intended CI configuration runs successfully.

8. Create a pull request
   - Open a PR from the feature branch into `main`.
   - Include issue references in the PR description.
   - Summarize the changes, tests performed, and any documentation updates.

## Branch and commit naming guidelines

- Branch names:
  - `feature/<short-description>` for new functionality
  - `fix/<short-description>` for bug fixes
  - `ci/<short-description>` for pipeline or workflow changes

- Commit messages:
  - Use present-tense imperative form, e.g. `fix: update label generator logic`
  - Use emoji-free, professional wording
  - Use `chore:` for auxiliary changes like tooling or documentation

## Notes

- Always keep changes small and focused.
- Prefer separate commits for code, tests, documentation, and CI updates.
- If the user explicitly asks to create a pull request, do so after validating the branch.
