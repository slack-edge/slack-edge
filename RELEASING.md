# Releasing

Publishing `slack-edge` to npm is manual. Follow these steps from a clean checkout of `main`.

## Prerequisites

- Push access to `slack-edge/slack-edge`.
- An npm account with publish rights to the `slack-edge` package (`npm whoami` to check; `npm login` if not).

## Steps

1. **Sync `main`.**
   ```sh
   git checkout main && git pull
   ```

2. **Bump the version** in `package.json` following semver. Commit on `main` using the existing convention:
   ```sh
   git commit -am "version X.Y.Z"
   git push
   ```

3. **Verify the build and tests pass.**
   ```sh
   npm ci
   npm run build:clean
   npm run ci-test
   ```

4. **Inspect the tarball** before shipping it.
   ```sh
   npm pack --dry-run
   ```
   Confirm the top-level entries are `dist/`, `LICENSE.txt`, `README.md`, and `package.json` — nothing else.

5. **Publish to npm.** The `prepublishOnly` script runs `build:clean` automatically, so the tarball is always built fresh from source.
   ```sh
   npm publish
   ```

6. **Tag the release** and push the tag. Match the latest tag style (`vX.Y.Z`):
   ```sh
   git tag vX.Y.Z
   git push --tags
   ```

7. **Create a GitHub release** against the new tag with a short changelog.
