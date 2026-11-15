// Which extra features show in the app (session 102, the honest review
// point 4: "too many features for zero users"). The code, the server routes
// and the tests all stay; set one to true to bring it back. Core features
// (post, browse, chat, rate, report) are always on.
// Building with VITE_ALL_FEATURES=1 turns them all on: the browser tests
// (e2e/smoke.mjs, e2e/arabic.mjs) keep testing the hidden code that way.
const ALL = import.meta.env?.VITE_ALL_FEATURES === '1';

const CHOSEN = {
  installments: false,    // paying in parts (PlanCard in chats)
  wallet: false,          // Unc credit (Wallet page)
  referrals: false,       // invite friends for credit (Invite page)
  stories: false,         // "found it" stories after a deal
  proofPhotos: false,     // "ask for a proof photo" in chats
  pickupChecklist: false, // meet-up checklist and big-deal card in chats
  demand: false,          // "what people ask for" page
  alerts: false,          // request alerts
  awayMode: false,        // away mode in Settings
  compareOffers: false,   // compare offers table on a request
  teams: false,           // business team members
};

export const FEATURES = Object.fromEntries(Object.entries(CHOSEN).map(([k, v]) => [k, ALL || v]));
