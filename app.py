# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify, send_from_directory, session, redirect
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from flask_cors import CORS
import os
from datetime import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import tempfile
import json

app = Flask(__name__, static_folder="frontend")
app.secret_key = 'supersegreto123'
CORS(app)

# === 1. CONNESSIONE GOOGLE SHEETS ===
scope = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive"
]

# Carica le credenziali dal contenuto JSON salvato come variabile d’ambiente
credentials_dict = json.loads(os.environ['GOOGLE_APPLICATION_CREDENTIALS_JSON'])
creds = ServiceAccountCredentials.from_json_keyfile_dict(credentials_dict, scope)

client = gspread.authorize(creds)


# === 2. CONNESSIONE GOOGLE DRIVE ===
drive_credentials_dict = json.loads(os.environ['GOOGLE_APPLICATION_CREDENTIALS_JSON'])
drive_creds = service_account.Credentials.from_service_account_info(
    drive_credentials_dict, scopes=['https://www.googleapis.com/auth/drive']
)
drive_service = build('drive', 'v3', credentials=drive_creds)

MAIN_FOLDER_NAME = "CRM_Documenti"
main_folder_id = None
results = drive_service.files().list(
    q=f"name='{MAIN_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    spaces='drive', fields="files(id, name)"
).execute()
folders = results.get('files', [])
if folders:
    main_folder_id = folders[0]['id']
else:
    file_metadata = {
        'name': MAIN_FOLDER_NAME,
        'mimeType': 'application/vnd.google-apps.folder'
    }
    folder_created = drive_service.files().create(body=file_metadata, fields='id').execute()
    main_folder_id = folder_created.get('id')

# === 3. APERTURA FOGLI GOOGLE ===
clienti_sheet = client.open("CRM_Database").worksheet("Clienti")
agenti_sheet = client.open("CRM_Database").worksheet("Agenti")
interazioni_sheet = client.open("CRM_Database").worksheet("Interazioni")
filelog_sheet = client.open("CRM_Database").worksheet("File_Allegati")
impostazioni_sheet = client.open("CRM_Database").worksheet("Impostazioni")

# -------------------------------------------------------------------
#  A) FUNZIONI DI LOGIN / LOGOUT
# -------------------------------------------------------------------
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    codice = data.get("codice")
    password = data.get("password")
    agenti = agenti_sheet.get_all_records()
    for agente in agenti:
        if agente['Codice_Agente'] == codice and agente['Password'] == password:
            session['agente'] = codice
            return jsonify({"message": "Login riuscito", "agente": codice}), 200
    return jsonify({"message": "Credenziali errate"}), 401

@app.route("/logout")
def logout():
    session.pop('agente', None)
    return redirect("/")

# -------------------------------------------------------------------
#  B) GESTIONE CLIENTI
# -------------------------------------------------------------------
@app.route("/clienti", methods=["GET"])
def get_clienti():
    codice_agente = session.get('agente')
    if not codice_agente:
        return jsonify({"message": "Non autenticato"}), 401
    records = clienti_sheet.get_all_records()
    # Ogni agente vede solo i suoi
    clienti_filtrati = [c for c in records if str(c.get("Agente")) == codice_agente]
    return jsonify(clienti_filtrati)

@app.route("/clienti", methods=["POST"])
def add_cliente():
    # Aggiunta nuovo cliente (ID generato auto)
    codice_agente = session.get('agente')
    if not codice_agente:
        return jsonify({"message": "Non autenticato"}), 401

    data = request.json
    records = clienti_sheet.get_all_records()
    clienti_agente = [c for c in records if str(c.get("Agente")) == codice_agente]

    # Trova ID più alto esistente per quell'agente
    numeri_usati = []
    for cliente in clienti_agente:
        id_cliente = cliente.get("ID_Cliente", "")
        if id_cliente.startswith(codice_agente + "-"):
            parte_num = id_cliente.split("-")[-1]
            if parte_num.isdigit():
                numeri_usati.append(int(parte_num))
    prossimo_numero = max(numeri_usati) + 1 if numeri_usati else 1
    nuovo_id = f"{codice_agente}-{prossimo_numero:04d}"

    new_row = [
        nuovo_id,                    # A: ID_Cliente
        data.get("Nome"),           # B: Nome
        data.get("Email"),          # C: Email
        data.get("Telefono"),       # D: Telefono
        codice_agente,              # E: Agente
        data.get("Stato"),          # F: Stato
        ""                          # G: Provvigione (gestita dal foglio)
    ]
    clienti_sheet.append_row(new_row)
    return jsonify({"message": f"Cliente aggiunto con ID {nuovo_id}"}), 201

