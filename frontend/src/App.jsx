import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Profile from "./pages/Profile";

import AdminDashboard from "./pages/AdminDashboard";
import Employees from "./pages/Employees";
import Teams from "./pages/Teams";
import Workplaces from "./pages/Workplaces";
import AdminLeaves from "./pages/AdminLeaves";
import AdminReports from "./pages/AdminReports";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";


function ProtectedLayout({ children }) {

  return (

    <ProtectedRoute>

      <Layout>
        {children}
      </Layout>

    </ProtectedRoute>

  );

}


function AdminLayout({ children }) {

  return (

    <ProtectedRoute>

      <AdminRoute>

        <Layout>
          {children}
        </Layout>

      </AdminRoute>

    </ProtectedRoute>

  );

}


function App() {

  return (

    <BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{

          duration: 3000,

          style: {
            background: "#1f2937",
            color: "#ffffff",
            borderRadius: "10px",
            padding: "14px 18px"
          },

          success: {
            duration: 2500
          },

          error: {
            duration: 4000
          }

        }}
      />


      <Routes>

        {/* Ana adres */}

        <Route
          path="/"
          element={

            <Navigate
              to="/login"
              replace
            />

          }
        />


        {/* Giriş */}

        <Route
          path="/login"
          element={

            <Login />

          }
        />


        {/* Personel sayfaları */}

        <Route
          path="/dashboard"
          element={

            <ProtectedLayout>

              <Dashboard />

            </ProtectedLayout>

          }
        />


        <Route
          path="/attendance"
          element={

            <ProtectedLayout>

              <Attendance />

            </ProtectedLayout>

          }
        />


        <Route
          path="/leaves"
          element={

            <ProtectedLayout>

              <Leaves />

            </ProtectedLayout>

          }
        />


        <Route
          path="/profile"
          element={

            <ProtectedLayout>

              <Profile />

            </ProtectedLayout>

          }
        />


        {/* Admin sayfaları */}

        <Route
          path="/admin"
          element={

            <AdminLayout>

              <AdminDashboard />

            </AdminLayout>

          }
        />


        <Route
          path="/admin/employees"
          element={

            <AdminLayout>

              <Employees />

            </AdminLayout>

          }
        />


        <Route
          path="/admin/teams"
          element={

            <AdminLayout>

              <Teams />

            </AdminLayout>

          }
        />


        <Route
          path="/admin/workplaces"
          element={

            <AdminLayout>

              <Workplaces />

            </AdminLayout>

          }
        />


        <Route
          path="/admin/leaves"
          element={

            <AdminLayout>

              <AdminLeaves />

            </AdminLayout>

          }
        />


        <Route
          path="/admin/reports"
          element={

            <AdminLayout>

              <AdminReports />

            </AdminLayout>

          }
        />


        {/* Bulunamayan sayfalar */}

        <Route
          path="*"
          element={

            <Navigate
              to="/dashboard"
              replace
            />

          }
        />

      </Routes>

    </BrowserRouter>

  );

}


export default App;