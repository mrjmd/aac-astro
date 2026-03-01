/**
 * Region definitions for auto-linking nearby cities
 *
 * Cities in the same region are considered "nearby" for internal linking.
 * This enables automatic nearbyCities generation at build time.
 */

// Connecticut Regions (Eastern 2/3 of state - no Fairfield County)
export const CT_REGIONS: Record<string, string[]> = {
  "Greater Hartford": [
    "Hartford",
    "West Hartford",
    "East Hartford",
    "Manchester",
    "Bristol",
    "New Britain",
    "Glastonbury",
    "Wethersfield",
    "Rocky Hill",
    "Newington",
    "Farmington",
    "Avon",
    "Simsbury",
    "Windsor",
    "Windsor Locks",
    "South Windsor",
    "Enfield",
    "Bloomfield",
    "Berlin",
  ],
  "New Haven County": [
    "New Haven",
    "Waterbury",
    "Meriden",
    "Wallingford",
    "Hamden",
    "North Haven",
    "East Haven",
    "West Haven",
    "Branford",
    "Guilford",
    "Madison",
    "Milford",
    "Orange",
    "Woodbridge",
    "Cheshire",
    "Naugatuck",
    "Seymour",
    "Ansonia",
    "Derby",
    "Shelton",
  ],
  "Middlesex County": [
    "Middletown",
    "Portland",
    "Cromwell",
    "Durham",
    "East Hampton",
    "Haddam",
    "Chester",
    "Deep River",
    "Essex",
    "Old Saybrook",
    "Westbrook",
    "Clinton",
  ],
  "New London County": [
    "New London",
    "Norwich",
    "Groton",
    "Stonington",
    "Mystic",
    "Waterford",
    "East Lyme",
    "Old Lyme",
    "Ledyard",
    "Montville",
    "Colchester",
  ],
  "Windham County": [
    "Willimantic",
    "Windham",
    "Putnam",
    "Danielson",
    "Plainfield",
    "Thompson",
    "Woodstock",
    "Brooklyn",
    "Canterbury",
  ],
  "Tolland County": [
    "Vernon",
    "Tolland",
    "Ellington",
    "Coventry",
    "Mansfield",
    "Storrs",
    "Stafford Springs",
    "Somers",
    "Bolton",
    "Andover",
    "Hebron",
  ],
};

// Massachusetts Regions
export const MA_REGIONS: Record<string, string[]> = {
  "Metro Boston": [
    "Boston",
    "Cambridge",
    "Somerville",
    "Brookline",
    "Newton",
    "Watertown",
    "Arlington",
    "Medford",
    "Malden",
    "Everett",
    "Chelsea",
    "Revere",
    "Winthrop",
  ],
  "North Shore": [
    "Salem",
    "Beverly",
    "Peabody",
    "Lynn",
    "Marblehead",
    "Swampscott",
    "Saugus",
    "Danvers",
    "Gloucester",
    "Rockport",
    "Ipswich",
    "Newburyport",
  ],
  "South Shore": [
    "Quincy",
    "Braintree",
    "Weymouth",
    "Milton",
    "Randolph",
    "Holbrook",
    "Rockland",
    "Hanover",
    "Norwell",
    "Hingham",
    "Cohasset",
    "Hull",
    "Scituate",
    "Marshfield",
    "Duxbury",
    "Plymouth",
  ],
  "MetroWest": [
    "Framingham",
    "Natick",
    "Wellesley",
    "Needham",
    "Dedham",
    "Norwood",
    "Walpole",
    "Medfield",
    "Millis",
    "Holliston",
    "Ashland",
    "Hopkinton",
    "Southborough",
    "Westborough",
    "Marlborough",
    "Hudson",
  ],
  "Greater Lowell": [
    "Lowell",
    "Chelmsford",
    "Dracut",
    "Tewksbury",
    "Billerica",
    "Wilmington",
    "Tyngsborough",
    "Westford",
    "Littleton",
  ],
  "Merrimack Valley": [
    "Lawrence",
    "Haverhill",
    "Methuen",
    "Andover",
    "North Andover",
    "Amesbury",
    "Salisbury",
    "Merrimac",
  ],
  "Greater Worcester": [
    "Worcester",
    "Shrewsbury",
    "Grafton",
    "Millbury",
    "Auburn",
    "Leicester",
    "Spencer",
    "Holden",
    "West Boylston",
    "Boylston",
    "Northborough",
  ],
  "South Central": [
    "Brockton",
    "Stoughton",
    "Canton",
    "Sharon",
    "Easton",
    "West Bridgewater",
    "East Bridgewater",
    "Bridgewater",
    "Middleborough",
    "Lakeville",
    "Raynham",
    "Taunton",
  ],
  "Cape Cod": [
    "Barnstable",
    "Hyannis",
    "Falmouth",
    "Sandwich",
    "Mashpee",
    "Bourne",
    "Yarmouth",
    "Dennis",
    "Brewster",
    "Harwich",
    "Chatham",
    "Orleans",
    "Eastham",
    "Wellfleet",
    "Truro",
    "Provincetown",
  ],
};

