import { request } from './api';

export const booksService = {
    async getBooks(params = {}) {
        const query = new URLSearchParams();
        if (params.page) query.set('page', params.page);
        if (params.category_id) query.set('category_id', params.category_id);
        if (params.search) query.set('search', params.search);
        if (params.per_page) query.set('per_page', params.per_page);

        return request(`/books?${query.toString()}`);
    },

    async getBook(id) {
        return request(`/books/${id}`);
    },

    async createBook(data) {
        return request('/books', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateBook(id, data) {
        return request(`/books/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteBook(id) {
        return request(`/books/${id}`, {
            method: 'DELETE',
        });
    },

    async getBookInventory(id) {
        return request(`/books/${id}/inventory`);
    },

    async addCopies(id, count = 2, condition = 'new') {
        return request(`/books/${id}/copies`, {
            method: 'POST',
            body: JSON.stringify({ count, condition }),
        });
    },
};

