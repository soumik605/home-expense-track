/**
 * Bengali names for common home-construction items.
 * Keys are matched case-insensitively and ignoring spaces/punctuation, so "Brick work",
 * "brickwork" and "BRICKWORK" all resolve. Anything not listed is shown as written in the sheet.
 * Add your own items here.
 */
const BN: Record<string, string> = {
  // Materials
  sand: 'বালি',
  brick: 'ইট',
  bricks: 'ইট',
  brickwork: 'ইট',
  cement: 'সিমেন্ট',
  steel: 'রড',
  rod: 'রড',
  rods: 'রড',
  iron: 'লোহা',
  tmt: 'টিএমটি রড',
  stone: 'পাথর',
  stonechips: 'পাথরকুচি',
  chips: 'পাথরকুচি',
  gravel: 'খোয়া',
  khoa: 'খোয়া',
  aggregate: 'খোয়া',
  wood: 'কাঠ',
  timber: 'কাঠ',
  tiles: 'টাইলস',
  tile: 'টাইলস',
  marble: 'মার্বেল',
  granite: 'গ্রানাইট',
  paint: 'রং',
  painting: 'রঙের কাজ',
  putty: 'পুটি',
  glass: 'কাচ',
  grill: 'গ্রিল',
  door: 'দরজা',
  doors: 'দরজা',
  window: 'জানালা',
  windows: 'জানালা',
  pipe: 'পাইপ',
  pipes: 'পাইপ',
  wire: 'তার',
  wiring: 'ওয়্যারিং',
  electrical: 'বৈদ্যুতিক',
  electric: 'বৈদ্যুতিক',
  plumbing: 'প্লাম্বিং',
  sanitary: 'স্যানিটারি',
  fittings: 'ফিটিংস',
  hardware: 'হার্ডওয়্যার',
  waterproofing: 'ওয়াটারপ্রুফিং',
  water: 'জল',
  // Work & services
  labour: 'মজুরি',
  labor: 'মজুরি',
  mason: 'রাজমিস্ত্রি',
  carpenter: 'ছুতোর মিস্ত্রি',
  contractor: 'ঠিকাদার',
  plaster: 'প্লাস্টার',
  plastering: 'প্লাস্টার',
  shuttering: 'সেন্টারিং',
  centering: 'সেন্টারিং',
  centring: 'সেন্টারিং',
  casting: 'ঢালাই',
  roof: 'ছাদ',
  roofcasting: 'ছাদ ঢালাই',
  foundation: 'ভিত',
  excavation: 'মাটি কাটা',
  earthwork: 'মাটির কাজ',
  soil: 'মাটি',
  filling: 'মাটি ভরাট',
  // JCB intentionally left in English.
  transport: 'গাড়ি ভাড়া',
  transportation: 'গাড়ি ভাড়া',
  vehicle: 'গাড়ি ভাড়া',
  tools: 'যন্ত্রপাতি',
  tool: 'যন্ত্রপাতি',
  equipment: 'যন্ত্রপাতি',
  electricity: 'বিদ্যুৎ বিল',
  architect: 'স্থপতি',
  design: 'নকশা',
  plan: 'নকশা',
  approval: 'অনুমোদন',
  permit: 'অনুমোদন',
  registration: 'রেজিস্ট্রেশন',
  land: 'জমি',
  puja: 'পূজা',
  food: 'খাবার',
  tea: 'চা-জলখাবার',
  other: 'অন্যান্য',
  others: 'অন্যান্য',
  misc: 'অন্যান্য',
  miscellaneous: 'অন্যান্য',
  uncategorised: 'অশ্রেণীবদ্ধ',
  uncategorized: 'অশ্রেণীবদ্ধ',
};

export const itemKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export type Lang = 'bn' | 'en';

/** Bengali name for an item, or null when there's no translation. */
export function bengaliItem(name: string): string | null {
  return BN[itemKey(name)] ?? null;
}

export function itemLabel(name: string, lang: Lang): string {
  return lang === 'bn' ? (bengaliItem(name) ?? name) : name;
}
