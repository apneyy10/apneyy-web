/**
 * Sample listings for preview deployments, in the same shape as Firestore
 * business documents. Never used when real verified listings exist (see build-data.mjs).
 */

const H = (open, close, closedOn = []) =>
  Object.fromEntries(
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(d => [
      d,
      { isOpen: !closedOn.includes(d), ranges: [{ open, close }] },
    ])
  );

const SPLIT = {
  monday: { isOpen: false, ranges: [] },
  ...Object.fromEntries(
    ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(d => [
      d,
      { isOpen: true, ranges: [{ open: '11:30', close: '15:00' }, { open: '17:00', close: d === 'friday' || d === 'saturday' ? '23:00' : '22:00' }] },
    ])
  ),
};

const PLACES = {
  edison: { city: 'Edison', state: 'NJ', postalCode: '08820', timezone: 'America/New_York', lat: 40.5726, lng: -74.3557, street: 'Oak Tree Rd' },
  jerseycity: { city: 'Jersey City', state: 'NJ', postalCode: '07306', timezone: 'America/New_York', lat: 40.7356, lng: -74.0565, street: 'Newark Ave' },
  jackson: { city: 'Jackson Heights', state: 'NY', postalCode: '11372', timezone: 'America/New_York', lat: 40.7489, lng: -73.8916, street: '74th St' },
  chicago: { city: 'Chicago', state: 'IL', postalCode: '60659', timezone: 'America/Chicago', lat: 41.9977, lng: -87.6963, street: 'W Devon Ave' },
  houston: { city: 'Houston', state: 'TX', postalCode: '77036', timezone: 'America/Chicago', lat: 29.7064, lng: -95.5133, street: 'Hillcroft Ave' },
  irving: { city: 'Irving', state: 'TX', postalCode: '75038', timezone: 'America/Chicago', lat: 32.8916, lng: -96.9617, street: 'N MacArthur Blvd' },
  fremont: { city: 'Fremont', state: 'CA', postalCode: '94538', timezone: 'America/Los_Angeles', lat: 37.5308, lng: -121.9712, street: 'Fremont Blvd' },
  sunnyvale: { city: 'Sunnyvale', state: 'CA', postalCode: '94086', timezone: 'America/Los_Angeles', lat: 37.3717, lng: -122.0379, street: 'El Camino Real' },
  artesia: { city: 'Artesia', state: 'CA', postalCode: '90701', timezone: 'America/Los_Angeles', lat: 33.8669, lng: -118.0828, street: 'Pioneer Blvd' },
  atlanta: { city: 'Decatur', state: 'GA', postalCode: '30033', timezone: 'America/New_York', lat: 33.8016, lng: -84.2635, street: 'Lawrenceville Hwy' },
  seattle: { city: 'Bellevue', state: 'WA', postalCode: '98007', timezone: 'America/Los_Angeles', lat: 47.6133, lng: -122.1424, street: 'NE 8th St' },
  queens: { city: 'Richmond Hill', state: 'NY', postalCode: '11419', timezone: 'America/New_York', lat: 40.6888, lng: -73.8186, street: '101st Ave' },
};

