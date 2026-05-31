# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Conex is a Firefox WebExtension (Manifest v3) that augments Firefox's Multi-Account Containers: a popup-driven UI for searching, switching, and managing tabs scoped by container, plus an optional container-picker that intercepts new tabs / external links. Firefox-only (`browser_specific_settings.gecko`, `contextualIdentities`, `tabHide`, `cookieStoreId`, etc. — no Chrome support).

## Build / lint / test

```bash
# typecheck + compile src/*.ts -> extension/*.js (outDir is ./extension, set in tsconfig.json)
./node_modules/.bin/tsc

# lint (eslint --fix .)
npm run lint

# full pre-commit gate (typecheck, lint, import-extension check, test count)
./pre-commit
```

There is no `npm run build` or `npm test`. Compile with `tsc` directly. Tests are mocha-in-browser:

1. `tsc` compiles `src/test/*.ts` to `extension/test/*.js`
2. Load the extension in Firefox (`web-ext run -s ./extension/` or `about:debugging`)
3. Open `extension/test/test.html` from the running extension to execute the suite
4. `extension/test/test.html` is the test entry point and explicitly lists which test files to load — when adding a new `*-tests.ts` you must add a `<script>` tag for its compiled `.js` to that HTML; otherwise it will not run

There is no way to run a single test file from the CLI. To isolate one, comment the other `<script>` tags out of `extension/test/test.html`, or use mocha's `.only` / `.skip` inside the test file.

## Hard rules (these will break the build)

- **All relative imports must end in `.js`** (e.g. `import { foo } from './helper.js'`), even though the source files are `.ts`. The pre-commit hook greps for `import.*/` lines that do not end in `.js` and fails the commit. This is required because the compiled output is loaded as native ES modules in the browser (`"type": "module"` in package.json + `"module": "es6"` in tsconfig).
- TypeScript is strict (`strict*` + `noUncheckedIndexedAccess` + `noImplicitOverride` + `noUnusedLocals/Parameters`). Don't loosen these to get a compile through — fix the call site.
- `extension/*.js` and `extension/test/*.js` are **build artifacts** (gitignored). Never edit them by hand; always edit the `.ts` source in `src/` and recompile.

## Release flow

Releases are driven by the `./release` shell script (signed Firefox addon + GitHub release). It bumps `extension/manifest.json` version, appends to `versions.json` (the self-hosted update manifest pointed at by the Mozilla addon), tags, signs via `web-ext sign`, and uploads the `.xpi` to GitHub Releases. Requires `WEB_EXT_API_KEY`, `WEB_EXT_API_SECRET`, `GITHUB_TOKEN`. The script refuses to run with a dirty tree.

The extension self-updates from `https://raw.githubusercontent.com/kesselborn/conex/main/versions.json` — that file is part of the release artifact, not just docs. Don't hand-edit it; let `./release` append to it.

## Architecture

Two entry points that both render into a popup-style UI via `renderMainPage()`:

- **`browser-action.ts`** — toolbar popup (`browser-action.html`). Lists all containers + their tabs, with search.
- **`container-selector.ts`** — interstitial page (`container-selector.html`) that the background script redirects new-tab navigations to when "ask container" is enabled. Renders the same UI but with `tabs: false` and a `newTabUrl` so picking a container opens the URL there.

Both share the rendering pipeline in `main-page.ts` → `containers.ts` → `container-element.ts` + `tab-element.ts`.

**Background script (`background.ts`)** runs as an ES-module service worker (`"type": "module"` in manifest). Tracks `lastCookieStoreId`, hooks `tabs.onActivated` / `tabs.onCreated` / `windows.onFocusChanged` to (a) show/hide tabs per container via `tab-management.ts` (requires the `tabHide` optional permission) and (b) intercept `webRequest.onBeforeRequest` to redirect new tabs into the container selector when `askContainer` is enabled.

**DOM structure (load-bearing — search, keyboard nav, and CSS all key off it):**

