// Public settings only. NEVER put keys or admin tokens in this file (the repo is public).
window.GPH_CONFIG = {
  // Gateway base URL (no trailing slash). Replace with the custom domain once it exists.
  GATEWAY_URL: "https://new-api-production-6f0d.up.railway.app",
  // new-api: $1 = 500,000 quota units (notes/HANDOFF.md section 4).
  QUOTA_PER_USD: 500000,
  // Prices we charge, USD per 1M tokens (notes/HANDOFF.md section 4). flash is uniform on purpose,
  // so $1.2 of quota = exactly 1,000,000 flash tokens.
  PRICES: {
    "deepseek-flash":  { input: 1.2,  output: 1.2 },
    "deepseek-v4-pro": { input: 1.32, output: 3.96 }
  },
  BASE_PRICE: 1.2,
  // Display info per model. Prices above are the real ones we charge; tags are short descriptions only.
  MODEL_INFO: {
    "deepseek-flash":  { tag: "Everyday · lowest price", accent: "sky" },
    "deepseek-v4-pro": { tag: "Advanced · higher price", accent: "violet" }
  },
  // Companies that must NOT get a "Powered by" badge in the header (their models still show on the Models tab).
  POWERED_HIDE: ["openai"],
  // Support contact shown on the Start page (a public Telegram username, no @).
  SUPPORT_TELEGRAM: "angsthtun",
  // Models listed in the Start page pop-ups. Names only: which ones really work depends on the key. Prices come from PRICES when set.
  START_MODELS: {
    deepseek: [
      { id: "deepseek-flash",  tag: "Everyday · lowest price" },
      { id: "deepseek-v4-pro", tag: "Advanced" }
    ],
    openai: [
      { id: "gpt-6-luna",    tag: "Light" },
      { id: "gpt-5.6-luna",  tag: "Light" },
      { id: "gpt-5.6-terra", tag: "Balanced" },
      { id: "gpt-5.6-sol",   tag: "Advanced" },
      { id: "gpt-6-astra",   tag: "Premium" },
      { id: "gpt-5.5-pro",   tag: "Premium" },
      { id: "gpt-5.3-codex", tag: "Coding" }
    ]
  },
  // How often the Models tab re-checks the gateway while the page is open and visible.
  LIVE_EVERY_MS: 60000
};
