// The app's pictures (session 62), drawn by scripts/make-art.mjs into
// client/public/art/. One picture per category; requests without a photo
// show their category's picture so every card has an image.
const CATEGORY_ART = {
  Electronics: 'electronics', 'Phones & Tablets': 'phones', Computers: 'computers', 'Home & Furniture': 'home',
  Appliances: 'appliances', 'Vehicles & Parts': 'vehicles', Fashion: 'fashion', 'Beauty & Health': 'beauty',
  'Sports & Outdoors': 'sports', 'Toys & Kids': 'toys', 'Books & Media': 'books', 'Tools & DIY': 'tools',
  Garden: 'garden', Pets: 'pets', Services: 'services', Other: 'other',
};
export const categoryArt = (category) => `/art/cat-${CATEGORY_ART[category] || 'other'}.jpg`;
export const art = (name) => `/art/${name}`;
