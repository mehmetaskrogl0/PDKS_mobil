import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";

import Layout from "./components/Layout";


function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Login />}
        />


        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />


        <Route
          path="/attendance"
          element={
            <Layout>
              <Attendance />
            </Layout>
          }
        />

      </Routes>

    </BrowserRouter>

  );

}


export default App;