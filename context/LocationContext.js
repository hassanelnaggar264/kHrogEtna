import React, { createContext, useContext, useState } from 'react';

const LocationContext = createContext();

export function LocationProvider({ children }) {
    const [nearbyEnabled, setNearbyEnabled] = useState(true);
    const [selectedGov, setSelectedGov] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);

    const resetLocation = () => {
        setNearbyEnabled(true);
        setSelectedGov(null);
        setSelectedCity(null);
    };

    // Helper to switch to specific location logic
    const setLocationFilter = (gov, city = null) => {
        setNearbyEnabled(false);
        setSelectedGov(gov);
        setSelectedCity(city);
    };

    const value = {
        nearbyEnabled,
        setNearbyEnabled,
        selectedGov,
        setSelectedGov,
        selectedCity,
        setSelectedCity,
        resetLocation,
        setLocationFilter
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
}
