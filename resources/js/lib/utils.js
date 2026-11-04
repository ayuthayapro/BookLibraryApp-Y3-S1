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

/**
 * Safely extracts an array from any API response structure
 */
export function toSafeArray(input, fallbackKey = null) {
    if (!input) return [];
    if (Array.isArray(input)) return input;

    // If input is an API wrapper { success: true, data: ... }
    if (input.data !== undefined) {
        if (Array.isArray(input.data)) return input.data;
        if (input.data && typeof input.data === 'object') {
            if (fallbackKey && Array.isArray(input.data[fallbackKey])) {
                return input.data[fallbackKey];
            }
            if (Array.isArray(input.data.data)) {
                return input.data.data;
            }
        }
    }

    if (fallbackKey && Array.isArray(input[fallbackKey])) {
        return input[fallbackKey];
    }

    if (Array.isArray(input.items)) {
        return input.items;
    }

    return [];
}

/**
 * Safely extracts pagination metadata from a Laravel paginator response
 */
export function extractPagination(res) {
    const p = res?.data?.data ? res.data : (res?.data || res || {});
    return {
        current_page: p.current_page || 1,
        last_page: p.last_page || 1,
        total: p.total || 0,
        per_page: p.per_page || 15,
    };
}


