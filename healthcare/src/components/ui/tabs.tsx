'use client';

import React from 'react';

type TabsContextType = {
    value: string;
    setValue: (v: string) => void;
};

const TabsContext = React.createContext<TabsContextType | null>(null);

export function Tabs({ defaultValue, value, onValueChange, children, className }: {
    defaultValue?: string;
    value?: string;
    onValueChange?: (v: string) => void;
    children: React.ReactNode;
    className?: string;
}) {
    const [internal, setInternal] = React.useState(defaultValue || '');
    const isControlled = value !== undefined;
    const current = isControlled ? (value as string) : internal;

    const setValue = (v: string) => {
        if (!isControlled) setInternal(v);
        onValueChange?.(v);
    };

    return (
        <TabsContext.Provider value={{ value: current, setValue }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`inline-flex items-center gap-2 rounded-lg bg-gray-100 p-1 ${className || ''}`}>
            {children}
        </div>
    );
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
    const ctx = React.useContext(TabsContext)!;
    const active = ctx.value === value;
    return (
        <button
            type="button"
            onClick={() => ctx.setValue(value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${active ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                } ${className || ''}`}
            data-active={active ? 'true' : 'false'}
        >
            {children}
        </button>
    );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
    const ctx = React.useContext(TabsContext)!;
    if (ctx.value !== value) return null;
    return <div className={className}>{children}</div>;
}