@app.route("/clienti/<id_cliente>", methods=["PUT"])
def aggiorna_cliente(id_cliente):
    # Modifica di un cliente esistente
    if 'agente' not in session:
        return jsonify({"message": "Non autenticato"}), 401

    data = request.json
    tutti = clienti_sheet.get_all_records()
    for idx, cliente in enumerate(tutti):
        if cliente["ID_Cliente"] == id_cliente and cliente["Agente"] == session['agente']:
            riga_excel = idx + 2  # +2 = salto intestazione e base1
            clienti_sheet.update(f"B{riga_excel}", [[data["Nome"]]])
            clienti_sheet.update(f"C{riga_excel}", [[data["Email"]]])
            clienti_sheet.update(f"D{riga_excel}", [[data["Telefono"]]])
            clienti_sheet.update(f"F{riga_excel}", [[data["Stato"]]])
            return jsonify({"message": "Cliente aggiornato correttamente"}), 200

    return jsonify({"message": "Cliente non trovato"}), 404

# -------------------------------------------------------------------
#  C) GESTIONE INTERAZIONI
# -------------------------------------------------------------------
@app.route("/interazioni/<id_cliente>", methods=["GET"])
def get_interazioni(id_cliente):
    if 'agente' not in session:
        return jsonify({"message": "Non autenticato"}), 401

    records = interazioni_sheet.get_all_records()
    # Filtra per ID_Cliente e Agente
    interazioni_cliente = [r for r in records
                           if str(r.get("ID_Cliente")) == id_cliente
                           and r.get("Agente") == session['agente']]
    return jsonify(interazioni_cliente)

@app.route("/interazioni", methods=["POST"])
def add_interazione():
    if 'agente' not in session:
        return jsonify({"message": "Non autenticato"}), 401

    data = request.json
    codice_agente = session['agente']

    # Data (formato gg/mm/aaaa)
    data_raw = data.get("Data", datetime.today().strftime("%Y-%m-%d"))
    try:
        data_obj = datetime.strptime(data_raw, "%Y-%m-%d")
        data_formattata = data_obj.strftime("%d/%m/%Y")
    except:
        data_formattata = data_raw

    # Calcolo nuovo ID_Interazione
    records = interazioni_sheet.get_all_records()
    nuovo_id = f"I{len(records) + 1:03d}"

    new_row = [
        nuovo_id,                        # A: ID_Interazione
        data.get("ID_Cliente"),         # B: ID_Cliente
        codice_agente,                  # C: Agente
        data_formattata,                # D: Data
        data.get("Tipo"),               # E: Tipo
        data.get("Esito"),              # F: Esito
        data.get("Descrizione")         # G: Descrizione
    ]
    interazioni_sheet.append_row(new_row)
    return jsonify({"message": f"Interazione {nuovo_id} aggiunta"}), 201

