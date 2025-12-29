'use client';

import React from 'react';

export function Table({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
                {children}
            </table>
        </div>
    );
}
export function TableHeader({ children }: { children: React.ReactNode }) {
    return <thead className="bg-gray-50 text-gray-900">{children}</thead>;
}
export function TableBody({ children }: { children: React.ReactNode }) {
    return <tbody>{children}</tbody>;
}
export function TableRow({ children }: { children: React.ReactNode }) {
    return <tr className="border-b last:border-0 hover:bg-gray-50/60">{children}</tr>;
}
export function TableHead({ children, className }: { children: React.ReactNode; className?: string }) {
    return <th className={`px-4 py-3 font-semibold ${className || ''}`}>{children}</th>;
}
export function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
    return <td className={`px-4 py-3 align-middle ${className || ''}`}>{children}</td>;
}
