// The fixed list of categories. Shared with the client via GET /api/meta.
export const CATEGORIES = [
  'Electronics', 'Phones & Tablets', 'Computers', 'Home & Furniture', 'Appliances',
  'Vehicles & Parts', 'Fashion', 'Beauty & Health', 'Sports & Outdoors', 'Toys & Kids',
  'Books & Media', 'Tools & DIY', 'Garden', 'Pets', 'Services', 'Other',
];
// Unc works in Bahrain: every price is in Bahraini Dinar (session 80).
export const CURRENCIES = ['BHD'];

// Craigslist-style sections (session 82). "wanted" = the original buyer
// requests (CATEGORIES above); "housing" and "jobs" = ads posted by
// landlords and employers, answered in the ad's chat.
export const SECTIONS = ['wanted', 'housing', 'jobs'];
export const HOUSING_CATEGORIES = ['Flats & apartments', 'Rooms & shared', 'Villas & houses', 'Offices & shops'];
export const JOB_CATEGORIES = [
  'Sales & retail', 'Food & hospitality', 'Office & admin', 'Drivers & delivery',
  'Trades & construction', 'IT & tech', 'Health & beauty', 'Other jobs',
];
export const JOB_TYPES = ['full-time', 'part-time', 'contract'];
export const categoriesFor = (section) => ({ housing: HOUSING_CATEGORIES, jobs: JOB_CATEGORIES }[section] ?? CATEGORIES);
