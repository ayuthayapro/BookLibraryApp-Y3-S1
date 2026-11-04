import { request } from './api';

export const copiesService = {
    async getCopies(params = {}) {
        const query = new URLSearchParams();
        if (params.page) query.set('page', params.page);
        if (params.book_id) query.set('book_id', params.book_id);
        if (params.status) query.set('status', params.status);
        if (params.condition) query.set('condition', params.condition);
        if (params.barcode) query.set('barcode', params.barcode);
        if (params.search) query.set('search', params.search);
        if (params.per_page) query.set('per_page', params.per_page);

        return request(`/book-copies?${query.toString()}`);
    },

    async getCopy(id) {
        return request(`/book-copies/${id}`);
    },

    async getByBarcode(barcode) {
        return request(`/book-copies/barcode/${encodeURIComponent(barcode)}`);
    },

    async getBarcodeLabel(id) {
        return request(`/book-copies/${id}/barcode`);
    },

    async createCopy(data) {
        return request('/book-copies', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async bulkCreateCopies(data) {
        return request('/book-copies/bulk', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateCopy(id, data) {
        return request(`/book-copies/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteCopy(id) {
        return request(`/book-copies/${id}`, {
            method: 'DELETE',
        });
    },

    async getInventorySummary() {
        return request('/inventory/summary');
    },

    async getInventory(params = {}) {
        const query = new URLSearchParams();
        if (params.page) query.set('page', params.page);
        if (params.category_id) query.set('category_id', params.category_id);
        if (params.search) query.set('search', params.search);
        return request(`/inventory?${query.toString()}`);
    },
};

