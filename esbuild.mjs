import * as esbuild from "esbuild"

// TODO: handle both chrome and firefox builds
// FIXME: ionicons.woof is copied + copied and hashed, it should be exported only once

await esbuild.build({
  entryPoints: [
    { in: "./src/manifest_firefox.json", out: "manifest" },
    "./src/assets/**/*.css",
    "./src/assets/**/*.woff",
    "./src/assets/**/*.png",
    "./src/assets/**/*.svg",
    "./src/popup/popup.js",
    "./src/popup/popup.css",
    "./src/popup/popup.html",
    "./src/options/options.js",
    "./src/options/options.css",
    "./src/options/options.html",
    "./src/background/sentry.js",
    "./src/background/background.js",
    "./src/background/upgrade.js",
    "./src/background/keyboard.js",
    "./src/background/page_actions.js",
    "./src/background/context_menus.js",
    "./src/background/uninstall.js",
  ],
  loader: {
    ".svg": "copy",
    ".png": "copy",
    ".woff": "copy",
    ".html": "copy",
    ".json": "copy",
  },
  bundle: true,
  outdir: "build/esbuild/",
  target: ["firefox57"],
})
