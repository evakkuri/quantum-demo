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


def test_validate_circuit_valid():
    resp = client.post(
        "/api/circuits/validate",
        json={"openqasm_code": SAMPLE_QASM},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is True
    assert len(data["errors"]) == 0


def test_validate_circuit_invalid_header():
    resp = client.post(
        "/api/circuits/validate",
        json={"openqasm_code": "qreg q[2];\nh q[0];"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is False
    assert len(data["errors"]) > 0


def test_validate_circuit_invalid_gate():
    bad_qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\ninvalid_gate q[0];'
    resp = client.post(
        "/api/circuits/validate",
        json={"openqasm_code": bad_qasm},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is False
    assert len(data["errors"]) > 0


def test_validate_circuit_single_qubit_superposition():
    qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\nh q[0];'
    resp = client.post(
        "/api/circuits/validate",
        json={"openqasm_code": qasm},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is True
    assert len(data["errors"]) == 0


def test_validate_circuit_ghz_state():
    qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[3];\nh q[0];\ncx q[0], q[1];\ncx q[0], q[2];'
    resp = client.post(
        "/api/circuits/validate",
        json={"openqasm_code": qasm},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is True
    assert len(data["errors"]) == 0


def test_validate_circuit_teleportation():
    qasm = (
        "OPENQASM 2.0;\n"
        'include "qelib1.inc";\n'
        "qreg q[3];\n"
        "creg c[2];\n"
        "h q[1];\n"
        "cx q[1], q[2];\n"
        "cx q[0], q[1];\n"
        "h q[0];\n"
        "measure q[0] -> c[0];\n"
        "measure q[1] -> c[1];"
    )
    resp = client.post(
        "/api/circuits/validate",
        json={"openqasm_code": qasm},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is True
    assert len(data["errors"]) == 0


def test_validate_circuit_out_of_range_qubit():
    qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\nh q[2];'
    resp = client.post(
        "/api/circuits/validate",
        json={"openqasm_code": qasm},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is False
    assert len(data["errors"]) > 0
