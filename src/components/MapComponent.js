import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import campusData from '../data/campusData';
import UserMarker from './UserMarker';

const MapComponent = ({ userLocation, startPoint, heading, otherUsers = [], destination, onPoiClick, theme, isFollowing, setIsFollowing, selectedPoi }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const otherMarkers = useRef({});
    const destinationMarker = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    const STYLES = {
        dark: 'https://tiles.openfreemap.org/styles/dark',
        satellite: {
            'version': 8,
            'sources': {
                'raster-tiles': {
                    'type': 'raster',
                    'tiles': [
                        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                    ],
                    'tileSize': 256,
                    'attribution': 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                }
            },
            'layers': [
                {
                    'id': 'simple-tiles',
                    'type': 'raster',
                    'source': 'raster-tiles',
                    'minzoom': 0,
                    'maxzoom': 22
                }
            ]
        }
    };

    const addCampusLayers = (m) => {
        if (!m.getSource('campus')) {
            m.addSource('campus', {
                type: 'geojson',
                data: campusData
            });
        }

        // Roads layer
        if (!m.getLayer('campus-roads')) {
            m.addLayer({
                'id': 'campus-roads',
                'type': 'line',
                'source': 'campus',
                'filter': ['==', 'type', 'road'],
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': theme === 'dark' ? '#475569' : '#ffffff',
                    'line-width': 4,
                    'line-opacity': 0.8
                }
            });
        }

        // Walkways layer
        if (!m.getLayer('campus-walkways')) {
            m.addLayer({
                'id': 'campus-walkways',
                'type': 'line',
                'source': 'campus',
                'filter': ['==', 'type', 'walkway'],
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': theme === 'dark' ? '#94a3b8' : '#e2e8f0',
                    'line-width': 2,
                    'line-dasharray': [2, 2]
                }
            });
        }

        // Extruded buildings (3D)
        if (!m.getLayer('campus-buildings')) {
            m.addLayer({
                'id': 'campus-buildings',
                'type': 'fill-extrusion',
                'source': 'campus',
                'filter': ['==', '$type', 'Polygon'],
                'paint': {
                    'fill-extrusion-color': [
                        'match',
                        ['get', 'type'],
                        'academic', '#6366f1',
                        'facility', '#8b5cf6',
                        'food', '#ec4899',
                        '#ffffff'
                    ],
                    'fill-extrusion-height': 20,
                    'fill-extrusion-base': 0,
                    'fill-extrusion-opacity': theme === 'dark' ? 0.85 : 0.6
                }
            });
        }

        // POI Labels
        if (!m.getLayer('campus-labels')) {
            m.addLayer({
                'id': 'campus-labels',
                'type': 'symbol',
                'source': 'campus',
                'layout': {
                    'text-field': ['get', 'name'],
                    'text-size': 13,
                    'text-offset': [0, 1.5],
                    'text-anchor': 'top'
                },
                'paint': {
                    'text-color': '#ffffff',
                    'text-halo-color': '#000000',
                    'text-halo-width': 1.5
                }
            });
        }
    };

    // Initialize Map
    useEffect(() => {
        if (map.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: STYLES[theme] || STYLES.dark,
            center: [77.6761, 9.5743],
            zoom: 16.5,
            pitch: 45,
            bearing: 0,
            antialias: true
        });

        const onLoad = () => {
            setMapLoaded(true);
            setMapInstance(map.current);
            addCampusLayers(map.current);

            map.current.on('click', 'campus-buildings', (e) => {
                if (e.features.length > 0) {
                    onPoiClick(e.features[0].properties);
                }
            });

            map.current.on('mouseenter', 'campus-buildings', () => {
                map.current.getCanvas().style.cursor = 'pointer';
            });

            map.current.on('mouseleave', 'campus-buildings', () => {
                map.current.getCanvas().style.cursor = '';
            });

            // Disable follow mode when user manually moves the map
            map.current.on('dragstart', () => {
                setIsFollowing(false);
            });
        };

        map.current.on('load', onLoad);
        map.current.on('style.load', () => {
            if (map.current) addCampusLayers(map.current);
        });

        return () => {
            if (map.current) {
                // Background cleanup of markers
                if (destinationMarker.current) destinationMarker.current.remove();
                Object.values(otherMarkers.current).forEach(m => m.remove());

                map.current.remove();
                map.current = null;
                setMapInstance(null);
            }
        };
    }, []);

    // Handle Theme Change
    useEffect(() => {
        if (!map.current || !mapLoaded) return;
        map.current.setStyle(STYLES[theme] || STYLES.dark);
    }, [theme]);

    // Update Camera to follow User
    useEffect(() => {
        if (!map.current || !userLocation || !mapLoaded || !isFollowing) return;

        const { lng, lat } = userLocation;
        const currentCenter = map.current.getCenter();

        // Only jump if we've moved significantly or if we're just starting to follow
        const distanceMoved = Math.sqrt(
            Math.pow(lng - currentCenter.lng, 2) +
            Math.pow(lat - currentCenter.lat, 2)
        );

        if (distanceMoved > 0.00001) {
            map.current.easeTo({
                center: [lng, lat],
                duration: 1000,
                essential: true,
                padding: destination ? { top: 120 } : { top: 0 } // Add padding if HUD is visible
            });
        }
    }, [userLocation, mapLoaded, isFollowing, destination]);

    // Update Other Users Markers
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        // Add or update markers for each user
        otherUsers.forEach(user => {
            if (!otherMarkers.current[user.id]) {
                const el = document.createElement('div');
                el.className = 'other-user-marker';
                el.innerHTML = `<div class="other-user-dot"></div><div class="other-user-label">${user.name}</div>`;

                otherMarkers.current[user.id] = new maplibregl.Marker({ element: el })
                    .setLngLat([user.lng, user.lat])
                    .addTo(map.current);
            } else {
                otherMarkers.current[user.id].setLngLat([user.lng, user.lat]);
            }
        });

        // Remove markers for users no longer in the list
        Object.keys(otherMarkers.current).forEach(id => {
            if (!otherUsers.find(u => u.id === parseInt(id))) {
                otherMarkers.current[id].remove();
                delete otherMarkers.current[id];
            }
        });
    }, [otherUsers, mapLoaded]);

    // Handle Destination Marker and Map Center for POI
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        // Clear existing destination marker
        if (destinationMarker.current) {
            destinationMarker.current.remove();
            destinationMarker.current = null;
        }

        const target = destination || selectedPoi;
        if (!target) return;

        let coords = target.coords;
        // If it's a POI from click, it might not have coords directly
        if (!coords && target.name) {
            const feature = campusData.features.find(f => f.properties.name === target.name);
            if (feature) {
                if (feature.geometry.type === 'Point') {
                    coords = feature.geometry.coordinates;
                } else if (feature.geometry.type === 'LineString') {
                    const points = feature.geometry.coordinates;
                    const sumLng = points.reduce((acc, c) => acc + c[0], 0);
                    const sumLat = points.reduce((acc, c) => acc + c[1], 0);
                    coords = [sumLng / points.length, sumLat / points.length];
                } else {
                    const flatCoords = feature.geometry.coordinates[0];
                    const sumLng = flatCoords.reduce((acc, c) => acc + c[0], 0);
                    const sumLat = flatCoords.reduce((acc, c) => acc + c[1], 0);
                    coords = [sumLng / flatCoords.length, sumLat / flatCoords.length];
                }
            }
        }

        if (coords) {
            const el = document.createElement('div');
            el.className = 'destination-marker';
            el.innerHTML = `<div class="dest-marker-pulse"></div><div class="dest-marker-icon">📍</div>`;

            destinationMarker.current = new maplibregl.Marker({ element: el })
                .setLngLat(coords)
                .addTo(map.current);

            // Fly to the destination if it was just selected
            map.current.flyTo({
                center: coords,
                zoom: 17,
                pitch: 45,
                essential: true
            });
        }
    }, [destination, selectedPoi, mapLoaded]);

    // Draw Route with Animation
    useEffect(() => {
        if (!map.current || !mapLoaded || !destination || (!userLocation && !startPoint)) {
            if (map.current && map.current.getLayer('route-line')) {
                map.current.setLayoutProperty('route-line', 'visibility', 'none');
                map.current.setLayoutProperty('route-line-pulse', 'visibility', 'none');
            }
            return;
        }

        // Calculate starting coordinates
        let startCoords;
        if (startPoint && startPoint.coords) {
            startCoords = startPoint.coords;
        } else if (userLocation) {
            startCoords = [userLocation.lng, userLocation.lat];
        }

        if (!startCoords) return;

        // Calculate destination coordinates if not provided (same logic as marker)
        let destCoords = destination.coords;
        if (!destCoords && destination.name) {
            const feature = campusData.features.find(f => f.properties.name === destination.name);
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

        if (!destCoords) return;

        const routeCoords = [
            startCoords,
            destCoords
        ];

        const routeData = {
            'type': 'Feature',
            'properties': {},
            'geometry': {
                'type': 'LineString',
                'coordinates': routeCoords
            }
        };

        const routeSource = map.current.getSource('route');
        if (routeSource) {
            routeSource.setData(routeData);
            map.current.setLayoutProperty('route-line', 'visibility', 'visible');
            map.current.setLayoutProperty('route-line-pulse', 'visibility', 'visible');
        } else {
            map.current.addSource('route', {
                'type': 'geojson',
                'data': routeData
            });

            // Bottom layer - thick line
            map.current.addLayer({
                'id': 'route-line',
                'type': 'line',
                'source': 'route',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#10b981',
                    'line-width': 8,
                    'line-opacity': 0.4
                }
            });

            // Top layer - pulsing dashed line
            map.current.addLayer({
                'id': 'route-line-pulse',
                'type': 'line',
                'source': 'route',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#10b981',
                    'line-width': 4,
                    'line-dasharray': [1, 2]
                }
            });

            // Animate dash offset for a "moving" effect
            let step = 0;
            const animate = () => {
                if (!map.current || !map.current.getLayer('route-line-pulse')) return;

                step = (step + 0.1) % 4;
                // We simulate movement by slightly changing the dash array
                // MapLibre doesn't support dashoffset animation easily, so we toggle between arrays
                const dashArray = step > 2 ? [1, 2] : [0.5, 2.5];

                if (map.current.getLayer('route-line-pulse')) {
                    map.current.setPaintProperty('route-line-pulse', 'line-dasharray', dashArray);
                }

                requestAnimationFrame(animate);
            };
            // animate(); // Keeping it disabled for now as it might be too much, but ready to enable
        }

        const bounds = new maplibregl.LngLatBounds();
        routeCoords.forEach(coord => bounds.extend(coord));
        map.current.fitBounds(bounds, { padding: 120, duration: 2000 });

    }, [destination, userLocation, startPoint, mapLoaded]);

    return (
        <div className="map-wrapper" style={{ width: '100%', height: '100vh' }}>
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
            {mapInstance && userLocation && (
                <UserMarker map={mapInstance} location={userLocation} heading={heading} />
            )}
        </div>
    );
};

export default MapComponent;
