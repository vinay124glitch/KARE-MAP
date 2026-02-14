import React from 'react';
import { Navigation, X } from 'lucide-react';
import SearchBar from './SearchBar';
import RouteOverlay from './RouteOverlay';

const NavigationPanel = ({ onSelectDestination, selectedPoi, onClearPoi, userLocation }) => {
    return (
        <>
            <SearchBar onSelectDestination={onSelectDestination} />

            {selectedPoi && (
                <div className="navigation-panel glass-morphism">
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

                        <RouteOverlay userLocation={userLocation} selectedPoi={selectedPoi} />

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
        </>
    );
};

export default NavigationPanel;
