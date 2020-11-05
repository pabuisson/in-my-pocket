import * as Sentry from "@sentry/browser";
import Settings from '../modules/settings.js';
import { Integrations } from "@sentry/tracing";
import { VersionManager } from '../modules/version_manager.js';

// --------------------------

Settings.init().then(() => {
  Sentry.init({
    dsn: "https://1207d464a72f4c788936641a73b872a2@o153528.ingest.sentry.io/1206746",

    // To set your release version
    release: "in-my-pocket@" + VersionManager.getCurrentVersion(),

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,

    beforeSend(event) {
      if (Settings.get('bugReport')) {
        return event;
      }
    },
  });
});
