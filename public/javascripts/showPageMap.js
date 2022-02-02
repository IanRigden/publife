mapboxgl.accessToken = mapToken;
//Show our MapBox map
console.log(pub.geometry.coordinates);
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: pub.geometry.coordinates, // [-74.5, 40]  starting position [lng, lat]
    zoom: 9 // starting zoom
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

//Mapbox script for adding the marker to the map
new mapboxgl.Marker()
    .setLngLat(pub.geometry.coordinates)
    .setPopup(
        new mapboxgl.Popup({ offset: 25 })
            .setHTML(
                `<h3>${pub.title}</h3><p>${pub.location}</p>`
            )
    )
    .addTo(map)

