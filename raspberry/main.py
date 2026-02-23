#!/usr/bin/env python3
"""
Raspberry Pi RFID scanner — sends scans to the Next.js API.
Each Raspberry Pi is identified by MACHINE_ID (e.g. 'ecran_1').
"""

import time
import requests

# === CONFIGURATION ===
API_URL = "http://10.5.0.2:3000/api/rfid"
MACHINE_ID = "ecran_1"  # Change per Raspberry Pi: 'ecran_1', 'ecran_2', etc.

try:
    from mfrc522 import SimpleMFRC522
    reader = SimpleMFRC522()
    HAS_READER = True
except ImportError:
    HAS_READER = False
    print("[WARN] mfrc522 not available — running in simulation mode")


def read_uid():
    """Read a UID from the RFID reader (or simulate one)."""
    if HAS_READER:
        uid, _ = reader.read()
        return str(uid)
    else:
        return input("Simulate UID > ").strip()


def send_scan(uid: str):
    """POST the scanned UID + machineId to the API."""
    try:
        resp = requests.post(
            API_URL,
            json={"rfidUuid": uid, "machineId": MACHINE_ID},
            timeout=5,
        )
        print(f"[OK] {resp.status_code} — {resp.json()}")
    except Exception as e:
        print(f"[ERR] {e}")


def main():
    print(f"RFID Scanner started — MACHINE_ID={MACHINE_ID}")
    print(f"API endpoint: {API_URL}")
    while True:
        uid = read_uid()
        if uid:
            send_scan(uid)
        time.sleep(1)


if __name__ == "__main__":
    main()
