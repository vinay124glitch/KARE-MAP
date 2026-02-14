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
