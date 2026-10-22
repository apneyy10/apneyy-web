/**
 * Labels for the ids stored on business documents. Mirrors the shared list in
 * apneyy-admin; admins can add categories at runtime (categories/catalog), which
 * CategoryService merges over this list. Ids are stored in Firestore, never rename one.
 */

export interface Option {
  id: string;
  label: string;
  icon?: string;
  hint?: string;
}

export type CategoryGroupId = 'food' | 'shopping' | 'beauty' | 'events' | 'services' | 'community';

export interface CategoryOption extends Option {
  group: CategoryGroupId;
  suggestedTags: string[];
  /** California B&P 7317/7324: salons and barbers must show a state board license. */
  requiresLicense?: boolean;
}

export const CATEGORY_GROUPS: readonly { id: CategoryGroupId; label: string; icon: string }[] = [
  { id: 'food', label: 'Food & dining', icon: '🍛' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'beauty', label: 'Beauty & style', icon: '💅' },
  { id: 'events', label: 'Weddings & events', icon: '🎉' },
  { id: 'services', label: 'Everyday services', icon: '🧰' },
  { id: 'community', label: 'Faith & community', icon: '🪔' },
] as const;

/** Stored in the listing's `category` field. Ids match the earlier staff-entered data. */
export const CATEGORIES: readonly CategoryOption[] = [
  // Food & dining
  { id: 'restaurant', label: 'Restaurant', icon: '🍛', group: 'food', suggestedTags: ['Biryani', 'Tandoor', 'Dosa', 'Thali', 'Lunch Buffet', 'Chaat'] },
  { id: 'quick_service', label: 'Quick service & takeout', icon: '🥡', group: 'food', suggestedTags: ['Kathi Rolls', 'Vada Pav', 'Combo Meals', 'Late Night'] },
  { id: 'sweets_mithai', label: 'Sweets & snacks', icon: '🍬', group: 'food', suggestedTags: ['Mithai', 'Kaju Katli', 'Namkeen', 'Diwali Boxes', 'Jalebi'] },
  { id: 'bakery_cafe', label: 'Bakery & chai café', icon: '☕', group: 'food', suggestedTags: ['Masala Chai', 'Rusk', 'Puffs', 'Eggless Cakes'] },
  { id: 'food_truck', label: 'Food truck', icon: '🚚', group: 'food', suggestedTags: ['Street Food', 'Pop-up', 'Events'] },
  { id: 'catering', label: 'Catering', icon: '🍱', group: 'food', suggestedTags: ['Wedding Catering', 'Party Orders', 'Office Lunch', 'Live Counters'] },
  { id: 'tiffin_service', label: 'Tiffin service', icon: '🥘', group: 'food', suggestedTags: ['Daily Tiffin', 'Home Cooked', 'Weekly Plans', 'Student Plans'] },
  { id: 'grocery_store', label: 'Grocery store', icon: '🛒', group: 'food', suggestedTags: ['Spices', 'Atta & Rice', 'Fresh Vegetables', 'Frozen Foods', 'Pooja Items'] },
  { id: 'paan_shop', label: 'Paan shop', icon: '🍃', group: 'food', suggestedTags: ['Meetha Paan', 'Kolkata Paan', 'Mukhwas'] },

  // Shopping
  { id: 'clothing_store', label: 'Clothing & ethnic wear', icon: '👗', group: 'shopping', suggestedTags: ['Saree', 'Lehenga', 'Sherwani', 'Kurta', 'Kids Ethnic Wear'] },
  { id: 'jewelry_store', label: 'Jewelry', icon: '💍', group: 'shopping', suggestedTags: ['22K Gold', 'Bridal Sets', 'Diamond', 'Silver', 'Custom Design'] },
  { id: 'pooja_samagri', label: 'Pooja & spiritual goods', icon: '🕯️', group: 'shopping', suggestedTags: ['Idols', 'Agarbatti', 'Diyas', 'Puja Thali', 'Havan Samagri'] },
  { id: 'books_media', label: 'Books, music & gifts', icon: '📚', group: 'shopping', suggestedTags: ['Hindi Books', 'Bollywood', 'Rakhi', 'Handicrafts'] },
  { id: 'home_decor', label: 'Home & décor', icon: '🏺', group: 'shopping', suggestedTags: ['Brassware', 'Handloom', 'Rugs', 'Festival Décor'] },

  // Beauty & style
  { id: 'beauty_salon', label: 'Beauty salon', icon: '💇', group: 'beauty', requiresLicense: true, suggestedTags: ['Eyebrow Threading', 'Bridal Makeup', 'Facials', 'Waxing'] },
  { id: 'barber_shop', label: 'Barber shop', icon: '💈', group: 'beauty', requiresLicense: true, suggestedTags: ['Haircut', 'Beard Trim', 'Head Massage'] },
  { id: 'mehndi_artist', label: 'Mehndi & henna artist', icon: '🎨', group: 'beauty', suggestedTags: ['Bridal Mehndi', 'Arabic Design', 'Organic Henna', 'Party Henna'] },
  { id: 'tailoring', label: 'Tailoring & alterations', icon: '🪡', group: 'beauty', suggestedTags: ['Blouse Stitching', 'Saree Fall & Pico', 'Suit Alterations'] },

  // Weddings & events
  { id: 'event_planner', label: 'Event & wedding planner', icon: '🎉', group: 'events', suggestedTags: ['Mandap Décor', 'Sangeet', 'Baraat', 'Reception'] },
  { id: 'photography', label: 'Photography', icon: '📷', group: 'events', suggestedTags: ['Wedding Photography', 'Pre-Wedding Shoot', 'Portraits'] },
  { id: 'videography', label: 'Videography', icon: '🎥', group: 'events', suggestedTags: ['Wedding Film', 'Highlights', 'Drone', 'Live Streaming'] },
  { id: 'dj_music', label: 'DJ, dhol & music', icon: '🎵', group: 'events', suggestedTags: ['Bollywood DJ', 'Bhangra', 'Dhol Player', 'Live Band'] },
  { id: 'banquet_hall', label: 'Banquet & party hall', icon: '🏛️', group: 'events', suggestedTags: ['Weddings', 'Birthdays', 'In-house Catering', 'Parking'] },
  { id: 'dance_studio', label: 'Dance & music classes', icon: '💃', group: 'events', suggestedTags: ['Bharatanatyam', 'Kathak', 'Bollywood Dance', 'Tabla', 'Carnatic Vocal'] },

  // Everyday services
  { id: 'travel_agent', label: 'Travel agent', icon: '✈️', group: 'services', suggestedTags: ['Flights Home', 'Tour Packages', 'Group Travel'] },
  { id: 'courier_delivery', label: 'Courier & parcels abroad', icon: '📦', group: 'services', suggestedTags: ['International Courier', 'Parcel Service', 'Door Pickup'] },
  { id: 'money_transfer', label: 'Money transfer & forex', icon: '💱', group: 'services', suggestedTags: ['Send Money Home', 'Currency Exchange'] },
  { id: 'laundry', label: 'Laundry & dry cleaning', icon: '🧺', group: 'services', suggestedTags: ['Saree Care', 'Dry Cleaning', 'Wash & Fold'] },
  { id: 'auto_truck', label: 'Auto & truck repair', icon: '🚛', group: 'services', suggestedTags: ['Semi Truck Repair', 'Diesel Mechanic', 'DOT Inspection', 'Tires'] },
  { id: 'fitness_yoga', label: 'Yoga & fitness', icon: '🧘', group: 'services', suggestedTags: ['Hatha Yoga', 'Pranayama', 'Meditation', 'Bhangra Fitness'] },
  { id: 'other_service', label: 'Other business', icon: '🏪', group: 'services', suggestedTags: [] },

  // Faith & community
  { id: 'temple', label: 'Temple', icon: '🛕', group: 'community', suggestedTags: ['Aarti', 'Prasadam', 'Festivals', 'Community Events'] },
  { id: 'gurdwara', label: 'Gurdwara', icon: '🙏', group: 'community', suggestedTags: ['Langar', 'Kirtan', 'Sunday Diwan'] },
  { id: 'pooja_services', label: 'Pandit & pooja services', icon: '🪔', group: 'community', suggestedTags: ['Griha Pravesh', 'Satyanarayan Katha', 'Havan', 'Wedding Priest'] },
  { id: 'community_org', label: 'Community organization', icon: '🤝', group: 'community', suggestedTags: ['Cultural Events', 'Language Classes', 'Volunteering'] },
] as const;

