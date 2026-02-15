import React, { useState } from 'react';
import { Search, MapPin, Coffee, Book, Home, FlaskConical } from 'lucide-react';
import campusData from '../data/campusData';

const SearchBar = ({ onSelectDestination, placeholder = "Search campus buildings...", onFocus, showMyLocation = false, externalSearch = '' }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isFocused, setIsFocused] = useState(false);

    React.useEffect(() => {
        if (externalSearch) {
            handleSearch(externalSearch);
        }
    }, [externalSearch]);

    const handleSearch = (e) => {
        const query = typeof e === 'string' ? e : e.target.value;
        setSearchQuery(query);

        if (query.length > 0) {
            const results = campusData.features.filter(f =>
                (f.properties.name && f.properties.name.toLowerCase().includes(query.toLowerCase())) ||
                (f.properties.type && f.properties.type.toLowerCase().includes(query.toLowerCase()))
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

    const getIcon = (feature) => {
        if (!feature || !feature.properties) return <MapPin size={16} color="var(--primary)" />;

        const cat = (feature.properties.category || '').toLowerCase();
        const type = (feature.properties.type || '').toLowerCase();
        const name = (feature.properties.name || '').toLowerCase();

        if (cat === 'food' || name.includes('mess') || name.includes('canteen')) return <Coffee size={16} color="#f59e0b" />;
        if (cat === 'hostel' || name.includes('hostel')) return <Home size={16} color="#ec4899" />;
        if (cat === 'academic' || name.includes('block') || name.includes('auditorium')) return <Book size={16} color="#3b82f6" />;
        if (cat === 'lab' || name.includes('lab')) return <FlaskConical size={16} color="#10b981" />;
        if (cat === 'library' || name.includes('library')) return <Book size={16} color="#a855f7" />;

        return <MapPin size={16} color="var(--primary)" />;
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
                <div className="glass-morphism search-results-dropdown">
                    {showMyLocation && isFocused && (
                        <div
                            onClick={() => selectResult('MY_LOCATION')}
                            style={{
                                padding: window.innerWidth < 480 ? '14px 16px' : '12px 16px',
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
                                width: '24px',
                                height: '24px',
                                background: 'rgba(99, 102, 241, 0.2)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--primary-glow)' }} />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: window.innerWidth < 480 ? '15px' : '14px' }}>Use My Live Location</span>
                        </div>
                    )}
                    {searchResults.map((result, idx) => (
                        <div
                            key={idx}
                            onClick={() => selectResult(result)}
                            style={{
                                padding: window.innerWidth < 480 ? '14px 16px' : '12px 16px',
                                cursor: 'pointer',
                                borderBottom: idx === searchResults.length - 1 ? 'none' : '1px solid var(--glass-border)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}
                            className="hover-effect"
                        >
                            <div className="result-icon-wrapper" style={{ opacity: 0.9, flexShrink: 0 }}>
                                {getIcon(result)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                <span style={{
                                    fontWeight: 500,
                                    fontSize: window.innerWidth < 480 ? '15px' : '14px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>{result.properties.name}</span>
                                {result.properties.category && (
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{result.properties.category}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
