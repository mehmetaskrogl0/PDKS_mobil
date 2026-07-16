import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import api from "../api/axios";


function AdminRoute({ children }) {

    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [unauthorized, setUnauthorized] = useState(false);


    useEffect(() => {

        let isMounted = true;


        const checkAdmin = async () => {

            const token = localStorage.getItem("token");


            if (
                !token ||
                token === "null" ||
                token === "undefined" ||
                token.trim() === ""
            ) {

                localStorage.removeItem("token");

                if (isMounted) {

                    setUnauthorized(true);
                    setLoading(false);

                }

                return;

            }


            try {

                const response = await api.get(
                    "/users/me"
                );

                const role = String(
                    response.data?.role || ""
                )
                    .trim()
                    .toLowerCase();


                if (isMounted) {

                    setIsAdmin(
                        role === "admin"
                    );

                }

            } catch (error) {

                console.error(
                    "Admin yetkisi kontrol edilemedi:",
                    error.response?.data ||
                    error.message
                );


                if (isMounted) {

                    if (
                        error.response?.status === 401
                    ) {

                        localStorage.removeItem(
                            "token"
                        );

                        setUnauthorized(true);

                    }

                    setIsAdmin(false);

                }

            } finally {

                if (isMounted) {

                    setLoading(false);

                }

            }

        };


        checkAdmin();


        return () => {

            isMounted = false;

        };

    }, []);


    if (loading) {

        return (

            <div className="flex min-h-screen items-center justify-center bg-gray-100">

                <div className="text-center">

                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />

                    <p className="text-gray-500">

                        Yetki kontrol ediliyor...

                    </p>

                </div>

            </div>

        );

    }


    if (unauthorized) {

        return (

            <Navigate
                to="/login"
                replace
            />

        );

    }


    if (!isAdmin) {

        return (

            <Navigate
                to="/dashboard"
                replace
            />

        );

    }


    return children;

}


export default AdminRoute;