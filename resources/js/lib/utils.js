/**
 * Utility helper functions for BookLibrary Admin Web
 */

export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateString;
    }
}

export function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    try {
        const d = new Date(dateString);
        return d.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateString;
    }
}

export function getDaysDifference(dueAt) {
    if (!dueAt) return 0;
    try {
        const due = new Date(dueAt).getTime();
        const now = new Date().getTime();
        return Math.floor((now - due) / (1000 * 60 * 60 * 24));
    } catch {
        return 0;
    }
}

