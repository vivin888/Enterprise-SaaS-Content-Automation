import * as Sentry from "@sentry/node"

Sentry.init({
  dsn: "https://ae0dce3c7f655bc9671d63608dac238f@o4510913444511744.ingest.us.sentry.io/4510913451196416",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});