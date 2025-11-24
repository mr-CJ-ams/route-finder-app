// Map API abstraction layer
class MapService {
  constructor(provider = 'OSM') {
    this.provider = provider;
    this.setProvider(provider);
  }

  setProvider(provider) {
    this.provider = provider;
    
    switch(provider) {
      case 'OSM':
        this.config = {
          geocoding: {
            search: (query) => 
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
            reverse: (lat, lng, zoom = 18) =>
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=${zoom}`
          },
          routing: {
            route: (startLng, startLat, endLng, endLat) =>
              `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
          },
          tiles: {
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        };
        break;
      
      // We can add Google Maps later like this:
    //   case 'GOOGLE':
    //     this.config = {
    //       geocoding: {
    //         search: (query) => 
    //           `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${process.env.REACT_APP_GOOGLE_API_KEY}`,
    //         reverse: (lat, lng) =>
    //           `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_API_KEY}`
    //       },
    //       routing: {
    //         // Google Directions API format
    //       },
    //       tiles: {
    //         // Google Maps tiles configuration
    //       }
    //     };
    //     break;
      
      default:
        throw new Error(`Unsupported map provider: ${provider}`);
    }
  }

  // Geocoding methods
  async searchLocation(query) {
    try {
      const response = await fetch(this.config.geocoding.search(query));
      const data = await response.json();
      return this._normalizeGeocodingResponse(data);
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  async reverseGeocode(lat, lng, zoom = 18) {
    try {
      const response = await fetch(this.config.geocoding.reverse(lat, lng, zoom));
      const data = await response.json();
      return this._normalizeReverseGeocodingResponse(data);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  }

  // Routing methods
  async calculateRoute(startLat, startLng, endLat, endLng) {
    try {
      const response = await fetch(this.config.routing.route(startLng, startLat, endLng, endLat));
      const data = await response.json();
      return this._normalizeRoutingResponse(data);
    } catch (error) {
      console.error('Routing error:', error);
      throw error;
    }
  }

  // Response normalization for OSM
  _normalizeGeocodingResponse(data) {
    if (this.provider === 'OSM') {
      return data.map((result, index) => ({
        id: index,
        name: result.display_name.split(',')[0].trim(),
        fullAddress: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        type: result.type,
        class: result.class,
        address: result.address || {}
      }));
    }
    // Add other providers here later
    return data;
  }

  _normalizeReverseGeocodingResponse(data) {
    if (this.provider === 'OSM') {
      return {
        address: data.address || {},
        displayName: data.display_name,
        lat: parseFloat(data.lat),
        lon: parseFloat(data.lon)
      };
    }
    return data;
  }

  _normalizeRoutingResponse(data) {
    if (this.provider === 'OSM') {
      if (data.routes && data.routes.length > 0) {
        const routeInfo = data.routes[0];
        return {
          distance: routeInfo.distance / 1000, // Convert to km
          duration: routeInfo.duration / 60,   // Convert to minutes
          coordinates: routeInfo.geometry.coordinates,
        };
      }
      throw new Error('No route found');
    }
    return data;
  }

  // Get map tile configuration
  getTileConfig() {
    return this.config.tiles;
  }
}

// Create and export a singleton instance
const mapService = new MapService('OSM');
export default mapService;