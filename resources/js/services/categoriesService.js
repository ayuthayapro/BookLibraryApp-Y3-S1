import { request } from './api';

export const categoriesService = {
    async getCategories() {
        return request('/categories');
    },

    async getCategory(id) {
        return request(`/categories/${id}`);
    },

    async createCategory(name) {
        return request('/categories', {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    },

    async updateCategory(id, name) {
        return request(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name }),
        });
    },

    async deleteCategory(id) {
        return request(`/categories/${id}`, {
            method: 'DELETE',
        });
    },
};

