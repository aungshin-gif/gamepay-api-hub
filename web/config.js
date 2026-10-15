// Public settings only. NEVER put keys or admin tokens in this file (the repo is public).
window.GPH_CONFIG = {
  // Gateway base URL (no trailing slash). Replace with the real one once the custom domain exists.
  GATEWAY_URL: "https://new-api-production-6f0d.up.railway.app",
  // 1 token of quota = this many USD when input and output are both priced at 1.2 USD per 1M tokens.
  // So $1.2 of quota = 1,000,000 tokens (see notes/HANDOFF.md section 5).
  USD_PER_MILLION_TOKENS: 1.2
};
