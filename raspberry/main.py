import time
import requests
import sys

# ---------------------------------------------------------
# CONFIGURATION
# Remplacez l'IP suivante par l'IP locale de votre PC qui fait tourner Next.js
# Ex: "http://192.168.1.25:3000/api/rfid"
API_URL = "http://10.5.0.2:3000/api/rfid"
# ---------------------------------------------------------

def send_uid_to_api(uid_string):
    """Envoie l'UID scanné à l'API via POST"""
    print(f"📡 Envoi de l'UID: {uid_string} vers {API_URL}...")
    
    try:
        response = requests.post(
            API_URL, 
            json={"rfidUuid": uid_string},
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Réponse API: {data.get('message', 'OK')}")
            if data.get('known'):
                print(f"👋 Utilisateur identifié: {data['user']['username']}")
            else:
                print("🆕 Nouveau badge ! Regardez l'écran pour l'inscription.")
        else:
            print(f"❌ Erreur API ({response.status_code}): {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("⚠️ Impossible de contacter le serveur. Vérifiez l'IP et que Next.js tourne.")
    except Exception as e:
        print(f"⚠️ Erreur inattendue: {e}")

# Simulation pour tester sans le matériel (Optionnel)
if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Si on lance "python main.py TEST-123"
        manual_uid = sys.argv[1]
        send_uid_to_api(manual_uid)
    else:
        # Ici, vous devrez intégrer votre code de lecture RFID (MFRC522)
        # Voici un exemple de boucle pseudo-code :
        
        print("⏳ En attente de badge RFID (Appuyez sur CTRL+C pour quitter)...")
        
        # --- EXEMPLE AVEC LIBRAIRIE MFRC522 (A décommenter sur le Pi) ---
        # from mfrc522 import SimpleMFRC522
        # reader = SimpleMFRC522()
        # try:
        #     while True:
        #         id, text = reader.read()
        #         send_uid_to_api(str(id))
        #         time.sleep(2) # Pause anti-doublons
        # finally:
        #     GPIO.cleanup()
        
        # Pour le test actuel sans capteur :
        print("Simulation: Envoi d'un badge de test...")
        send_uid_to_api("RASPBERRY-TEST-01")
