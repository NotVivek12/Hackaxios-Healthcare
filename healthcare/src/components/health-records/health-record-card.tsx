'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import {
    Edit,
    Trash,
    Calendar,
    User,
    Paperclip,
    Share2,
    ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface HealthRecordProps {
    record: {
        _id: string;
        title: string;
        type: 'allergy' | 'medication' | 'condition' | 'vaccination' | 'lab' | 'other';
        description: string;
        date: string;
        provider?: string;
        attachmentUrl?: string;
        isShared: boolean;
        notes?: string;
        createdAt: string;
        updatedAt: string;
    };
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleShare: (id: string, isShared: boolean) => void;
}

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'allergy':
            return '🤧';
        case 'medication':
            return '💊';
        case 'condition':
            return '🏥';
        case 'vaccination':
            return '💉';
        case 'lab':
            return '🧪';
        default:
            return '📋';
    }
};

const getTypeColor = (type: string) => {
    switch (type) {
        case 'allergy':
            return 'bg-red-100 text-red-800';
        case 'medication':
            return 'bg-blue-100 text-blue-800';
        case 'condition':
            return 'bg-yellow-100 text-yellow-800';
        case 'vaccination':
            return 'bg-green-100 text-green-800';
        case 'lab':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export const HealthRecordCard = ({ record, onEdit, onDelete, onToggleShare }: HealthRecordProps) => {
    const t = useTranslations('HealthRecords');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const { success, error: showError } = useToast();

    const handleDelete = async () => {
        if (confirm(t('deleteConfirmation'))) {
            setIsDeleting(true);
            try {
                onDelete(record._id);
            } catch (err) {
                console.error('Error deleting record:', err);
                showError(t('deleteError'));
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleToggleShare = async () => {
        setIsToggling(true);
        try {
            onToggleShare(record._id, !record.isShared);
            success(record.isShared ? t('unsharedSuccess') : t('sharedSuccess'));
        } catch (err) {
            console.error('Error toggling share status:', err);
            showError(t('shareError'));
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center">
                        <div className={`p-2 rounded-md mr-3 ${getTypeColor(record.type)}`}>
                            <span className="text-xl">{getTypeIcon(record.type)}</span>
                        </div>
                        <div>
                            <CardTitle className="text-lg">{record.title}</CardTitle>
                            <CardDescription>
                                {t(`recordType.${record.type}`)} • {formatDistanceToNow(new Date(record.date), { addSuffix: true })}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(record._id)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">{t('edit')}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting}
                            onClick={handleDelete}
                        >
                            <Trash className="h-4 w-4 text-red-500" />
                            <span className="sr-only">{t('delete')}</span>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-700 mb-4">{record.description}</p>

                {record.notes && (
                    <div className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-md">
                        <p className="font-medium mb-1">{t('notes')}:</p>
                        <p>{record.notes}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                        {new Date(record.date).toLocaleDateString()}
                    </div>

                    {record.provider && (
                        <div className="flex items-center text-gray-600">
                            <User className="h-4 w-4 mr-2 flex-shrink-0" />
                            {record.provider}
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="pt-0 flex justify-between">
                {record.attachmentUrl ? (
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => window.open(record.attachmentUrl, '_blank')}
                    >
                        <Paperclip className="h-3 w-3 mr-1" />
                        {t('viewAttachment')}
                        <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                ) : (
                    <div></div>
                )}

                <Button
                    variant={record.isShared ? "secondary" : "outline"}
                    size="sm"
                    className={`text-xs ${record.isShared ? 'bg-green-50 text-green-700 hover:bg-green-100' : ''}`}
                    onClick={handleToggleShare}
                    disabled={isToggling}
                >
                    <Share2 className="h-3 w-3 mr-1" />
                    {record.isShared ? t('shared') : t('share')}
                </Button>
            </CardFooter>
        </Card>
    );
};
