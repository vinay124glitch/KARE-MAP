import { useState, useMemo } from 'react';
import campusData from '../data/campusData';
import { routingEngine } from '../utils/routing';

export const useNavigation = (userLocation, selectedPoi) => {

    // Calculate distance in meters using Haversine formula
    const calculateDistance = (coord1, coord2) => {
        if (!coord1 || !coord2) return null;
        const R = 6371e3; // Earth radius in meters
        const p1 = Array.isArray(coord1) ? { lng: coord1[0], lat: coord1[1] } : coord1;
        const p2 = Array.isArray(coord2) ? { lng: coord2[0], lat: coord2[1] } : coord2;

        const phi1 = (p1.lat * Math.PI) / 180;
        const phi2 = (p2.lat * Math.PI) / 180;
        const deltaPhi = ((p2.lat - p1.lat) * Math.PI) / 180;
        const deltaLambda = ((p2.lng - p1.lng) * Math.PI) / 180;

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    const navInfo = useMemo(() => {
        if (!selectedPoi || !userLocation) return null;

        // Extract destination coordinates
        let destCoords = selectedPoi.coords;
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

        // Find road-snapped path
        const start = [userLocation.lng, userLocation.lat];
        const path = routingEngine.findPath(start, destCoords);

        let distance = 0;
        let finalPath = path;

        if (path && path.length > 1) {
            // Calculate total distance along the road path
            for (let i = 0; i < path.length - 1; i++) {
                distance += calculateDistance(path[i], path[i + 1]);
            }
        } else {
            // Fallback to straight line if no path found
            distance = calculateDistance(userLocation, { lng: destCoords[0], lat: destCoords[1] });
            finalPath = [start, destCoords];
        }

        const time = Math.round(distance / 1.4); // Assume 1.4 m/s walking speed

        return {
            path: finalPath,
            distanceRaw: distance,
            timeRaw: time,
            distance: distance > 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`,
            time: time > 60 ? `${Math.round(time / 60)} min` : `${time} sec`
        };
    }, [selectedPoi, userLocation]);

    return { navInfo };
};

