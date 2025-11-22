import React, { useState, useRef, useEffect } from "react";
import { MapPin, Navigation, Users, AlertCircle, CheckCircle, Smartphone, Settings, Wifi } from "lucide-react";

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
  const [boundaryCheckLoading, setBoundaryCheckLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mapRef = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // New state for clicked coordinates
  const [clickedCoords, setClickedCoords] = useState(null);
  const [clickedAddress, setClickedAddress] = useState(null);
  const [clickedDetails, setClickedDetails] = useState({});
  const [destinationDetails, setDestinationDetails] = useState({});

  // Loading states for addresses
  const [originAddressLoading, setOriginAddressLoading] = useState(true);
  const [clickedAddressLoading, setClickedAddressLoading] = useState(false);
  const [destinationAddressLoading, setDestinationAddressLoading] = useState(false);

  // Check if user is on mobile device
  useEffect(() => {
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    setIsMobile(checkMobile());
  }, []);

  // Panglao Municipality Boundary Coordinates (approximate bounding box)
  const PANGLAO_BOUNDARY = {
    minLat: 9.5000,  // Southern boundary
    maxLat: 9.6500,  // Northern boundary  
    minLng: 123.7500, // Western boundary
    maxLng: 123.8500  // Eastern boundary
  };

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

  // Check if location is within Panglao municipality
  const checkPanglaoBoundary = (address) => {
    if (!address) return false;
    
    // Check if the location is within Panglao municipality
    const hasPanglaoMunicipality = address.municipality === 'Panglao';
    const hasBoholProvince = address.state === 'Bohol' || address.province === 'Bohol';
    const hasCentralVisayas = address.region === 'Central Visayas';
    
    // Official tariff applies only for Panglao, Bohol, Central Visayas
    return hasPanglaoMunicipality && hasBoholProvince && hasCentralVisayas;
  };

  // Enhanced location name fetcher with boundary check
  const fetchEnhancedLocationName = async (lat, lng) => {
    try {
      setOriginAddressLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`
      );
      const data = await response.json();
      
      const address = data.address || {};
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

      // Check if within Panglao municipality using address details
      const withinPanglao = checkPanglaoBoundary(address);
      setIsWithinPanglao(withinPanglao);

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
        setIsWithinPanglao(broaderWithinPanglao);
      }
      
      // Final fallback - use coordinates with context
      return placeName || `Location near ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      
    } catch (err) {
      // Set to false if geocoding fails
      setIsWithinPanglao(false);
      
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

  // Calculate fare based on distance and passenger type
  const calculateFare = (distanceKm, pType) => {
    const FIRST_KM_FARE = 20;
    const SUCCEEDING_KM_FARE = 5;
    const DISCOUNT = 5;

    let fare;
    if (distanceKm <= 1) {
      fare = FIRST_KM_FARE;
    } else {
      const remainingKm = distanceKm - 1;
      fare = FIRST_KM_FARE + remainingKm * SUCCEEDING_KM_FARE;
    }

    if (pType !== "regular") {
      fare -= DISCOUNT;
    }

    return Math.max(fare, 0);
  };

  // Initialize Leaflet map with click handler
  useEffect(() => {
    if (location && !mapInitialized && mapRef.current) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        setTimeout(() => {
          const L = window.L;
          if (L && mapRef.current) {
            const map = L.map(mapRef.current).setView(
              [location.latitude, location.longitude],
              15
            );
            mapRef.current.leafletMap = map;

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
                iconUrl:
                  "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
                shadowUrl:
                  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
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
          }
        }, 100);
      };
      document.body.appendChild(script);
    }
  }, [location, mapInitialized]);

  // Draw route on map when route is updated
  useEffect(() => {
    if (route && destinationCoords && mapRef.current?.leafletMap) {
      const L = window.L;
      const map = mapRef.current.leafletMap;

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
      L.polyline(routeCoords, {
        color: "#ff6b6b",
        weight: 4,
        opacity: 0.8,
        className: "route-line",
      }).addTo(map);

      // Add destination marker with initial popup
      const destinationMarker = L.marker(destinationCoords, {
        icon: L.icon({
          iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
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

      const bounds = L.latLngBounds(
        [location.latitude, location.longitude],
        destinationCoords
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, destinationCoords, destination, location]);

  // Handle destination search
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
      setSearchError("Error searching destination. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Render address display with loading state
  const renderAddressDisplay = (address, details, isLoading, isWithinBoundary, type = "origin") => {
    const colors = {
      origin: { bg: "green", text: "green", border: "green" },
      clicked: { bg: "blue", text: "blue", border: "blue" },
      destination: { bg: "orange", text: "orange", border: "orange" }
    };
    
    const color = colors[type];
    const withinColor = isWithinBoundary ? color : "red";

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
              {type === "origin" && "📍 Outside Panglao Municipality:"}
              {type === "clicked" && "📍 Clicked Location (Outside Panglao):"}
              {type === "destination" && "🎯 Destination (Outside Panglao):"}
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
              {address}
            </p>

            {details.barangay && (
              <p className="text-sm mt-1">
                {isWithinBoundary ? (
                  <span className={`text-${withinColor}-700`}>
                    Barangay {details.barangay}, {details.municipality || 'Panglao'}, {details.province || 'Bohol'}
                  </span>
                ) : (
                  <span className="text-red-700">
                    {details.municipality ? `${details.municipality}, ` : ""}
                    {details.province || "Outside Panglao"}
                  </span>
                )}
              </p>
            )}
          </>
        )}
      </div>
    );
  };

  // Rest of the component remains the same...
  // [Keep all the existing render functions and JSX as they were, but replace the address display parts]

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

    if (isWithinPanglao === true) {
      return (
        <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h4 className="font-bold text-green-800 text-lg">BiyaFare</h4>
              <p className="text-green-700 text-sm mt-1">
                Official tariff fares apply for tricycles and motorcycles in Panglao, Bohol.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (isWithinPanglao === false && location) {
      return (
        <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h4 className="font-bold text-red-800 text-lg">❌ Outside Panglao Municipality</h4>
              <p className="text-red-700 text-sm mt-1">
                Official tariff fares do not apply. Your location is outside Panglao jurisdiction.
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

    const isClickedWithinPanglao = checkPanglaoBoundary(clickedCoords.lat, clickedCoords.lng);

    return renderAddressDisplay(
      clickedAddress,
      clickedDetails,
      clickedAddressLoading,
      isClickedWithinPanglao,
      "clicked"
    );
  };

  // Render fare calculation section only when within Panglao
  const renderFareCalculation = () => {
    if (!isWithinPanglao) {
      return (
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-300">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="font-bold text-gray-700 text-lg mb-2">Fare Calculation Not Available</h4>
            <p className="text-gray-600 text-sm">
              Official tariff fares only apply to trips originating within Panglao Municipality.
              <br />
              Your current location is outside the jurisdiction.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
        <h4 className="font-bold text-green-900 text-base mb-4">Route Information & Fare Calculation</h4>
        
        <div className="mb-4 pb-4 border-b border-green-300">
          <label className="block text-xs font-semibold text-green-900 mb-2">
            <Users className="inline w-4 h-4 mr-1" />
            Passenger Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(["regular", "student", "elderly", "disable"]).map((type) => (
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
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-md p-3 shadow-sm border border-green-100">
            <p className="text-xs text-green-600 font-semibold uppercase tracking-wider">Origin</p>
            <p className="text-sm font-semibold text-green-900 mt-1 line-clamp-2">
              {originAddressLoading ? "Fetching address..." : (originName || "Location")}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {location?.latitude.toFixed(4)}, {location?.longitude.toFixed(4)}
            </p>
            {originDetails.barangay && !originAddressLoading && (
              <p className="text-xs text-blue-600 mt-1">
                📍 {originDetails.municipality || 'Panglao'}, {originDetails.province || 'Bohol'}
              </p>
            )}
          </div>
          <div className="bg-white rounded-md p-3 shadow-sm border border-green-100">
            <p className="text-xs text-green-600 font-semibold uppercase tracking-wider">Destination</p>
            <p className="text-sm font-semibold text-green-900 mt-1 line-clamp-2">
              {destinationAddressLoading ? "Fetching address..." : (destinationDetails.fullAddress ? destinationDetails.fullAddress.substring(0, 30) : destination.substring(0, 30))}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {destinationCoords[0].toFixed(4)}, {destinationCoords[1].toFixed(4)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-md p-3 shadow-sm border border-green-100">
            <p className="text-xs text-green-600 font-semibold uppercase tracking-wider">Distance</p>
            <p className="text-xl font-bold text-green-900 mt-1">
              {route.distance.toFixed(2)} <span className="text-sm">km</span>
            </p>
          </div>
          <div className="bg-gradient-to-br from-yellow-400 to-orange-400 rounded-md p-3 shadow-sm border border-yellow-300">
            <p className="text-xs text-yellow-900 font-semibold uppercase tracking-wider">Fare ({passengerType})</p>
            <p className="text-2xl font-bold text-yellow-900 mt-1">
              ₱{calculateFare(route.distance, passengerType).toFixed(0)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-md p-3 border border-green-200">
          <h5 className="font-semibold text-green-900 mb-2 text-sm">Fare Breakdown(Per Person)</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-700">
              <span>First 1 km:</span>
              <span className="font-semibold">₱20.00</span>
            </div>
            {route.distance > 1 && (
              <>
                <div className="flex justify-between text-gray-700">
                  <span>Remaining {(route.distance - 1).toFixed(2)} km × ₱5/km:</span>
                  <span className="font-semibold">₱{((route.distance - 1) * 5).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-300 pt-1 flex justify-between text-gray-900 font-bold">
                  <span>Subtotal:</span>
                  <span>₱{(route.distance <= 1 ? 20 : 20 + (route.distance - 1) * 5).toFixed(2)}</span>
                </div>
              </>
            )}
            {passengerType !== "regular" && (
              <div className="flex justify-between text-green-700 font-semibold">
                <span>Discount ({passengerType}):</span>
                <span>-₱5.00</span>
              </div>
            )}
            <div className="border-t-2 border-green-400 pt-1 flex justify-between text-green-900 font-bold text-sm">
              <span>Total Fare:</span>
              <span>₱{calculateFare(route.distance, passengerType).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-md p-3 border border-blue-200 mt-3">
          <h5 className="font-semibold text-blue-900 mb-1 text-sm">📍 Jurisdiction Information</h5>
          <p className="text-xs text-blue-700">
            ✅ <strong>Official Tariff Applies</strong> - Your trip originates within the jurisdiction of Panglao, Bohol.
            {originDetails.barangay && !originAddressLoading && ` You are in Barangay ${originDetails.barangay}.`}
          </p>
          <div className="mt-2 pt-2 border-t border-blue-200">
            <p className="text-xs font-semibold text-blue-800 mb-1">Official Fare Structure:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li className="flex justify-between">
                <span>First 1 Kilometer:</span>
                <span className="font-semibold">20 pesos</span>
              </li>
              <li className="flex justify-between">
                <span>Every Succeeding Kilometer:</span>
                <span className="font-semibold">5 pesos</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
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
                {renderAddressDisplay(originName, originDetails, originAddressLoading, isWithinPanglao, "origin")}

                {/* Clicked coordinates display */}
                {renderClickedCoordinates()}

                <div
                  ref={mapRef}
                  className="w-full h-96 rounded-xl border border-gray-300 shadow-inner bg-gray-100 cursor-pointer"
                  style={{ minHeight: "400px" }}
                />
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
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => {
                        setDestination(e.target.value);
                        setSearchError(null);
                      }}
                      placeholder="Enter destination (e.g., 'Panglao Island', 'Airport', address, etc.)"
                      className="flex-1 px-5 py-3 rounded-xl border-2 border-cyan-200 focus:border-cyan-500 focus:outline-none transition-colors bg-cyan-50 text-gray-800 placeholder-gray-500 font-medium"
                    />
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