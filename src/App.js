import React, { useState } from 'react';
import MapComponent from './components/MapComponent';
import NavigationPanel from './components/NavigationPanel';
import { useGeolocation } from './hooks/useGeolocation';
import { useNavigation } from './hooks/useNavigation';
import { Play, Pause, Navigation as NavIcon } from 'lucide-react';
import './App.css';

function App() {
    const [isFollowing, setIsFollowing] = useState(true);
    const [mapTheme, setMapTheme] = useState('satellite');
    const [isSimulating, setIsSimulating] = useState(false);
    const { location, heading, error } = useGeolocation(isSimulating);
    const [destination, setDestination] = useState(null);
    const [selectedPoi, setSelectedPoi] = useState(null);
    const [otherUsers, setOtherUsers] = useState([]);

    const { navInfo } = useNavigation(location, destination);

    // Simulate other users on campus
    React.useEffect(() => {
        const initialUsers = [
            { id: 1, name: 'Suresh', lat: 9.5746, lng: 77.6758, speed: 0.00005 },
            { id: 2, name: 'Priya', lat: 9.5752, lng: 77.6752, speed: 0.00003 },
            { id: 3, name: 'Rahul', lat: 9.5738, lng: 77.6745, speed: 0.00004 },
            { id: 4, name: 'Anita', lat: 9.5725, lng: 77.6735, speed: 0.00006 }
        ];
        setOtherUsers(initialUsers);

        const interval = setInterval(() => {
            setOtherUsers(prev => prev.map(user => ({
                ...user,
                lat: user.lat + (Math.random() - 0.5) * user.speed,
                lng: user.lng + (Math.random() - 0.5) * user.speed
            })));
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const handleSelectLocation = (locationData) => {
        setSelectedPoi(locationData);
        setDestination(locationData);
        setIsFollowing(true); // Automatically follow when navigating
    };

    const handlePoiClick = (poi) => {
        handleSelectLocation(poi);
    };

    const clearPoi = () => {
        setSelectedPoi(null);
        setDestination(null);
    };

    const toggleTheme = () => {
        setMapTheme(prev => prev === 'dark' ? 'satellite' : 'dark');
    };

    return (
        <div className="app-container">
            {error && !isSimulating && (
                <div className="error-toast glass-morphism">
                    {error}. Using default campus view.
                </div>
            )}

            {/* Control Buttons Group */}
            <div className="map-controls-group">
                {/* Simulation Toggle */}
                <button
                    className={`sim-toggle glass-morphism ${isSimulating ? 'active' : ''}`}
                    onClick={() => setIsSimulating(!isSimulating)}
                    title={isSimulating ? "Stop Simulation" : "Start Simulation"}
                >
                    {isSimulating ? <Pause size={20} /> : <Play size={20} />}
                    <span>{isSimulating ? "Stop Sim" : "Start Sim"}</span>
                </button>

                {/* Theme Toggle */}
                <button
                    className="theme-toggle glass-morphism"
                    onClick={toggleTheme}
                    title={`Switch to ${mapTheme === 'dark' ? 'Satellite' : 'Dark'} View`}
                >
                    <div className="theme-toggle-icon">
                        {mapTheme === 'dark' ? '🛰️' : '🌑'}
                    </div>
                    <span>{mapTheme === 'dark' ? 'Satellite' : 'Dark'}</span>
                </button>

                {/* Follow Mode Toggle / Locate Me */}
                <button
                    className={`theme-toggle glass-morphism ${isFollowing ? 'active' : ''}`}
                    onClick={() => {
                        setIsFollowing(true);
                        // Force a re-center even if already following
                        if (location) {
                            // Find the map instance and fly to user
                            const mapInstance = document.querySelector('.maplibregl-map')?.map;
                            if (mapInstance) {
                                mapInstance.flyTo({
                                    center: [location.lng, location.lat],
                                    zoom: 18,
                                    duration: 1500
                                });
                            }
                        }
                    }}
                    title={isFollowing ? "Re-center Map" : "Locate Me"}
                >
                    <div className="theme-toggle-icon">
                        {isFollowing ? '🎯' : '🧭'}
                    </div>
                    <span>{isFollowing ? 'Re-center' : 'Locate Me'}</span>
                </button>
            </div>

            <MapComponent
                userLocation={location}
                heading={heading}
                otherUsers={otherUsers}
                destination={destination}
                onPoiClick={handlePoiClick}
                theme={mapTheme}
                isFollowing={isFollowing}
                setIsFollowing={setIsFollowing}
                selectedPoi={selectedPoi}
            />

            {/* Directions HUD */}
            {destination && (
                <div className="directions-hud glass-morphism animate-in-top">
                    <div className="directions-icon">
                        <NavIcon size={20} color="white" />
                    </div>
                    <div className="directions-content">
                        <h4 className="directions-title">Navigating to {destination.name}</h4>
                        <div className="directions-stats">
                            {navInfo ? (
                                <span>{navInfo.distance} • {navInfo.time} away</span>
                            ) : (
                                <span>Calculating path...</span>
                            )}
                        </div>
                    </div>
                    <button className="close-directions" onClick={clearPoi}>
                        ✕
                    </button>
                </div>
            )}

            <NavigationPanel
                onSelectDestination={handleSelectLocation}
                selectedPoi={selectedPoi}
                onClearPoi={clearPoi}
                userLocation={location}
            />

            {!location && !error && !isSimulating && (
                <div className="loading-overlay">
                    <div className="glass-morphism" style={{ padding: '32px', textAlign: 'center' }}>
                        <div className="animate-pulse-subtle" style={{
                            width: '64px',
                            height: '64px',
                            background: 'var(--primary)',
                            borderRadius: '50%',
                            margin: '0 auto 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{ width: '48px', height: '48px', background: 'white', borderRadius: '50%' }} />
                        </div>
                        <h3>Finding your location...</h3>
                        <p className="text-muted" style={{ marginBottom: '20px' }}>Please enable GPS for real-time navigation.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                                className="btn-primary"
                                onClick={() => setIsSimulating(true)}
                                style={{ width: '100%' }}
                            >
                                Start Simulation Mode
                            </button>
                            <button
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--glass-border)',
                                    color: 'white',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    const defaultLoc = { lat: 9.5743, lng: 77.6761, accuracy: 0 };
                                    setIsSimulating(true);
                                }}
                            >
                                Use Virtual Location
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
