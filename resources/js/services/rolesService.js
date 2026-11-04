import { request } from './api';

export const rolesService = {
    async getRoles() {
        return request('/roles');
    },

    async getPermissions() {
        return request('/permissions');
    },

    async createRole(data) {
        return request('/roles', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async assignRolesToUser(userId, roles) {
        return request(`/users/${userId}/roles`, {
            method: 'POST',
            body: JSON.stringify({ roles }),
        });
    },

    async assignPermissionsToUser(userId, permissions) {
        return request(`/users/${userId}/permissions`, {
            method: 'POST',
            body: JSON.stringify({ permissions }),
        });
    },
};