const S = [
  ['Saffron Tandoor House', 'केसर तंदूर हाउस', 'restaurant', 'edison', 'A family-run Punjabi kitchen on Oak Tree Road. Our clay tandoor fires fresh naan all day, and the weekend thali is cooked the way Biji taught us. Big groups and late-night chai always welcome.', ['English', 'Hindi', 'Punjabi'], ['halal', 'jain'], ['north_indian', 'punjabi', 'tandoor_grill'], ['Lunch Buffet', 'Butter Chicken', 'Weekend Thali', 'Late Night Chai'], '$$', SPLIT, ['dine_in', 'takeout', 'delivery', 'catering', 'buffet'], ['free_parking', 'kid_friendly', 'sports_tv']],
  ['Udupi Annapoorna', 'ಉಡುಪಿ ಅನ್ನಪೂರ್ಣ', 'restaurant', 'sunnyvale', 'Crisp dosas, fluffy idlis and filter coffee served in steel tumblers. Pure vegetarian South Indian tiffin since 2009, with a Sunday Kerala sadya on banana leaf.', ['English', 'Kannada', 'Tamil', 'Telugu'], ['pure_veg', 'jain', 'vegan'], ['south_indian', 'kerala'], ['Dosa', 'Filter Coffee', 'Sunday Sadya', 'Idli Vada'], '$', H('08:00', '21:30'), ['dine_in', 'takeout', 'catering'], ['free_parking', 'kid_friendly']],
  ['Karachi Grill & Kabab', 'کراچی گرل', 'restaurant', 'houston', 'Charcoal seekh kababs, nihari slow-cooked overnight and Karachi-style chicken karahi. Halal, family seating and the best chai on Hillcroft.', ['English', 'Urdu', 'Hindi'], ['halal'], ['mughlai', 'tandoor_grill'], ['Nihari', 'Seekh Kabab', 'Karahi', 'Family Seating'], '$$', H('12:00', '01:00'), ['dine_in', 'takeout', 'delivery'], ['free_parking', 'kid_friendly', 'sports_tv']],
  ['Himalayan Momo Hut', 'हिमालयन मोमो', 'quick_service', 'jackson', 'Steamed, fried and jhol momos folded by hand every morning, plus thukpa and chowmein. A tiny Nepali spot with a big following under the 7 train.', ['English', 'Nepali', 'Hindi'], ['halal'], ['nepali'], ['Jhol Momo', 'Thukpa', 'Late Night'], '$', H('11:00', '23:00'), ['dine_in', 'takeout', 'delivery'], []],
  ['Dhaka Biryani House', 'ঢাকা বিরিয়ানি', 'restaurant', 'queens', 'Kacchi biryani the old Dhaka way, sealed in dum for hours. Fresh fish curries, pitha on weekends and catering for weddings and milad.', ['English', 'Bengali', 'Hindi'], ['halal'], ['bengali', 'biryani'], ['Kacchi Biryani', 'Fish Curry', 'Pitha', 'Wedding Catering'], '$$', H('11:00', '22:30'), ['dine_in', 'takeout', 'catering'], ['kid_friendly']],
  ['Chaat Corner', 'चाट कॉर्नर', 'quick_service', 'chicago', 'Pani puri, papdi chaat and Mumbai vada pav straight from Devon Avenue. Every chutney is made in-house, every day.', ['English', 'Hindi', 'Gujarati', 'Urdu'], ['pure_veg', 'jain'], ['street_food'], ['Pani Puri', 'Vada Pav', 'Kathi Rolls'], '$', H('11:00', '21:00', ['tuesday']), ['dine_in', 'takeout'], []],
  ['Gangaur Sweets', 'गणगौर स्वीट्स', 'sweets_mithai', 'edison', 'Pure ghee mithai, namkeen and festival boxes made fresh every morning. Pre-order Diwali, Rakhi and wedding boxes with custom packaging.', ['English', 'Hindi', 'Gujarati', 'Marathi'], ['pure_veg', 'eggless'], [], ['Kaju Katli', 'Diwali Boxes', 'Jalebi', 'Namkeen'], '$$', H('10:00', '21:00'), ['takeout', 'shipping', 'delivery'], ['free_parking', 'festival_specials']],
  ['Chai Point Café', 'चाय पॉइंट', 'bakery_cafe', 'irving', 'Kadak masala chai, fresh rusk, veg puffs and eggless cakes. Laptop friendly by day, the community hangout by night.', ['English', 'Hindi', 'Telugu', 'Tamil'], ['eggless', 'pure_veg'], [], ['Masala Chai', 'Veg Puffs', 'Eggless Cakes'], '$', H('07:00', '22:00'), ['dine_in', 'takeout'], ['wifi', 'outdoor_seating']],
  ['Patel Fresh Market', 'પટેલ ફ્રેશ માર્કેટ', 'grocery_store', 'chicago', 'Spices, atta and rice, fresh methi and karela, frozen parathas and pooja items, all under one roof. Weekly deals every Wednesday.', ['English', 'Gujarati', 'Hindi', 'Urdu'], [], [], ['Spices', 'Fresh Vegetables', 'Frozen Foods', 'Pooja Items'], '$', H('09:00', '21:00'), ['delivery', 'walk_ins'], ['free_parking']],
  ['Apna Bazaar', 'ਅਪਣਾ ਬਾਜ਼ਾਰ', 'grocery_store', 'fremont', 'The Bay Area’s go-to South Asian grocer, with a hot snacks counter, fresh paneer and a full halal meat section.', ['English', 'Punjabi', 'Hindi', 'Urdu'], ['halal'], [], ['Fresh Paneer', 'Halal Meat', 'Atta & Rice', 'Snacks Counter'], '$', H('08:30', '21:30'), ['walk_ins', 'delivery'], ['free_parking', 'wheelchair']],
  ['Lakshmi Silks & Sarees', 'லக்ஷ்மி சில்க்ஸ்', 'clothing_store', 'artesia', 'Kanjeevaram silk, Banarasi and designer sarees, plus blouse stitching in a week. Bridal appointments with a personal stylist.', ['English', 'Tamil', 'Telugu', 'Hindi'], [], [], ['Saree', 'Kanjeevaram', 'Bridal', 'Blouse Stitching'], '$$$', H('11:00', '20:00', ['monday']), ['appointments', 'walk_ins', 'shipping'], ['women_staff', 'free_parking']],
  ['Royal Sherwani Studio', 'रॉयल शेरवानी', 'clothing_store', 'jerseycity', 'Sherwanis, Indo-western suits and kurta pajamas for grooms and the whole baraat. Custom fittings and rentals available.', ['English', 'Hindi', 'Gujarati', 'Urdu'], [], [], ['Sherwani', 'Kurta', 'Groom Wear', 'Rentals'], '$$$', H('11:00', '20:00'), ['appointments', 'walk_ins'], []],
  ['Sona Jewellers', 'सोना ज्वेलर्स', 'jewelry_store', 'edison', '22K gold, polki and diamond bridal sets, crafted by artisans with three generations of experience. Gold buy-back and custom design.', ['English', 'Hindi', 'Gujarati', 'Punjabi'], [], [], ['22K Gold', 'Bridal Sets', 'Custom Design'], '$$$$', H('11:00', '19:30', ['tuesday']), ['appointments', 'walk_ins'], ['free_parking']],
  ['Glow Threading & Beauty', 'ग्लो ब्यूटी', 'beauty_salon', 'irving', 'Eyebrow threading in five minutes, bridal makeup, facials and waxing. Licensed staff, walk-ins welcome seven days a week.', ['English', 'Hindi', 'Telugu', 'Urdu'], [], [], ['Eyebrow Threading', 'Bridal Makeup', 'Facials'], '$', H('10:00', '20:00'), ['walk_ins', 'appointments'], ['women_staff']],
  ['Mehndi by Anika', 'મહેંદી બાય અનિકા', 'mehndi_artist', 'fremont', 'Bridal and party mehndi with 100% organic henna, mixed fresh every morning. We come to your home or venue anywhere in the Bay Area.', ['English', 'Hindi', 'Gujarati'], [], [], ['Bridal Mehndi', 'Organic Henna', 'Arabic Design'], '$$$', H('10:00', '19:00', ['tuesday']), ['appointments', 'home_service', 'private_events'], ['women_staff', 'festival_specials']],
  ['Shaadi Lens Studio', 'शादी लेंस', 'photography', 'jerseycity', 'Candid wedding photography across the tri-state area. Haldi, mehndi, sangeet, pheras and reception, beautifully covered.', ['English', 'Hindi', 'Punjabi', 'Gujarati'], [], [], ['Wedding Photography', 'Pre-Wedding Shoot', 'Drone'], '$$$', H('10:00', '18:00', ['sunday']), ['appointments', 'home_service'], []],
  ['Dhol Nation', 'ਢੋਲ ਨੇਸ਼ਨ', 'dj_music', 'queens', 'Live dhol for baraats, Bhangra DJ sets and LED dance floors. From mehndi night to reception, we bring the energy.', ['English', 'Punjabi', 'Hindi'], [], [], ['Dhol Player', 'Bhangra', 'Bollywood DJ'], '$$', H('10:00', '22:00'), ['appointments', 'private_events', 'home_service'], []],
  ['Nritya Dance Academy', 'नृत्य डांस अकादमी', 'dance_studio', 'sunnyvale', 'Bharatanatyam, Kathak and Bollywood classes for ages 4 to 60. Annual recital, arangetram coaching and weekend batches.', ['English', 'Tamil', 'Hindi', 'Telugu'], [], [], ['Bharatanatyam', 'Kathak', 'Bollywood Dance'], '$$', H('16:00', '20:30', ['monday']), ['appointments', 'online'], ['kid_friendly']],
  ['Shree Ganesh Mandir', 'श्री गणेश मंदिर', 'temple', 'atlanta', 'Daily aarti, weekend bhajans and festivals all year round. Prasadam after every Sunday puja, and everyone is welcome.', ['English', 'Hindi', 'Gujarati', 'Telugu', 'Tamil'], ['pure_veg'], [], ['Aarti', 'Prasadam', 'Festivals'], '', H('07:00', '20:30'), ['walk_ins'], ['free_parking', 'wheelchair', 'kid_friendly']],
  ['Gurdwara Sahib Bellevue', 'ਗੁਰਦੁਆਰਾ ਸਾਹਿਬ', 'gurdwara', 'seattle', 'Sunday diwan, kirtan and langar for all. Punjabi classes for kids and community seva every weekend.', ['English', 'Punjabi', 'Hindi'], ['pure_veg'], [], ['Langar', 'Kirtan', 'Sunday Diwan'], '', H('05:30', '21:00'), ['walk_ins'], ['free_parking', 'wheelchair', 'kid_friendly']],
  ['Pandit Raghav Sharma', 'पंडित राघव शर्मा', 'pooja_services', 'irving', 'Griha pravesh, Satyanarayan katha, havan and wedding ceremonies in Hindi, Sanskrit and English, at your home or venue.', ['English', 'Hindi', 'Sanskrit'], [], [], ['Griha Pravesh', 'Havan', 'Wedding Priest'], '$$', H('07:00', '20:00'), ['appointments', 'home_service', 'online'], []],
  ['Desi Express Courier', 'देसी एक्सप्रेस', 'courier_delivery', 'jerseycity', 'Send parcels, documents and gifts across South Asia in 5 to 7 days, with door pickup anywhere in New Jersey.', ['English', 'Hindi', 'Gujarati', 'Bengali'], [], [], ['Parcel Service', 'Door Pickup', 'Documents'], '$', H('10:00', '19:00', ['sunday']), ['home_service', 'walk_ins'], []],
  ['Yatra Travels', 'यात्रा ट्रेवल्स', 'travel_agent', 'chicago', 'Best fares to Delhi, Mumbai, Lahore, Dhaka and Kathmandu, plus pilgrimage tours and group bookings for weddings.', ['English', 'Hindi', 'Urdu', 'Punjabi', 'Gujarati'], [], [], ['Group Travel', 'Tour Packages', 'Pilgrimage'], '$$', H('10:00', '18:30', ['sunday']), ['appointments', 'online'], []],
  ['Singh Truck & Diesel Repair', 'ਸਿੰਘ ਟਰੱਕ ਰਿਪੇਅਰ', 'auto_truck', 'fremont', 'Semi truck and diesel repair, DOT inspections and tires, 24/7 roadside help. Punjabi-speaking mechanics who get you back on the road.', ['English', 'Punjabi', 'Hindi'], [], [], ['Semi Truck Repair', 'DOT Inspection', 'Tires'], '$$', H('06:00', '22:00'), ['walk_ins', 'home_service'], ['free_parking']],
  ['Sattva Yoga Studio', 'सत्त्व योग', 'fitness_yoga', 'seattle', 'Hatha yoga, pranayama and guided meditation taught by teachers trained in Rishikesh. Your first class is free.', ['English', 'Hindi'], [], [], ['Hatha Yoga', 'Pranayama', 'Meditation'], '$$', H('06:30', '20:00'), ['appointments', 'online'], ['women_staff']],
  ['Tiffin Ghar', 'टिफिन घर', 'tiffin_service', 'jerseycity', 'Home-style dal, sabzi, roti and rice delivered daily. Weekly and student plans, Jain and no onion-garlic options.', ['English', 'Hindi', 'Gujarati', 'Marathi'], ['pure_veg', 'jain', 'no_onion_garlic'], ['north_indian', 'gujarati'], ['Daily Tiffin', 'Student Plans', 'Home Cooked'], '$', H('10:00', '20:00', ['sunday']), ['delivery', 'catering'], []],
  ['Lahore Kitchen', 'لاہور کچن', 'restaurant', 'artesia', 'Lahori chargha, paye and fresh tandoori naan on Pioneer Boulevard. Halal, big portions and weekend breakfast with halwa puri.', ['English', 'Urdu', 'Punjabi'], ['halal'], ['mughlai', 'punjabi', 'tandoor_grill'], ['Halwa Puri', 'Chargha', 'Weekend Breakfast'], '$$', SPLIT, ['dine_in', 'takeout', 'catering'], ['free_parking', 'kid_friendly']],
  ['Colombo Spice', 'කොළඹ ස්පයිස්', 'restaurant', 'houston', 'Sri Lankan hoppers, kottu roti and black pork curry, cooked with spices we roast ourselves.', ['English', 'Sinhala', 'Tamil'], ['gluten_free'], ['fusion'], ['Hoppers', 'Kottu Roti', 'Lamprais'], '$$', H('11:30', '21:30', ['monday']), ['dine_in', 'takeout'], ['kid_friendly']],
  ['Bollywood Banquets', 'बॉलीवुड बैंक्वेट्स', 'banquet_hall', 'edison', 'Elegant hall for 50 to 600 guests with in-house catering, mandap décor and valet. Weddings, sangeet and birthdays.', ['English', 'Hindi', 'Gujarati', 'Punjabi'], ['halal', 'jain'], [], ['Weddings', 'In-house Catering', 'Parking'], '$$$', H('10:00', '23:00'), ['private_events', 'catering', 'appointments'], ['free_parking', 'wheelchair']],
  ['Kirana Books & Gifts', 'किराना बुक्स', 'books_media', 'atlanta', 'Hindi and Urdu books, kids’ bilingual stories, rakhis, handicrafts and festival gifts.', ['English', 'Hindi', 'Urdu', 'Bengali'], [], [], ['Hindi Books', 'Rakhi', 'Handicrafts'], '$', H('11:00', '19:00', ['monday']), ['walk_ins', 'shipping'], ['kid_friendly']],
];


