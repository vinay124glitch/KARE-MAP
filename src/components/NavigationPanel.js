import React from 'react';
import { Navigation, X } from 'lucide-react';
import SearchBar from './SearchBar';
import RouteOverlay from './RouteOverlay';

const NavigationPanel = ({ onSelectDestination, onSelectStartPoint, startPoint, selectedPoi, onClearPoi, userLocation }) => {
    const [isSelectingStart, setIsSelectingStart] = React.useState(false);
    const [activeSearch, setActiveSearch] = React.useState('');
    const [showRouteInputs, setShowRouteInputs] = React.useState(false);

    return (
        <div className="navigation-container">
            <div className="search-group">
                {!showRouteInputs ? (
                    <div className="search-box-wrapper main-search-bar">
                        <SearchBar
                            onSelectDestination={(loc) => {
                                onSelectDestination(loc);
                                // If they select a place, we could automatically show the "From" input
                                // or just show the POI card.
                            }}
                            placeholder="Search KARE Campus..."
                            externalSearch={activeSearch}
                        />
                        <button
                            className="directions-btn-toggle"
                            onClick={() => setShowRouteInputs(true)}
                            title="Open Directions"
                        >
                            <Navigation size={20} />
                        </button>
                    </div>
                ) : (
                    <div className="route-inputs-container animate-in-top">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Plan Route</span>
                            <button
                                onClick={() => setShowRouteInputs(false)}
                                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="search-box-wrapper">
                            <span className="search-label">From:</span>
                            <SearchBar
                                onSelectDestination={onSelectStartPoint}
                                placeholder={startPoint?.name || "Your Current Location"}
                                active={isSelectingStart}
                                onFocus={() => setIsSelectingStart(true)}
                                showMyLocation={true}
                            />
                        </div>
                        <div className="search-box-wrapper">
                            <span className="search-label">To:</span>
                            <SearchBar
                                onSelectDestination={onSelectDestination}
                                placeholder={selectedPoi?.name || "Search destination..."}
                                onFocus={() => setIsSelectingStart(false)}
                                externalSearch={activeSearch}
                            />
                        </div>
                    </div>
                )}

                <div className="category-chips-container">
                    {['Hostel', 'Academic', 'Food', 'Lab', 'Library'].map(cat => (
                        <div
                            key={cat}
                            className={`category-chip ${activeSearch === cat ? 'active' : ''}`}
                            onClick={() => setActiveSearch(prev => prev === cat ? '' : cat)}
                        >
                            {cat}s
                        </div>
                    ))}
                </div>
            </div>

            {selectedPoi && (
                <div className="navigation-panel glass-morphism animate-in-bottom">
                    <div className="poi-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>{selectedPoi.name}</h2>
                                <p className="text-muted" style={{ fontSize: '14px' }}>{selectedPoi.description || 'University Campus Location'}</p>
                            </div>
                            <button onClick={onClearPoi} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <RouteOverlay userLocation={startPoint || userLocation} selectedPoi={selectedPoi} />

                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <button
                                className="btn-primary"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={() => {
                                    onSelectDestination(selectedPoi);
                                }}
                            >
                                <Navigation size={18} />
                                Start Navigation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NavigationPanel;
