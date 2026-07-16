import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post("/auth/login", {
                email: email,
                password: password
            });

            localStorage.setItem(
                "token",
                response.data.access_token
            );

            alert("Giriş başarılı");

            navigate("/dashboard");

        } catch (error) {
            console.log(error.response);
            alert(error.response?.data?.detail || "Giriş başarısız");
        }
    };


    return (
        <div>
            <h1>PDKS Giriş</h1>

            <form onSubmit={handleLogin}>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <br />

                <input
                    type="password"
                    placeholder="Şifre"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <br />

                <button type="submit">
                    Giriş Yap
                </button>

            </form>
        </div>
    );
}

export default Login;