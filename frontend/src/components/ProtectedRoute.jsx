import { Navigate } from "react-router-dom";


function ProtectedRoute({ children }) {

    const token =
        localStorage.getItem("token");


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


    return children;

}


export default ProtectedRoute;