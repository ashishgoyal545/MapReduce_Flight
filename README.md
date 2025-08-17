# Flight Path Analysis using MapReduce and Sequential Search Algorithms

This project provides a comprehensive analysis of flight pathfinding algorithms, comparing the performance of sequential search methods (Depth-First Search and A* Heuristics Search) with a parallel MapReduce approach. The goal is to determine the most efficient method for calculating the temporal transitive closure on a large dataset of flight information.

## Project Overview

The project utilizes the OpenFlights dataset, which contains extensive information about airports, airlines, and flight routes. This data is represented as a directed graph where airports are nodes and flight routes are edges. The primary objective is to find optimal flight paths between two user-specified airports within a given time frame.

The project explores the following key aspects:
- **Temporal Transitive Closure:** Finding all possible paths between two airports that adhere to specific time constraints.
- **Algorithm Comparison:** Evaluating the performance of different search algorithms in terms of execution time, scalability, and path quality.
- **Path Optimization:** Identifying the best flight paths based on various criteria, such as:
    - Top 5 paths with the least total travel time.
    - Top 5 paths with the least flight time (excluding layovers).
    - Top 5 paths with the fewest number of stops.
- **Data Visualization:** Visualizing the flight paths on a graph to provide a clear and intuitive representation of the results.

## Dataset

The project uses the following data files from the OpenFlights dataset:
- `airports.dat`: Contains information about airports, including their IATA codes, names, locations (latitude and longitude), etc.
- `routes.dat`: Contains information about flight routes, including the source and destination airports, airline, etc.

## Algorithms Implemented

### 1. Sequential Search Algorithms

#### a) Depth-First Search (DFS)
An uninformed search algorithm that explores as far as possible along each branch before backtracking. It is used to find all possible paths between two airports.

#### b) A* Search
An informed search algorithm that uses a heuristic function to guide its search. In this project, the geographic distance between airports is used as the heuristic to find the shortest path. A* is generally more efficient than DFS for finding optimal paths.

### 2. Parallel Algorithm

#### MapReduce
A programming model for processing large datasets in parallel. The project implements a MapReduce algorithm to find flight paths, which is particularly effective for large-scale graph processing. The MapReduce approach involves two main phases:
- **Map Phase:** The flight data is processed and transformed into key-value pairs, where the source airport is the key.
- **Reduce Phase:** The mapped data is aggregated to find all possible flight paths between the source and destination airports.

## How to Run the Project

The project is implemented in a Jupyter Notebook (`Database_Project.ipynb`). To run the project, you will need to have Python installed, along with the following libraries:
- pandas
- networkx
- matplotlib

You can install these libraries using pip:
```bash
pip install pandas networkx matplotlib
```

The notebook is interactive and prompts the user to enter the following information:
- Source airport IATA code
- Destination airport IATA code
- Start time
- Time window (in hours)

The notebook will then execute the different search algorithms, display the results, and visualize the flight paths.

## Results and Conclusion

The project demonstrates that the MapReduce paradigm is generally more efficient for calculating the transitive closure of large graphs compared to sequential search algorithms. The experimental results show that MapReduce performs better, especially for deep graphs.

The project also provides a comparative analysis of the execution time of the A* and MapReduce algorithms, highlighting the trade-offs between path quality, memory usage, and scalability.

This project serves as a valuable resource for understanding and implementing different pathfinding algorithms for flight data analysis.
