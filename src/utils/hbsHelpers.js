/**
 * Register Handlebars helpers used across views for safe/display formatting.
 */
function registerHbsHelpers(hbs) {
  hbs.registerHelper("money", (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  });

  hbs.registerHelper("pct", (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return `${n.toFixed(2)}%`;
  });

  hbs.registerHelper("hasItems", (arr) => Array.isArray(arr) && arr.length > 0);

  hbs.registerHelper("orDash", (value) => {
    if (value === undefined || value === null || value === "") return "—";
    return value;
  });

  hbs.registerHelper("eq", (a, b) => a === b);

  hbs.registerHelper("alertType", (type) => {
    const allowed = new Set(["info", "warn", "error", "success"]);
    return allowed.has(type) ? type : "warn";
  });
}

module.exports = { registerHbsHelpers };
