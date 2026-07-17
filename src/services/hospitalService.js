const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const hospitalCache = new Map();

/**
 * Calculates the distance between two coordinates using the Haversine formula.
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Reverse geocodes latitude/longitude into address components using Nominatim API.
 */
async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'JeevanLinkApp/1.0 (tambolibhavy@gmail.com)',
      },
    });
    if (!res.ok) {
      throw new Error(`Nominatim HTTP error: ${res.status}`);
    }
    const data = await res.json();
    const addr = data.address || {};

    return {
      city: addr.city || addr.town || addr.village || addr.suburb || '',
      district: addr.district || addr.county || '',
      state: addr.state || '',
      country: addr.country || '',
      postalCode: addr.postcode || '',
    };
  } catch (err) {
    console.error('Reverse geocode error:', err);
    throw err;
  }
}

/**
 * Fetches nearby hospitals using OpenStreetMap Overpass API with local cache.
 */
async function fetchNearbyHospitals(lat, lon, radiusKm = 15) {
  const radiusMeters = radiusKm * 1000;
  const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}_${radiusKm}`;
  
  const cached = hospitalCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[Cache Hit] Serving hospitals from cache for key: ${cacheKey}`);
    return cached.data;
  }

  // Overpass query for amenity=hospital around coordinates
  const overpassQuery = `[out:json][timeout:25];
(
  node["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
  way["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
  relation["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
);
out center;`;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
  ];

  let data = null;
  let lastError = null;

  for (const endpoint of endpoints) {
    const url = `${endpoint}?data=${encodeURIComponent(overpassQuery)}`;
    try {
      console.log(`[Overpass] Fetching hospitals from: ${endpoint}`);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'JeevanLinkApp/1.0 (tambolibhavy@gmail.com)',
        },
      });
      if (res.ok) {
        data = await res.json();
        console.log(`[Overpass] Successfully fetched from: ${endpoint}`);
        break; // Success!
      } else {
        console.warn(`[Overpass] Server ${endpoint} returned status: ${res.status}`);
        lastError = new Error(`Overpass HTTP error ${res.status} from ${endpoint}`);
      }
    } catch (err) {
      console.warn(`[Overpass] Server ${endpoint} connection failed:`, err.message);
      lastError = err;
    }
  }

  if (!data) {
    throw lastError || new Error('All Overpass servers failed to respond.');
  }

  const elements = data.elements || [];

    const hospitals = elements
      .map((el) => {
        const tags = el.tags || {};
        const hLat = el.lat || (el.center && el.center.lat);
        const hLon = el.lon || (el.center && el.center.lon);

        if (!hLat || !hLon) return null;

        const distance = calculateDistance(lat, lon, hLat, hLon);

        return {
          name: tags.name || tags['name:en'] || tags['name:hi'] || 'Unnamed Hospital',
          address:
            tags['addr:full'] ||
            [
              tags['addr:housenumber'],
              tags['addr:street'],
              tags['addr:suburb'],
              tags['addr:city'],
            ]
              .filter(Boolean)
              .join(', ') ||
            'Address not available',
          phone: tags.phone || tags['contact:phone'] || tags.mobile || '',
          latitude: hLat,
          longitude: hLon,
          distance: parseFloat(distance.toFixed(2)), // distance in km
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance);

    // Save to cache
    hospitalCache.set(cacheKey, {
      timestamp: Date.now(),
      data: hospitals,
    });

    return hospitals;
}

module.exports = {
  reverseGeocode,
  fetchNearbyHospitals,
};