# -------------------------------------------------------------------
#  D) GESTIONE DOCUMENTI
# -------------------------------------------------------------------
@app.route("/upload/<id_cliente>", methods=["POST"])
def upload_file(id_cliente):
    if 'agente' not in session:
        return jsonify({"message": "Non autenticato"}), 401
    if 'file' not in request.files:
        return jsonify({"message": "Nessun file ricevuto"}), 400

    file = request.files['file']
    filename = file.filename
    codice_agente = session['agente']
    data_oggi = datetime.today().strftime("%d/%m/%Y")

    # Trova o crea cartella del cliente su Drive
    query = (f"name='{id_cliente}' and mimeType='application/vnd.google-apps.folder' "
             f"and '{main_folder_id}' in parents and trashed=false")
    results = drive_service.files().list(q=query, spaces='drive', fields="files(id, name)").execute()
    folders = results.get('files', [])
    if folders:
        folder_id = folders[0]['id']
    else:
        file_metadata = {
            'name': id_cliente,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [main_folder_id]
        }
        folder = drive_service.files().create(body=file_metadata, fields='id').execute()
        folder_id = folder.get('id')

    # Crea file temporaneo
    import shutil
    temp_fd, temp_path = tempfile.mkstemp()
    with os.fdopen(temp_fd, 'wb') as tmp:
        shutil.copyfileobj(file.stream, tmp)

    # Caricamento su Drive
    media = MediaFileUpload(temp_path)
    file_metadata = {
        'name': filename,
        'parents': [folder_id],
        'mimeType': file.mimetype or 'application/octet-stream'
    }

    uploaded = drive_service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id'
    ).execute()

    file_id = uploaded.get("id")

    # 🔓 Rendi il file visibile pubblicamente (permessi + published)
    drive_service.permissions().create(
        fileId=file_id,
        body={
            "role": "reader",
            "type": "anyone",
            "allowFileDiscovery": False
        }
    ).execute()


    # Pulizia file temporaneo
    try:
        os.remove(temp_path)
    except Exception as e:
        print("⚠️ Impossibile eliminare il file temporaneo:", e)

    # Log su File_Allegati
    try:
        print("✅ Registro file:", file_id, id_cliente, filename, codice_agente, data_oggi)
        filelog_sheet.append_row([
            file_id,
            id_cliente,
            filename,
            codice_agente,
            data_oggi,
            "In attesa"
        ])
    except Exception as e:
        print("❌ Errore durante la scrittura su File_Allegati:", str(e))
        return jsonify({"message": "File caricato, ma errore nel log", "error": str(e)}), 500

    return jsonify({"message": "File caricato e registrato correttamente"})

@app.route("/files/<id_cliente>", methods=["GET"])
def get_files(id_cliente):
    if 'agente' not in session:
        return jsonify({"message": "Non autenticato"}), 401

    # Trova cartella del cliente
    query = (f"name='{id_cliente}' and mimeType='application/vnd.google-apps.folder' "
             f"and '{main_folder_id}' in parents and trashed=false")
    results = drive_service.files().list(q=query, spaces='drive', fields="files(id, name)").execute()
    folders = results.get('files', [])
    if not folders:
        return jsonify([])

    folder_id = folders[0]['id']
    query = f"'{folder_id}' in parents and trashed=false"
    files = drive_service.files().list(q=query, spaces='drive', 
                                       fields="files(id, name)").execute().get('files', [])

    log_records = filelog_sheet.get_all_records()
    file_links = []
    for f in files:
        stato = "In attesa"
        caricato_da = "AGENTE"
        letto = "TRUE"
        for r in log_records:
            if r['ID_File'] == f['id']:
                stato = r.get('Stato', "In attesa")
                caricato_da = r.get('Caricato_da', "AGENTE")
                letto = r.get('Letto_da_Agente', "TRUE")
                break
        file_links.append({
            'name': f['name'],
            'id': f['id'],
            'url': f"https://drive.google.com/uc?export=view&id={f['id']}",
            'stato': stato,
            'caricato_da': caricato_da,
            'letto_da_agente': letto
        })

    return jsonify(file_links)

    @app.route("/file/<file_id>", methods=["DELETE"])
    def delete_file(file_id):
        if 'agente' not in session:
            return jsonify({"message": "Non autenticato"}), 401
    
        # Se log in File_Allegati = "Approvato", blocca
        log_records = filelog_sheet.get_all_records()
        for r in log_records:
            if r['ID_File'].strip() == file_id.strip():
                if r['Stato'].strip().lower() == "approvato":
                    return jsonify({"message": "File approvato. Non puoi eliminarlo."}), 403
                break
    
        # Elimina effettivamente su Drive
        try:
            drive_service.files().delete(fileId=file_id).execute()
            return jsonify({"message": "File eliminato"})
        except Exception as e:
            return jsonify({"message": "Errore durante l'eliminazione", "error": str(e)}), 500

# -------------------------------------------------------------------
#  D1) UPLOAD FILE DA ADMIN
# -------------------------------------------------------------------
# Visualizza pagina Admin upload
@app.route("/admin-upload")
def pagina_admin_upload():
    return send_from_directory(app.static_folder, "admin_upload.html")


# Ritorna tutti i clienti (visibili all’admin)
@app.route("/clienti-admin")
def get_clienti_admin():
    records = clienti_sheet.get_all_records()
    return jsonify(records)


