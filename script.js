document.addEventListener('DOMContentLoaded', () => {
    const sourceInput = document.getElementById('sourceInput');
    const destinationInput = document.getElementById('destinationInput');
    const startTimeInput = document.getElementById('startTime');
    const durationInput = document.getElementById('duration');
    const searchBtn = document.getElementById('searchBtn');
    const resultsDiv = document.getElementById('results');
    const airportsList = document.getElementById('airports-list');

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
                const airport = { id: parts[0], name: parts[1], city: parts[2], country: parts[3], iata: parts[4] };
                if (airport.iata && airport.name) {
                    airportsMap.set(airport.iata, airport);
                }
                return airport;
            }).filter(a => a.iata && a.name); // Filter out invalid entries

            // Populate datalist for dropdowns
            let optionsHtml = '';
            airports.forEach(airport => {
                optionsHtml += `<option value="${airport.iata}">${airport.name}, ${airport.city}</option>`;
            });
            airportsList.innerHTML = optionsHtml;

            routesData.split('\n').forEach(line => {
                const parts = line.split(',');
                const sourceAirport = parts[2];
                const destAirport = parts[4];
                if (sourceAirport && destAirport) {
                    if (!routesGraph.has(sourceAirport)) {
                        routesGraph.set(sourceAirport, []);
                    }
                    // Simulate flight times for logic
                    routesGraph.get(sourceAirport).push({
                        destination: destAirport,
                        departureTime: Math.floor(Math.random() * 24), // Random hour
                        flightDuration: 2 + Math.random() * 8 // Random duration 2-10 hours
                    });
                }
            });

            console.log('Airport and route data loaded.');
        } catch (error) {
            console.error('Failed to load data:', error);
            resultsDiv.innerHTML = '<p>Error loading data. Please try again later.</p>';
        }
    }

    function findPaths(startNode, endNode, startTime, maxDuration) {
        const allPaths = [];
        const queue = [[startNode, [startNode], startTime]]; // [currentAirport, path, currentTime]

        while (queue.length > 0) {
            const [currentAirport, path, currentTime] = queue.shift();

            if (currentAirport === endNode) {
                allPaths.push({ path, totalTime: (currentTime - startTime) / 3600000 });
                continue;
            }

            const destinations = routesGraph.get(currentAirport) || [];
            for (const flight of destinations) {
                const arrivalTime = new Date(currentTime.getTime() + flight.flightDuration * 3600000);
                if ((arrivalTime - startTime) / 3600000 <= maxDuration && !path.includes(flight.destination)) {
                    const newPath = [...path, flight.destination];
                    queue.push([flight.destination, newPath, arrivalTime]);
                }
            }
        }
        return allPaths.sort((a, b) => a.totalTime - b.totalTime);
    }

    function displayResults(paths, src, dst) {
        if (paths.length === 0) {
            resultsDiv.innerHTML = `<p>No paths found from ${src} to ${dst} within the given time.</p>`;
            return;
        }

        let html = `<h2>Top 5 Paths from ${src} to ${dst}</h2>`;
        paths.slice(0, 5).forEach((p, i) => {
            const pathAirports = p.path.map(iata => airportsMap.get(iata)?.name || iata).join(' -> ');
            html += `<p><b>Path ${i + 1}:</b> ${pathAirports} <br>
                       <b>Total Time:</b> ${p.totalTime.toFixed(2)} hours</p>`;
        });
        resultsDiv.innerHTML = html;
    }

    searchBtn.addEventListener('click', () => {
        const src = sourceInput.value.toUpperCase();
        const dst = destinationInput.value.toUpperCase();
        const startTimeStr = startTimeInput.value;
        const duration = parseInt(durationInput.value, 10);

        if (!src || !dst || !startTimeStr || !duration) {
            alert('Please fill in all fields.');
            return;
        }

        const [hours, minutes] = startTimeStr.split(':');
        const startTime = new Date();
        startTime.setHours(hours, minutes, 0, 0);

        const paths = findPaths(src, dst, startTime, duration);
        displayResults(paths, src, dst);
    });

    loadData();
});
