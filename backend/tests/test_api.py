from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite:///./test_circuits.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def setup_module():
    Base.metadata.create_all(bind=engine)


def teardown_module():
    Base.metadata.drop_all(bind=engine)
    import os

    if os.path.exists("./test_circuits.db"):
        os.remove("./test_circuits.db")


SAMPLE_QASM = """OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
h q[0];
cx q[0], q[1];"""


def test_health_check():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_create_circuit():
    resp = client.post(
        "/api/circuits/",
        json={
            "name": "Bell State",
            "openqasm_code": SAMPLE_QASM,
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Bell State"
    assert data["id"] is not None


def test_list_circuits():
    resp = client.get("/api/circuits/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_get_circuit():
    # Create one first
    create_resp = client.post(
        "/api/circuits/",
        json={
            "name": "Test",
            "openqasm_code": SAMPLE_QASM,
        },
    )
    cid = create_resp.json()["id"]

    resp = client.get(f"/api/circuits/{cid}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Test"


def test_get_circuit_not_found():
    resp = client.get("/api/circuits/9999")
    assert resp.status_code == 404


def test_get_circuit_diagram():
    create_resp = client.post(
        "/api/circuits/",
        json={
            "name": "Bell",
            "openqasm_code": SAMPLE_QASM,
        },
    )
    cid = create_resp.json()["id"]

    resp = client.get(f"/api/circuits/{cid}/diagram")
    assert resp.status_code == 200
    data = resp.json()
    assert data["circuit"]["name"] == "Bell"
    # diagram should be base64 or have an error
    assert data["diagram_base64"] is not None or data["error"] is not None
