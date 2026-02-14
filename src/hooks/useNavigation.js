import { useState, useMemo } from 'react';
import campusData from '../data/campusData';

export const useNavigation = (userLocation, selectedPoi) => {

    // Calculate distance in meters using Haversine formula
    const calculateDistance = (coord1, coord2) => {
        if (!coord1 || !coord2) return null;
        const R = 6371e3; // Earth radius in meters
        const phi1 = (coord1.lat * Math.PI) / 180;
        const phi2 = (coord2.lat * Math.PI) / 180;
        const deltaPhi = ((coord2.lat - coord1.lat) * Math.PI) / 180;
        const deltaLambda = ((coord2.lng - coord1.lng) * Math.PI) / 180;

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    const navInfo = useMemo(() => {
        if (!selectedPoi || !userLocation) return null;

        // selectedPoi might have coords directly or we might need to find it from campusData
        let destCoords = selectedPoi.coords;
        // If selectedPoi doesn't have coords but has a name, try to find it
        if (!destCoords && selectedPoi.name) {
            const feature = campusData.features.find(f => f.properties.name === selectedPoi.name);
            if (feature) {
                if (feature.geometry.type === 'Point') {
                    destCoords = feature.geometry.coordinates;
                } else if (feature.geometry.type === 'LineString') {
                    const points = feature.geometry.coordinates;
                    const sumLng = points.reduce((acc, c) => acc + c[0], 0);
                    const sumLat = points.reduce((acc, c) => acc + c[1], 0);
                    destCoords = [sumLng / points.length, sumLat / points.length];
                } else {
                    const flatCoords = feature.geometry.coordinates[0];
                    const sumLng = flatCoords.reduce((acc, c) => acc + c[0], 0);
                    const sumLat = flatCoords.reduce((acc, c) => acc + c[1], 0);
                    destCoords = [sumLng / flatCoords.length, sumLat / flatCoords.length];
                }
            }
        }

        if (!destCoords) return null;

        const distance = calculateDistance(userLocation, { lng: destCoords[0], lat: destCoords[1] });
        const time = Math.round(distance / 1.4); // Assume 1.4 m/s walking speed

        return {
            distanceRaw: distance,
            timeRaw: time,
            distance: distance > 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`,
            time: time > 60 ? `${Math.round(time / 60)} min` : `${time} sec`
        };
    }, [selectedPoi, userLocation]);

    return { navInfo };
};
