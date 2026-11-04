import { request } from './api';

export const dashboardService = {
    async getStats() {
        return request('/dashboard/stats');
    },

    async getPopularBooks() {
        return request('/dashboard/popular-books');
    },

    async getRecentActivities() {
        return request('/dashboard/recent-activities');
    },

    async getCharts() {
        return request('/dashboard/charts');
    },
};