// Rhode Island Regions (within 2-hour drive of Quincy)
export const RI_REGIONS: Record<string, string[]> = {
  "Greater Providence": [
    "Providence",
    "Cranston",
    "Warwick",
    "Pawtucket",
    "East Providence",
    "Johnston",
    "North Providence",
    "Central Falls",
    "Lincoln",
    "Cumberland",
  ],
  "Northern RI": [
    "Woonsocket",
    "Smithfield",
    "North Smithfield",
    "Burrillville",
    "Glocester",
  ],
  "East Bay": [
    "East Greenwich",
    "West Warwick",
    "Coventry",
    "Bristol",
    "Barrington",
    "Warren",
  ],
  "South County": [
    "Newport",
    "Middletown",
    "Portsmouth",
    "Tiverton",
    "Little Compton",
    "Narragansett",
    "South Kingstown",
    "North Kingstown",
    "Westerly",
    "Charlestown",
  ],
};

// New Hampshire Regions (Southern NH - within 2-hour drive of Quincy)
export const NH_REGIONS: Record<string, string[]> = {
  "Greater Nashua": [
    "Nashua",
    "Hudson",
    "Litchfield",
    "Merrimack",
    "Milford",
    "Amherst",
    "Hollis",
    "Brookline",
    "Wilton",
  ],
  "Greater Manchester": [
    "Manchester",
    "Hooksett",
    "Bedford",
    "Goffstown",
    "Auburn",
    "Candia",
    "Deerfield",
    "Raymond",
  ],
  "Seacoast": [
    "Portsmouth",
    "Dover",
    "Rochester",
    "Exeter",
    "Hampton",
    "Newmarket",
    "Durham",
    "Rye",
    "Greenland",
    "Stratham",
  ],
  "Southern NH": [
    "Salem",
    "Derry",
    "Londonderry",
    "Windham",
    "Pelham",
    "Atkinson",
    "Hampstead",
    "Plaistow",
    "Newton",
  ],
};

// Maine Regions (Southern ME - within 2-hour drive of Quincy)
export const ME_REGIONS: Record<string, string[]> = {
  "Greater Portland": [
    "Portland",
    "South Portland",
    "Scarborough",
    "Westbrook",
    "Gorham",
    "Falmouth",
    "Cape Elizabeth",
    "Cumberland",
    "Yarmouth",
    "Freeport",
  ],
  "Southern Maine": [
    "Saco",
    "Biddeford",
    "Sanford",
    "Kennebunk",
    "Kennebunkport",
    "Wells",
    "Ogunquit",
    "Kittery",
    "York",
    "Eliot",
    "Old Orchard Beach",
  ],
};

// Helper function to get cities in the same region
export function getNearbyCities(city: string, stateAbbr: string): string[] {
  const regions = getRegionsForState(stateAbbr);
  if (!regions) return [];

  // Find which region this city belongs to
  for (const [regionName, cities] of Object.entries(regions)) {
    if (cities.includes(city)) {
      // Return other cities in the same region (excluding the current city)
      return cities.filter(c => c !== city);
    }
  }

  return [];
}

// Get regions for a state
export function getRegionsForState(stateAbbr: string): Record<string, string[]> | null {
  switch (stateAbbr) {
    case 'CT':
      return CT_REGIONS;
    case 'MA':
      return MA_REGIONS;
    case 'RI':
      return RI_REGIONS;
    case 'NH':
      return NH_REGIONS;
    case 'ME':
      return ME_REGIONS;
    default:
      return null;
  }
}

// Get region name for a city
export function getRegionForCity(city: string, stateAbbr: string): string | null {
  const regions = getRegionsForState(stateAbbr);
  if (!regions) return null;

  for (const [regionName, cities] of Object.entries(regions)) {
    if (cities.includes(city)) {
      return regionName;
    }
  }

  return null;
}

// Get all cities for a state
export function getAllCitiesForState(stateAbbr: string): string[] {
  const regions = getRegionsForState(stateAbbr);
  if (!regions) return [];

  return Object.values(regions).flat();
}

// Counties to EXCLUDE in Connecticut (western 1/3)
export const CT_EXCLUDED_COUNTIES = [
  "Fairfield County",
  "Litchfield County",
];

// Cities to EXCLUDE in Connecticut (western cities in Fairfield/Litchfield)
export const CT_EXCLUDED_CITIES = [
  "Stamford",
  "Greenwich",
  "Norwalk",
  "Danbury",
  "Fairfield",
  "Westport",
  "Wilton",
  "Ridgefield",
  "New Canaan",
  "Darien",
  "Weston",
  "Easton",
  "Trumbull",
  "Monroe",
  "Bethel",
  "Brookfield",
  "Newtown",
  "Redding",
  "Torrington",
  "Litchfield",
  "New Milford",
  "Thomaston",
];

// Check if a CT city is in the service area (eastern 2/3)
export function isCTCityInServiceArea(city: string): boolean {
  return !CT_EXCLUDED_CITIES.includes(city);
}
