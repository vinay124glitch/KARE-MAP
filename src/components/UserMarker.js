import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

const UserMarker = ({ map, location, heading }) => {
    const markerRef = useRef(null);

    useEffect(() => {
        if (!map || !location) return;

        const { lng, lat } = location;

        // Create marker if it doesn't exist
        if (!markerRef.current) {
            const el = document.createElement('div');
            el.className = 'user-marker';

            // Create heading arrow
            const arrow = document.createElement('div');
            arrow.className = 'user-marker-heading';
            el.appendChild(arrow);

            markerRef.current = new maplibregl.Marker({ element: el })
                .setLngLat([lng, lat])
                .addTo(map);
        } else {
            // Update position
            markerRef.current.setLngLat([lng, lat]);
        }

        // Update rotation
        const arrowEl = markerRef.current.getElement().querySelector('.user-marker-heading');
        if (arrowEl) {
            arrowEl.style.transform = `rotate(${heading}deg)`;
        }

        // Handle Accuracy Circle
        let accuracyEl = markerRef.current.getElement().querySelector('.accuracy-circle');
        if (!accuracyEl) {
            accuracyEl = document.createElement('div');
            accuracyEl.className = 'accuracy-circle';
            markerRef.current.getElement().appendChild(accuracyEl);
        }

        if (location.accuracy) {
            // Meters to pixels conversion at current zoom
            const lat = location.lat;
            const metersPerPixel = (Math.cos(lat * Math.PI / 180) * 40075017) / (256 * Math.pow(2, map.getZoom()));
            const radiusPx = (location.accuracy / metersPerPixel) * 2;
            accuracyEl.style.width = `${radiusPx}px`;
            accuracyEl.style.height = `${radiusPx}px`;
            accuracyEl.style.display = 'block';
        } else {
            accuracyEl.style.display = 'none';
        }

        // Cleanup
        return () => {
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
        };
    }, [map, location, heading]);

    return null;
};

export default UserMarker;
