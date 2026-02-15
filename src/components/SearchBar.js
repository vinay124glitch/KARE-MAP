import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import campusData from '../data/campusData';

const SearchBar = ({ onSelectDestination, placeholder = "Search campus buildings...", onFocus, showMyLocation = false }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isFocused, setIsFocused] = useState(false);

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length > 1) {
            const results = campusData.features.filter(f =>
                f.properties.name && f.properties.name.toLowerCase().includes(query.toLowerCase())
            );
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };

    const selectResult = (feature) => {
        if (feature === 'MY_LOCATION') {
            onSelectDestination(null);
            setSearchQuery('');
            setSearchResults([]);
            return;
        }

        let coords;
        if (feature.geometry.type === 'Point') {
            coords = feature.geometry.coordinates;
        } else if (feature.geometry.type === 'LineString') {
            const points = feature.geometry.coordinates;
            const sumLng = points.reduce((acc, c) => acc + c[0], 0);
            const sumLat = points.reduce((acc, c) => acc + c[1], 0);
            coords = [sumLng / points.length, sumLat / points.length];
        } else {
            const flatCoords = feature.geometry.coordinates[0];
            const sumLng = flatCoords.reduce((acc, c) => acc + c[0], 0);
            const sumLat = flatCoords.reduce((acc, c) => acc + c[1], 0);
            coords = [sumLng / flatCoords.length, sumLat / flatCoords.length];
        }

        onSelectDestination({
            name: feature.properties.name,
            coords: coords,
            description: feature.properties.description
        });
        setSearchQuery('');
        setSearchResults([]);
    };

    return (
        <div className="search-container">
            <div className="glass-morphism" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Search size={20} className="text-muted" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={handleSearch}
                    onFocus={(e) => {
                        setIsFocused(true);
                        if (onFocus) onFocus(e);
                    }}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        flex: 1,
                        outline: 'none',
                        fontSize: '16px',
                        padding: '8px 0'
                    }}
                />
            </div>

            {((searchResults.length > 0) || (showMyLocation && isFocused)) && (
                <div className="glass-morphism search-results-dropdown" style={{
                    marginTop: '8px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    position: 'absolute',
                    width: '100%',
                    zIndex: 1000
                }}>
                    {showMyLocation && isFocused && (
                        <div
                            onClick={() => selectResult('MY_LOCATION')}
                            style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: searchResults.length > 0 ? '1px solid var(--glass-border)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                color: 'var(--primary)'
                            }}
                            className="hover-effect"
                        >
                            <div style={{
                                width: '20px',
                                height: '20px',
                                background: 'var(--primary)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }} />
                            </div>
                            <span style={{ fontWeight: 600 }}>Use Live Location</span>
                        </div>
                    )}
                    {searchResults.map((result, idx) => (
                        <div
                            key={idx}
                            onClick={() => selectResult(result)}
                            style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: idx === searchResults.length - 1 ? 'none' : '1px solid var(--glass-border)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}
                            className="hover-effect"
                        >
                            <MapPin size={16} color="var(--primary)" />
                            <span>{result.properties.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
