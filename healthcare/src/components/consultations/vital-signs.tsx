'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FadeIn, ScaleIn } from '@/components/animations/motion-effects';

interface VitalSignsProps {
    consultationId: string;
    isProvider: boolean;
}

interface VitalSign {
    id: string;
    type: 'heart_rate' | 'blood_pressure' | 'temperature' | 'oxygen_saturation' | 'respiratory_rate' | 'weight' | 'height';
    value: string;
    unit: string;
    timestamp: Date;
    status: 'normal' | 'elevated' | 'low' | 'critical';
    notes?: string;
}

export const VitalSigns = ({ consultationId, isProvider }: VitalSignsProps) => {
    const [vitals, setVitals] = useState<VitalSign[]>([]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [selectedVital, setSelectedVital] = useState<VitalSign['type']>('heart_rate');
    const [manualValue, setManualValue] = useState('');

    // Initialize with sample data
    useEffect(() => {
        const sampleVitals: VitalSign[] = [
            {
                id: '1',
                type: 'heart_rate',
                value: '78',
                unit: 'bpm',
                timestamp: new Date(Date.now() - 300000),
                status: 'normal'
            },
            {
                id: '2',
                type: 'blood_pressure',
                value: '120/80',
                unit: 'mmHg',
                timestamp: new Date(Date.now() - 240000),
                status: 'normal'
            },
            {
                id: '3',
                type: 'temperature',
                value: '98.6',
                unit: '°F',
                timestamp: new Date(Date.now() - 180000),
                status: 'normal'
            },
            {
                id: '4',
                type: 'oxygen_saturation',
                value: '98',
                unit: '%',
                timestamp: new Date(Date.now() - 120000),
                status: 'normal'
            }
        ];
        setVitals(sampleVitals);
    }, []);

    const vitalTypes = {
        heart_rate: { name: 'Heart Rate', icon: '💓', normalRange: '60-100 bpm' },
        blood_pressure: { name: 'Blood Pressure', icon: '🩺', normalRange: '90/60-120/80 mmHg' },
        temperature: { name: 'Temperature', icon: '🌡️', normalRange: '97-99°F' },
        oxygen_saturation: { name: 'Oxygen Saturation', icon: '🫁', normalRange: '95-100%' },
        respiratory_rate: { name: 'Respiratory Rate', icon: '🌬️', normalRange: '12-20 breaths/min' },
        weight: { name: 'Weight', icon: '⚖️', normalRange: 'Individual' },
        height: { name: 'Height', icon: '📏', normalRange: 'Individual' }
    };

    const getStatusColor = (status: VitalSign['status']) => {
        switch (status) {
            case 'normal': return 'text-green-600 bg-green-50 border-green-200';
            case 'elevated': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const simulateReading = () => {
        setIsSimulating(true);
        
        // Simulate device reading with progress
        setTimeout(() => {
            const newVital: VitalSign = {
                id: Date.now().toString(),
                type: selectedVital,
                value: generateSimulatedValue(selectedVital),
                unit: getUnit(selectedVital),
                timestamp: new Date(),
                status: 'normal'
            };
            
            setVitals(prev => [newVital, ...prev.filter(v => v.type !== selectedVital)]);
            setIsSimulating(false);
        }, 3000);
    };

    const generateSimulatedValue = (type: VitalSign['type']): string => {
        switch (type) {
            case 'heart_rate': return (70 + Math.floor(Math.random() * 20)).toString();
            case 'blood_pressure': return `${110 + Math.floor(Math.random() * 20)}/${70 + Math.floor(Math.random() * 15)}`;
            case 'temperature': return (98 + Math.random() * 2).toFixed(1);
            case 'oxygen_saturation': return (96 + Math.floor(Math.random() * 4)).toString();
            case 'respiratory_rate': return (14 + Math.floor(Math.random() * 6)).toString();
            case 'weight': return (150 + Math.floor(Math.random() * 50)).toString();
            case 'height': return `5'${8 + Math.floor(Math.random() * 6)}"`;
            default: return '0';
        }
    };

    const getUnit = (type: VitalSign['type']): string => {
        switch (type) {
            case 'heart_rate': return 'bpm';
            case 'blood_pressure': return 'mmHg';
            case 'temperature': return '°F';
            case 'oxygen_saturation': return '%';
            case 'respiratory_rate': return '/min';
            case 'weight': return 'lbs';
            case 'height': return '';
            default: return '';
        }
    };

    const addManualReading = () => {
        if (!manualValue.trim()) return;

        const newVital: VitalSign = {
            id: Date.now().toString(),
            type: selectedVital,
            value: manualValue,
            unit: getUnit(selectedVital),
            timestamp: new Date(),
            status: 'normal', // In real app, would calculate based on value
            notes: 'Manual entry'
        };

        setVitals(prev => [newVital, ...prev]);
        setManualValue('');
    };

    const getLatestVital = (type: VitalSign['type']) => {
        return vitals.find(v => v.type === type);
    };

    return (
        <div className="h-full flex flex-col p-6 bg-gradient-to-br from-green-50 to-blue-50">
            <FadeIn>
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">💓 Vital Signs Monitor</h2>
                    <p className="text-gray-600">Real-time health monitoring for consultation #{consultationId.slice(-8).toUpperCase()}</p>
                </div>
            </FadeIn>

            {/* Current Vitals Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {Object.entries(vitalTypes).map(([type, config], index) => {
                    const vital = getLatestVital(type as VitalSign['type']);
                    return (
                        <ScaleIn key={type} delay={0.1 * index}>
                            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 hover:shadow-xl transition-shadow">
                                <div className="text-center">
                                    <div className="text-2xl mb-2">{config.icon}</div>
                                    <h3 className="font-semibold text-gray-800 text-sm mb-2">{config.name}</h3>
                                    {vital ? (
                                        <>
                                            <div className="text-2xl font-bold text-blue-600 mb-1">
                                                {vital.value} <span className="text-sm text-gray-500">{vital.unit}</span>
                                            </div>
                                            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(vital.status)}`}>
                                                {vital.status.toUpperCase()}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {vital.timestamp.toLocaleTimeString()}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-gray-400">
                                            <div className="text-lg mb-1">--</div>
                                            <div className="text-xs">No data</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScaleIn>
                    );
                })}
            </div>

            {/* Measurement Controls */}
            {isProvider && (
                <FadeIn delay={0.4}>
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
                        <h3 className="font-semibold text-gray-800 mb-4">📊 Take New Measurement</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Vital Sign</label>
                                <select
                                    value={selectedVital}
                                    onChange={(e) => setSelectedVital(e.target.value as VitalSign['type'])}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {Object.entries(vitalTypes).map(([type, config]) => (
                                        <option key={type} value={type}>
                                            {config.icon} {config.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Manual Entry</label>
                                <input
                                    type="text"
                                    value={manualValue}
                                    onChange={(e) => setManualValue(e.target.value)}
                                    placeholder={`Enter ${vitalTypes[selectedVital].name.toLowerCase()}`}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex items-end space-x-2">
                                <Button
                                    onClick={addManualReading}
                                    disabled={!manualValue.trim()}
                                    className="flex-1"
                                    variant="outline"
                                >
                                    💾 Save Manual
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <Button
                                onClick={simulateReading}
                                disabled={isSimulating}
                                className={`bg-green-600 hover:bg-green-700 ${isSimulating ? 'animate-pulse' : ''}`}
                            >
                                {isSimulating ? '📡 Reading...' : '📱 Device Reading'}
                            </Button>

                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Normal Range:</span> {vitalTypes[selectedVital].normalRange}
                            </div>
                        </div>

                        {isSimulating && (
                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                    <span className="text-blue-700 font-medium">Connecting to {vitalTypes[selectedVital].name} monitor...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </FadeIn>
            )}

            {/* Vitals History */}
            <div className="flex-1 overflow-y-auto">
                <FadeIn delay={0.6}>
                    <h3 className="font-semibold text-gray-800 mb-4">📈 Measurement History</h3>
                </FadeIn>

                <div className="space-y-3">
                    {vitals.map((vital, index) => (
                        <FadeIn key={vital.id} delay={0.1 * index}>
                            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-xl">{vitalTypes[vital.type].icon}</div>
                                        <div>
                                            <h4 className="font-medium text-gray-800">{vitalTypes[vital.type].name}</h4>
                                            <p className="text-sm text-gray-500">{vital.timestamp.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-blue-600">
                                            {vital.value} <span className="text-sm text-gray-500">{vital.unit}</span>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(vital.status)}`}>
                                            {vital.status.toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                
                                {vital.notes && (
                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                        <p className="text-sm text-gray-600">📝 {vital.notes}</p>
                                    </div>
                                )}
                            </div>
                        </FadeIn>
                    ))}
                </div>

                {vitals.length === 0 && (
                    <ScaleIn>
                        <div className="text-center py-12 text-gray-500">
                            <div className="text-6xl mb-4">📊</div>
                            <p className="text-lg font-medium">No measurements yet</p>
                            <p>Take the first vital sign measurement to start monitoring</p>
                        </div>
                    </ScaleIn>
                )}
            </div>

            {/* AI Health Insights */}
            <FadeIn delay={0.8}>
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-3">🤖 AI Health Insights</h3>
                    <div className="space-y-2 text-sm">
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <p className="text-gray-700">💡 All vital signs within normal range - patient appears stable</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <p className="text-gray-700">📈 Heart rate slightly elevated, consider stress or recent activity</p>
                        </div>
                        <Button size="sm" variant="outline" className="w-full mt-2">
                            View Detailed Analysis
                        </Button>
                    </div>
                </div>
            </FadeIn>
        </div>
    );
};

export default VitalSigns;