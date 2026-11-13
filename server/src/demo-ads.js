// Demo Housing and Jobs ads (session 82) for `npm run seed`, prices in BD.
// [poster email, section, category, title, description, price, priceMax, city, daysAgo, bedrooms, furnished, jobType, condition, photo]
export const DEMO_ADS = [
  ['fatima@demo.local', 'housing', 'Flats & apartments', '2 bedroom flat in Juffair, sea view', 'Fully furnished, 9th floor, gym and pool, covered parking. Electricity and water included up to BD 30. Available from the 1st.', 380, 380, 'Juffair', 1, 2, 1, null],
  ['hussain@demo.local', 'housing', 'Rooms & shared', 'Room in a shared flat, Adliya', 'Big room with its own bathroom in a 3 bedroom flat. Quiet professionals, no smoking. Wi-Fi and bills included.', 140, 140, 'Adliya', 2, 1, 1, null],
  ['furniture@demo.local', 'housing', 'Offices & shops', 'Small shop for rent on Road 1105, Muharraq', 'Ground floor, 40 m², glass front on a busy road. Good for a café, salon or phone shop. CR needed.', 300, 300, 'Muharraq', 3, null, 0, null],
  ['noor@demo.local', 'housing', 'Villas & houses', '4 bedroom villa with garden, Saar', 'Semi-furnished villa, maid room, private garden and 2 parking spaces. Near schools. One year contract.', 850, 850, 'Saar', 4, 4, 0, null],
  ['fatima@demo.local', 'housing', 'Flats & apartments', 'Studio in Seef, near the mall', 'New building, furnished studio, walking distance to Seef Mall. Monthly or yearly.', 220, 220, 'Seef', 5, 0, 1, null],
  ['hussain@demo.local', 'housing', 'Flats & apartments', '1 bedroom flat in Hoora, unfurnished', 'Second floor, balcony, split ACs. Close to the bus stop and shops.', 180, 180, 'Hoora', 6, 1, 0, null],
  ['vendor@demo.local', 'jobs', 'Sales & retail', 'Sales assistant for an electronics shop in Seef', 'Help customers choose phones and laptops, keep the shop tidy. Arabic and English. Training given.', 350, 450, 'Seef', 1, null, null, 'full-time'],
  ['phonefix@demo.local', 'jobs', 'Trades & construction', 'Phone repair technician', 'At least 2 years fixing screens and batteries. Own tools a plus. Salary depends on experience.', 400, 600, 'Manama', 2, null, null, 'full-time'],
  ['autoparts@demo.local', 'jobs', 'Drivers & delivery', 'Delivery driver with a light licence', 'Deliver car parts across Bahrain. Company van provided, fuel paid. Morning shift.', 300, 380, 'East Riffa', 3, null, null, 'full-time'],
  ['furniture@demo.local', 'jobs', 'Trades & construction', 'Furniture assembler, weekends', 'Assemble sofas and dining sets at customers’ homes on Fridays and Saturdays.', 150, 200, 'Muharraq', 4, null, null, 'part-time'],
  ['noor@demo.local', 'jobs', 'Food & hospitality', 'Barista for a café in Adliya', 'Morning shifts, latte art a plus. Friendly team, meals included.', 280, 320, 'Adliya', 5, null, null, 'full-time'],
  ['vendor@demo.local', 'jobs', 'IT & tech', 'Website update, 3 month contract', 'Update our online catalogue and product photos. Can be done part from home, meetings in Seef.', 600, 900, 'Seef', 6, null, null, 'contract'],
  // For sale (session 84): [.., condition, photo from server/demo-photos]
  ['hussain@demo.local', 'forsale', 'Phones & Tablets', 'iPhone 14 Pro, 256GB, deep purple', 'Battery 89%, always in a case, box and cable included. No scratches on the screen.', 230, 230, 'Sitra', 1, null, null, null, 'used', 'req-iphone.jpg'],
  ['furniture@demo.local', 'forsale', 'Home & Furniture', 'Solid oak dining table with 6 chairs', 'New from our showroom, 180 cm. Free delivery in Bahrain and assembly.', 320, 320, 'Muharraq', 2, null, null, null, 'new', 'oak-table.jpg'],
  ['noor@demo.local', 'forsale', 'Sports & Outdoors', 'Road bike, 54 cm frame', 'Aluminium frame, Shimano gears, new tyres last month. Selling because I moved.', 95, 95, 'Riffa', 3, null, null, null, 'used', 'req-roadbike.jpg'],
  ['vendor@demo.local', 'forsale', 'Electronics', 'Sony noise cancelling headphones', 'Sealed in the box, one year shop warranty.', 110, 110, 'Seef', 3, null, null, null, 'new', 'req-headphones.jpg'],
  ['fatima@demo.local', 'forsale', 'Home & Furniture', 'Wardrobe, 3 doors, white', 'Good condition, you collect from Isa Town. Can help take it apart.', 40, 40, 'Isa Town', 5, null, null, null, 'used', 'wardrobe.jpg'],
  ['autoparts@demo.local', 'forsale', 'Vehicles & Parts', 'Set of 4 tyres, 225/45 R17', 'Brand new, fitting included at our shop in East Riffa.', 120, 120, 'East Riffa', 6, null, null, null, 'new', 'req-tyres.jpg'],
];
