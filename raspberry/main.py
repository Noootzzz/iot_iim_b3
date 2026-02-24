#!/usr/bin/env python3
"""
Raspberry Pi RFID scanner + physical buttons — sends events to the Next.js API.
Each Raspberry Pi is identified by MACHINE_ID (e.g. 'ecran_1').

Buttons GPIO layout (active LOW with internal pull-up):
  - GPIO 17: Player 1 score +
  - GPIO 27: Player 2 score +
  - GPIO 22: Player 1 score -
  - GPIO 23: Player 2 score -
  - GPIO 24: Back / return to lobby
"""

import time
import threading
import requests

# === CONFIGURATION ===
API_URL = "http://10.5.0.2:3000/api/rfid"
BUTTONS_API_URL = "http://10.5.0.2:3000/api/buttons"
MACHINE_ID = "ecran_1"  # Change per Raspberry Pi: 'ecran_1', 'ecran_2', etc.

# GPIO pin -> action mapping
BUTTON_MAP = {
    17: "increment_p1",
    27: "increment_p2",
    22: "decrement_p1",
    23: "decrement_p2",
    24: "back",
}

DEBOUNCE_MS = 250  # Debounce time in milliseconds

# --- RFID Reader ---
try:
    from mfrc522 import SimpleMFRC522
    reader = SimpleMFRC522()
    HAS_READER = True
except ImportError:
    HAS_READER = False
    print("[WARN] mfrc522 not available — running in simulation mode")

# --- GPIO Buttons ---
try:
    import RPi.GPIO as GPIO
    HAS_GPIO = True
except ImportError:
    HAS_GPIO = False
    print("[WARN] RPi.GPIO not available — buttons disabled")


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
        print(f"[RFID] {resp.status_code} — {resp.json()}")
    except Exception as e:
        print(f"[RFID ERR] {e}")


def send_button(action: str):
    """POST a button press to the API."""
    try:
        resp = requests.post(
            BUTTONS_API_URL,
            json={"machineId": MACHINE_ID, "action": action},
            timeout=5,
        )
        print(f"[BTN] {action} — {resp.status_code} — {resp.json()}")
    except Exception as e:
        print(f"[BTN ERR] {e}")


def setup_buttons():
    """Configure GPIO pins for physical buttons."""
    if not HAS_GPIO:
        return

    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)

    for pin in BUTTON_MAP:
        GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.add_event_detect(
            pin,
            GPIO.FALLING,
            callback=button_callback,
            bouncetime=DEBOUNCE_MS,
        )
    print(f"[BTN] Buttons configured: {BUTTON_MAP}")


def button_callback(channel):
    """Called when a GPIO button is pressed (interrupt-driven)."""
    action = BUTTON_MAP.get(channel)
    if action:
        # Send in a thread to avoid blocking the interrupt handler
        threading.Thread(target=send_button, args=(action,), daemon=True).start()


def simulate_buttons():
    """Terminal-based button simulation when GPIO is unavailable."""
    print("\n[SIM] Button simulation mode")
    print("  1 = P1 score+   2 = P2 score+")
    print("  3 = P1 score-   4 = P2 score-")
    print("  5 = Back")
    print("  Enter = skip (return to RFID scan)\n")

    KEY_MAP = {
        "1": "increment_p1",
        "2": "increment_p2",
        "3": "decrement_p1",
        "4": "decrement_p2",
        "5": "back",
    }

    while True:
        key = input("Button [1-5] > ").strip()
        if key in KEY_MAP:
            send_button(KEY_MAP[key])
        elif key == "":
            break
        else:
            print("  Invalid key")


def main():
    print(f"RFID Scanner + Buttons started — MACHINE_ID={MACHINE_ID}")
    print(f"RFID endpoint:    {API_URL}")
    print(f"Buttons endpoint: {BUTTONS_API_URL}")

    setup_buttons()

    try:
        while True:
            if HAS_GPIO:
                # Buttons are handled by interrupts, just scan RFID
                uid = read_uid()
                if uid:
                    send_scan(uid)
                time.sleep(1)
            else:
                # In simulation mode, alternate between RFID and buttons
                uid = read_uid()
                if uid:
                    send_scan(uid)
                simulate_buttons()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        if HAS_GPIO:
            GPIO.cleanup()


if __name__ == "__main__":
    main()
