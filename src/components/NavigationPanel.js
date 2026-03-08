import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, X, MapPin, Clock, Footprints } from 'lucide-react';
import SearchBar from './SearchBar';
import RouteOverlay from './RouteOverlay';

const NavigationPanel = ({ onSelectDestination, onSelectStartPoint, startPoint, selectedPoi, onClearPoi, userLocation, onStartNavigation }) => {
    const [isSelectingStart, setIsSelectingStart] = React.useState(false);
    const [activeSearch, setActiveSearch] = React.useState('');
    const [showRouteInputs, setShowRouteInputs] = React.useState(false);

    return (
        <div className="navigation-container">
            <motion.div
                className="search-group"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
            >
                {!showRouteInputs ? (
                    <div className="search-box-wrapper main-search-bar">
                        <SearchBar
                            onSelectDestination={(loc) => {
                                onSelectDestination(loc);
                            }}
                            placeholder="Search KARE Campus..."
                            externalSearch={activeSearch}
                        />
                        <button
                            className="directions-btn-toggle"
                            onClick={() => setShowRouteInputs(true)}
                            title="Open Directions"
                        >
                            <Navigation size={22} />
                        </button>
                    </div>
                ) : (
                    <motion.div
                        layoutId="nav-box"
                        className="route-inputs-container glass-morphism"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.1rem', color: 'white' }}>Plan Your Route</h3>
                            <button
                                onClick={() => setShowRouteInputs(false)}
                                className="close-directions-btn"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="search-box-wrapper" style={{ marginBottom: '12px' }}>
                            <div className="search-dot-start" />
                            <SearchBar
                                onSelectDestination={onSelectStartPoint}
                                placeholder={startPoint?.name || "Your Current Location"}
                                active={isSelectingStart}
                                onFocus={() => setIsSelectingStart(true)}
                                showMyLocation={true}
                            />
                        </div>
                        <div className="search-box-wrapper">
                            <div className="search-dot-end" />
                            <SearchBar
                                onSelectDestination={onSelectDestination}
                                placeholder={selectedPoi?.name || "Search destination..."}
                                onFocus={() => setIsSelectingStart(false)}
                                externalSearch={activeSearch}
                            />
                        </div>
                    </motion.div>
                )}

                <div className="category-chips-container">
                    {['Hostel', 'Academic', 'Food', 'Lab', 'Library'].map((cat, i) => (
                        <motion.div
                            key={cat}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`category-chip ${activeSearch === cat ? 'active' : ''}`}
                            onClick={() => setActiveSearch(prev => prev === cat ? '' : cat)}
                        >
                            {cat}s
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            <AnimatePresence>
                {selectedPoi && (
                    <motion.div
                        className="poi-panel-wrapper"
                        initial={{ y: 300, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 300, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className="poi-card-premium glass-morphism">
                            <div className="poi-header">
                                <div className="poi-main-info">
                                    <h2>{selectedPoi.name}</h2>
                                    <p>{selectedPoi.description || 'University Campus Location'}</p>
                                </div>
                                <button className="poi-close-btn" onClick={onClearPoi}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="poi-quick-stats">
                                <div className="stat-item">
                                    <MapPin size={16} className="text-primary" />
                                    <span>Main Campus</span>
                                </div>
                                <div className="stat-item">
                                    <Clock size={16} className="text-success" />
                                    <span>Open Now</span>
                                </div>
                            </div>

                            <div className="poi-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <RouteOverlay userLocation={startPoint || userLocation} selectedPoi={selectedPoi} />
                                <button
                                    onClick={onStartNavigation}
                                    style={{
                                        width: '100%',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px 16px',
                                        borderRadius: '24px',
                                        fontSize: '15px',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 6px rgba(26,115,232,0.3)'
                                    }}
                                >
                                    <Footprints size={18} /> Start Navigation
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NavigationPanel;
