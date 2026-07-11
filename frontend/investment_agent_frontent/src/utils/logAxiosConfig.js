// logsAxiosInstance.js - UPDATED
import axios from 'axios';

const logsAxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_GEN_SOCKET,
    timeout: 20000,
    withCredentials: true
});

// Function to get token from cookies
function getTokenFromCookies() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'accessToken') {
            return value;
        }
    }
    return null;
}

logsAxiosInstance.interceptors.request.use(
    (config) => {


        // Try multiple sources for token
        let token = localStorage.getItem("accessToken") ||
            getTokenFromCookies();



        if (token) {
            config.headers.Authorization = `Bearer ${token}`;

        } else {
            console.warn('⚠️ No token found for GenAI backend request');
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default logsAxiosInstance;