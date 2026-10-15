// Public settings only. NEVER put keys or admin tokens in this file (the repo is public).
window.GPH_CONFIG = {
  // Gateway base URL (no trailing slash). Replace with the custom domain once it exists.
  GATEWAY_URL: "https://new-api-production-6f0d.up.railway.app",
  // new-api: $1 = 500,000 quota units (notes/HANDOFF.md section 4).
  QUOTA_PER_USD: 500000,
  // Prices we charge, USD per 1M tokens (notes/HANDOFF.md section 4). flash is uniform on purpose,
  // so $1.2 of quota = exactly 1,000,000 tokens.
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
  // Optional: a link members tap for more credit (Telegram / Messenger / email). Empty = button hidden.
  CONTACT_URL: ""
};
