'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FadeIn, ScaleIn } from '@/components/animations/motion-effects';
import type { Consultation } from '@/types';

interface MedicalNotesProps {
    consultationId: string;
    isProvider: boolean;
    consultation?: Consultation | null;
}

interface Note {
    id: string;
    timestamp: Date;
    author: string;
    content: string;
    type: 'assessment' | 'prescription' | 'observation' | 'plan';
    priority: 'low' | 'medium' | 'high';
}

export const MedicalNotes = ({ consultationId, isProvider, consultation }: MedicalNotesProps) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [noteType, setNoteType] = useState<Note['type']>('observation');
    const [priority, setPriority] = useState<Note['priority']>('medium');
    const [isRecording, setIsRecording] = useState(false);

    // Sample initial notes
    useEffect(() => {
        const initialNotes: Note[] = [
            {
                id: '1',
                timestamp: new Date(Date.now() - 30000),
                author: 'Dr. Smith',
                content: 'Patient reports symptoms for 3 days. Fever, headache, and fatigue noted.',
                type: 'assessment',
                priority: 'medium'
            },
            {
                id: '2',
                timestamp: new Date(Date.now() - 15000),
                author: 'Dr. Smith',
                content: 'Temperature: 38.2°C, Blood pressure: 120/80, Heart rate: 85 bpm',
                type: 'observation',
                priority: 'low'
            }
        ];
        setNotes(initialNotes);
    }, []);

    const addNote = () => {
        if (!newNote.trim()) return;

        const note: Note = {
            id: Date.now().toString(),
            timestamp: new Date(),
            author: isProvider ? 'Dr. Provider' : 'Patient',
            content: newNote,
            type: noteType,
            priority
        };

        setNotes(prev => [note, ...prev]);
        setNewNote('');
    };

    const startVoiceRecording = () => {
        setIsRecording(true);
        // In real implementation, would start speech recognition
        setTimeout(() => {
            setIsRecording(false);
            setNewNote(prev => prev + ' [Voice note recorded]');
        }, 3000);
    };

    const getTypeIcon = (type: Note['type']) => {
        switch (type) {
            case 'assessment': return '🔍';
            case 'prescription': return '💊';
            case 'observation': return '📊';
            case 'plan': return '📋';
            default: return '📝';
        }
    };

    const getTypeColor = (type: Note['type']) => {
        switch (type) {
            case 'assessment': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'prescription': return 'bg-green-50 text-green-700 border-green-200';
            case 'observation': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'plan': return 'bg-orange-50 text-orange-700 border-orange-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getPriorityColor = (priority: Note['priority']) => {
        switch (priority) {
            case 'high': return 'border-l-red-500';
            case 'medium': return 'border-l-yellow-500';
            case 'low': return 'border-l-green-500';
            default: return 'border-l-gray-500';
        }
    };

    return (
        <div className="h-full flex flex-col p-6 bg-gradient-to-br from-blue-50 to-white">
            <FadeIn>
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">📋 Medical Notes</h2>
                    <p className="text-gray-600">Real-time documentation for consultation #{consultationId.slice(-8).toUpperCase()}</p>
                    {consultation?.reason && (
                        <p className="text-sm text-gray-500 mt-1">
                            Reason: {consultation.reason}
                        </p>
                    )}
                </div>
            </FadeIn>

            {/* Note Input Section */}
            {isProvider && (
                <ScaleIn delay={0.2}>
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-blue-100">
                        <h3 className="font-semibold text-gray-800 mb-4">Add New Note</h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Note Type</label>
                                <select
                                    value={noteType}
                                    onChange={(e) => setNoteType(e.target.value as Note['type'])}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="observation">🔍 Observation</option>
                                    <option value="assessment">📊 Assessment</option>
                                    <option value="prescription">💊 Prescription</option>
                                    <option value="plan">📋 Treatment Plan</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as Note['priority'])}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="low">🟢 Low</option>
                                    <option value="medium">🟡 Medium</option>
                                    <option value="high">🔴 High</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Enter medical note..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center space-x-3">
                            <Button
                                onClick={addNote}
                                disabled={!newNote.trim()}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                💾 Save Note
                            </Button>

                            <Button
                                onClick={startVoiceRecording}
                                disabled={isRecording}
                                variant="outline"
                                className={isRecording ? 'animate-pulse bg-red-50' : ''}
                            >
                                {isRecording ? '🔴 Recording...' : '🎤 Voice Note'}
                            </Button>

                            <Button variant="outline">
                                📷 Attach Image
                            </Button>
                        </div>
                    </div>
                </ScaleIn>
            )}

            {/* Notes Timeline */}
            <div className="flex-1 overflow-y-auto">
                <FadeIn delay={0.4}>
                    <h3 className="font-semibold text-gray-800 mb-4">📜 Notes Timeline</h3>
                </FadeIn>

                <div className="space-y-4">
                    {notes.map((note, index) => (
                        <FadeIn key={note.id} delay={0.1 * index}>
                            <div className={`bg-white rounded-xl shadow-md p-4 border-l-4 ${getPriorityColor(note.priority)} hover:shadow-lg transition-shadow`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(note.type)}`}>
                                            {getTypeIcon(note.type)} {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {note.timestamp.toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{note.author}</span>
                                </div>
                                
                                <p className="text-gray-800 leading-relaxed">{note.content}</p>

                                {/* Note Actions */}
                                {isProvider && (
                                    <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100">
                                        <Button size="sm" variant="ghost" className="text-xs">
                                            ✏️ Edit
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-xs">
                                            📤 Share
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-xs text-red-600">
                                            🗑️ Delete
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </FadeIn>
                    ))}
                </div>

                {notes.length === 0 && (
                    <ScaleIn>
                        <div className="text-center py-12 text-gray-500">
                            <div className="text-6xl mb-4">📝</div>
                            <p className="text-lg font-medium">No notes yet</p>
                            <p>Add your first note to start documenting this consultation</p>
                        </div>
                    </ScaleIn>
                )}
            </div>

            {/* AI Suggestions Panel */}
            {isProvider && (
                <FadeIn delay={0.6}>
                    <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
                        <h3 className="font-semibold text-purple-800 mb-3">🤖 AI Suggestions</h3>
                        <div className="space-y-2 text-sm">
                            <div className="bg-white rounded-lg p-3 border border-purple-100">
                                <p className="text-gray-700">💡 Consider asking about family history of similar symptoms</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-purple-100">
                                <p className="text-gray-700">📋 Recommend blood work based on reported symptoms</p>
                            </div>
                            <Button size="sm" variant="outline" className="w-full mt-2">
                                View More Suggestions
                            </Button>
                        </div>
                    </div>
                </FadeIn>
            )}
        </div>
    );
};

export default MedicalNotes;