// Example requests for every category (session 72), so each category has
// something to show in the demo. Used by `npm run seed` (server/src/seed.js)
// and by scripts/fetch-photos.mjs, which downloads each request's photo.
// [title, description, category, budget min, budget max, area, days ago, photo file, photo search words, Pexels id]
export const DEMO_BUYERS = [
  ['fatima@demo.local', 'Fatima Ali', 'Isa Town'],
  ['hussain@demo.local', 'Hussain Mahdi', 'Sitra'],
  ['noor@demo.local', 'Noor Khalil', 'Riffa'],
];

export const DEMO_REQUESTS = [
  ['Sony noise-cancelling headphones (XM4 or XM5)', 'Good condition, with the case. Original only, please.', 'Electronics', 60, 120, 'Hamad Town', 2, 'req-headphones.jpg', 'sony headphones', 32992390],
  ['iPhone 14 Pro, 256GB, any colour', 'Battery health above 85%. Box and receipt a plus.', 'Phones & Tablets', 350, 450, 'Isa Town', 1, 'req-iphone.jpg', 'iphone pro', 4071887],
  ['Samsung tablet for school', 'For my son, 10 inch or bigger, with a cover.', 'Phones & Tablets', 80, 150, 'Sitra', 5, 'req-tablet.jpg', 'tablet on desk', 6337],
  ['MacBook Air M1 or M2 for university', '8GB RAM at least. Small scratches are fine.', 'Computers', 400, 650, 'Riffa', 3, 'req-macbook.jpg', 'macbook air', 12935279],
  ['Gaming PC with RTX 3060 or better', 'Tower only, no monitor needed. Must run current games smoothly.', 'Computers', 500, 800, 'Muharraq', 8, 'req-gaming-pc.jpg', 'gaming pc rgb', 15109454],
  ['Majlis floor seating, 3 pieces', 'For a family majlis, dark colours. Delivery to Riffa.', 'Home & Furniture', 300, 700, 'Riffa', 4, 'req-majlis.jpg', 'floor cushions living room', 38701547],
  ['Front-load washing machine, 8kg or more', 'Working well, any brand. Need it this week.', 'Appliances', 80, 180, 'Sitra', 1, 'req-washer.jpg', 'washing machine', 11899611],
  ['Split AC, 2 ton, installed before summer', 'Inverter preferred. Price should include installation.', 'Appliances', 150, 300, 'Hamad Town', 6, 'req-ac.jpg', 'air conditioner unit wall', 38788452],
  ['Land Cruiser headlights (2016)', 'Both sides, original or good copy.', 'Vehicles & Parts', 60, 150, 'East Riffa', 2, 'req-headlight.jpg', 'car headlight', 17716173],
  ['Car tyres, 265/65 R17, set of 4', 'New or nearly new. Fitting in Sitra would be great.', 'Vehicles & Parts', 120, 260, 'Sitra', 9, 'req-tyres.jpg', 'car tyres stack', 37002235],
  ['Men\'s thobes tailored before Eid', 'Three thobes, white and grey. I bring the cloth or you supply it.', 'Fashion', 30, 60, 'Muharraq', 3, 'req-tailor.jpg', 'tailor sewing fabric', 19340518],
  ['White sneakers, size 43', 'Nike or Adidas, new or worn once.', 'Fashion', 40, 90, 'Juffair', 7, 'req-sneakers.jpg', 'white sneakers', 40059921],
  ['Hair styling set (Dyson or similar)', 'Complete set with all attachments.', 'Beauty & Health', 150, 400, 'Seef', 5, 'req-hair.jpg', 'hair dryer styling', 4746754],
  ['Oud perfume gift set', 'For a wedding gift, nicely packed.', 'Beauty & Health', 40, 120, 'Manama', 2, 'req-perfume.jpg', 'perfume bottles', 18656841],
  ['Road bike for a beginner, size M', 'Light frame, working gears. Helmet a bonus.', 'Sports & Outdoors', 150, 350, 'Saar', 10, 'req-roadbike.jpg', 'road bike', 13415390],
  ['Padel racket, intermediate', 'Used is fine if the grip is good.', 'Sports & Outdoors', 40, 110, 'Juffair', 1, 'req-padel.jpg', 'padel racket', 39558863],
  ['LEGO Technic sets for a 9-year-old', 'Complete sets with instructions.', 'Toys & Kids', 30, 90, 'Isa Town', 4, 'req-lego.jpg', 'lego bricks', 38277694],
  ['Kids\' ride-on car', 'Battery works, with charger. For a 4-year-old.', 'Toys & Kids', 60, 150, 'Hamad Town', 12, 'req-ridecar.jpg', 'kids toy car', 37883298],
  ['Naguib Mahfouz novels in Arabic', 'Used copies are fine. The Cairo Trilogy first.', 'Books & Media', 10, 40, 'Manama', 6, 'req-books.jpg', 'old books stack', 1383379],
  ['PS5 games: EA FC and Gran Turismo 7', 'Discs, good condition.', 'Books & Media', 30, 70, 'Riffa', 2, 'req-games.jpg', 'video game controller tv', 28973296],
  ['Cordless drill set (Bosch or Makita)', 'With two batteries and a charger.', 'Tools & DIY', 40, 110, 'Sitra', 3, 'req-drill.jpg', 'cordless drill', 30413428],
  ['Foldable ladder, 3 to 4 metres', 'Aluminium, steady. For home use.', 'Tools & DIY', 30, 80, 'Muharraq', 8, 'req-ladder.jpg', 'ladder', 3619317],
  ['Date palm offshoots (Khalas)', 'Three healthy offshoots, delivery to Budaiya.', 'Garden', 20, 60, 'Budaiya', 5, 'req-palm.jpg', 'palm tree', 33543030],
  ['Plants and pots for a balcony', 'Heat-tolerant plants, 6 to 8 pots.', 'Garden', 15, 50, 'Juffair', 1, 'req-plants.jpg', 'balcony plants pots', 40825880],
  ['Aquarium, about 100 litres, with filter', 'Glass tank with lid and light.', 'Pets', 40, 120, 'Isa Town', 7, 'req-aquarium.jpg', 'aquarium fish tank', 37431486],
  ['Cat carrier and scratching post', 'For a big cat, airline-approved carrier if possible.', 'Pets', 20, 50, 'Amwaj Islands', 3, 'req-cat.jpg', 'cat', 33585484],
  ['AC cleaning for 4 units', 'Split units, before the summer. This weekend if possible.', 'Services', 25, 60, 'Riffa', 2, 'req-ac-service.jpg', 'technician air conditioner', 7347538],
  ['Movers for a 2-bedroom flat', 'From Juffair to Saar, with packing.', 'Services', 80, 160, 'Juffair', 4, 'req-movers.jpg', 'moving boxes', 7203849],
  ['Henna artist for a wedding night', 'Bride and around 10 guests, in Muharraq.', 'Other', 50, 150, 'Muharraq', 9, 'req-henna.jpg', 'henna hand', 12872530],
  ['Gift wrapping for 30 Eid boxes', 'Ready by next Thursday. Boxes supplied.', 'Other', 20, 60, 'Manama', 1, 'req-gifts.jpg', 'gift wrapping', 5802138],
];