/** Why a business is on Apneyy (stored in `indianConnection`). */
export const CONNECTIONS: readonly Option[] = [
  { id: 'owned', label: 'South Asian-owned', icon: '🧡' },
  { id: 'food_products', label: 'South Asian food or products', icon: '🍛' },
  { id: 'language', label: 'Speaks South Asian languages', icon: '🗣️' },
  { id: 'culture', label: 'South Asian culture and vibe', icon: '🪔' },
  { id: 'community', label: 'Serves the South Asian community', icon: '🤝' },
] as const;

export const CUISINES: readonly Option[] = [
  { id: 'north_indian', label: 'North Indian' },
  { id: 'south_indian', label: 'South Indian' },
  { id: 'punjabi', label: 'Punjabi' },
  { id: 'gujarati', label: 'Gujarati' },
  { id: 'rajasthani', label: 'Rajasthani' },
  { id: 'bengali', label: 'Bengali' },
  { id: 'hyderabadi', label: 'Hyderabadi' },
  { id: 'mughlai', label: 'Mughlai' },
  { id: 'kerala', label: 'Kerala' },
  { id: 'chettinad', label: 'Chettinad' },
  { id: 'goan', label: 'Goan' },
  { id: 'maharashtrian', label: 'Maharashtrian' },
  { id: 'street_food', label: 'Street food & chaat' },
  { id: 'indo_chinese', label: 'Indo-Chinese' },
  { id: 'tandoor_grill', label: 'Tandoor & grill' },
  { id: 'biryani', label: 'Biryani' },
  { id: 'nepali', label: 'Nepali & Himalayan' },
  { id: 'fusion', label: 'Fusion' },
] as const;