```
<form id="browser-action">
  <input id="searchId">
  <ol>                          <!-- containers -->
    <li id="firefox-container-N"> <!-- cookieStoreId is the li id -->
      <h2><span>name</span><span>(count)</span></h2>
      <ul>                      <!-- tabs -->
        <li id="tab-<tabId>">
          <h3>title</h3>
          <h4>url</h4>
        </li>
      </ul>
    </li>
  </ol>
</form>
```

Class flags drive visibility/state — see `ClassSelectors` in `constants.ts`:
- `collapsed` on container `<li>`: hide tab list, show header only
- `no-match` on container or tab `<li>`: hidden (search miss)
- `no-container-match` on container `<li>`: only used in container-selector context, where `>foo` syntax filters containers without filtering tabs
- `closed` on tab `<li>`: dimmed (tab was closed via the UI; element kept around briefly)

Selectors and IDs are centralized in `constants.ts` (`Selectors`, `ClassSelectors`, `IdSelectors`, `InputNameSelectors`, `Ids`, `ConexElements`). Prefer adding to these enums over hardcoding strings.

**Search syntax** (`search.ts`): space-separated tokens AND-match against title+URL. A token starting with `>` scopes to container name (e.g. `foo >work` = tabs matching "foo" inside containers matching "work"). Matched substrings are wrapped in `<em class="match-N">` where N is the token index — `conex.css` styles them with different colors per index.

**Keyboard navigation** (`keyboard-input-handler.ts`): the form has one shared keydown/keyup listener that dispatches based on whether the focused element is the search input, a container `<li>`, or a tab `<li>`. Arrow keys / Tab walk visible siblings skipping `.no-match`; Backspace closes the focused tab or container; Enter on a tab opens it, Enter on a container opens its first tab (or a new tab if collapsed / empty / in container-selector context). Shift modifies direction or forces "open new tab in container."

**Mouse / form interactions** go through `mouse-handler.ts:formChange`, which is wired as a single `change` listener on the form and dispatches on the `name` attribute of the changed input (see `InputNameSelectors`). New interactive controls should be `<input>` elements with one of those names rather than ad-hoc click handlers.

**Settings** (`settings.ts`): a single object in `browser.storage.local` under key `"settings"`. Each toggle in `options-ui.ts` has a `change*Setting` function that first requests/removes the relevant optional permission, then writes. The permission request must happen synchronously in the user-gesture handler before any `await` (see comment in `changeOptionalPermissions`), so don't reorder.

**i18n** is real and required — all user-facing strings go through `_()` (alias for `browser.i18n.getMessage`, see `helper.ts`). Add new strings to `extension/_locales/en/messages.json` (and `de/` if translating). The locale directory contains a sentinel file literally named `RELOAD EXTENSION WHEN ADDING NEW STRINGS` — Firefox caches `messages.json` and a reload of the extension is needed after editing.

**Logging** (`logger.ts`): `debug/info/warn/error(component, ...data)` — level is per-component, stored in `browser.storage.local` under `"log-settings"`, default `warn`. To enable debug for a component, change it from the hidden debug UI (see README: 10 clicks on the Conex Preferences header in `about:addons`).

## Globals and conventions

- `browser` is declared at the top of files that use it (`declare let browser: Browser;`) — types come from `webextension-polyfill`, but the runtime is Firefox's native `browser`. Do not import a polyfill; do not use `chrome.*`.
- `$`, `$$`, `$e` in `helper.ts` are the project's tiny querySelector/createElement helpers. Use them instead of `document.querySelector` for consistency. `$e('tag', {attrs}, [children])` converts underscore-attrs to dashed (e.g. `data_foo` → `data-foo`) and treats `content` as a text node.
- `cookieStoreId` strings: `firefox-default` is the no-container default; `firefox-private-*` is private browsing; the app reserves `bookmarks` and `history` as pseudo-container ids for the bookmark/history dummy containers (`containers.ts`). See `Ids` enum.

## Known WIP

`README.md` says "WIP FOR THE NEXT VERSION" and `todo` lists open bugs and beta items. The recent commit history shows iteration on the container selector (`wip container selector`) — that flow is the most volatile area.
