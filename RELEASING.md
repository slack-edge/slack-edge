# Releasing

Publishing `slack-edge` to npm is manual. The version bump goes through a pull request; the publish itself happens locally from `main` after the PR merges.

## Prerequisites

- Push access to `slack-edge/slack-edge`.
- An npm account with publish rights to the `slack-edge` package (`npm whoami` to check; `npm login` if not).

## Steps

1. **Sync `main` and create a release branch.**
   ```sh
   git checkout main && git pull
   git checkout -b version-X.Y.Z
   ```

2. **Bump the version** in `package.json` following semver, then refresh `package-lock.json` so both files stay in sync:
   ```sh
   npm install --package-lock-only
   ```

3. **Verify the build and tests pass.**
   ```sh
   npm ci
   npm run build:clean
   npm run ci-test
   ```

4. **Commit, push, and open a PR** against `main` using the existing convention:
   ```sh
   git commit -am "version X.Y.Z"
   git push -u origin version-X.Y.Z
   gh pr create --base main --title "version X.Y.Z"
   ```
   Get the PR reviewed and merged before continuing.

5. **Return to `main` and pull the merged commit.**
   ```sh
   git checkout main && git pull
   ```

6. **Inspect the tarball** before shipping it.
   ```sh
   npm pack --dry-run
   ```
   Confirm the top-level entries are `dist/`, `LICENSE.txt`, `README.md`, and `package.json` — nothing else.

7. **Publish to npm.** The `prepublishOnly` script runs `build:clean` automatically, so the tarball is always built fresh from source.
   ```sh
   npm publish
   ```

8. **Tag the release** and push the tag. Match the latest tag style (`vX.Y.Z`):
   ```sh
   git tag vX.Y.Z
   git push --tags
   ```

9. **Create a GitHub release** against the new tag with a short changelog.
