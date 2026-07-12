import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 60000,   
    withCredentials: true,
});

axiosInstance.interceptors.request.use(
    async (config) => {
        try {
            
            const token = await window.Clerk?.session?.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (e) {
            console.warn("Could not get Clerk token:", e);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;