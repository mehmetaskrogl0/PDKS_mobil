import axios from "axios";


const api = axios.create({

    baseURL: "http://127.0.0.1:8000",

    headers: {
        "Content-Type": "application/json"
    },

    timeout: 15000

});


api.interceptors.request.use(

    (config) => {

        const token = localStorage.getItem("token");

        const validToken =
            token &&
            token !== "null" &&
            token !== "undefined" &&
            token.trim() !== "";


        if (validToken) {

            config.headers =
                config.headers || {};

            config.headers.Authorization =
                `Bearer ${token}`;

        } else {

            localStorage.removeItem("token");

            if (config.headers) {

                delete config.headers.Authorization;

            }

        }


        return config;

    },

    (error) => {

        return Promise.reject(error);

    }

);


api.interceptors.response.use(

    (response) => {

        return response;

    },

    (error) => {

        const status =
            error.response?.status;

        const requestUrl =
            error.config?.url || "";

        const isLoginRequest =
            requestUrl.includes("/auth/login");

        const isAlreadyOnLoginPage =
            window.location.pathname === "/login";


        if (
            status === 401 &&
            !isLoginRequest
        ) {

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            if (!isAlreadyOnLoginPage) {

                window.location.replace("/login");

            }

        }


        return Promise.reject(error);

    }

);


export default api;