export const DIETARY: readonly Option[] = [
  { id: 'pure_veg', label: 'Pure vegetarian', icon: '🟢' },
  { id: 'jain', label: 'Jain options', icon: '🙏' },
  { id: 'halal', label: 'Halal', icon: '☪️' },
  { id: 'vegan', label: 'Vegan options', icon: '🌱' },
  { id: 'gluten_free', label: 'Gluten-free options', icon: '🌾' },
  { id: 'eggless', label: 'Eggless', icon: '🥚' },
  { id: 'no_onion_garlic', label: 'No onion or garlic', icon: '🧄' },
] as const;

/** Ways customers can be served. Food services only show for food businesses. */
export const SERVICES: readonly (Option & { foodOnly?: boolean })[] = [
  { id: 'dine_in', label: 'Dine-in', foodOnly: true },
  { id: 'takeout', label: 'Takeout', foodOnly: true },
  { id: 'delivery', label: 'Delivery' },
  { id: 'catering', label: 'Catering', foodOnly: true },
  { id: 'buffet', label: 'Lunch buffet', foodOnly: true },
  { id: 'reservations', label: 'Reservations' },
  { id: 'walk_ins', label: 'Walk-ins welcome' },
  { id: 'appointments', label: 'By appointment' },
  { id: 'home_service', label: 'Comes to you' },
  { id: 'online', label: 'Online or virtual' },
  { id: 'shipping', label: 'Ships nationwide' },
  { id: 'private_events', label: 'Private events' },
] as const;

export const AMENITIES: readonly Option[] = [
  { id: 'free_parking', label: 'Free parking' },
  { id: 'wheelchair', label: 'Wheelchair accessible' },
  { id: 'kid_friendly', label: 'Kid friendly' },
  { id: 'outdoor_seating', label: 'Outdoor seating' },
  { id: 'wifi', label: 'Free Wi-Fi' },
  { id: 'women_staff', label: 'Women staff available' },
  { id: 'sports_tv', label: 'Cricket on TV' },
  { id: 'festival_specials', label: 'Festival specials' },
] as const;

export const PAYMENT_METHODS: readonly string[] = [
  'Cash',
  'Credit card',
  'Debit card',
  'Apple Pay',
  'Google Pay',
  'Zelle',
  'Venmo',
] as const;

export const PRICE_RANGES = [
  { value: '$', desc: 'Budget friendly' },
  { value: '$$', desc: 'Moderate' },
  { value: '$$$', desc: 'Premium' },
  { value: '$$$$', desc: 'Luxury' },
] as const;

/** Delivery and ordering platforms a food business can link to. */
export const ORDERING_PLATFORMS = [
  { key: 'doordash', label: 'DoorDash' },
  { key: 'ubereats', label: 'Uber Eats' },
  { key: 'grubhub', label: 'Grubhub' },
  { key: 'direct', label: 'Order direct' },
] as const;

export function labelFor(list: readonly Option[], id: string): string {
  return list.find(o => o.id === id)?.label ?? id;
}

/** schema.org type for each category, for LocalBusiness structured data. */
export const SCHEMA_TYPES: Readonly<Record<string, string>> = {
  restaurant: 'Restaurant',
  quick_service: 'FastFoodRestaurant',
  sweets_mithai: 'Bakery',
  bakery_cafe: 'CafeOrCoffeeShop',
  food_truck: 'FoodEstablishment',
  catering: 'FoodEstablishment',
  tiffin_service: 'FoodEstablishment',
  grocery_store: 'GroceryStore',
  paan_shop: 'Store',
  clothing_store: 'ClothingStore',
  jewelry_store: 'JewelryStore',
  pooja_samagri: 'Store',
  books_media: 'BookStore',
  home_decor: 'HomeGoodsStore',
  beauty_salon: 'BeautySalon',
  barber_shop: 'HairSalon',
  mehndi_artist: 'HealthAndBeautyBusiness',
  tailoring: 'LocalBusiness',
  event_planner: 'ProfessionalService',
  photography: 'ProfessionalService',
  videography: 'ProfessionalService',
  dj_music: 'EntertainmentBusiness',
  banquet_hall: 'EventVenue',
  dance_studio: 'DanceSchool',
  travel_agent: 'TravelAgency',
  courier_delivery: 'LocalBusiness',
  money_transfer: 'FinancialService',
  laundry: 'DryCleaningOrLaundry',
  auto_truck: 'AutoRepair',
  fitness_yoga: 'ExerciseGym',
  temple: 'HinduTemple',
  gurdwara: 'PlaceOfWorship',
  pooja_services: 'LocalBusiness',
  community_org: 'Organization',
};
