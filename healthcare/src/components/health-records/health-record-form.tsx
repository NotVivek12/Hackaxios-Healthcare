'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { IHealthRecord } from '@/models/HealthRecord';

// For client-side use with string dates
type ClientHealthRecord = Omit<IHealthRecord, 'userId' | 'date' | 'createdAt' | 'updatedAt'> & {
    _id?: string;
    date: string;
    createdAt?: string;
    updatedAt?: string;
};

interface HealthRecordFormProps {
    initialData?: ClientHealthRecord | null;
    onSubmit: (data: Omit<IHealthRecord, 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    onCancel: () => void;
}

export const HealthRecordForm = ({ initialData, onSubmit, onCancel }: HealthRecordFormProps) => {
    const t = useTranslations('HealthRecords');
    const { success, error: showError } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Define form validation schema
    const formSchema = z.object({
        title: z.string().min(1, { message: t('validation.titleRequired') }),
        type: z.enum(['allergy', 'medication', 'condition', 'vaccination', 'lab', 'other'], {
            errorMap: () => ({ message: t('validation.invalidType') })
        }),
        description: z.string().min(1, { message: t('validation.descriptionRequired') }),
        date: z.string().min(1, { message: t('validation.dateRequired') }),
        provider: z.string().optional(),
        attachmentUrl: z.string().url().optional().or(z.literal('')),
        isShared: z.boolean().default(false).optional(),
        notes: z.string().optional()
    });

    type FormValues = z.infer<typeof formSchema>;

    // Initialize form with default values or data for editing
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            ...initialData,
            date: initialData.date ? format(new Date(initialData.date), 'yyyy-MM-dd') : '',
        } : {
            title: '',
            type: 'other',
            description: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            provider: '',
            attachmentUrl: '',
            isShared: false,
            notes: ''
        }
    });

    // Reset form when initialData changes
    useEffect(() => {
        if (initialData) {
            reset({
                ...initialData,
                date: initialData.date ? format(new Date(initialData.date), 'yyyy-MM-dd') : '',
            });
        }
    }, [initialData, reset]);

    // Handle form submission
    const handleFormSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            // Convert string date to Date object and ensure isShared is a boolean
            const formattedData = {
                ...data,
                date: new Date(data.date),
                isShared: data.isShared ?? false
            };
            await onSubmit(formattedData);
            success(initialData ? t('updateSuccess') : t('createSuccess'));
            if (!initialData) {
                // Reset form after successful creation
                reset();
            }
        } catch (err) {
            console.error('Error submitting health record:', err);
            showError(initialData ? t('updateError') : t('createError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl">
                    {initialData ? t('editRecord') : t('addRecord')}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={onCancel}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>

            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Title */}
                        <div className="space-y-1">
                            <label htmlFor="title" className="text-sm font-medium">
                                {t('recordTitle')} <span className="text-red-500">*</span>
                            </label>
                            <Input
                                id="title"
                                {...register('title')}
                                className={errors.title ? 'border-red-500' : ''}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Type */}
                        <div className="space-y-1">
                            <label htmlFor="type" className="text-sm font-medium">
                                {t('fieldType')} <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="type"
                                {...register('type')}
                                className={`w-full h-10 px-3 rounded-md border ${errors.type ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            >
                                <option value="allergy">{t('recordType.allergy')}</option>
                                <option value="medication">{t('recordType.medication')}</option>
                                <option value="condition">{t('recordType.condition')}</option>
                                <option value="vaccination">{t('recordType.vaccination')}</option>
                                <option value="lab">{t('recordType.lab')}</option>
                                <option value="other">{t('recordType.other')}</option>
                            </select>
                            {errors.type && (
                                <p className="text-sm text-red-500">{errors.type.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Date and Provider */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label htmlFor="date" className="text-sm font-medium">
                                {t('recordDate')} <span className="text-red-500">*</span>
                            </label>
                            <Input
                                id="date"
                                type="date"
                                {...register('date')}
                                className={errors.date ? 'border-red-500' : ''}
                            />
                            {errors.date && (
                                <p className="text-sm text-red-500">{errors.date.message}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="provider" className="text-sm font-medium">
                                {t('provider')}
                            </label>
                            <Input id="provider" {...register('provider')} />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label htmlFor="description" className="text-sm font-medium">
                            {t('description')} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="description"
                            {...register('description')}
                            className={`w-full px-3 py-2 rounded-md border ${errors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-1">
                        <label htmlFor="notes" className="text-sm font-medium">
                            {t('notes')}
                        </label>
                        <textarea
                            id="notes"
                            {...register('notes')}
                            className="w-full px-3 py-2 rounded-md border border-gray-300"
                            rows={2}
                        />
                    </div>

                    {/* Attachment URL */}
                    <div className="space-y-1">
                        <label htmlFor="attachmentUrl" className="text-sm font-medium">
                            {t('attachmentUrl')}
                        </label>
                        <Input
                            id="attachmentUrl"
                            type="url"
                            placeholder="https://..."
                            {...register('attachmentUrl')}
                            className={errors.attachmentUrl ? 'border-red-500' : ''}
                        />
                        {errors.attachmentUrl && (
                            <p className="text-sm text-red-500">{errors.attachmentUrl.message}</p>
                        )}
                    </div>

                    {/* Share toggle */}
                    <div className="flex items-center space-x-2">
                        <input
                            id="isShared"
                            type="checkbox"
                            {...register('isShared')}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="isShared" className="text-sm font-medium">
                            {t('shareWithProviders')}
                        </label>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        {t('cancel')}
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? t('saving') : initialData ? t('update') : t('save')}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};
