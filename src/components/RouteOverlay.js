import React from 'react';
import { Clock, Ruler } from 'lucide-react';
import { useNavigation } from '../hooks/useNavigation';

const RouteOverlay = ({ userLocation, selectedPoi }) => {
    const { navInfo } = useNavigation(userLocation, selectedPoi);

    if (!navInfo) return null;

    return (
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', padding: '8px 0', borderTop: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="var(--primary)" />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{navInfo.time}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Ruler size={16} color="var(--secondary)" />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{navInfo.distance} walking</span>
            </div>
        </div>
    );
};

export default RouteOverlay;
