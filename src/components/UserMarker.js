import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

const UserMarker = ({ map, location, heading }) => {
    const markerRef = useRef(null);
    const prevLoc = useRef(null);
    const movingTimeout = useRef(null);

    useEffect(() => {
        if (!map || !location) return;

        const { lng, lat } = location;

        // Create marker if it doesn't exist
        if (!markerRef.current) {
            const el = document.createElement('div');
            el.className = 'human-marker is-moving'; // start moving initially

            const innerHtml = `
              <div class="human-walking-container">
                <svg viewBox="0 0 100 100" class="human-avatar">
                  <rect class="left-foot" x="32" y="34" width="12" height="26" rx="6" fill="#188038" />
                  <rect class="right-foot" x="56" y="34" width="12" height="26" rx="6" fill="#188038" />
                  <ellipse class="torso" cx="50" cy="50" rx="26" ry="14" fill="#1a73e8" />
                  <circle class="head" cx="50" cy="50" r="14" fill="#fbcbba" stroke="#202124" stroke-width="2" />
                  <polygon class="direction-indicator" points="50,14 42,32 58,32" fill="#ea4335" />
                </svg>
              </div>
              <div class="accuracy-circle"></div>
            `;
            el.innerHTML = innerHtml;

            markerRef.current = new maplibregl.Marker({ element: el })
                .setLngLat([lng, lat])
                .addTo(map);
        } else {
            // Update position
            markerRef.current.setLngLat([lng, lat]);
        }

        const markerEl = markerRef.current.getElement();

        // Movement detection for walking animation
        if (prevLoc.current && (prevLoc.current.lat !== lat || prevLoc.current.lng !== lng)) {
            markerEl.classList.add('is-moving');
            clearTimeout(movingTimeout.current);
            movingTimeout.current = setTimeout(() => {
                if (markerEl) markerEl.classList.remove('is-moving');
            }, 800); // stop walking animation after 800ms of no movement
        }
        prevLoc.current = location;

        // Update rotation based on heading
        const containerEl = markerEl.querySelector('.human-walking-container');
        if (containerEl) {
            containerEl.style.transform = `rotate(${heading}deg)`;
        }

        // Handle Accuracy Circle dynamically
        let accuracyEl = markerEl.querySelector('.accuracy-circle');
        if (location.accuracy && accuracyEl) {
            const metersPerPixel = (Math.cos(lat * Math.PI / 180) * 40075017) / (256 * Math.pow(2, map.getZoom()));
            const radiusPx = (location.accuracy / metersPerPixel) * 2;
            accuracyEl.style.width = `${radiusPx}px`;
            accuracyEl.style.height = `${radiusPx}px`;
            accuracyEl.style.display = 'block';
        } else if (accuracyEl) {
            accuracyEl.style.display = 'none';
        }
    }, [map, location, heading]);

    // Handle Cleanup Only on Unmount
    useEffect(() => {
        return () => {
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
            if (movingTimeout.current) clearTimeout(movingTimeout.current);
        };
    }, []);

    return null;
};

export default UserMarker;
