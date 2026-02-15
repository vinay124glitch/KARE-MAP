import { useState, useEffect } from 'react';

export const useGeolocation = (simulate = false) => {
  const [location, setLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (simulate) {
      // Simulation mode: Move in a circle around the campus center
      let angle = 0;
      const center = { lat: 9.5743, lng: 77.6761 };
      const radius = 0.001; // Roughly 100m

      const interval = setInterval(() => {
        const lat = center.lat + Math.sin(angle) * radius;
        const lng = center.lng + Math.cos(angle) * radius;
        // Heading is tangent to the circle
        const h = (angle * 180 / Math.PI + 90) % 360;

        setLocation({ lat, lng, accuracy: 5 });
        setHeading(h);
        angle += 0.05;
      }, 1000);

      return () => clearInterval(interval);
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    // Request higher frequency updates for live tracking
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;

        setLocation(prev => {
          // Calculate heading if not provided by device
          if (position.coords.heading === null || position.coords.heading === undefined) {
            if (prev && (prev.lat !== newLat || prev.lng !== newLng)) {
              const y = Math.sin((newLng - prev.lng) * Math.PI / 180) * Math.cos(newLat * Math.PI / 180);
              const x = Math.cos(prev.lat * Math.PI / 180) * Math.sin(newLat * Math.PI / 180) -
                Math.sin(prev.lat * Math.PI / 180) * Math.cos(newLat * Math.PI / 180) * Math.cos((newLng - prev.lng) * Math.PI / 180);
              const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
              setHeading(bearing);
            }
          } else {
            setHeading(position.coords.heading);
          }

          return {
            lat: newLat,
            lng: newLng,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
          };
        });

        setError(null);
      },
      (err) => {
        let errorMsg = 'Unknown error occurred.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg = 'Please enable Location permissions in your browser settings.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg = 'GPS signal not found. Are you outdoors?';
            break;
          case err.TIMEOUT:
            errorMsg = 'Location request timed out. Checking again...';
            break;
        }
        setError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Orientation handling for mobile devices
    const handleOrientation = (event) => {
      if (event.webkitCompassHeading) {
        // iOS
        setHeading(event.webkitCompassHeading);
      } else if (event.alpha !== null) {
        // Android / Standard
        setHeading(360 - event.alpha);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [simulate]);

  return { location, heading, error };
};