export function sampleBusinesses() {
  const now = Date.parse('2026-10-20T12:00:00Z');
  return S.map(([name, nameNative, category, placeKey, description, languages, dietary, cuisines, tags, priceRange, hours, services, amenities], i) => {
    const p = PLACES[placeKey];
    const n = 100 + ((i * 37) % 900);
    const area = { NJ: '732', NY: '718', IL: '773', TX: p.city === 'Irving' ? '972' : '713', CA: p.city === 'Artesia' ? '562' : '510', GA: '404', WA: '425' }[p.state];
    const line = String(1000 + ((i * 53) % 9000)).padStart(4, '0');
    const slugBase = `${name} ${p.city}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return {
      id: `sample${String(i + 1).padStart(3, '0')}`,
      name,
      nameNative,
      slug: `${slugBase}-s${i + 1}`,
      category,
      indianConnection: ['owned', 'language', ...(cuisines.length ? ['food_products'] : ['community'])],
      cuisines,
      dietary,
      services,
      amenities,
      tags,
      languagesSpoken: languages,
      description,
      phone: `+1${area}555${line}`,
      phoneDisplay: `(${area}) 555-${line}`,
      email: '',
      website: '',
      menuUrl: '',
      orderingLinks: {},
      socialLinks: {},
      address: {
        line1: `${n} ${p.street}`,
        line2: '',
        city: p.city,
        state: p.state,
        postalCode: p.postalCode,
        country: 'US',
        timezone: p.timezone,
        lat: p.lat + ((i % 5) - 2) * 0.004,
        lng: p.lng + ((i % 3) - 1) * 0.004,
      },
      openingHours: hours,
      priceRange,
      paymentMethods: ['Cash', 'Credit card', 'Zelle'],
      featuredItems: [],
      photos: [],
      logo: '',
      licenseNumber: ['beauty_salon', 'barber_shop'].includes(category) ? 'TX-COS-0' + (40000 + i) : '',
      status: 'verified',
      createdAt: new Date(now - i * 86400000 * 2).toISOString(),
      updatedAt: new Date(now - i * 86400000).toISOString(),
    };
  });
}
