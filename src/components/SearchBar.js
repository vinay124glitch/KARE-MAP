import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import campusData from '../data/campusData';

const SearchBar = ({ onSelectDestination }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

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
                    placeholder="Search campus buildings..."
                    value={searchQuery}
                    onChange={handleSearch}
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

            {searchResults.length > 0 && (
                <div className="glass-morphism" style={{ marginTop: '8px', maxHeight: '300px', overflowY: 'auto' }}>
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
