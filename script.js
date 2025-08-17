document.addEventListener('DOMContentLoaded', () => {
    const sourceInput = document.getElementById('sourceInput');
    const destinationInput = document.getElementById('destinationInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsDiv = document.getElementById('results');
    let airports = [];
    let routes = [];
    let airportsMap = new Map();
    let routesGraph = new Map();

    async function loadData() {
        try {
            const [airportsResponse, routesResponse] = await Promise.all([
                fetch('https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat'),
                fetch('https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat')
            ]);

            const airportsData = await airportsResponse.text();
            const routesData = await routesResponse.text();

            airports = airportsData.split('\n').map(line => {
                const parts = line.split(',').map(part => part.replace(/"/g, ''));
                const airport = {
                    id: parts[0],
                    name: parts[1],
                    city: parts[2],
                    country: parts[3],
                    iata: parts[4],
                    icao: parts[5]
                };
                if (airport.iata) {
                    airportsMap.set(airport.iata, airport);
                }
                return airport;
            });

            routes = routesData.split('\n').map(line => {
                const parts = line.split(',');
                const route = {
                    sourceAirport: parts[2],
                    destAirport: parts[4]
                };
                if (route.sourceAirport && route.destAirport) {
                    if (!routesGraph.has(route.sourceAirport)) {
                        routesGraph.set(route.sourceAirport, []);
                    }
                    routesGraph.get(route.sourceAirport).push(route.destAirport);
                }
                return route;
            });

            console.log('Airport and route data loaded, graph built.');
        } catch (error) {
            console.error('Failed to load data:', error);
            resultsDiv.innerHTML = '<p>Error loading data. Please try again later.</p>';
        }
    }

    function findShortestRoute(source, destination) {
        if (!routesGraph.has(source) || !airportsMap.has(destination)) {
            return null;
        }

        const queue = [[source]];
        const visited = new Set([source]);

        while (queue.length > 0) {
            const path = queue.shift();
            const airport = path[path.length - 1];

            if (airport === destination) {
                return path;
            }

            const neighbors = routesGraph.get(airport) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    const newPath = [...path, neighbor];
                    queue.push(newPath);
                }
            }
        }
        return null;
    }

    function displayRoute(path, source, destination) {
        const sourceName = airportsMap.get(source)?.name || source;
        const destName = airportsMap.get(destination)?.name || destination;

        if (!path) {
            resultsDiv.innerHTML = `<p>No route found from ${sourceName} to ${destName}.</p>`;
            return;
        }

        let html = `<h2>Shortest Route from ${sourceName} to ${destName}</h2>`;
        html += `<p>${path.map(iata => (airportsMap.get(iata)?.name || iata) + ` (${iata})`).join(' &rarr; ')}</p>`;
        resultsDiv.innerHTML = html;
    }

    searchBtn.addEventListener('click', () => {
        const sourceIata = sourceInput.value.toUpperCase().trim();
        const destinationIata = destinationInput.value.toUpperCase().trim();

        if (!sourceIata || !destinationIata) {
            alert('Please enter both source and destination airports.');
            return;
        }

        const path = findShortestRoute(sourceIata, destinationIata);
        displayRoute(path, sourceIata, destinationIata);
    });

    loadData();
});
