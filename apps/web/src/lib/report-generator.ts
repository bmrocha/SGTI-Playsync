/**
 * Utility functions for exporting and printing reports.
 * This file replaces the old report-generator.ts with only essential analytics tools.
 */

/**
 * Generates a CSV file from an array of objects and triggers a download.
 */
export const generateCSV = (data: Record<string, unknown>[], fileName: string) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(fieldName => {
                const value = row[fieldName];
                // Escape commas and wrap in quotes
                const cellValue = value !== undefined && value !== null ? String(value) : '';
                return `"${cellValue.replace(/"/g, '""')}"`;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

/**
 * Triggers the browser's print dialog.
 */
export const triggerPrint = () => {
    if (typeof window !== 'undefined') {
        window.print();
    }
};
