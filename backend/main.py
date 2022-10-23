from flask import Flask, request
from collections import defaultdict
import numpy as np
import json
from flask import Flask
from flask_cors import CORS, cross_origin

app = Flask(__name__)
cors = CORS(app, resources={r"/foo": {"origins": "*"}})
app.config["CORS_HEADERS"] = "Content-Type"
np.random.seed(0)


@app.route("/init", methods=["POST"])
@cross_origin(origin="*", headers=["Content-Type"])
def init():
    print(request)
    data = request.json
    print(data)
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
            "time": (time + 9) // 10,
            "likeability": np.random.random(),
        }
        f_data.append(body)

    return json.dumps(f_data)


@app.route("/find-likeability", methods=["POST"])
@cross_origin(origin="*", headers=["Content-Type"])
def find_likeability():
    user_preference = request.json["user_preference"]
    edges = request.json["edges"]

    # Use ML model for scoring once ready
    scores = {
        "data": [
            user_preference["safety"]
            * ((1 - edge["accidents"]) + (1 - edge["close_calls"]))
            + user_preference["smoothness"]
            * ((1 - edge["bumps_and_potholes"]) + edge["width"])
            + user_preference["ambience"] * (1 - edge["noise"])
            + user_preference["privacy"] * (1 - edge["num_cctv"])
            + user_preference["mobile_network"] * edge["mobile_network"]
            + user_preference["view"] * (edge["touristy"] + edge["visibility"])
            + user_preference["charging_stations"] * edge["charging_stations"]
            for edge in edges
        ]
    }

    # print(user_preference, edges, scores)
    # print(json.dumps(scores))
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
        while len(unvisited) > 0:
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


@app.route("/find-min-time-path", methods=["POST"])
@cross_origin(origin="*", headers=["Content-Type"])
def find_best_route():
    src = request.json["source"]
    dst = request.json["destination"]
    graph = request.json["graph"]

    g = Graph1()
    g.build_graph(graph["edges"])
    return g.distance(src, dst)


# self edges, self edges
class Graph2:
    def __init__(self):
        self.INF = 10**10
        self.TMAX = 100
        self.NMAX = 200
        self.graph = defaultdict(list)

    def build_graph(self, edges):
        # print(edges)
        for id, (u, v, t, l) in enumerate(edges):
            if u == v:
                continue
            for ct in range(self.TMAX):
                self.graph[(u, ct)] = []
                if ct + t >= self.TMAX:
                    break
                self.graph[(u, ct)].append(((v, ct + t), -l, id))
                self.graph[(v, ct)].append(((u, ct + t), -l, id))

    def closest_route(self, src, dst, request_time):
        dist, parent = {}, {}
        history = defaultdict(list)
        unvisited = set()
        for node in self.graph.keys():
            dist[node] = self.INF
            history[node[0]] = [node[0]]
            unvisited.add(node)

        dist[(src, 0)] = 0

        while len(unvisited) > 0:
            minDistance = self.INF
            minVertex = src
            for v in unvisited:
                if dist[v] < minDistance:
                    minDistance = dist[v]
                    minVertex = v
            if minDistance == self.INF:
                break
            u = minVertex
            if u[0] == dst:
                unvisited.remove(u)
                continue
            unvisited.remove(u)
            # print(u[0])
            for nbrEdge in self.graph[u]:
                v, w, id = nbrEdge[0], float(nbrEdge[1]), nbrEdge[2]
                newD = dist[u] + w
                print("V", v, newD)
                if newD < dist[v] and v[0] not in history[u[0]]:
                    print("V", v, newD)
                    dist[v] = newD
                    parent[v] = (id, u)
                    history[v[0]] = history[u[0]] + [v[0]]

        best_hate, node = self.INF, -1
        for t in range(request_time + 1):
            if (dst, t) in dist:
                print(dst, t, dist[(dst, t)])
            if (dst, t) in dist and dist[(dst, t)] < best_hate:
                best_hate = dist[(dst, t)]
                node = (dst, t)

        path, curr = [], node
        while curr != (src, 0):
            id = parent[curr][0]
            path.append(id)
            curr = parent[curr][1]
        path.reverse()
        return json.dumps({"likeability": 1 / best_hate, "path": path})


@app.route("/find-closest-route", methods=["POST"])
@cross_origin(origin="*", headers=["Content-Type"])
def find_closest_route():
    src = request.json["source"]
    dst = request.json["destination"]
    request_time = request.json["request_time"]
    graph = request.json["graph"]
    print(request.json)

    g = Graph2()
    g.build_graph(graph["edges"])
    return g.closest_route(src, dst, request_time)


app.run(debug=True)