# Admin carica un file
@app.route("/admin-upload/<id_cliente>", methods=["POST"])
def admin_upload_file(id_cliente):
    if 'file' not in request.files:
        return jsonify({"message": "Nessun file ricevuto"}), 400

    file = request.files['file']
    filename = file.filename
    data_oggi = datetime.today().strftime("%d/%m/%Y")

    # Trova ID_Agente del cliente
    clienti = clienti_sheet.get_all_records()
    agente_cliente = next((c["Agente"] for c in clienti if c["ID_Cliente"] == id_cliente), None)

    if not agente_cliente:
        return jsonify({"message": "Cliente non trovato"}), 404

    # Trova o crea cartella su Drive
    query = (f"name='{id_cliente}' and mimeType='application/vnd.google-apps.folder' "
             f"and '{main_folder_id}' in parents and trashed=false")
    results = drive_service.files().list(q=query, spaces='drive', fields="files(id, name)").execute()
    folders = results.get('files', [])
    if folders:
        folder_id = folders[0]['id']
    else:
        folder_metadata = {
            'name': id_cliente,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [main_folder_id]
        }
        folder = drive_service.files().create(body=folder_metadata, fields='id').execute()
        folder_id = folder.get('id')

    # Salva file temporaneo
    import shutil
    temp_fd, temp_path = tempfile.mkstemp()
    with os.fdopen(temp_fd, 'wb') as tmp:
        shutil.copyfileobj(file.stream, tmp)

    media = MediaFileUpload(temp_path)
    file_metadata = {'name': filename, 'parents': [folder_id]}
    uploaded = drive_service.files().create(body=file_metadata, media_body=media, fields='id').execute()
    file_id = uploaded.get('id')

    # Rendi il file visibile pubblicamente
    drive_service.permissions().create(
        fileId=file_id,
        body={
            "role": "reader",
            "type": "anyone",
            "allowFileDiscovery": False
        }
    ).execute()

    try:
        os.remove(temp_path)
    except Exception as e:
        print("⚠️ Impossibile eliminare il file temporaneo:", e)

    # Log
    try:
        filelog_sheet.append_row([
            file_id,
            id_cliente,
            filename,
            agente_cliente,
            data_oggi,
            "In attesa",
            "ADMIN",
            "FALSE"
        ])
    except Exception as e:
        return jsonify({"message": "File caricato, ma errore nel log", "error": str(e)}), 500

    return jsonify({"message": "File caricato correttamente da Admin"})


# -------------------------------------------------------------------
#  E) GESTIONE STATI, TIPI, ESITI (Impostazioni)
# -------------------------------------------------------------------
@app.route("/stati-cliente", methods=["GET"])
def get_stati_cliente():
    try:
        valori = impostazioni_sheet.col_values(3)
        stati = [v for v in valori if v.lower() != "stato_cliente" and v.strip() != ""]
        return jsonify(stati)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/tipi-interazione", methods=["GET"])
def get_tipi_interazione():
    try:
        valori = impostazioni_sheet.col_values(1)
        tipi = [v for v in valori if v.lower() != "tipo_interazione" and v.strip() != ""]
        return jsonify(tipi)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/esiti-interazione", methods=["GET"])
def get_esiti_interazione():
    try:
        valori = impostazioni_sheet.col_values(2)
        esiti = [v for v in valori if v.lower() != "esito_interazione" and v.strip() != ""]
        return jsonify(esiti)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------------------------------------------------
#  F) Quando l’agente apre i documenti → aggiorna
# -------------------------------------------------------------------
@app.route("/files/segna-letti/<id_cliente>", methods=["POST"])
def segna_letti_da_agente(id_cliente):
    if 'agente' not in session:
        return jsonify({"message": "Non autenticato"}), 401

    codice_agente = session['agente']
    log_records = filelog_sheet.get_all_records()

    for idx, row in enumerate(log_records):
        if (row.get("ID_Cliente") == id_cliente and
            row.get("Caricato_da") == "ADMIN" and
            row.get("Letto_da_Agente", "").strip().upper() != "TRUE" and
            row.get("ID_Agente") == codice_agente):

            riga_excel = idx + 2
            filelog_sheet.update(f"H{riga_excel}", [["TRUE"]])  # colonna H = Letto_da_Agente

    return jsonify({"message": "Aggiornamento completato"})


# -------------------------------------------------------------------
#  F) ROUTE PRINCIPALI DI AVVIO
# -------------------------------------------------------------------
@app.route("/")
def serve_login():
    return send_from_directory(app.static_folder, "login.html")

@app.route("/index.html")
def serve_index():
    if 'agente' not in session:
        return redirect("/")
    return send_from_directory(app.static_folder, "index.html")

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
