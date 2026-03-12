import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle response errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// Upload a single image (FormData expected)
export async function uploadImage(formData) {
    return api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
}

// Update current user's profile. Accepts JSON body. For avatars, upload first and pass the URL here.
export async function updateUserProfile(data) {
    return api.put('/auth/me', data);
}