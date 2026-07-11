import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 20000,
    withCredentials: true

});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken"); // adjust key if needed
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;