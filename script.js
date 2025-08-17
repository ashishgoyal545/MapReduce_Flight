document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sourceInput = document.getElementById('sourceInput');
    const destinationInput = document.getElementById('destinationInput');
    const startTimeInput = document.getElementById('startTime');
    const durationInput = document.getElementById('duration');
    const searchBtn = document.getElementById('searchBtn');
    const resultsDiv = document.getElementById('results');
    const airportsList = document.getElementById('airports-list');
    const graphDiv = document.getElementById('graph');
    const optimalBtn = document.getElementById('optimalBtn');
    const top5Btn = document.getElementById('top5Btn');
    const worst5Btn = document.getElementById('worst5Btn');

    // Data stores
    let airports = [];
    let airportsMap = new Map();
    let allFoundRoutes = [];

    // Load data
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
                if (airport.iata && airport.name) airportsMap.set(airport.iata, airport);
                return airport;
            }).filter(a => a.iata && a.name);

            let optionsHtml = '';
            airports.forEach(a => optionsHtml += `<option value="${a.iata}">${a.name}, ${a.city}</option>`);
            airportsList.innerHTML = optionsHtml;

            window.routesData = routesData.split('\n').map(line => {
                const parts = line.split(',');
                return { src: parts[2], dst: parts[4], airline: parts[0] };
            });

            console.log('Data loaded.');
        } catch (error) {
            console.error('Failed to load data:', error);
            resultsDiv.innerHTML = '<p>Error loading data.</p>';
        }
    }

    // MapReduce Implementation
    function mapFlights(routes, startTime, durationHours) {
        return routes.map((route, index) => {
            const departureTime = new Date(startTime.getTime() + (index % 24) * 3600 * 1000);
            const arrivalTime = new Date(departureTime.getTime() + (2 + Math.random() * 8) * 3600 * 1000);
            if (departureTime >= startTime && (departureTime - startTime) / 3600000 <= durationHours) {
                return { src: route.src, dst: route.dst, dep: departureTime, arr: arrivalTime, airline: route.airline };
            }
        }).filter(Boolean);
    }

    function reduceFlights(mappedData, src, dst, startTime) {
        const routesFromAirport = new Map();
        mappedData.forEach(flight => {
            if (!routesFromAirport.has(flight.src)) routesFromAirport.set(flight.src, []);
            routesFromAirport.get(flight.src).push(flight);
        });

        const allPaths = [];
        const queue = [[src, [src], startTime, []]]; // [airport, path, currentTime, flightDetails]

        while (queue.length > 0) {
            const [current, path, currentTime, flightDetails] = queue.shift();

            if (current === dst) {
                const totalTime = (currentTime - flightDetails[0].dep) / 3600000;
                const flightTime = flightDetails.reduce((acc, f) => acc + (f.arr - f.dep), 0) / 3600000;
                allPaths.push({ path, totalTime, flightTime, details: flightDetails });
                continue;
            }

            const neighbors = routesFromAirport.get(current) || [];
            for (const flight of neighbors) {
                if (!path.includes(flight.dst) && currentTime <= flight.dep) {
                    const newPath = [...path, flight.dst];
                    const newDetails = [...flightDetails, flight];
                    queue.push([flight.dst, newPath, flight.arr, newDetails]);
                }
            }
        }
        return allPaths.sort((a, b) => a.totalTime - b.totalTime);
    }

    // UI Functions
    function displayPaths(paths) {
        if (!paths || paths.length === 0) {
            resultsDiv.innerHTML = '<p>No paths found.</p>';
            return;
        }
        let html = '<ul>';
        paths.forEach((p, i) => {
            const pathStr = p.path.join(' -> ');
            html += `<li><b>Path ${i + 1}:</b> ${pathStr}<br>
                         Total Time: ${p.totalTime.toFixed(2)}h, Flight Time: ${p.flightTime.toFixed(2)}h</li>`;
        });
        html += '</ul>';
        resultsDiv.innerHTML = html;
    }

    function visualizePaths(paths) {
        const nodes = new vis.DataSet();
        const edges = new vis.DataSet();
        const addedNodes = new Set();

        paths.forEach((p, i) => {
            const color = ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6'][i % 5];
            p.path.forEach((airport, j) => {
                if (!addedNodes.has(airport)) {
                    const airportInfo = airportsMap.get(airport);
                    nodes.add({
                        id: airport,
                        label: airport,
                        title: airportInfo ? `${airportInfo.name}\n${airportInfo.city}, ${airportInfo.country}` : airport,
                        level: j // Assign level for hierarchical layout
                    });
                    addedNodes.add(airport);
                }
                if (j > 0) {
                    const flight = p.details[j - 1];
                    edges.add({
                        from: p.path[j - 1],
                        to: airport,
                        arrows: 'to',
                        color: { color, highlight: '#ff0000' },
                        label: flight.airline,
                        title: `Airline: ${flight.airline}<br>Dep: ${flight.dep.toLocaleTimeString()}<br>Arr: ${flight.arr.toLocaleTimeString()}`
                    });
                }
            });
        });

        const options = {
            layout: {
                hierarchical: {
                    enabled: true,
                    direction: 'LR', // Left to Right
                    sortMethod: 'directed',
                    nodeSpacing: 200,
                    treeSpacing: 250
                }
            },
            edges: {
                smooth: {
                    enabled: true,
                    type: "cubicBezier",
                    forceDirection: "horizontal",
                    roundness: 0.4
                },
                font: { size: 12, align: 'middle' },
                arrows: { to: { enabled: true, scaleFactor: 0.8 } }
            },
            nodes: {
                shape: 'box',
                size: 25,
                font: { size: 16, color: '#333' },
                borderWidth: 2,
                margin: 10
            },
            physics: {
                enabled: false // Disable physics for hierarchical layout
            },
            interaction: {
                hover: true,
                tooltipDelay: 200,
                dragNodes: false,
                dragView: true,
                zoomView: true
            }
        };
        new vis.Network(graphDiv, { nodes, edges }, options);
    }

    // Event Listeners
    searchBtn.addEventListener('click', () => {
        const src = sourceInput.value.toUpperCase();
        const dst = destinationInput.value.toUpperCase();
        const startTimeStr = startTimeInput.value;
        const duration = parseInt(durationInput.value, 10);

        if (!src || !dst || !startTimeStr || !duration) {
            alert('Please fill all fields.');
            return;
        }

        const [hours, minutes] = startTimeStr.split(':');
        const startTime = new Date();
        startTime.setHours(hours, minutes, 0, 0);

        const mapped = mapFlights(window.routesData, startTime, duration);
        allFoundRoutes = reduceFlights(mapped, src, dst, startTime);
        
        displayPaths(allFoundRoutes.slice(0, 5)); // Show top 5 by default
        visualizePaths(allFoundRoutes.slice(0, 5));
    });

    optimalBtn.addEventListener('click', () => {
        if (allFoundRoutes.length > 0) {
            const optimal = [allFoundRoutes[0]];
            displayPaths(optimal);
            visualizePaths(optimal);
        }
    });

    top5Btn.addEventListener('click', () => {
        if (allFoundRoutes.length > 0) {
            const top5 = allFoundRoutes.slice(0, 5);
            displayPaths(top5);
            visualizePaths(top5);
        }
    });

    worst5Btn.addEventListener('click', () => {
        if (allFoundRoutes.length > 0) {
            const worst5 = allFoundRoutes.slice(-5).reverse();
            displayPaths(worst5);
            visualizePaths(worst5);
        }
    });

    loadData();
});
