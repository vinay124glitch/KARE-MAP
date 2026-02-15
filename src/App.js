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
    const [startPoint, setStartPoint] = useState(null);
    const [destination, setDestination] = useState(null);
    const [selectedPoi, setSelectedPoi] = useState(null);

    const { navInfo } = useNavigation(startPoint || location, destination);

    const handleSelectDestination = (locationData) => {
        setSelectedPoi(locationData);
        setDestination(locationData);
        setIsFollowing(false); // Disable follow when manually selecting destination
    };

    const handleSelectStartPoint = (locationData) => {
        setStartPoint(locationData);
        if (locationData === null) {
            setIsFollowing(true);
        } else {
            setIsFollowing(false);
        }
    };

    const handlePoiClick = (poi) => {
        handleSelectDestination(poi);
    };

    const clearPoi = () => {
        setSelectedPoi(null);
        setDestination(null);
        setStartPoint(null);
    };

    const THEMES = ['satellite', 'streets', 'dark', 'light', 'bright'];

    const toggleTheme = () => {
        setMapTheme(prev => {
            const currentIndex = THEMES.indexOf(prev);
            const nextIndex = (currentIndex + 1) % THEMES.length;
            return THEMES[nextIndex];
        });
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
                    title={`Switch Map View (Current: ${mapTheme})`}
                >
                    <div className="theme-toggle-icon">
                        {mapTheme === 'satellite' ? '🛰️' :
                            mapTheme === 'dark' ? '🌑' :
                                mapTheme === 'light' ? '☀️' :
                                    mapTheme === 'streets' ? '🗺️' : '🎨'}
                    </div>
                    <span style={{ textTransform: 'capitalize' }}>{mapTheme}</span>
                </button>

                {/* Follow Mode Toggle / Locate Me */}
                <button
                    className={`theme-toggle glass-morphism ${isFollowing ? 'active' : ''}`}
                    onClick={() => {
                        setIsFollowing(true);
                        setStartPoint(null); // Return to real-time location
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
                startPoint={startPoint}
                heading={heading}
                destination={destination}
                routePath={navInfo?.path}
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
                        <h4 className="directions-title">
                            {startPoint ? `From ${startPoint.name} to ${destination.name}` : `Navigating to ${destination.name}`}
                        </h4>
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
                onSelectDestination={handleSelectDestination}
                onSelectStartPoint={handleSelectStartPoint}
                startPoint={startPoint}
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
