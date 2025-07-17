const BASE_URL = '/api/v1';

async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Something went wrong');
        }
        return response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export function getFeed(page = 1) {
    return request(`/feed?page=${page}`);
}

export function getPost(id) {
    return request(`/posts/${id}`);
}

export function login(credentials) {
    return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
}

export function register(userData) {
    return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
}

// Add other API functions here...
