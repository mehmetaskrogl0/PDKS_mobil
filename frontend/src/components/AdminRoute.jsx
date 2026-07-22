import { Navigate } from "react-router-dom";


function getStoredUser() {

    try {

        const storedUser =
            localStorage.getItem("user");

        if (!storedUser) {
            return null;
        }

        return JSON.parse(storedUser);

    } catch (error) {

        console.error(
            "Kullanıcı bilgisi okunamadı:",
            error
        );

        return null;

    }

}


function AdminRoute({ children }) {

    const token =
        localStorage.getItem("token");

    const user =
        getStoredUser();


    const role = String(
        localStorage.getItem("role") ||
        user?.role ||
        "employee"
    )
        .trim()
        .toLowerCase();


    const validToken =
        token &&
        token !== "null" &&
        token !== "undefined" &&
        token.trim() !== "";


    if (!validToken) {

        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");

        return (
            <Navigate
                to="/login"
                replace
            />
        );

    }


    if (role !== "admin") {

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