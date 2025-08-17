document.addEventListener('DOMContentLoaded', () => {
    const sourceInput = document.getElementById('source');
    const destinationInput = document.getElementById('destination');
    const startTimeInput = document.getElementById('startTime');
    const durationInput = document.getElementById('duration');
    const searchBtn = document.getElementById('searchBtn');
    const resultsDiv = document.getElementById('results');
    const graphDiv = document.getElementById('graph');

    let airports = [
        { IATA: 'JFK', Name: 'John F. Kennedy International Airport', City: 'New York', Country: 'United States' },
        { IATA: 'LAX', Name: 'Los Angeles International Airport', City: 'Los Angeles', Country: 'United States' },
        { IATA: 'LHR', Name: 'London Heathrow Airport', City: 'London', Country: 'United Kingdom' },
        { IATA: 'CDG', Name: 'Charles de Gaulle Airport', City: 'Paris', Country: 'France' },
        { IATA: 'HND', Name: 'Haneda Airport', City: 'Tokyo', Country: 'Japan' }
    ];
    let routes = [
        { Airline: 'AA', Src_Airport: 'JFK', Dst_Airport: 'LAX' },
        { Airline: 'BA', Src_Airport: 'JFK', Dst_Airport: 'LHR' },
        { Airline: 'AF', Src_Airport: 'LHR', Dst_Airport: 'CDG' },
        { Airline: 'JAL', Src_Airport: 'CDG', Dst_Airport: 'HND' },
        { Airline: 'AA', Src_Airport: 'LAX', Dst_Airport: 'HND' }
    ];

    // Load data
    async function loadData() {
        // Using sample data, no need to fetch
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
        const startTime = new Date(2021, 0, 1, hours, minutes);

        const mappedData = mapFlights(routes, startTime, duration);
        const paths = reduceFlights(mappedData, src, dst, startTime);

        displayResults(paths, src, dst);
        visualizePaths(paths.slice(0, 5), src, dst);
    });

    function mapFlights(data, startTime, durationHours) {
        const results = [];
        const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

        data.forEach((row, index) => {
            const departureTime = new Date(startTime.getTime() + (index % 24) * 60 * 60 * 1000);
            const arrivalTime = new Date(departureTime.getTime() + 2 * 60 * 60 * 1000); // Assume 2-hour flight

            if (departureTime >= startTime && departureTime <= endTime) {
                results.push({
                    src: row.Src_Airport,
                    dst: row.Dst_Airport,
                    depTime: departureTime,
                    arrTime: arrivalTime,
                    airline: row.Airline
                });
            }
        });
        return results;
    }

    function reduceFlights(mappedData, srcAirport, dstAirport, inputStartTime) {
        const routesFromAirport = new Map();
        for (const flight of mappedData) {
            if (!routesFromAirport.has(flight.src)) {
                routesFromAirport.set(flight.src, []);
            }
            routesFromAirport.get(flight.src).push(flight);
        }

        const allRoutes = [];

        function findPaths(startAirport, currentPath, currentTime, flightTimes, visited) {
            if (startAirport === dstAirport) {
                const totalTime = new Date(currentTime - flightTimes[0].depTime);
                const flightTime = flightTimes.reduce((acc, ft) => acc + (ft.arrTime - ft.depTime), 0);
                allRoutes.push({
                    path: [...currentPath],
                    totalTime: totalTime,
                    flightTime: new Date(flightTime),
                    startTime: flightTimes[0].depTime,
                    endTime: currentTime,
                    flights: flightTimes
                });
                return;
            }

            visited.add(startAirport);

            const flights = routesFromAirport.get(startAirport) || [];
            for (const flight of flights) {
                if (!visited.has(flight.dst) && currentTime <= flight.depTime) {
                    findPaths(flight.dst, [...currentPath, flight.dst], flight.arrTime, [...flightTimes, flight], new Set(visited));
                }
            }
        }

        findPaths(srcAirport, [srcAirport], inputStartTime, [], new Set());
        
        return allRoutes.sort((a, b) => a.totalTime - b.totalTime);
    }

    function displayResults(paths, src, dst) {
        if (paths.length === 0) {
            resultsDiv.innerHTML = `<p>No paths found from ${src} to ${dst}.</p>`;
            return;
        }

        let html = `<h2>Top 5 Paths from ${src} to ${dst}</h2>`;
        paths.slice(0, 5).forEach((p, i) => {
            html += `<p><b>Path ${i + 1}:</b> ${p.path.join(' -> ')} <br>
                       <b>Total Time:</b> ${msToTime(p.totalTime)} <br>
                       <b>Flight Time:</b> ${msToTime(p.flightTime)}</p>`;
        });
        resultsDiv.innerHTML = html;
    }

    function msToTime(duration) {
        const minutes = Math.floor((duration / (1000 * 60)) % 60);
        const hours = Math.floor((duration / (1000 * 60 * 60)));
        return `${hours}h ${minutes}m`;
    }

    function visualizePaths(paths, src, dst) {
        const nodes = new vis.DataSet();
        const edges = new vis.DataSet();
        const addedNodes = new Set();

        paths.forEach((p, i) => {
            const color = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'][i % 5];
            for (let j = 0; j < p.path.length - 1; j++) {
                const from = p.path[j];
                const to = p.path[j + 1];
                if (!addedNodes.has(from)) {
                    nodes.add({ id: from, label: from });
                    addedNodes.add(from);
                }
                if (!addedNodes.has(to)) {
                    nodes.add({ id: to, label: to });
                    addedNodes.add(to);
                }
                edges.add({ from: from, to: to, arrows: 'to', color: { color } });
            }
        });

        const data = { nodes, edges };
        const options = {
            nodes: {
                shape: 'dot',
                size: 20,
                font: {
                    size: 14
                }
            },
            edges: {
                width: 2
            }
        };
        new vis.Network(graphDiv, data, options);
    }

    loadData();
});
