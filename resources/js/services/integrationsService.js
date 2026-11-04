import { request } from './api';

export const integrationsService = {
    // Google Books
    async searchGoogleBooks(query, maxResults = 12) {
        return request(`/google-books/search?q=${encodeURIComponent(query)}&max_results=${maxResults}`);
    },

    async getGoogleBook(googleBookId) {
        return request(`/google-books/${googleBookId}`);
    },

    async importGoogleBook(googleBookId, copiesCount = 2, condition = 'new', categoryId = null) {
        return request('/google-books/import', {
            method: 'POST',
            body: JSON.stringify({
                google_book_id: googleBookId,
                copies_count: copiesCount,
                condition,
                category_id: categoryId,
            }),
        });
    },

    // Gemini AI
    async geminiChat(message, history = []) {
        return request('/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ message, history }),
        });
    },

    async geminiRecommendations(preferences = '') {
        return request('/ai/recommendations', {
            method: 'POST',
            body: JSON.stringify({ preferences }),
        });
    },

    async geminiSummarize(bookId) {
        return request(`/ai/summarize/${bookId}`, {
            method: 'POST',
        });
    },
};

