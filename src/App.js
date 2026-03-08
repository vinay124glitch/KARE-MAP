import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MapComponent from './components/MapComponent';
import NavigationPanel from './components/NavigationPanel';
import { useGeolocation } from './hooks/useGeolocation';
import { useNavigation } from './hooks/useNavigation';
import { Play, Pause, Navigation as NavIcon, ArrowUp, CornerUpLeft, CornerUpRight, CheckCircle, Layers, Target, Flame, Settings } from 'lucide-react';
import './App.css';

function App() {
    const [isFollowing, setIsFollowing] = useState(true);
    const [mapTheme, setMapTheme] = useState('satellite');
    const [isSimulating, setIsSimulating] = useState(false);
    const { location, heading, error } = useGeolocation(isSimulating);
    const [startPoint, setStartPoint] = useState(null);
    const [destination, setDestination] = useState(null);
    const [selectedPoi, setSelectedPoi] = useState(null);
    const [debugMode, setDebugMode] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(false);

    const { navInfo } = useNavigation(startPoint || location, destination);

    const handleSelectDestination = (locationData) => {
        setSelectedPoi(locationData);
        setDestination(locationData);
        setIsFollowing(true);
    };

    const handleSelectStartPoint = (locationData) => {
        setStartPoint(locationData);
        setIsFollowing(locationData === null);
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
        <div className={`app-container ${destination ? 'has-hud' : ''}`}>
            <AnimatePresence>
                {error && !isSimulating && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="error-toast glass-morphism"
                    >
                        <div className="status-dot warning" />
                        {error}. Using default campus view.
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sidebar Controls */}
            <motion.div
                className="control-sidebar glass-morphism"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 20 }}
            >
                <button
                    className={`control-btn ${isSimulating ? 'active' : ''}`}
                    onClick={() => setIsSimulating(!isSimulating)}
                    title={isSimulating ? "Stop Simulation" : "Start Simulation"}
                >
                    {isSimulating ? <Pause size={22} className="text-secondary" /> : <Play size={22} />}
                </button>

                <div className="control-divider" />

                <button
                    className="control-btn"
                    onClick={toggleTheme}
                    title={`Map View: ${mapTheme}`}
                >
                    <Layers size={22} />
                </button>

                <button
                    className={`control-btn ${isFollowing ? 'active' : ''}`}
                    onClick={() => {
                        setIsFollowing(true);
                        setStartPoint(null);
                        if (location) {
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
                    title="Center on me"
                >
                    <Target size={22} className={isFollowing ? 'text-primary' : ''} />
                </button>

                <button
                    className={`control-btn ${showHeatmap ? 'active' : ''}`}
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    title="Activity Pulse"
                >
                    <Flame size={22} className={showHeatmap ? 'text-orange-500' : ''} />
                </button>

                <div className="control-divider" />

                <button
                    className={`control-btn ${debugMode ? 'active' : ''}`}
                    onClick={() => setDebugMode(!debugMode)}
                    title="Developer Mode"
                >
                    <Settings size={22} />
                </button>
            </motion.div>

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
                debugMode={debugMode}
                navInfo={navInfo}
                showHeatmap={showHeatmap}
            />

            {/* Directions HUD */}
            <AnimatePresence>
                {destination && (
                    <motion.div
                        key="directions-hud"
                        initial={{ opacity: 0, y: -50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.95 }}
                        className="directions-hud glass-morphism"
                    >
                        <div className="directions-icon-wrapper">
                            {navInfo?.instructionType === 'left' ? <CornerUpLeft size={28} /> :
                                navInfo?.instructionType === 'right' ? <CornerUpRight size={28} /> :
                                    navInfo?.instructionType === 'arrival' ? <CheckCircle size={28} className="text-success" /> :
                                        <ArrowUp size={28} />}
                        </div>
                        <div className="directions-content">
                            <span className="directions-next-step">
                                {navInfo?.nextInstruction || 'Calculating...'}
                            </span>
                            <div className="directions-destination">
                                <strong>{destination.name}</strong>
                                {navInfo && (
                                    <span className="directions-meta">
                                        {navInfo.distance} • {navInfo.time}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button className="close-directions-btn" onClick={clearPoi}>
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <NavigationPanel
                onSelectDestination={handleSelectDestination}
                onSelectStartPoint={handleSelectStartPoint}
                startPoint={startPoint}
                selectedPoi={selectedPoi}
                onClearPoi={clearPoi}
                userLocation={location}
            />

            <AnimatePresence>
                {!location && !error && !isSimulating && (
                    <motion.div
                        className="loading-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="loading-card glass-morphism"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            <div className="loading-logo">
                                <div className="logo-ring" />
                                <div className="logo-pulse" />
                            </div>
                            <h3>KARE MAP</h3>
                            <p>Initializing campus navigation...</p>

                            <div className="loading-actions">
                                <button className="btn-primary" onClick={() => setIsSimulating(true)}>
                                    Start Simulation
                                </button>
                                <button className="btn-secondary" onClick={() => setIsSimulating(true)}>
                                    Virtual Mode
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;
// Triggering rebuild to fix white screen issue.
