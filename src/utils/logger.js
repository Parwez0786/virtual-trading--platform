/**
 * Server-side logging only (startup / fatal).
 * Do not use for user-facing request errors — those belong in flash/UI.
 */
const Logger = Object.freeze({
  info: (msg) => {
    if (process.env.NODE_ENV !== "test") {
      process.stdout.write(`${msg}\n`);
    }
  },
  error: (msg) => {
    process.stderr.write(`${msg}\n`);
  },
});

module.exports = Logger;
