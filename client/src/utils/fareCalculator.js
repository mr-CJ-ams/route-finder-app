// Fare calculation module for different locations

// Panglao fare rates (existing)
const PANGLAO_FARE_RATES = {
  regular: {
    firstKm: 20,
    succeedingKm: 5
  },
  student: {
    firstKm: 15,
    succeedingKm: 4
  },
  elderly: {
    firstKm: 15,
    succeedingKm: 4
  },
  disable: {
    firstKm: 15,
    succeedingKm: 4
  }
};

// Tagbilaran fare rates (new)
const TAGBILARAN_FARE_RATES = {
  regular: {
    firstKm: 15,
    succeedingKm: 2
  },
  student: {
    firstKm: 12,
    succeedingKm: 1.60
  },
  senior: {
    firstKm: 12,
    succeedingKm: 1.60
  },
  disable: {
    firstKm: 12,
    succeedingKm: 1.60
  },
  below5: {
    firstKm: 7.50,
    succeedingKm: 1
  }
};

// Check if location is within Tagbilaran municipality
export const checkTagbilaranBoundary = (address) => {
  if (!address) return false;
  
  console.log('Tagbilaran boundary check - Address details:', address);
  
  // Check if the location is within Tagbilaran municipality
  const hasTagbilaranMunicipality = 
    address.municipality === 'Tagbilaran' ||
    address.town === 'Tagbilaran' ||
    address.city === 'Tagbilaran' ||
    address.county === 'Tagbilaran';
  
  const hasBoholProvince = 
    address.state === 'Bohol' || 
    address.province === 'Bohol' ||
    address.region === 'Bohol';
  
  const hasCentralVisayas = 
    address.region === 'Central Visayas' ||
    address.region === 'Region VII';
  
  // Also check if the display name contains "Tagbilaran, Bohol"
  const displayName = address._displayName || '';
  const hasTagbilaranInDisplay = displayName.includes('Tagbilaran, Bohol') || 
                                displayName.includes('Tagbilaran City') ||
                                displayName.includes('Tagbilaran');
  
  // Tagbilaran tariff applies if it's clearly in Tagbilaran City, Bohol
  return (hasTagbilaranMunicipality && hasBoholProvince) || hasTagbilaranInDisplay;
};

// Check if location is within Panglao municipality
export const checkPanglaoBoundary = (address) => {
  if (!address) return false;
  
  console.log('Panglao boundary check - Address details:', address);
  
  // Check if the location is within Panglao municipality
  const hasPanglaoMunicipality = 
    address.municipality === 'Panglao' ||
    address.town === 'Panglao' ||
    address.city === 'Panglao' ||
    address.county === 'Panglao';
  
  const hasBoholProvince = 
    address.state === 'Bohol' || 
    address.province === 'Bohol' ||
    address.region === 'Bohol';
  
  const hasCentralVisayas = 
    address.region === 'Central Visayas' ||
    address.region === 'Region VII';
  
  // Also check if the display name contains "Panglao, Bohol"
  const displayName = address._displayName || '';
  const hasPanglaoInDisplay = displayName.includes('Panglao, Bohol') || 
                              displayName.includes('Panglao');
  
  // Official tariff applies if it's clearly in Panglao, Bohol
  return (hasPanglaoMunicipality && hasBoholProvince) || hasPanglaoInDisplay;
};

// Main fare calculation function
export const calculateFare = (distanceKm, passengerType, locationType) => {
  let fareRates;
  
  // Select fare rates based on location
  if (locationType === 'tagbilaran') {
    fareRates = TAGBILARAN_FARE_RATES;
    
    // Map passenger types for Tagbilaran
    if (passengerType === 'elderly') {
      passengerType = 'senior'; // Map elderly to senior for Tagbilaran
    }
  } else {
    fareRates = PANGLAO_FARE_RATES;
    
    // Map passenger types for Panglao
    if (passengerType === 'senior') {
      passengerType = 'elderly'; // Map senior to elderly for Panglao
    }
  }
  
  // Get rates for passenger type, fallback to regular if not found
  const rates = fareRates[passengerType] || fareRates.regular;
  
  let fare;
  if (distanceKm <= 1) {
    fare = rates.firstKm;
  } else {
    const remainingKm = distanceKm - 1;
    fare = rates.firstKm + remainingKm * rates.succeedingKm;
  }

  return Math.max(fare, 0);
};

// Get fare breakdown details
export const getFareBreakdown = (distanceKm, passengerType, locationType) => {
  const totalFare = calculateFare(distanceKm, passengerType, locationType);
  let fareRates;
  
  if (locationType === 'tagbilaran') {
    fareRates = TAGBILARAN_FARE_RATES;
    if (passengerType === 'elderly') passengerType = 'senior';
  } else {
    fareRates = PANGLAO_FARE_RATES;
    if (passengerType === 'senior') passengerType = 'elderly';
  }
  
  const rates = fareRates[passengerType] || fareRates.regular;
  
  return {
    totalFare,
    firstKmRate: rates.firstKm,
    succeedingKmRate: rates.succeedingKm,
    distance: distanceKm,
    passengerType,
    locationType
  };
};

// Get jurisdiction information
export const getJurisdictionInfo = (locationType) => {
  if (locationType === 'tagbilaran') {
    return {
      name: 'Tagbilaran City, Bohol',
      fareStructure: TAGBILARAN_FARE_RATES,
      description: 'Official tariff fares apply for tricycles and motorcycles in Tagbilaran City, Bohol.'
    };
  } else if (locationType === 'panglao') {
    return {
      name: 'Panglao Municipality, Bohol',
      fareStructure: PANGLAO_FARE_RATES,
      description: 'Official tariff fares apply for tricycles and motorcycles in Panglao, Bohol.'
    };
  } else {
    return {
      name: 'Outside Jurisdiction',
      fareStructure: null,
      description: 'Official tariff fares do not apply. Your location is outside the jurisdiction.'
    };
  }
};

// Determine location type based on address
export const determineLocationType = (address) => {
  if (checkTagbilaranBoundary(address)) {
    return 'tagbilaran';
  } else if (checkPanglaoBoundary(address)) {
    return 'panglao';
  } else {
    return 'outside';
  }
};