"""Atlas PDKS backend integration tests"""
import os
import time
import uuid
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load frontend .env for EXPO_PUBLIC_BACKEND_URL
load_dotenv(Path(__file__).parent.parent.parent / "frontend" / ".env")

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@atlaspdks.com"
ADMIN_PASSWORD = "Admin1234!"

# Workplace coordinates
WP_LAT = 41.0082
WP_LNG = 28.9784
FAR_LAT = 41.05
FAR_LNG = 28.99


@pytest.fixture(scope="module")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(http):
    r = http.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def employee(http):
    """Create a fresh test employee and return dict with email, password, token, id"""
    email = f"TEST_emp_{uuid.uuid4().hex[:8]}@atlas.com"
    password = "test1234"
    name = "TEST Employee"
    r = http.post(f"{API}/auth/register", json={"email": email, "password": password, "name": name})
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    return {
        "email": email, "password": password, "name": name,
        "token": data["access_token"], "id": data["user"]["id"],
    }


def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------------- Auth ----------------
class TestAuth:
    def test_register_returns_token_and_user(self, http):
        email = f"TEST_reg_{uuid.uuid4().hex[:8]}@atlas.com"
        r = http.post(f"{API}/auth/register", json={"email": email, "password": "test1234", "name": "TEST Reg"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        assert data["user"]["role"] == "employee"
        assert data["user"]["email"] == email

    def test_admin_login_returns_admin_role(self, http, admin_token):
        # Use fixture — verify with /auth/me
        r = http.get(f"{API}/auth/me", headers=auth_headers(admin_token))
        assert r.status_code == 200
        assert r.json()["role"] == "admin"
        assert r.json()["email"] == ADMIN_EMAIL

    def test_employee_login_returns_employee_role(self, http, employee):
        r = http.post(f"{API}/auth/login", json={"email": employee["email"], "password": employee["password"]})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "employee"

    def test_me_without_token_401(self, http):
        r = http.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_login_wrong_password_400(self, http):
        r = http.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 400


# ---------------- Config ----------------
class TestConfig:
    def test_workplace_config(self, http, employee):
        r = http.get(f"{API}/config/workplace", headers=auth_headers(employee["token"]))
        assert r.status_code == 200
        d = r.json()
        assert abs(d["lat"] - WP_LAT) < 0.001
        assert abs(d["lng"] - WP_LNG) < 0.001
        assert d["radius_m"] == 150
        assert d["shift_start"] == "09:00"
        assert d["shift_end"] == "17:30"


# ---------------- Attendance ----------------
class TestAttendance:
    def test_check_in_far_returns_400(self, http, employee):
        r = http.post(f"{API}/attendance/check-in",
                      headers=auth_headers(employee["token"]),
                      json={"lat": FAR_LAT, "lng": FAR_LNG})
        assert r.status_code == 400
        assert "doğrulanamadı" in r.json()["detail"].lower() or "dogrulanamadi" in r.json()["detail"].lower()

    def test_check_in_at_workplace_ok(self, http, employee):
        r = http.post(f"{API}/attendance/check-in",
                      headers=auth_headers(employee["token"]),
                      json={"lat": WP_LAT, "lng": WP_LNG, "accuracy": 5})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert "attendance_id" in d
        assert d["distance_m"] <= 150

    def test_double_check_in_400(self, http, employee):
        # employee should already have an active check-in from prior test
        r = http.post(f"{API}/attendance/check-in",
                      headers=auth_headers(employee["token"]),
                      json={"lat": WP_LAT, "lng": WP_LNG})
        assert r.status_code == 400
        assert "aktif" in r.json()["detail"].lower()

    def test_break_start_end(self, http, employee):
        r1 = http.post(f"{API}/attendance/break/start", headers=auth_headers(employee["token"]))
        assert r1.status_code == 200
        assert r1.json()["ok"] is True
        time.sleep(0.5)
        r2 = http.post(f"{API}/attendance/break/end", headers=auth_headers(employee["token"]))
        assert r2.status_code == 200
        assert r2.json()["ok"] is True

    def test_attendance_today(self, http, employee):
        r = http.get(f"{API}/attendance/today", headers=auth_headers(employee["token"]))
        assert r.status_code == 200
        d = r.json()
        assert d["checked_in"] is True
        assert d["attendance_id"] is not None

    def test_attendance_stats(self, http, employee):
        r = http.get(f"{API}/attendance/stats", headers=auth_headers(employee["token"]))
        assert r.status_code == 200
        d = r.json()
        assert "today_minutes" in d
        assert "week_minutes" in d
        assert d["planned_minutes"] == (17 * 60 + 30) - (9 * 60)

    def test_attendance_recent(self, http, employee):
        r = http.get(f"{API}/attendance/recent?limit=8", headers=auth_headers(employee["token"]))
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    def test_check_out_ok(self, http, employee):
        r = http.post(f"{API}/attendance/check-out",
                      headers=auth_headers(employee["token"]),
                      json={"lat": WP_LAT, "lng": WP_LNG, "accuracy": 5})
        assert r.status_code == 200
        assert r.json()["ok"] is True
        assert "worked_minutes" in r.json()

    def test_attendance_history(self, http, employee):
        r = http.get(f"{API}/attendance/history?days=30", headers=auth_headers(employee["token"]))
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        assert len(rows) >= 1
        assert rows[0]["check_out"] is not None


# ---------------- Requests ----------------
class TestRequests:
    def test_create_manual_entry_request(self, http, employee):
        r = http.post(f"{API}/requests",
                      headers=auth_headers(employee["token"]),
                      json={"kind": "manual_entry", "reason": "TEST GPS unavailable", "entry_time": "09:00"})
        assert r.status_code == 200
        assert "id" in r.json()
        # Save for other test via class attribute
        TestRequests.req_id = r.json()["id"]

    def test_list_mine(self, http, employee):
        r = http.get(f"{API}/requests/mine", headers=auth_headers(employee["token"]))
        assert r.status_code == 200
        rows = r.json()
        assert any(x["id"] == TestRequests.req_id for x in rows)
        target = next(x for x in rows if x["id"] == TestRequests.req_id)
        assert target["status"] == "pending"


# ---------------- Admin ----------------
class TestAdmin:
    def test_employee_cannot_access_admin(self, http, employee):
        r = http.get(f"{API}/admin/stats", headers=auth_headers(employee["token"]))
        assert r.status_code == 403

    def test_admin_stats(self, http, admin_token):
        r = http.get(f"{API}/admin/stats", headers=auth_headers(admin_token))
        assert r.status_code == 200
        d = r.json()
        assert "total_employees" in d
        assert "active_now" in d
        assert "pending_requests" in d

    def test_admin_employees(self, http, admin_token):
        r = http.get(f"{API}/admin/employees", headers=auth_headers(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    def test_admin_attendance(self, http, admin_token):
        r = http.get(f"{API}/admin/attendance?days=7", headers=auth_headers(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_requests_list(self, http, admin_token):
        r = http.get(f"{API}/admin/requests", headers=auth_headers(admin_token))
        assert r.status_code == 200
        rows = r.json()
        assert any(x["id"] == TestRequests.req_id for x in rows)

    def test_admin_approve_request(self, http, admin_token, employee):
        r = http.post(f"{API}/admin/requests/{TestRequests.req_id}/approve",
                      headers=auth_headers(admin_token),
                      json={"note": "TEST approved"})
        assert r.status_code == 200
        # Verify via GET
        r2 = http.get(f"{API}/requests/mine", headers=auth_headers(employee["token"]))
        target = next(x for x in r2.json() if x["id"] == TestRequests.req_id)
        assert target["status"] == "approved"

    def test_admin_reject_request(self, http, admin_token, employee):
        # Create fresh pending request
        r = http.post(f"{API}/requests",
                      headers=auth_headers(employee["token"]),
                      json={"kind": "leave", "reason": "TEST leave"})
        req_id = r.json()["id"]
        r2 = http.post(f"{API}/admin/requests/{req_id}/reject",
                       headers=auth_headers(admin_token),
                       json={"note": "TEST rejected"})
        assert r2.status_code == 200
        r3 = http.get(f"{API}/requests/mine", headers=auth_headers(employee["token"]))
        target = next(x for x in r3.json() if x["id"] == req_id)
        assert target["status"] == "rejected"

    def test_admin_approve_already_processed_404(self, http, admin_token):
        r = http.post(f"{API}/admin/requests/{TestRequests.req_id}/approve",
                      headers=auth_headers(admin_token),
                      json={"note": "again"})
        assert r.status_code == 404
