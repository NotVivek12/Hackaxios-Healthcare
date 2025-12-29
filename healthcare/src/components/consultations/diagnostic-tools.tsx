'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FadeIn, ScaleIn } from '@/components/animations/motion-effects';

interface DiagnosticToolsProps {
    consultationId: string;
    isProvider: boolean;
}

interface DiagnosticTest {
    id: string;
    name: string;
    icon: string;
    category: 'imaging' | 'lab' | 'assessment' | 'screening';
    status: 'available' | 'in-progress' | 'completed' | 'ordered';
    description: string;
    estimatedTime?: string;
    results?: DiagnosticResult;
}

type DiagnosticResult = {
    confidence?: number;
    primaryCondition?: string;
    severity?: string;
    recommendations?: string[];
    depression?: { score: number; severity: string };
    anxiety?: { score: number; severity: string };
    recommendation?: string;
    overallRisk?: string;
    factors?: Array<{ factor: string; risk: string }>;
    status?: string;
};

export const DiagnosticTools = ({ consultationId, isProvider }: DiagnosticToolsProps) => {
    const [activeCategory, setActiveCategory] = useState<string>('assessment');
    const [diagnosticTests, setDiagnosticTests] = useState<DiagnosticTest[]>([]);
    const [selectedTool, setSelectedTool] = useState<DiagnosticTest | null>(null);
    const [isRunningTest, setIsRunningTest] = useState(false);

    useEffect(() => {
        const availableTests: DiagnosticTest[] = [
            // Assessment Tools
            {
                id: 'symptom-analyzer',
                name: 'AI Symptom Analyzer',
                icon: '🔍',
                category: 'assessment',
                status: 'available',
                description: 'Advanced AI analysis of reported symptoms',
                estimatedTime: '2-3 minutes'
            },
            {
                id: 'mental-health',
                name: 'Mental Health Screening',
                icon: '🧠',
                category: 'screening',
                status: 'available',
                description: 'Quick depression and anxiety assessment',
                estimatedTime: '5-7 minutes'
            },
            {
                id: 'risk-assessment',
                name: 'Risk Assessment Tool',
                icon: '⚠️',
                category: 'assessment',
                status: 'available',
                description: 'Evaluate patient risk factors',
                estimatedTime: '3-5 minutes'
            },
            
            // Imaging Tools
            {
                id: 'skin-analysis',
                name: 'Skin Condition Analysis',
                icon: '🔬',
                category: 'imaging',
                status: 'available',
                description: 'AI-powered dermatological assessment',
                estimatedTime: '1-2 minutes'
            },
            {
                id: 'eye-exam',
                name: 'Virtual Eye Exam',
                icon: '👁️',
                category: 'imaging',
                status: 'available',
                description: 'Basic vision and eye health screening',
                estimatedTime: '5-10 minutes'
            },
            
            // Lab Tools
            {
                id: 'blood-work',
                name: 'Blood Work Order',
                icon: '🩸',
                category: 'lab',
                status: 'available',
                description: 'Order comprehensive blood panel',
                estimatedTime: 'External lab'
            },
            {
                id: 'urine-test',
                name: 'Urinalysis',
                icon: '🧪',
                category: 'lab',
                status: 'available',
                description: 'Basic urine analysis',
                estimatedTime: 'External lab'
            }
        ];

        setDiagnosticTests(availableTests);
    }, []);

    const categories = {
        assessment: { name: 'Assessments', icon: '📋', color: 'blue' },
        imaging: { name: 'Imaging', icon: '📸', color: 'purple' },
        lab: { name: 'Lab Tests', icon: '🧪', color: 'green' },
        screening: { name: 'Screening', icon: '🔍', color: 'orange' }
    };

    const runDiagnosticTest = (test: DiagnosticTest) => {
        setSelectedTool(test);
        setIsRunningTest(true);

        // Update test status
        setDiagnosticTests(prev => 
            prev.map(t => t.id === test.id ? { ...t, status: 'in-progress' } : t)
        );

        // Simulate test execution
        setTimeout(() => {
            const mockResults = generateMockResults(test);
            setDiagnosticTests(prev => 
                prev.map(t => t.id === test.id ? { 
                    ...t, 
                    status: 'completed',
                    results: mockResults
                } : t)
            );
            setIsRunningTest(false);
        }, 3000);
    };

    const generateMockResults = (test: DiagnosticTest) => {
        switch (test.id) {
            case 'symptom-analyzer':
                return {
                    confidence: 92,
                    primaryCondition: 'Viral Upper Respiratory Infection',
                    severity: 'Mild to Moderate',
                    recommendations: [
                        'Rest and hydration',
                        'Monitor temperature',
                        'Follow up if symptoms worsen'
                    ]
                };
            case 'mental-health':
                return {
                    depression: { score: 3, severity: 'Minimal' },
                    anxiety: { score: 7, severity: 'Mild' },
                    recommendation: 'Consider stress management techniques'
                };
            case 'risk-assessment':
                return {
                    overallRisk: 'Low',
                    factors: [
                        { factor: 'Age', risk: 'Low' },
                        { factor: 'Medical History', risk: 'Low' },
                        { factor: 'Lifestyle', risk: 'Moderate' }
                    ]
                };
            default:
                return { status: 'Completed successfully' };
        }
    };

    const getStatusColor = (status: DiagnosticTest['status']) => {
        switch (status) {
            case 'available': return 'bg-green-50 text-green-700 border-green-200';
            case 'in-progress': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'ordered': return 'bg-purple-50 text-purple-700 border-purple-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getCategoryColor = (category: string) => {
        const colors = {
            blue: 'bg-blue-500 text-white',
            purple: 'bg-purple-500 text-white',
            green: 'bg-green-500 text-white',
            orange: 'bg-orange-500 text-white'
        };
        return colors[categories[category as keyof typeof categories]?.color as keyof typeof colors] || 'bg-gray-500 text-white';
    };

    const filteredTests = diagnosticTests.filter(test => test.category === activeCategory);

    return (
        <div className="h-full flex flex-col p-6 bg-gradient-to-br from-purple-50 to-blue-50">
            <FadeIn>
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">🔬 Diagnostic Tools</h2>
                    <p className="text-gray-600">Advanced medical assessment tools for consultation #{consultationId.slice(-8).toUpperCase()}</p>
                </div>
            </FadeIn>

            {/* Category Navigation */}
            <FadeIn delay={0.2}>
                <div className="flex space-x-2 mb-6 overflow-x-auto">
                    {Object.entries(categories).map(([key, category]) => (
                        <button
                            key={key}
                            onClick={() => setActiveCategory(key)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                                activeCategory === key
                                    ? getCategoryColor(key)
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {category.icon} {category.name}
                        </button>
                    ))}
                </div>
            </FadeIn>

            {/* Diagnostic Tools Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {filteredTests.map((test, index) => (
                        <ScaleIn key={test.id} delay={0.1 * index}>
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all cursor-pointer group">
                                <div className="text-center mb-4">
                                    <div className="text-4xl mb-2">{test.icon}</div>
                                    <h3 className="font-semibold text-gray-800 mb-2">{test.name}</h3>
                                    <p className="text-sm text-gray-600 mb-3">{test.description}</p>
                                    
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(test.status)} mb-3`}>
                                        {test.status.toUpperCase()}
                                    </div>

                                    {test.estimatedTime && (
                                        <div className="text-xs text-gray-500 mb-3">
                                            ⏱️ {test.estimatedTime}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                    {test.status === 'available' && isProvider && (
                                        <Button
                                            onClick={() => runDiagnosticTest(test)}
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                            disabled={isRunningTest}
                                        >
                                            {isRunningTest && selectedTool?.id === test.id ? '⏳ Running...' : '▶️ Start Test'}
                                        </Button>
                                    )}

                                    {test.status === 'completed' && (
                                        <Button
                                            onClick={() => setSelectedTool(test)}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            📊 View Results
                                        </Button>
                                    )}

                                    {test.status === 'in-progress' && (
                                        <div className="w-full bg-yellow-100 text-yellow-800 p-2 rounded-lg text-center text-sm">
                                            <div className="animate-spin w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full mx-auto mb-1"></div>
                                            Processing...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScaleIn>
                    ))}
                </div>
            </div>

            {/* Results Modal */}
            {selectedTool && selectedTool.results && (
                <FadeIn>
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-gray-800">
                                        {selectedTool.icon} {selectedTool.name} Results
                                    </h3>
                                    <button
                                        onClick={() => setSelectedTool(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {selectedTool.id === 'symptom-analyzer' && (
                                        <div>
                                            <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                                <h4 className="font-semibold text-blue-800 mb-2">Primary Assessment</h4>
                                                <p className="text-blue-700">
                                                    <strong>{selectedTool.results.primaryCondition}</strong> 
                                                    ({selectedTool.results.confidence}% confidence)
                                                </p>
                                                <p className="text-sm text-blue-600 mt-1">
                                                    Severity: {selectedTool.results.severity}
                                                </p>
                                            </div>
                                            
                                            {Array.isArray(selectedTool.results.recommendations) && (
                                                <>
                                                    <h4 className="font-semibold text-gray-800 mb-2">Recommendations</h4>
                                                    <ul className="space-y-1">
                                                        {selectedTool.results.recommendations.map((rec: string, index: number) => (
                                                            <li key={index} className="flex items-center space-x-2">
                                                                <span className="text-green-600">✓</span>
                                                                <span>{rec}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {selectedTool.id === 'mental-health' &&
                                     selectedTool.results.depression &&
                                     selectedTool.results.anxiety && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-green-50 p-4 rounded-lg">
                                                    <h4 className="font-semibold text-green-800">Depression Score</h4>
                                                    <p className="text-2xl font-bold text-green-600">
                                                        {selectedTool.results.depression.score}/21
                                                    </p>
                                                    <p className="text-sm text-green-700">{selectedTool.results.depression.severity}</p>
                                                </div>
                                                <div className="bg-yellow-50 p-4 rounded-lg">
                                                    <h4 className="font-semibold text-yellow-800">Anxiety Score</h4>
                                                    <p className="text-2xl font-bold text-yellow-600">
                                                        {selectedTool.results.anxiety.score}/21
                                                    </p>
                                                    <p className="text-sm text-yellow-700">{selectedTool.results.anxiety.severity}</p>
                                                </div>
                                            </div>
                                            {selectedTool.results.recommendation && (
                                                <div className="bg-blue-50 p-4 rounded-lg">
                                                    <h4 className="font-semibold text-blue-800">Recommendation</h4>
                                                    <p className="text-blue-700">{selectedTool.results.recommendation}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex space-x-3 pt-4 border-t">
                                        <Button className="flex-1">📄 Save to Record</Button>
                                        <Button variant="outline" className="flex-1">📤 Share Results</Button>
                                        <Button variant="outline" onClick={() => setSelectedTool(null)}>
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            )}

            {/* Quick Actions */}
            {isProvider && (
                <FadeIn delay={0.6}>
                    <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                        <h3 className="font-semibold text-green-800 mb-3">⚡ Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="justify-start">
                                📋 Order Lab Panel
                            </Button>
                            <Button variant="outline" className="justify-start">
                                📸 Request Imaging
                            </Button>
                            <Button variant="outline" className="justify-start">
                                💊 Prescribe Medication
                            </Button>
                            <Button variant="outline" className="justify-start">
                                📅 Schedule Follow-up
                            </Button>
                        </div>
                    </div>
                </FadeIn>
            )}
        </div>
    );
};

export default DiagnosticTools;