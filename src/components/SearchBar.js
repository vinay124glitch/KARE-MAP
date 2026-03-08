import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Coffee, Book, Home, FlaskConical, Navigation } from 'lucide-react';
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
                (f.properties.type && f.properties.type.toLowerCase().includes(query.toLowerCase())) ||
                (f.properties.category && f.properties.category.toLowerCase().includes(query.toLowerCase()))
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
        if (!feature || !feature.properties) return <MapPin size={18} color="var(--primary)" />;

        const cat = (feature.properties.category || '').toLowerCase();
        const type = (feature.properties.type || '').toLowerCase();
        const name = (feature.properties.name || '').toLowerCase();

        if (cat === 'food' || name.includes('mess') || name.includes('canteen')) return <Coffee size={18} className="text-secondary" />;
        if (cat === 'hostel' || name.includes('hostel')) return <Home size={18} style={{ color: '#ec4899' }} />;
        if (cat === 'academic' || name.includes('block') || name.includes('auditorium')) return <Book size={18} className="text-primary" />;
        if (cat === 'lab' || name.includes('lab')) return <FlaskConical size={18} className="text-success" />;
        if (cat === 'library' || name.includes('library')) return <Book size={18} style={{ color: '#a855f7' }} />;

        return <MapPin size={18} className="text-dim" />;
    };

    return (
        <div className="search-container">
            <div className="glass-morphism search-input-wrapper">
                <Search size={18} className="search-icon" />
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
                />
            </div>

            <AnimatePresence>
                {((searchResults.length > 0) || (showMyLocation && isFocused)) && (
                    <motion.div
                        className="glass-morphism search-results-dropdown"
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    >
                        {showMyLocation && isFocused && (
                            <div
                                onClick={() => selectResult('MY_LOCATION')}
                                className="search-result-item my-location-item"
                            >
                                <div className="my-location-indicator">
                                    <Navigation size={14} className="text-primary" />
                                </div>
                                <div className="result-text">
                                    <span className="result-name">My Current Location</span>
                                    <span className="result-type">Device GPS</span>
                                </div>
                            </div>
                        )}
                        {searchResults.map((result, idx) => (
                            <div
                                key={idx}
                                onClick={() => selectResult(result)}
                                className="search-result-item"
                            >
                                <div className="result-icon-wrapper">
                                    {getIcon(result)}
                                </div>
                                <div className="result-text">
                                    <span className="result-name">{result.properties.name}</span>
                                    {result.properties.category && (
                                        <span className="result-type">{result.properties.category}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchBar;
