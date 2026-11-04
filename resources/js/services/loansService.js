import { request } from './api';

export const loansService = {
    async getLoans(params = {}) {
        const query = new URLSearchParams();
        if (params.page) query.set('page', params.page);
        if (params.status) query.set('status', params.status);
        if (params.user_id) query.set('user_id', params.user_id);
        if (params.search) query.set('search', params.search);
        if (params.per_page) query.set('per_page', params.per_page);

        return request(`/loans?${query.toString()}`);
    },

    async getOverdueLoans(params = {}) {
        const query = new URLSearchParams();
        if (params.page) query.set('page', params.page);
        if (params.per_page) query.set('per_page', params.per_page);

        return request(`/loans/overdue?${query.toString()}`);
    },

    async getMyLoans() {
        return request('/loans/my-loans');
    },

    async borrow(data) {
        return request('/loans', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async returnLoan(loanId, returnedAt = null) {
        return request(`/loans/${loanId}/return`, {
            method: 'POST',
            body: JSON.stringify({ returned_at: returnedAt || new Date().toISOString().slice(0, 10) }),
        });
    },
};

