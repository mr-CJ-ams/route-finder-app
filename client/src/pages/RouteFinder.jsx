import React, { useState, useRef, useEffect } from "react";
import { MapPin, Navigation, Users, AlertCircle, CheckCircle, Smartphone, Settings, Wifi, Search } from "lucide-react";
import { 
  calculateFare, 
  getFareBreakdown, 
  getJurisdictionInfo, 
  determineLocationType,
  checkPanglaoBoundary,
  checkTagbilaranBoundary 
} from "../utils/fareCalculator";

const RouteFinder = () => {
  // Map and route state
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [destination, setDestination] = useState("");
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [originName, setOriginName] = useState(null);
  const [originDetails, setOriginDetails] = useState({});
  const [route, setRoute] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [passengerType, setPassengerType] = useState("regular");
  const [isWithinPanglao, setIsWithinPanglao] = useState(null);
  const [isWithinTagbilaran, setIsWithinTagbilaran] = useState(null);
  const [locationType, setLocationType] = useState(null); // 'panglao', 'tagbilaran', or 'outside'
  const [boundaryCheckLoading, setBoundaryCheckLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mapRef = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  
  // New state for clicked coordinates
  const [clickedCoords, setClickedCoords] = useState(null);
  const [clickedAddress, setClickedAddress] = useState(null);
  const [clickedDetails, setClickedDetails] = useState({});
  const [destinationDetails, setDestinationDetails] = useState({});

  // Loading states for addresses
  const [originAddressLoading, setOriginAddressLoading] = useState(true);
  const [clickedAddressLoading, setClickedAddressLoading] = useState(false);
  const [destinationAddressLoading, setDestinationAddressLoading] = useState(false);

  // New state for search suggestions
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const searchInputRef = useRef(null);

  // Check if user is on mobile device
  useEffect(() => {
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    setIsMobile(checkMobile());
  }, []);

  // Load Leaflet CSS and JS
  useEffect(() => {
    // Check if Leaflet is already loaded
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.async = true;
    
    script.onload = () => {
      console.log('Leaflet loaded successfully');
      setLeafletLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load Leaflet');
      setLocationError("Failed to load map library. Please check your internet connection.");
    };

    document.head.appendChild(script);

    // Cleanup function
    return () => {
      // Don't remove the CSS as it might be used by other components
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Enhanced reverse geocoding function
  const getDetailedAddress = (data) => {
    const address = data.address || {};
    
    // Priority hierarchy for place names
    const placeHierarchy = [
      // Immediate location identifiers
      address.amenity,           // Specific place (school, mall, etc.)
      address.road,              // Street name
      address.neighbourhood,     // Neighborhood
      address.suburb,            // Subdivision/Suburb
      address.village,           // Village
      address.hamlet,            // Hamlet
      address.quarter,           // Quarter/Zone
      address.residential,       // Residential area
      address.city_district,     // City district
      
      // Administrative boundaries
      address.town,              // Town
      address.municipality,      // Municipality
      address.city,              // City
      address.county,            // County
      
      // Smallest administrative units
      address.barangay,          // Barangay (Philippines)
      `Barangay ${address.barangay}`,
      address.subdistrict,       // Subdistrict
      address.district,          // District
    ];

    // Find the first non-empty value
    const placeName = placeHierarchy.find(value => value && value.trim() !== '');
    
    return placeName || null;
  };

  // Enhanced location name fetcher with boundary check
  const fetchEnhancedLocationName = async (lat, lng) => {
    try {
      setOriginAddressLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`
      );
      const data = await response.json();
      
      console.log('Full geocoding response:', data); // Debugging
      
      const address = data.address || {};
      // Add the display name to the address object for checking
      address._displayName = data.display_name;
      
      let placeName = getDetailedAddress(data);
      
      // Store detailed address information
      const newOriginDetails = {
        road: address.road,
        neighbourhood: address.neighbourhood,
        suburb: address.suburb,
        barangay: address.barangay,
        village: address.village,
        municipality: address.municipality,
        city: address.city,
        province: address.state,
        region: address.region,
        fullAddress: data.display_name
      };

      setOriginDetails(newOriginDetails);

      // Check jurisdiction boundaries
      const withinPanglao = checkPanglaoBoundary(address);
      const withinTagbilaran = checkTagbilaranBoundary(address);
      const detectedLocationType = determineLocationType(address);
      
      setIsWithinPanglao(withinPanglao);
      setIsWithinTagbilaran(withinTagbilaran);
      setLocationType(detectedLocationType);

      console.log('Jurisdiction check results:', {
        withinPanglao,
        withinTagbilaran,
        locationType: detectedLocationType
      });

      // If no specific place found, try with lower zoom level for broader area
      if (!placeName) {
        const broaderResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=14`
        );
        const broaderData = await broaderResponse.json();
        placeName = getDetailedAddress(broaderData);
        setOriginDetails(prev => ({
          ...prev,
          ...broaderData.address,
          fullAddress: broaderData.display_name
        }));
        
        // Re-check boundary with broader data
        const broaderWithinPanglao = checkPanglaoBoundary(broaderData.address);
        const broaderWithinTagbilaran = checkTagbilaranBoundary(broaderData.address);
        const broaderLocationType = determineLocationType(broaderData.address);
        
        setIsWithinPanglao(broaderWithinPanglao);
        setIsWithinTagbilaran(broaderWithinTagbilaran);
        setLocationType(broaderLocationType);
      }
      
      // Final fallback - use coordinates with context
      return placeName || `Location near ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      
    } catch (err) {
      // Set to false if geocoding fails
      setIsWithinPanglao(false);
      setIsWithinTagbilaran(false);
      setLocationType('outside');
      
      // Set fallback fullAddress on error
      setOriginDetails({
        fullAddress: `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });
      
      return `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } finally {
      setOriginAddressLoading(false);
    }
  };

  // Function to get detailed address for clicked coordinates
  const getDetailedAddressForCoordinates = async (lat, lng) => {
    try {
      setClickedAddressLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`
      );
      const data = await response.json();
      
      const address = data.address || {};
      let placeName = getDetailedAddress(data);
      
      // Store detailed address information for clicked location
      const newClickedDetails = {
        road: address.road,
        neighbourhood: address.neighbourhood,
        suburb: address.suburb,
        barangay: address.barangay,
        village: address.village,
        municipality: address.municipality,
        city: address.city,
        province: address.state,
        fullAddress: data.display_name
      };

      setClickedDetails(newClickedDetails);

      // If no specific place found, try with lower zoom level for broader area
      if (!placeName) {
        const broaderResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=14`
        );
        const broaderData = await broaderResponse.json();
        placeName = getDetailedAddress(broaderData);
        setClickedDetails(prev => ({
          ...prev,
          ...broaderData.address,
          fullAddress: broaderData.display_name
        }));
      }
      
      // Final fallback - use coordinates with context
      return placeName || `Location near ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      
    } catch (err) {
      return `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } finally {
      setClickedAddressLoading(false);
    }
  };

  // Function to get detailed address for destination
  const fetchDestinationDetails = async (lat, lng) => {
    try {
      setDestinationAddressLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`
      );
      const data = await response.json();
      
      const address = data.address || {};
      
      // Store detailed address information for destination
      const newDestinationDetails = {
        road: address.road,
        neighbourhood: address.neighbourhood,
        suburb: address.suburb,
        barangay: address.barangay,
        village: address.village,
        municipality: address.municipality,
        city: address.city,
        province: address.state,
        fullAddress: data.display_name
      };

      setDestinationDetails(newDestinationDetails);
      return data.display_name;
    } catch (err) {
      const fallbackAddress = `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setDestinationDetails({ fullAddress: fallbackAddress });
      return fallbackAddress;
    } finally {
      setDestinationAddressLoading(false);
    }
  };

  // NEW: Function to fetch search suggestions
  const fetchSearchSuggestions = async (query) => {
  if (!query.trim() || query.length < 2) {
    setSearchSuggestions([]);
    setShowSuggestions(false);
    return;
  }

  setSuggestionsLoading(true);
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
    );
    const results = await response.json();

    const suggestions = results.map((result, index) => {
      const address = result.address || {};
      
      // Use the display name but extract a cleaner name for the input
      const displayName = result.display_name;
      const primaryName = displayName.split(',')[0].trim();

      return {
        id: index,
        name: primaryName, // Clean primary name for input field
        fullAddress: displayName, // Full address for display
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        type: result.type,
        class: result.class,
        address: address
      };
    });

    setSearchSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    setSearchSuggestions([]);
    setShowSuggestions(false);
  } finally {
    setSuggestionsLoading(false);
  }
};

  // NEW: Handle destination input change with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (destination.trim()) {
        fetchSearchSuggestions(destination);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [destination]);

  // NEW: Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    console.log('Selected suggestion:', suggestion); // Debug log
    // Use the primary name for the input field
    setDestination(suggestion.name);
    setDestinationCoords([suggestion.lat, suggestion.lon]);
    setShowSuggestions(false);
    
    // Set destination details with full address for display
    setDestinationDetails({
      fullAddress: suggestion.fullAddress,
      ...suggestion.address
    });

    // Automatically calculate route if location is available
    if (location) {
      calculateRoute(suggestion.lat, suggestion.lon);
    }
  };

  // NEW: Calculate route function
  const calculateRoute = async (destLat, destLon) => {
    setSearchLoading(true);
    setSearchError(null);

    try {
      const routeResponse = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${location.longitude},${location.latitude};${destLon},${destLat}?overview=full&geometries=geojson`
      );
      const routeData = await routeResponse.json();

      if (routeData.routes && routeData.routes.length > 0) {
        const routeInfo = routeData.routes[0];
        setRoute({
          distance: routeInfo.distance / 1000,
          duration: routeInfo.duration / 60,
          coordinates: routeInfo.geometry.coordinates,
        });
      } else {
        setSearchError("Could not find a route to this destination.");
      }
    } catch (err) {
      setSearchError("Error calculating route. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Initialize map when location and Leaflet are available
  useEffect(() => {
    if (location && leafletLoaded && !mapInitialized && mapRef.current) {
      console.log('Initializing map...');
      
      const L = window.L;
      try {
        // Clear any existing map
        if (mapRef.current.leafletMap) {
          mapRef.current.leafletMap.remove();
        }

        const map = L.map(mapRef.current).setView(
          [location.latitude, location.longitude],
          15
        );
        
        // Store map instance in ref
        mapRef.current.leafletMap = map;

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Add click event listener to the map
        map.on('click', async function(e) {
          const { lat, lng } = e.latlng;
          setClickedCoords({ lat, lng });
          
          // Get detailed address for clicked location
          const placeName = await getDetailedAddressForCoordinates(lat, lng);
          setClickedAddress(placeName);
          
          // Remove previous click marker if exists
          if (mapRef.current.clickMarker) {
            map.removeLayer(mapRef.current.clickMarker);
          }
          
          // Add marker for clicked location
          mapRef.current.clickMarker = L.marker([lat, lng], {
            icon: L.icon({
              iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
              shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            }),
          })
            .addTo(map)
            .bindPopup(`
              <strong>📍 Clicked Location</strong><br/>
              Fetching address...<br/>
              Lat: ${lat.toFixed(6)}<br/>
              Lng: ${lng.toFixed(6)}
            `)
            .openPopup();
        });

        // Add origin marker with initial popup
        L.marker([location.latitude, location.longitude], {
          icon: L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          }),
        })
          .addTo(map)
          .bindPopup(
            `<strong>📍 Your Location</strong><br/>Fetching address...<br/>Lat: ${location.latitude.toFixed(6)}<br/>Lng: ${location.longitude.toFixed(6)}`
          );

        setMapInitialized(true);
        console.log('Map initialized successfully');
        
      } catch (error) {
        console.error('Error initializing map:', error);
        setLocationError("Failed to initialize map. Please refresh the page.");
      }
    }
  }, [location, leafletLoaded, mapInitialized]);

  // Update marker popups when address data is available
  const updateMarkerPopups = () => {
    if (!mapRef.current?.leafletMap) return;
    
    const L = window.L;
    const map = mapRef.current.leafletMap;
    
    // Update origin marker popup
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const latLng = layer.getLatLng();
        
        // Check if this is the origin marker (green)
        if (latLng.lat === location?.latitude && latLng.lng === location?.longitude) {
          const popupContent = `
            <strong>📍 Your Location</strong><br/>
            ${originAddressLoading ? 'Fetching address...' : (originDetails.fullAddress || originName || 'Location')}<br/>
            Lat: ${location.latitude.toFixed(6)}<br/>
            Lng: ${location.longitude.toFixed(6)}
          `;
          layer.setPopupContent(popupContent);
        }
        
        // Check if this is the clicked marker (blue)
        if (clickedCoords && latLng.lat === clickedCoords.lat && latLng.lng === clickedCoords.lng) {
          const popupContent = `
            <strong>📍 Clicked Location</strong><br/>
            ${clickedAddressLoading ? 'Fetching address...' : (clickedDetails.fullAddress || clickedAddress || 'Location')}<br/>
            Lat: ${clickedCoords.lat.toFixed(6)}<br/>
            Lng: ${clickedCoords.lng.toFixed(6)}
          `;
          layer.setPopupContent(popupContent);
        }
        
        // Check if this is the destination marker (red)
        if (destinationCoords && latLng.lat === destinationCoords[0] && latLng.lng === destinationCoords[1]) {
          const popupContent = `
            <strong>🎯 Destination</strong><br/>
            ${destinationAddressLoading ? 'Fetching address...' : (destinationDetails.fullAddress || destination)}<br/>
            Lat: ${destinationCoords[0].toFixed(6)}<br/>
            Lng: ${destinationCoords[1].toFixed(6)}
          `;
          layer.setPopupContent(popupContent);
        }
      }
    });
  };

  // Update popups when address data changes
  useEffect(() => {
    updateMarkerPopups();
  }, [originDetails, clickedDetails, destinationDetails, originAddressLoading, clickedAddressLoading, destinationAddressLoading]);

  // Draw route on map when route is updated
  useEffect(() => {
    if (route && destinationCoords && mapRef.current?.leafletMap) {
      const L = window.L;
      const map = mapRef.current.leafletMap;

      // Remove existing route and destination marker
      map.eachLayer((layer) => {
        if (layer.options?.className === "route-line") {
          map.removeLayer(layer);
        }
        if (layer.options?.isDestinationMarker) {
          map.removeLayer(layer);
        }
      });

      const routeCoords = route.coordinates.map((coord) => [
        coord[1],
        coord[0],
      ]);
      
      // Add route line
      L.polyline(routeCoords, {
        color: "#ff6b6b",
        weight: 4,
        opacity: 0.8,
        className: "route-line",
      }).addTo(map);

      // Add destination marker with initial popup
      const destinationMarker = L.marker(destinationCoords, {
        icon: L.icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
        isDestinationMarker: true,
      })
        .addTo(map)
        .bindPopup(
          `<strong>🎯 Destination</strong><br/>Fetching address...<br/>Lat: ${destinationCoords[0].toFixed(6)}<br/>Lng: ${destinationCoords[1].toFixed(6)}`
        )
        .openPopup();

      // Fetch destination details and update popup
      fetchDestinationDetails(destinationCoords[0], destinationCoords[1]).then((destinationAddress) => {
        // Popup will be updated automatically via the updateMarkerPopups function
      });

      // Fit map to show both origin and destination
      const bounds = L.latLngBounds(
        [location.latitude, location.longitude],
        destinationCoords
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, destinationCoords, destination, location]);

  // Enhanced geolocation with better error handling
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser. Please use a modern browser like Chrome, Firefox, or Safari.");
      return;
    }

    setBoundaryCheckLoading(true);
    
    const locationOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds
      maximumAge: 60000 // 1 minute
    };

    const successCallback = async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setLocation({
        latitude: lat,
        longitude: lng,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      });
      setLocationError(null);

      // Get enhanced location name
      const placeName = await fetchEnhancedLocationName(lat, lng);
      setOriginName(placeName);
      setBoundaryCheckLoading(false);
    };

    const errorCallback = (error) => {
      setBoundaryCheckLoading(false);
      
      let errorMessage = "Unable to fetch your location. ";
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage += "Location access was denied. ";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage += "Location information is unavailable. ";
          break;
        case error.TIMEOUT:
          errorMessage += "Location request timed out. ";
          break;
        default:
          errorMessage += "An unknown error occurred. ";
          break;
      }

      // Add mobile-specific instructions
      if (isMobile) {
        errorMessage += "Please enable location services and grant location permission to this website.";
      } else {
        errorMessage += "Please check your browser settings and ensure location access is allowed.";
      }
      
      setLocationError(errorMessage);
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, locationOptions);
  };

  // Retry location function
  const handleRetryLocation = () => {
    setLocationError(null);
    requestLocation();
  };

  // Fetch geolocation on component mount
  useEffect(() => {
    requestLocation();
  }, []);

  // Handle destination search (legacy function for form submission)
  const handleSearchDestination = async (e) => {
    e.preventDefault();
    if (!destination.trim() || !location) return;

    setSearchLoading(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`
      );
      const results = await response.json();

      if (!results || results.length === 0) {
        setSearchError("Destination not found. Please try a different search.");
        return;
      }

      const destLat = parseFloat(results[0].lat);
      const destLon = parseFloat(results[0].lon);
      setDestinationCoords([destLat, destLon]);

      await calculateRoute(destLat, destLon);
    } catch (err) {
      setSearchError("Error searching destination. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  // NEW: Render search suggestions dropdown
  const renderSearchSuggestions = () => {
    if (!showSuggestions || searchSuggestions.length === 0) return null;

    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto mt-1">
        {suggestionsLoading ? (
          <div className="p-4 text-center text-gray-500">
            <svg className="animate-spin h-5 w-5 mx-auto mb-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Searching...
          </div>
        ) : (
          searchSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-3 border-b border-gray-100 hover:bg-cyan-50 cursor-pointer transition-colors duration-150"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent input blur
                handleSuggestionSelect(suggestion);
              }}
            >
              <div className="flex items-start gap-3">
                <Search className="w-4 h-4 text-cyan-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {suggestion.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {suggestion.fullAddress}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {suggestion.lat.toFixed(4)}, {suggestion.lon.toFixed(4)}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {suggestion.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // Render address display with complete address format
  const renderAddressDisplay = (address, details, isLoading, isWithinBoundary, type = "origin") => {
    const colors = {
      origin: { bg: "green", text: "green", border: "green" },
      clicked: { bg: "blue", text: "blue", border: "blue" },
      destination: { bg: "orange", text: "orange", border: "orange" }
    };
    
    const color = colors[type];
    const withinColor = isWithinBoundary ? color : "red";

    // Format complete address like: "Anos Fonacier Circumferential Road, Tawala, Panglao, Bohol, Central Visayas, 6339, Philippines"
    const formatCompleteAddress = (details) => {
      if (!details.fullAddress) return address;
      
      // Use the full address from Nominatim which typically has the complete format
      return details.fullAddress;
    };

    const completeAddress = formatCompleteAddress(details);

    return (
      <div
        className={`rounded-xl px-4 pt-3 pb-1 mb-6 border-2 ${
          isWithinBoundary
            ? `bg-${color.bg}-50 border-${color.border}-200`
            : "bg-red-50 border-red-200"
        }`}
      >
        <p className="text-sm font-semibold mb-2">
          {isWithinBoundary ? (
            <span className={`text-${withinColor}-800`}>
              {type === "origin" && "📍 Your Location:"}
              {type === "clicked" && "📍 Clicked Location:"}
              {type === "destination" && "🎯 Destination:"}
            </span>
          ) : (
            <span className="text-red-800">
              {type === "origin" && "📍 Outside Jurisdiction:"}
              {type === "clicked" && "📍 Clicked Location (Outside Jurisdiction):"}
              {type === "destination" && "🎯 Destination (Outside Jurisdiction):"}
            </span>
          )}
        </p>

        {isLoading ? (
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-gray-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-gray-600">Fetching address...</span>
          </div>
        ) : (
          <>
            <p
              className={`text-lg font-bold ${
                isWithinBoundary ? `text-${withinColor}-900` : "text-red-900"
              }`}
            >
              {completeAddress}
            </p>

            {details.barangay && (
              <p className="text-sm mt-1">
                {isWithinBoundary ? (
                  <span className={`text-${withinColor}-700`}>
                    Barangay {details.barangay}, {details.municipality || details.city || 'Unknown'}, {details.province || 'Bohol'}
                  </span>
                ) : (
                  <span className="text-red-700">
                    {details.municipality ? `${details.municipality}, ` : ""}
                    {details.province || "Outside Jurisdiction"}
                  </span>
                )}
              </p>
            )}
          </>
        )}
      </div>
    );
  };

  // Render mobile-specific location instructions
  const renderMobileLocationInstructions = () => {
    return (
      <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 mt-4">
        <div className="flex items-start gap-3 mb-3">
          <Smartphone className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h4 className="font-bold text-blue-800 text-lg">Mobile Location Setup</h4>
            <p className="text-blue-700 text-sm">Follow these steps to enable location:</p>
          </div>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-1 mt-1">
              <Settings className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-blue-800">1. Enable Device Location</p>
              <p className="text-blue-700">
                • Go to Phone Settings → Location → Turn ON<br/>
                • Enable "High accuracy" mode if available
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-1 mt-1">
              <Wifi className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-blue-800">2. Browser Permissions</p>
              <p className="text-blue-700">
                • Tap the <strong>location icon (📍)</strong> in address bar<br/>
                • Select <strong>"Allow"</strong> location access<br/>
                • Or go to Browser Settings → Site permissions → Location
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-1 mt-1">
              <div className="w-4 h-4 text-blue-600 text-center">📶</div>
            </div>
            <div>
              <p className="font-semibold text-blue-800">3. Connection & Retry</p>
              <p className="text-blue-700">
                • Ensure good internet connection<br/>
                • Make sure GPS/Location is enabled<br/>
                • Try refreshing the page after enabling settings
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRetryLocation}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry Location Detection
        </button>
      </div>
    );
  };

  // Render location error with specific instructions
  const renderLocationError = () => {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
            <div className="flex-1">
              <h4 className="font-bold text-red-800 text-lg mb-2">Location Access Required</h4>
              <p className="text-red-700">{locationError}</p>
            </div>
          </div>
        </div>

        {isMobile && renderMobileLocationInstructions()}

        {!isMobile && (
          <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
            <h5 className="font-bold text-yellow-800 mb-3">Desktop Browser Instructions:</h5>
            <div className="space-y-2 text-sm text-yellow-700">
              <p>• <strong>Chrome:</strong> Click the lock icon → Site settings → Location → Allow</p>
              <p>• <strong>Firefox:</strong> Address bar icon → Permissions → Location Access</p>
              <p>• <strong>Safari:</strong> Preferences → Websites → Location → Allow</p>
              <p>• Ensure your device location services are enabled</p>
            </div>
            <button
              onClick={handleRetryLocation}
              className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Retry Location
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render boundary status badge
  const renderBoundaryStatus = () => {
    if (boundaryCheckLoading) {
      return (
        <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-gray-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-gray-700 font-medium">Checking jurisdiction boundaries...</span>
          </div>
        </div>
      );
    }

    if (locationType === 'panglao') {
      return (
        <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h4 className="font-bold text-green-800 text-lg">BiyaFare - Panglao Municipality</h4>
              <p className="text-green-700 text-sm mt-1">
                Official tariff fares apply for tricycles and motorcycles in Panglao, Bohol.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (locationType === 'tagbilaran') {
      return (
        <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-blue-600" />
            <div>
              <h4 className="font-bold text-blue-800 text-lg">BiyaFare - Tagbilaran City</h4>
              <p className="text-blue-700 text-sm mt-1">
                Official tariff fares apply for tricycles and motorcycles in Tagbilaran City, Bohol.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (locationType === 'outside' && location) {
      return (
        <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h4 className="font-bold text-red-800 text-lg">❌ Outside Jurisdiction</h4>
              <p className="text-red-700 text-sm mt-1">
                Official tariff fares do not apply. Your location is outside Panglao and Tagbilaran jurisdictions.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Render clicked coordinates information
  const renderClickedCoordinates = () => {
    if (!clickedCoords) return null;

    const isClickedWithinJurisdiction = locationType !== 'outside';

    return renderAddressDisplay(
      clickedAddress,
      clickedDetails,
      clickedAddressLoading,
      isClickedWithinJurisdiction,
      "clicked"
    );
  };

  // Render fare calculation section only when within jurisdiction
  const renderFareCalculation = () => {
    if (locationType === 'outside') {
      return (
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-300">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="font-bold text-gray-700 text-lg mb-2">Fare Calculation Not Available</h4>
            <p className="text-gray-600 text-sm">
              Official tariff fares only apply to trips originating within Panglao Municipality or Tagbilaran City.
              <br />
              Your current location is outside the jurisdiction.
            </p>
          </div>
        </div>
      );
    }

    const jurisdictionInfo = getJurisdictionInfo(locationType);
    const fareBreakdown = getFareBreakdown(route.distance, passengerType, locationType);

    return (
      <div className={`rounded-lg p-4 border-2 ${
        locationType === 'tagbilaran' 
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
          : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
      }`}>
        <h4 className={`font-bold text-base mb-4 ${
          locationType === 'tagbilaran' ? 'text-blue-900' : 'text-green-900'
        }`}>
          Route Information & Fare Calculation
        </h4>
        
        <div className="mb-4 pb-4 border-b border-gray-300">
          <label className={`block text-xs font-semibold mb-2 ${
            locationType === 'tagbilaran' ? 'text-blue-900' : 'text-green-900'
          }`}>
            <Users className="inline w-4 h-4 mr-1" />
            Passenger Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {locationType === 'tagbilaran' ? (
              // Tagbilaran passenger types
              ["regular", "student", "senior", "below5"].map((type) => (
                <button
                  key={type}
                  onClick={() => setPassengerType(type)}
                  className={`py-1 px-3 rounded-md font-semibold transition-all text-sm ${
                    passengerType === type
                      ? locationType === 'tagbitaran' 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "bg-green-600 text-white shadow-md"
                      : "bg-white border-2 hover:border-gray-400"
                  } ${
                    locationType === 'tagbilaran' 
                      ? "text-blue-700 border-blue-200" 
                      : "text-green-700 border-green-200"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                  {type !== "regular" && (
                    <span className="text-xs ml-1">
                      ({type === 'below5' ? '-50%' : '-20%'})
                    </span>
                  )}
                </button>
              ))
            ) : (
              // Panglao passenger types
              ["regular", "student", "elderly", "disable"].map((type) => (
                <button
                  key={type}
                  onClick={() => setPassengerType(type)}
                  className={`py-1 px-3 rounded-md font-semibold transition-all text-sm ${
                    passengerType === type
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-white text-green-700 border-2 border-green-200 hover:border-green-400"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                  {type !== "regular" && <span className="text-xs ml-1">(-₱5)</span>}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className={`rounded-md p-3 shadow-sm border ${
            locationType === 'tagbilaran' 
              ? 'bg-white border-blue-100' 
              : 'bg-white border-green-100'
          }`}>
            <p className={`text-xs font-semibold uppercase tracking-wider ${
              locationType === 'tagbilaran' ? 'text-blue-600' : 'text-green-600'
            }`}>ORIGIN</p>
            <p className={`text-sm font-semibold mt-1 line-clamp-3 ${
              locationType === 'tagbilaran' ? 'text-blue-900' : 'text-green-900'
            }`}>
              {originAddressLoading ? "Fetching address..." : (originDetails.fullAddress || originName || "Location")}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {location?.latitude.toFixed(4)}, {location?.longitude.toFixed(4)}
            </p>
          </div>
          <div className={`rounded-md p-3 shadow-sm border ${
            locationType === 'tagbilaran' 
              ? 'bg-white border-blue-100' 
              : 'bg-white border-green-100'
          }`}>
            <p className={`text-xs font-semibold uppercase tracking-wider ${
              locationType === 'tagbilaran' ? 'text-blue-600' : 'text-green-600'
            }`}>DESTINATION</p>
            <p className={`text-sm font-semibold mt-1 line-clamp-3 ${
              locationType === 'tagbilaran' ? 'text-blue-900' : 'text-green-900'
            }`}>
              {destinationAddressLoading ? "Fetching address..." : (destinationDetails.fullAddress || destination)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {destinationCoords[0].toFixed(4)}, {destinationCoords[1].toFixed(4)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-4">
          <div className={`rounded-md p-3 shadow-sm border ${
            locationType === 'tagbilaran' 
              ? 'bg-white border-blue-100' 
              : 'bg-white border-green-100'
          }`}>
            <p className={`text-xs font-semibold uppercase tracking-wider ${
              locationType === 'tagbilaran' ? 'text-blue-600' : 'text-green-600'
            }`}>Distance</p>
            <p className={`text-xl font-bold mt-1 ${
              locationType === 'tagbilaran' ? 'text-blue-900' : 'text-green-900'
            }`}>
              {route.distance.toFixed(2)} <span className="text-sm">km</span>
            </p>
          </div>
          <div className="bg-gradient-to-br from-yellow-400 to-orange-400 rounded-md p-3 shadow-sm border border-yellow-300">
            <p className="text-xs text-yellow-900 font-semibold uppercase tracking-wider">Fare ({passengerType})</p>
            <p className="text-2xl font-bold text-yellow-900 mt-1">
              ₱{calculateFare(route.distance, passengerType, locationType).toFixed(2)}
            </p>
          </div>
        </div>

        <div className={`rounded-md p-3 border ${
          locationType === 'tagbilaran' 
            ? 'bg-white border-blue-200' 
            : 'bg-white border-green-200'
        }`}>
          <h5 className={`font-semibold mb-2 text-sm ${
            locationType === 'tagbilaran' ? 'text-blue-900' : 'text-green-900'
          }`}>Fare Breakdown (Per Person)</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-700">
              <span>First 1 km:</span>
              <span className="font-semibold">₱{fareBreakdown.firstKmRate.toFixed(2)}</span>
            </div>
            {route.distance > 1 && (
              <>
                <div className="flex justify-between text-gray-700">
                  <span>Remaining {(route.distance - 1).toFixed(2)} km × ₱{fareBreakdown.succeedingKmRate.toFixed(2)}/km:</span>
                  <span className="font-semibold">₱{((route.distance - 1) * fareBreakdown.succeedingKmRate).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-300 pt-1 flex justify-between text-gray-900 font-bold">
                  <span>Subtotal:</span>
                  <span>₱{(fareBreakdown.firstKmRate + (route.distance - 1) * fareBreakdown.succeedingKmRate).toFixed(2)}</span>
                </div>
              </>
            )}
            {passengerType !== "regular" && (
              <div className={`flex justify-between font-semibold ${
                locationType === 'tagbilaran' ? 'text-blue-700' : 'text-green-700'
              }`}>
                <span>Discount ({passengerType}):</span>
                <span>
                  {locationType === 'tagbilaran' 
                    ? passengerType === 'below5' ? '-50%' : '-20%'
                    : '-₱5.00'
                  }
                </span>
              </div>
            )}
            <div className={`border-t-2 pt-1 flex justify-between font-bold text-sm ${
              locationType === 'tagbilaran' 
                ? 'border-blue-400 text-blue-900' 
                : 'border-green-400 text-green-900'
            }`}>
              <span>Total Fare:</span>
              <span>₱{fareBreakdown.totalFare.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className={`rounded-md p-3 border mt-3 ${
          locationType === 'tagbilaran' 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <h5 className={`font-semibold mb-1 text-sm ${
            locationType === 'tagbilaran' ? 'text-blue-900' : 'text-green-900'
          }`}>📍 Jurisdiction Information</h5>
          <p className={`text-xs ${
            locationType === 'tagbilaran' ? 'text-blue-700' : 'text-green-700'
          }`}>
            ✅ <strong>Official Tariff Applies</strong> - Your trip originates within the jurisdiction of {jurisdictionInfo.name}.
            {originDetails.barangay && !originAddressLoading && ` You are in Barangay ${originDetails.barangay}.`}
          </p>
          <div className="mt-2 pt-2 border-t border-gray-300">
            <p className={`text-xs font-semibold mb-1 ${
              locationType === 'tagbilaran' ? 'text-blue-800' : 'text-green-800'
            }`}>Official Fare Structure:</p>
            <ul className={`text-xs space-y-1 ${
              locationType === 'tagbilaran' ? 'text-blue-700' : 'text-green-700'
            }`}>
              <li className="flex justify-between">
                <span>First 1 Kilometer:</span>
                <span className="font-semibold">
                  ₱{locationType === 'tagbilaran' ? '15.00' : '20.00'}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Every Succeeding Kilometer:</span>
                <span className="font-semibold">
                  ₱{locationType === 'tagbilaran' ? '2.00' : '5.00'}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Render map loading state
  const renderMap = () => {
    if (!leafletLoaded) {
      return (
        <div className="w-full h-96 rounded-xl border border-gray-300 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-cyan-600 mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-gray-600 font-medium">Loading map...</p>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={mapRef}
        className="w-full h-96 rounded-xl border border-gray-300 shadow-inner bg-gray-100 cursor-pointer"
        style={{ minHeight: "400px" }}
      />
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-cyan-400 to-teal-500">
      {/* Remove horizontal padding from the main container */}
      <div className="w-full mx-auto">
        <div className="space-y-6">
          {/* Jurisdiction Status - Keep some side padding for status only */}
          <div className="px-4">
            {location && renderBoundaryStatus()}
          </div>

          {/* SWAPPED: Current Location Card now comes first */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-cyan-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-100 rounded-full p-2 shadow">
                <MapPin size={24} className="text-red-600" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-cyan-900 tracking-tight">
                Your Current Location
              </h3>
            </div>

            {locationError ? (
              renderLocationError()
            ) : !location ? (
              <div className="flex justify-center items-center py-16">
                <svg className="animate-spin h-8 w-8 text-red-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span className="ml-4 text-red-600 font-medium text-lg">Fetching your location...</span>
              </div>
            ) : (
              <>
                {renderAddressDisplay(originName, originDetails, originAddressLoading, locationType !== 'outside', "origin")}

                {renderMap()}
                
                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-600">
                    💡 <strong>Click anywhere on the map</strong> to see coordinates and address
                  </p>
                </div>
              </>
            )}
          </div>

          {/* SWAPPED: Route Search Card now comes second */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-cyan-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-100 rounded-full p-3 shadow">
                <Navigation size={24} className="text-orange-600" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-cyan-900 tracking-tight">
                Find Route to Destination
              </h3>
            </div>

            {!location ? (
              <div className="space-y-4">
                {locationError ? (
                  renderLocationError()
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-yellow-700 font-medium">
                      Waiting for location... Enable your location to search for routes.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <form onSubmit={handleSearchDestination} className="mb-6">
                  <div className="relative">
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1 relative">
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={destination}
                          onChange={(e) => {
                            setDestination(e.target.value);
                            setSearchError(null);
                          }}
                          onFocus={() => {
                            if (searchSuggestions.length > 0) {
                              setShowSuggestions(true);
                            }
                          }}
                          onBlur={() => {
                            // Use setTimeout to allow click event to fire first
                            setTimeout(() => setShowSuggestions(false), 200);
                          }}
                          placeholder="Enter destination (e.g., 'Alona Beach', 'Panglao Island', 'Airport', address, etc.)"
                          className="w-full px-5 py-3 rounded-xl border-2 border-cyan-200 focus:border-cyan-500 focus:outline-none transition-colors bg-cyan-50 text-gray-800 placeholder-gray-500 font-medium"
                        />
                        {renderSearchSuggestions()}
                      </div>
                      <button
                        type="submit"
                        disabled={searchLoading || !destination.trim()}
                        className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                      >
                        {searchLoading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Searching...
                          </span>
                        ) : (
                          "Calculate Fare"
                        )}
                      </button>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      💡 <strong>Start typing</strong> to see search suggestions (e.g., "Alona" for Alona Beach)
                    </div>
                  </div>
                </form>

                {searchError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <p className="text-red-700 font-medium text-sm">{searchError}</p>
                  </div>
                )}

                {route && destinationCoords && renderFareCalculation()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteFinder;