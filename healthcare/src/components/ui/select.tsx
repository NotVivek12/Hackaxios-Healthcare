'use client';

import React from 'react';

type SelectContextType = {
    value?: string;
    setValue: (v: string) => void;
};

const SelectContext = React.createContext<SelectContextType | null>(null);

export function Select({ children, value, defaultValue, onValueChange }: {
    children: React.ReactNode;
    value?: string;
    defaultValue?: string;
    onValueChange?: (v: string) => void;
}) {
    const [internal, setInternal] = React.useState(defaultValue);
    const isControlled = value !== undefined;
    const current = isControlled ? value : internal;
    const setValue = (v: string) => {
        if (!isControlled) setInternal(v);
        onValueChange?.(v);
    };
    return (
        <SelectContext.Provider value={{ value: current, setValue }}>
            <div className="relative inline-block w-full max-w-xs">{children}</div>
        </SelectContext.Provider>
    );
}

export function SelectTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={`border rounded-md h-9 px-3 flex items-center justify-between bg-white ${className || ''}`}>{children}</div>;
}
export function SelectValue({ placeholder }: { placeholder?: string }) {
    const ctx = React.useContext(SelectContext);
    return <span className="text-sm text-gray-700">{ctx?.value || placeholder}</span>;
}
export function SelectContent({ children }: { children: React.ReactNode }) {
    return <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">{children}</div>;
}
export function SelectItem({ children, value }: { children: React.ReactNode; value: string }) {
    const ctx = React.useContext(SelectContext)!;
    const selected = ctx.value === value;
    return (
        <div
            className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${selected ? 'bg-gray-100 font-medium' : ''}`}
            onClick={() => ctx.setValue(value)}
            data-value={value}
        >
            {children}
        </div>
    );
}
