import { request } from './api';

export const membersService = {
    async getMembers(params = {}) {
        const query = new URLSearchParams();
        if (params.page) query.set('page', params.page);
        if (params.search) query.set('search', params.search);
        if (params.status) query.set('status', params.status);
        if (params.per_page) query.set('per_page', params.per_page);

        return request(`/users?${query.toString()}`);
    },

    async getMember(id) {
        return request(`/users/${id}`);
    },

    async updateMember(id, data) {
        return request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteMember(id) {
        return request(`/users/${id}`, {
            method: 'DELETE',
        });
    },
};

