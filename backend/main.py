from flask import Flask, request
from collections import defaultdict
import numpy as np
import json
app = Flask(__name__)

@app.route("/init")
def init():
    data = request.json
    f_data = []
    for u, v, time in data["edges"]:
        body = {
            "u": u,
            "v": v,
            "visibility": np.random.random(),
            "mobile_network": np.random.random(),
            "touristy": np.random.random(),
            "num_cctv": np.random.random(),
            "accidents": np.random.random(),
            "close_calls": np.random.random(),
            "charging_stations": np.random.random(),
            "width": np.random.random(),
            "bumps_and_potholes": np.random.random(),
            "noise": np.random.random(),
            "time": np.random.random(),
            "likeability": np.random.random()
        }
        f_data.append(body)
    return json.dumps(f_data)


@app.route("/find-likeability")
def find_likeability():
    user_preference = request.json['user_preference']
    edges = request.json['edges']

    # Use ML model for scoring once ready
    scores = [user_preference['safety'] * ((1 - edge['accidents']) + (1 - edge['close_calls'])) + \
        user_preference['smoothness'] * ((1 - edge['bumps_and_potholes']) + edge['width']) + \
        user_preference['ambience'] * (1 - edge['noise']) + \
        user_preference['privacy'] * (1 - edge['num_cctv']) + \
        user_preference['mobile_network'] * edge['mobile_network'] + \
        user_preference['view'] * (edge['touristy'] + edge['visibility']) + \
        user_preference['charging_stations'] * edge['charging_stations'] for edge in edges ]

    print(user_preference, edges, scores)
    return json.dumps(scores)

# self edges, self edges
class Graph1:
    def __init__(self):
        self.INF = 10**10
        self.graph = defaultdict(list)

    def build_graph(self, edges):
        for id, (u, v, t, l) in enumerate(edges):
            self.graph[u].append((v, t, l, id))
            self.graph[v].append((u, t, l, id))

    def distance(self, src, dst):
        dist, parent = {}, {}
        unvisited = set()
        for v in self.graph.keys():
            dist[v] = self.INF
            unvisited.add(v)
            parent[v] = (-1, -1)
        dist[src] = 0
        while (len(unvisited) > 0):
            minDistance = self.INF
            minVertex = src
            for v in unvisited:
                if dist[v] < minDistance:
                    minDistance = dist[v]
                    minVertex = v
            u = minVertex
            unvisited.remove(u)
            for nbrEdge in self.graph[u]:
                v, w, id = nbrEdge[0], float(nbrEdge[1]), nbrEdge[3]
                newD = dist[u] + w
                if newD < dist[v]:
                    dist[v] = newD
                    parent[v] = (id, u)

        path, curr = [], dst
        while curr != src:
            id = parent[curr][0]
            path.append(id)
            curr = parent[curr][1]
        path.reverse()
        return json.dumps({"dist": dist[dst], "path": path})

@app.route("/find-min-time-path")
def find_best_route():
    src = request.json['source']
    dst = request.json['destination']
    graph = request.json['graph']

    g = Graph1()
    g.build_graph(graph['edges'])
    return g.distance(src, dst)

# self edges, self edges
class Graph2:
    def __init__(self):
        self.INF = 10**10
        self.TMAX = 100
        self.NMAX = 200
        self.graph = defaultdict(list)

    def build_graph(self, edges):
        for id, (u, v, t, l) in enumerate(edges):
            if u == v:
                continue
            for ct in range(self.TMAX):
                if ct + t >= self.TMAX:
                    break
                self.graph[(u, ct)].append(((v, ct + t), -l, id))
                self.graph[(v, ct)].append(((u, ct + t), -l, id))

    def closest_route(self, src, dst, request_time):
        dist, parent = {}, {}
        history = defaultdict(list)
        for node in self.graph.keys():
            dist[node] = self.INF
            history[node[0]] = [node[0]]
            for u, _, _ in self.graph[node]:
                dist[u] = self.INF
                history[u[0]] = [u[0]]

        dist[(src, 0)] = 0
        for _ in range(len(self.graph.keys())):
            for u in self.graph.keys():
                for v, w, id in self.graph[u]:
                    if dist[u] != self.INF and dist[u] + w < dist[v] and v[0] not in history[u[0]]:
                        dist[v] = dist[u] + w
                        parent[v] = (u, id)
                        history[v[0]] = history[u[0]] + [v[0]]
        
        for u in self.graph.keys():
            for v, w, id in self.graph[u]:
                if dist[u] != self.INF and dist[u] + w < dist[v] and v[0] not in history[u[0]]:
                    print("Not Working!")
        
        best_likeability, node = 0, -1
        for t in range(request_time + 1):
            if dist[(dst, t)] < best_likeability:
                best_likeability = dist[(dst, t)]
                node = (dst, t)
            
        if node == -1:
            return ""
        
        curr = node
        path = []
        while curr != (src, 0):
            p, id = parent[curr]
            curr = p
            path.append(id)

        return json.dumps({"likeability": -1 * best_likeability, "path": path})
        

@app.route("/find-closest-route")
def find_closest_route():
    src = request.json['source']
    dst = request.json['destination']
    request_time = request.json['request_time']
    graph = request.json['graph']

    g = Graph2()
    g.build_graph(graph['edges'])
    return g.closest_route(src, dst, request_time)

app.run(debug=True)
