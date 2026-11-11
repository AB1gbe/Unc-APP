// Downloads the real photos used by the app (session 64) from Pexels
// (free to use, https://www.pexels.com/license/), crops them to size and
// writes a credits file with every photographer's name.
//
// Needs a free Pexels API key (https://www.pexels.com/api/). On Windows cmd,
// inside Unc-APP:
//   set PEXELS_API_KEY=your-key
//   node scripts/fetch-photos.mjs
// The photos are committed, so you only run this to change them. Each entry
// has a fixed Pexels photo id, so a re-run downloads the same pictures; set
// id to null and run again to pick the first search result instead.
// (Uses Playwright's browser for cropping, like scripts/make-art.mjs.)
import fs from 'node:fs';
import { chromium } from 'playwright';

const KEY = process.env.PEXELS_API_KEY;
if (!KEY) { console.error('Set PEXELS_API_KEY first (see the top of this file).'); process.exit(1); }
const ART = new URL('../client/public/art/', import.meta.url).pathname;
const DEMO = new URL('../server/demo-photos/', import.meta.url).pathname;

// [folder, file, width, height, search words, Pexels photo id or null]
const PHOTOS = [
  // Demo data (npm run seed)
  [DEMO, 'ps5-wanted.jpg', 1200, 900, 'playstation 5 console controller', 13189290],
  [DEMO, 'oak-table.jpg', 1200, 900, 'dining room table', 6748972],
  [DEMO, 'wardrobe.jpg', 1200, 900, 'wardrobe closet bedroom', 6527064],
  [DEMO, 'offer-ps5-boxed.jpg', 1200, 900, 'playstation 5 box', 34956925],
  [DEMO, 'offer-ps5-disc.jpg', 1200, 900, 'playstation controller white', 3945657],
  [DEMO, 'charger-case.jpg', 1200, 900, 'phone charger cable', 4072683],
  [DEMO, 'story-found-it.jpg', 1200, 900, 'woman holding shopping bags happy', 3775547],
  [DEMO, 'avatar-sam.jpg', 512, 512, 'smiling man portrait', 6102841],
  [DEMO, 'avatar-riverside.jpg', 512, 512, 'phone repair shop', 36969131],
  [DEMO, 'avatar-alex.jpg', 512, 512, 'young man smiling portrait', 27544052],
  [DEMO, 'cover-riverside.jpg', 1600, 600, 'mobile phone shop', 11297769],
  // More demo shops (session 72: Unc puts businesses first)
  [DEMO, 'cover-furniture.jpg', 1600, 600, 'furniture showroom', 6830012],
  [DEMO, 'avatar-furniture.jpg', 512, 512, 'furniture store owner', 8837498],
  [DEMO, 'cover-autoparts.jpg', 1600, 600, 'auto parts store shelves', 4480505],
  [DEMO, 'avatar-autoparts.jpg', 512, 512, 'mechanic portrait', 9112798],
  [DEMO, 'cover-phonefix.jpg', 1600, 600, 'phone repair workbench', 31862953],
  [DEMO, 'avatar-phonefix.jpg', 512, 512, 'smartphone repair technician', 19518397],
  // How Unc works
  [ART, 'step-post.jpg', 480, 360, 'person typing on smartphone', 6260105],
  [ART, 'step-offers.jpg', 480, 360, 'shop owner using phone counter', 6612691],
  [ART, 'step-deal.jpg', 480, 360, 'handshake deal', 33175650],
  // Categories
  [ART, 'cat-electronics.jpg', 480, 360, 'headphones', 210927],
  [ART, 'cat-phones.jpg', 480, 360, 'smartphone in hand', 242427],
  [ART, 'cat-computers.jpg', 480, 360, 'laptop on desk', 1128207],
  [ART, 'cat-home.jpg', 480, 360, 'sofa living room', 6758245],
  [ART, 'cat-appliances.jpg', 480, 360, 'kitchen appliances', 18071814],
  [ART, 'cat-vehicles.jpg', 480, 360, 'car parked street', 10971731],
  [ART, 'cat-fashion.jpg', 480, 360, 'sneakers', 4901935],
  [ART, 'cat-beauty.jpg', 480, 360, 'skincare products', 3736398],
  [ART, 'cat-sports.jpg', 480, 360, 'bicycle', 32403277],
  [ART, 'cat-toys.jpg', 480, 360, 'children toys', 1329305],
  [ART, 'cat-books.jpg', 480, 360, 'books stack', 5009160],
  [ART, 'cat-tools.jpg', 480, 360, 'tools on workbench', 7423708],
  [ART, 'cat-garden.jpg', 480, 360, 'potted plants', 36620948],
  [ART, 'cat-pets.jpg', 480, 360, 'cute dog', 32949053],
  [ART, 'cat-services.jpg', 480, 360, 'technician repairing', 33958627],
  [ART, 'cat-other.jpg', 480, 360, 'gift box', 1303087],
  // Help page
  [ART, 'help-start.jpg', 480, 360, 'person using smartphone app', 6940874],
  [ART, 'help-offers.jpg', 480, 360, 'two people talking shop', 5622290],
  [ART, 'help-safety.jpg', 480, 360, 'padlock security', 36740854],
  [ART, 'help-payments.jpg', 480, 360, 'credit card payment', 5242822],
  [ART, 'help-account.jpg', 480, 360, 'laptop keyboard hands', 17810854],
  [ART, 'help-team.jpg', 300, 300, 'customer support headset smiling', 14566062],
];

const api = async (path) => {
  const res = await fetch(`https://api.pexels.com/v1/${path}`, { headers: { Authorization: KEY } });
  if (!res.ok) throw new Error(`Pexels ${res.status} for ${path}`);
  return res.json();
};

const used = new Set();
const credits = { [ART]: {}, [DEMO]: {} };
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [dir, file, w, h, words, id] of PHOTOS) {
  let photo;
  if (id) photo = await api(`photos/${id}`);
  else {
    const orientation = w === h ? 'square' : 'landscape';
    const found = await api(`search?query=${encodeURIComponent(words)}&per_page=15&orientation=${orientation}`);
    photo = found.photos.find((p) => !used.has(p.id));
    if (!photo) throw new Error(`No photo found for "${words}"`);
  }
  used.add(photo.id);
  const img = await fetch(photo.src.large2x);
  if (!img.ok) throw new Error(`Download ${img.status} for ${file}`);
  const b64 = Buffer.from(await img.arrayBuffer()).toString('base64');
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<body style="margin:0"><img id="p" src="data:image/jpeg;base64,${b64}" style="width:${w}px;height:${h}px;object-fit:cover;display:block"></body>`);
  await page.locator('#p').evaluate((el) => el.decode());
  await page.locator('#p').screenshot({ path: `${dir}${file}`, type: 'jpeg', quality: 80 });
  credits[dir][file] = { pexelsId: photo.id, photographer: photo.photographer, page: photo.url };
  console.log(file, '←', photo.id, photo.photographer);
}
await browser.close();
for (const dir of [ART, DEMO]) fs.writeFileSync(`${dir}credits.json`, `${JSON.stringify(credits[dir], null, 2)}\n`);
