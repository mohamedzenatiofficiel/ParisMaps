import os
from flask import Flask, jsonify, request, send_from_directory
from google.cloud import bigquery
from flask_cors import CORS

# Définir le chemin vers votre fichier de clé de compte de service
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "service-account-file.json"

app = Flask(__name__, static_folder='../frontend/static', static_url_path='/static')
CORS(app)  # Permettre CORS pour toutes les routes

# Initialiser le client BigQuery
client = bigquery.Client()

# Définir votre requête SQL
QUERY = """
    SELECT
        num_emprise,
        cp_arrondissement,
        date_debut,
        date_fin,
        chantier_categorie,
        moa_principal,
        surface,
        chantier_synthese,
        localisation_detail,
        localisation_stationnement,
        demande_cite_id,
        chantier_cite_id,
        longitude,
        latitude
    FROM `newmap-427113.dataset.data`
    
"""

@app.route('/travaux', methods=['GET'])
def get_travaux():
    try:
        query_job = client.query(QUERY)  # Exécuter la requête
        results = query_job.result()  # Récupérer les résultats
        travaux = []

        for row in results:
            travaux.append({
                "num_emprise": row["num_emprise"],
                "cp_arrondissement": row["cp_arrondissement"],
                "date_debut": row["date_debut"].isoformat() if row["date_debut"] else None,
                "date_fin": row["date_fin"].isoformat() if row["date_fin"] else None,
                "chantier_categorie": row["chantier_categorie"],
                "moa_principal": row["moa_principal"],
                "surface": row["surface"],
                "chantier_synthese": row["chantier_synthese"],
                "localisation_detail": row["localisation_detail"],
                "localisation_stationnement": row["localisation_stationnement"],
                "demande_cite_id": row["demande_cite_id"],
                "chantier_cite_id": row["chantier_cite_id"],
                "longitude": row["longitude"],
                "latitude": row["latitude"]
            })

        return jsonify(travaux)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def serve_index():
    return send_from_directory('../frontend', 'index.html')

if __name__ == '__main__':
    app.run(debug=True)
