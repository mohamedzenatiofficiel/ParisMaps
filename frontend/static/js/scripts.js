// scripts.js

// Initialisation de la carte
var map = L.map('map').setView([48.8566, 2.3522], 12);

// Ajouter une couche de fond
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

console.log('Carte initialisée');

// Fonction pour récupérer les données de l'API
async function getTravaux() {
    try {
        let response = await fetch('/travaux');
        if (!response.ok) {
            throw new Error('Erreur réseau: ' + response.statusText);
        }
        let data = await response.json();
        console.log('Données récupérées de l\'API:', data);  // Log des données
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des travaux:', error);
        return [];
    }
}

// Fonction pour ajouter des marqueurs à la carte
function addMarkers(travaux, waypoints) {
    travaux.forEach(travail => {
        if (travail.latitude && travail.longitude) {
            let travailLatLng = L.latLng(travail.latitude, travail.longitude);
            if (isCloseToRoute(travailLatLng, waypoints)) {
                var marker = L.marker(travailLatLng).addTo(map);
                marker.bindPopup(`
                    <strong>Num Emprise:</strong> ${travail.num_emprise}<br>
                    <strong>Arrondissement:</strong> ${travail.cp_arrondissement}<br>
                    <strong>Date Début:</strong> ${travail.date_debut}<br>
                    <strong>Date Fin:</strong> ${travail.date_fin}<br>
                    <strong>Catégorie:</strong> ${travail.chantier_categorie}<br>
                    <strong>MOA Principal:</strong> ${travail.moa_principal}<br>
                    <strong>Surface:</strong> ${travail.surface}<br>
                    <strong>Synthèse:</strong> ${travail.chantier_synthese}<br>
                    <strong>Localisation Détail:</strong> ${travail.localisation_detail}<br>
                    <strong>Localisation Stationnement:</strong> ${travail.localisation_stationnement}<br>
                    <strong>Demande Cité ID:</strong> ${travail.demande_cite_id}<br>
                    <strong>Chantier Cité ID:</strong> ${travail.chantier_cite_id}
                `);
            }
        } else {
            console.warn('Travail sans coordonnées:', travail);  // Log des travaux sans coordonnées
        }
    });
}

// Fonction pour vérifier si un point est proche de l'itinéraire
function isCloseToRoute(point, waypoints) {
    const threshold = 0.05;  // Distance en degrés (~5 km)
    return waypoints.some(wp => point.distanceTo(wp) < threshold * 1000);
}

// Variables pour stocker les points de départ et d'arrivée
var startPoint, endPoint;
var routingControl;

// Icônes personnalisées
var startIcon = L.icon({
    iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

var endIcon = L.icon({
    iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Fonction pour géocoder une adresse en utilisant Nominatim
async function geocode(address) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await response.json();
    if (data.length > 0) {
        const { lat, lon } = data[0];
        return L.latLng(lat, lon);
    } else {
        throw new Error('Adresse introuvable');
    }
}

// Fonction pour calculer l'itinéraire
async function calculateRoute() {
    const startAddress = document.getElementById('start').value;
    const endAddress = document.getElementById('end').value;

    try {
        startPoint = await geocode(startAddress);
        endPoint = await geocode(endAddress);

        // Ajouter des marqueurs pour les points A et B
        L.marker(startPoint, { icon: startIcon }).addTo(map).bindPopup('Point de départ').openPopup();
        L.marker(endPoint, { icon: endIcon }).addTo(map).bindPopup('Point d\'arrivée').openPopup();

        console.log('Points de départ et d\'arrivée ajoutés');

        // Mettre à jour le routage
        updateRouting();
    } catch (error) {
        console.error('Erreur lors du géocodage:', error);
    }
}

// Fonction pour mettre à jour le routage
function updateRouting() {
    if (startPoint && endPoint) {
        if (routingControl) {
            map.removeControl(routingControl);
        }
        routingControl = L.Routing.control({
            waypoints: [
                startPoint,
                endPoint
            ],
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1'
            }),
            routeWhileDragging: true
        }).addTo(map);

        routingControl.on('routesfound', function(e) {
            var routes = e.routes;
            var waypoints = routes[0].coordinates.map(coord => L.latLng(coord.lat, coord.lng));
            console.log('Itinéraire trouvé:', routes);
            // Récupérer et afficher les travaux proches de l'itinéraire
            getTravaux().then(travaux => addMarkers(travaux, waypoints));
        });
    }
}
