/**
 * HTML email builders (table + inline CSS for client compatibility).
 * Visual direction: charcoal ink, soft paper background, teal accent (trading desk).
 */

const BRAND = "Virtual Trading";
const ACCENT = "#0F766E";
const INK = "#1C1917";
const MUTED = "#57534E";
const PAPER = "#F5F5F4";
const CARD = "#FFFFFF";
const BORDER = "#E7E5E4";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout({ preheader, title, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};font-family:Georgia,'Times New Roman',serif;color:${INK};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${PAPER};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${CARD};border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 18px;border-bottom:3px solid ${ACCENT};">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${ACCENT};font-weight:700;">
                ${escapeHtml(BRAND)}
              </p>
              <h1 style="margin:10px 0 0;font-size:26px;line-height:1.25;font-weight:700;color:${INK};">
                ${escapeHtml(title)}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:${MUTED};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#A8A29E;border-top:1px solid ${BORDER};">
              You’re receiving this because of activity on your ${escapeHtml(BRAND)} account.
              If you didn’t request this, you can ignore this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(label, href) {
  const safeHref = escapeHtml(href);
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 8px;">
      <tr>
        <td style="border-radius:8px;background:${ACCENT};">
          <a href="${safeHref}" style="display:inline-block;padding:14px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:8px;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

function registrationEmail({ link, name }) {
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Welcome,";
  const subject = `Confirm your ${BRAND} registration`;
  const text = [
    name ? `Hi ${name},` : "Welcome,",
    "",
    `Thanks for joining ${BRAND}. Confirm your email to finish setting up your account.`,
    "",
    `Open this link (expires in 15 minutes):`,
    link,
    "",
    `— ${BRAND}`,
  ].join("\n");

  const html = layout({
    preheader: "Confirm your email to start virtual trading.",
    title: "Confirm your email",
    bodyHtml: `
      <p style="margin:0 0 14px;color:${INK};font-size:16px;">${greeting}</p>
      <p style="margin:0 0 14px;">
        Thanks for joining <strong style="color:${INK};">${escapeHtml(BRAND)}</strong>.
        Confirm your email to activate your account and start practicing with live market data.
      </p>
      ${ctaButton("Complete registration", link)}
      <p style="margin:18px 0 0;font-size:13px;">
        This link expires in <strong style="color:${INK};">15 minutes</strong>.
        If the button doesn’t work, copy and paste this URL into your browser:
      </p>
      <p style="margin:10px 0 0;word-break:break-all;font-size:12px;color:${ACCENT};">
        <a href="${escapeHtml(link)}" style="color:${ACCENT};">${escapeHtml(link)}</a>
      </p>
    `,
  });

  return { subject, text, html };
}

function passwordResetEmail({ link, username }) {
  const greeting = username
    ? `Hi ${escapeHtml(username)},`
    : "Hello,";
  const subject = `Reset your ${BRAND} password`;
  const text = [
    username ? `Hi ${username},` : "Hello,",
    "",
    `We received a request to reset your ${BRAND} password.`,
    "",
    `Open this link (expires in 15 minutes):`,
    link,
    "",
    "If you didn’t request this, you can ignore this email.",
    "",
    `— ${BRAND}`,
  ].join("\n");

  const html = layout({
    preheader: "Use this secure link to reset your password.",
    title: "Reset your password",
    bodyHtml: `
      <p style="margin:0 0 14px;color:${INK};font-size:16px;">${greeting}</p>
      <p style="margin:0 0 14px;">
        We received a request to reset the password for your
        <strong style="color:${INK};">${escapeHtml(BRAND)}</strong> account.
        Click below to choose a new password.
      </p>
      ${ctaButton("Reset password", link)}
      <p style="margin:18px 0 0;font-size:13px;">
        This link expires in <strong style="color:${INK};">15 minutes</strong>.
        If you didn’t ask for a reset, no action is needed.
      </p>
      <p style="margin:10px 0 0;word-break:break-all;font-size:12px;color:${ACCENT};">
        <a href="${escapeHtml(link)}" style="color:${ACCENT};">${escapeHtml(link)}</a>
      </p>
    `,
  });

  return { subject, text, html };
}

module.exports = {
  registrationEmail,
  passwordResetEmail,
};
