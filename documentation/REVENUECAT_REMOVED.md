# Why RevenueCat Keeps Coming Back (and how to stop it)

RevenueCat has been **fully removed** from this project. It is **not** in `package.json` or `package-lock.json`. So **npm does not install it**.

## How it can reappear

`node_modules/@revenuecat` will only come back if one of these happens:

1. **You run a command that adds it**
   - `npm install @revenuecat/purchases-capacitor` (or `purchases-capacitor-ui`)
   - `npx cap add @revenuecat/purchases-capacitor`
   - Any script or doc that runs the above

2. **You use a branch or backup that still has it**
   - Another branch might have RevenueCat in `package.json` or `package-lock.json`. When you checkout that branch and run `npm install`, it will install again.

3. **An old clone or copy of the repo**
   - A different folder might still have an old `package.json` / lockfile with RevenueCat.

## What this repo does to keep it gone

- **Postinstall script** (`scripts/postinstall.cjs`) runs after every `npm install` and **deletes** `node_modules/@revenuecat` if it exists. So even if something adds it, the next `npm install` will remove it again.
- **iOS**: RevenueCat was removed from the Swift Package Manager `Package.resolved` so the iOS app no longer references it.
- **Android**: RevenueCat was never in the Gradle config; only Capacitor and push-notifications are included.

## What you should do

- **Do not** run `cap add` or `npm install` for any `@revenuecat` package.
- If you see RevenueCat in `node_modules` again, run:
  ```bash
  rm -rf node_modules/@revenuecat
  ```
  or run `npm install` (the postinstall will delete it).
- If you use multiple branches, remove RevenueCat from `package.json` and run `npm install` on any branch that still lists it, then commit the updated `package.json` and `package-lock.json`.
