import React, { useEffect } from "react";
import Header from "../components/Header";
import Plot from "react-plotly.js";
import axios from "axios";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import { createPortal } from "react-dom";

const Home = () => {
  const [src, setSrc] = React.useState([]);
  const [dst, setDst] = React.useState([]);
  const [rev, setRev] = React.useState(0);
  const [path, setPath] = React.useState([]);
  const [rawdata, setRawData] = React.useState(raw_data);
  const [edgeData, setEdgeData] = React.useState([]);
  const [editMode, setEditMode] = React.useState(false);
  const [v1, setv1] = React.useState([]);
  const [v2, setv2] = React.useState([]);
  const [minTime, setMinTime] = React.useState(-1);
  const categories = [
    "safety",
    "ambience",
    "privacy",
    "mobile_network",
    "view",
    "charging_stations",
    "smoothness"
  ];
  const edge_attrs = [
    "visibility",
    "mobile_network",
    "touristy",
    "num_cctv",
    "accidents",
    "close_calls",
    "charging_stations",
    "width",
    "bumps_and_potholes",
    "noise",
    "time",
    // "likeability",
  ];
  let init_pref = {};
  categories.map((x) => (init_pref[x] = 0.5));

  const [userPreferences, setUserPreferences] = React.useState(init_pref);
  let roadData = {};

  const nodes = {};
  raw_data["nodes"].map((x) => (nodes[x[0]] = x));

  useEffect(() => {
    let p = {};
    p["edges"] = rawdata["edges"];
    p["nodes"] = rawdata["nodes"].filter(
      (x) => x[0] != src[0] && x[0] != dst[0]
    );
    setRawData(p);
  }, [src, dst]);

  useEffect(async () => {
    // const d = await axios.post(, raw_data);
    // console.log(d);

    const data = await fetch("http://127.0.0.1:5000/init", {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(raw_data),
    });
    setEdgeData(await data.json());
  }, []);

  const edge_selected = v2.length != 0 && v1.length != 0;
  let eIdx = -1;
  console.log("fff", edge_selected);
  console.log(v1, v2);
  console.log(edgeData);
  let edge_sliders = <></>;
  if (edge_selected) {
    console.log(edgeData);
    for (let i = 0; i < edgeData.length; i++) {
      if (edgeData[i].u == v1[0] && edgeData[i].v == v2[0]) {
        eIdx = i;
        break;
      }
      if (edgeData[i].u == v2[0] && edgeData[i].v == v1[0]) {
        eIdx = i;
        break;
      }
    }
    console.log(eIdx);
    edge_sliders = [];
    roadData = edgeData[eIdx];
    for (const edge_attr of edge_attrs) {
      edge_sliders.push(
        <InputGroup className="mb-3">
          <InputGroup.Text id="inputGroup-sizing-default">
            {edge_attr}
          </InputGroup.Text>
          <Form.Control
            aria-label="Default"
            aria-describedby="inputGroup-sizing-default"
            defaultValue={edgeData[eIdx][edge_attr]}
            onChange={(e) => {
              roadData[edge_attr] = parseFloat(e.target.value);
            }}
          />
        </InputGroup>
      );
    }
    edge_sliders.push(
      <Button
        variant="primary"
        onClick={() => {
          setEdgeData([
            ...edgeData.slice(0, eIdx),
            roadData,
            ...edgeData.slice(eIdx + 1),
          ]);
          setv1([]);
          setv2([]);
          setEditMode(false);
        }}
      >
        Update Road
      </Button>
    );
  }

  let getMinDist = <></>;
  if (src.length > 0 && dst.length > 0) {
    getMinDist = (
      <Button
        variant="primary"
        onClick={async () => {
          const resp = await fetch("http://127.0.0.1:5000/find-min-time-path", {
            method: "POST",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              source: src[0],
              destination: dst[0],
              graph: { edges: edgeData.map((x) => [x.u, x.v, x.time, 0]) },
            }),
          });
          const data = await resp.json();
          console.log(data);
          const pathEdges = data["path"].map((x) => raw_data["edges"][x]);
          setPath(pathEdges);
          setMinTime(data["dist"]);
          console.log("Path edges", pathEdges, src, dst);
          setRev(rev + 1);
        }}
      >
        Get Optimal Route
      </Button>
    );
  }

  console.log(edgeData);

  const data = [
    {
      type: "scattermapbox",
      mode: "markers",
      lon: rawdata["nodes"].map((x) => x[2]),
      lat: rawdata["nodes"].map((x) => x[1]),
      hoverinfo: "text",
      hovertext: rawdata["nodes"].map((x) => x[0]),
    },
    path.length != 0
      ? {
          type: "scattermapbox",
          mode: "lines",
          lon: [src[2], ...path.map((x) => nodes[x[1]][2]), dst[2]],
          lat: [src[1], ...path.map((x) => nodes[x[1]][1]), dst[1]],
          line: {
            width: 3,
            color: "black",
          },
        }
      : {},
    src.length != 0
      ? {
          type: "scattermapbox",
          mode: "markers",
          lon: [src[2]],
          lat: [src[1]],
          hoverinfo: "text",
          marker: {
            size: 17,
            color: "red",
          },
          hovertext: [src[0]],
        }
      : {},
    dst.length != 0
      ? {
          type: "scattermapbox",
          mode: "markers",
          lon: [dst[2]],
          lat: [dst[1]],
          hoverinfo: "text",
          marker: {
            size: 17,
            color: "black",
          },
          hovertext: [dst[0]],
        }
      : {},
    v1.length != 0
      ? {
          type: "scattermapbox",
          mode: "markers",
          lon: [v1[2]],
          lat: [v1[1]],
          hoverinfo: "text",
          marker: {
            size: 10,
            color: "green",
          },
          hovertext: [v1[0]],
        }
      : {},
    v2.length != 0
      ? {
          type: "scattermapbox",
          mode: "markers",
          lon: [v2[2]],
          lat: [v2[1]],
          hoverinfo: "text",
          marker: {
            size: 10,
            color: "green",
          },
          hovertext: [v2[0]],
        }
      : {},
    v2.length != 0 && v1.length != 0
      ? {
          type: "scattermapbox",
          mode: "lines",
          lon: [v1[2], v2[2]],
          lat: [v1[1], v2[1]],
          line: {
            width: 3,
            color: "green",
          },
        }
      : {},
  ];

  const sliders = [];
  for (const category of categories) {
    sliders.push(
      <>
        <Form.Label>{category}</Form.Label>
        <Form.Range
          onChange={(x) => {
            setUserPreferences({
              ...userPreferences,
              [category]: Number(x.target.value) / 100.0,
            });
            console.log(userPreferences);
          }}
        />
      </>
    );
  }
  let pref_time = minTime;
  let likeable_stuff = <></>;
  if (minTime != -1){
    likeable_stuff = 
    <div>
        <InputGroup className="mb-3">
          <InputGroup.Text id="inputGroup-sizing-default">
            {"Maximum Time Available"}
          </InputGroup.Text>
          <Form.Control
            aria-label="Default"
            aria-describedby="inputGroup-sizing-default"
            defaultValue={minTime}
            onChange={(e) => {
              pref_time = Number(e.target.value)
            }}
          />
        </InputGroup>
        <Button variant="primary" onClick={
          async () => {
            const d = await fetch("http://127.0.0.1:5000/find-likeability", {
              method: "POST",
              mode: "cors",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_preference: userPreferences,
                edges: edgeData,
              }),
            });
            let data = await d.json();
            console.log(data);
            console.log("edgeData: ", edgeData);
            const resp = await fetch("http://127.0.0.1:5000/find-closest-route", {
              method: "POST",
              mode: "cors",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                source: src[0],
                destination: dst[0],
                graph: { edges: edgeData.map((x, i) => [x.u, x.v, x.time, data["data"][i]])},
                request_time: pref_time,
              }),
            });
            console.log("resp: ", resp);
            data = await resp.json();
            console.log(data);
            console.log(path);
            const pathEdges = data["path"].map((x) => raw_data["edges"][x]);
            setPath(pathEdges);
            console.log(pathEdges);
            // console.log("Path edges", pathEdges, src, dst);
            setRev(rev + 1);
          }
        }>Get Most Likable Route</Button>
      </div>
  }

  console.log(data);
  return (
    <React.Fragment>
      <Header title="Home" />
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Plot
            revision={rev}
            data={data}
            layout={{
              showlegend: false,
              autosize: true,
              hovermode: "closest",
              mapbox: {
                bearing: 0,
                center: {
                  lat: 52.361312532675555,
                  lon: 4.840440891420068,
                },
                pitch: 0,
                zoom: 15.75,
                datarevision: { rev },
              },
              margin: {
                l: 0,
                r: 0,
                b: 0,
                t: 0,
                pad: 4,
              },
              height: 650,
              width: 1000,
            }}
            config={{
              mapboxAccessToken:
                "pk.eyJ1IjoicHVsYWttYWxob3RyYSIsImEiOiJja2s2dXZueWgwN21hMm5xem9jbTB1cTRrIn0.pDZFZ1HpWuDeGbYv0sH35w",
            }}
            onClick={(x) => {
              console.log(x);
              const node = [
                x["points"][0]["hovertext"],
                x["points"][0]["lat"],
                x["points"][0]["lon"],
              ];
              if (editMode == false) {
                if (src.length == 0) {
                  setSrc(node);
                } else if (dst.length == 0) {
                  setDst(node);
                }
              } else {
                if (v1.length == 0) {
                  setv1(node);
                } else if (v2.length == 0) {
                  setv2(node);
                }
              }
            }}
          />
          <div>
            <button
              onClick={async (e) => {
                const ourPath = [1, 2, 3, 4, 5];
              }}
            >
              {" "}
              Calculate Optimal Path
            </button>
            <br></br>
            <button
              onClick={(e) => {
                setEditMode(!editMode);
              }}
            >
              Edit Mode
            </button>
            <div>
              <></>
            </div>
            {sliders}
          </div>
          <div>{edge_sliders}</div>
          {/* /End replace */}
          <div>{getMinDist}</div>
          <div>
              {likeable_stuff}
            </div>
        </div>
      </main>
    </React.Fragment>
  );
};

export default Home;

const raw_data = {
  nodes: [
    [46329203, 52.358576, 4.8374886],
    [46329409, 52.358573, 4.8368604],
    [46329410, 52.3585492, 4.8406314],
    [46329457, 52.3585647, 4.8355947],
    [46329516, 52.3585892, 4.8381166],
    [46329633, 52.3587141, 4.8387802],
    [46331848, 52.3592391, 4.8406165],
    [46332379, 52.3592831, 4.8355653],
    [46332380, 52.3592939, 4.8362114],
    [46332479, 52.3593037, 4.8366671],
    [46332481, 52.3593053, 4.8368549],
    [46332486, 52.3593104, 4.8375019],
    [46332487, 52.3593203, 4.8387694],
    [46332490, 52.3593414, 4.8407785],
    [46332529, 52.3593151, 4.8381319],
    [46332607, 52.3593335, 4.840447],
    [46332798, 52.3593542, 4.8431727],
    [46333591, 52.3594417, 4.8406106],
    [46335522, 52.3599269, 4.8366499],
    [46335667, 52.3599645, 4.8405929],
    [46336542, 52.3601969, 4.8405799],
    [46336632, 52.3602059, 4.8410789],
    [46337902, 52.3604664, 4.8374448],
    [46337905, 52.3605018, 4.8405628],
    [46342469, 52.3614334, 4.8405393],
    [46342537, 52.3614512, 4.8417156],
    [46342594, 52.3614465, 4.841405],
    [46342969, 52.3615902, 4.8354208],
    [46343024, 52.3616044, 4.8366037],
    [46343674, 52.3617557, 4.8405313],
    [46343706, 52.3617633, 4.8409783],
    [46343768, 52.3617608, 4.8413927],
    [46345063, 52.3620875, 4.8365906],
    [46345064, 52.3621065, 4.8381685],
    [46345065, 52.362115, 4.8392267],
    [46345159, 52.3621523, 4.8405215],
    [46346117, 52.3623293, 4.8365876],
    [46346209, 52.3623215, 4.8349506],
    [46346716, 52.3625353, 4.840948],
    [46347442, 52.36272, 4.84089],
    [46347861, 52.362784, 4.8361079],
    [46347923, 52.3627849, 4.8365723],
    [46348134, 52.3628346, 4.8405098],
    [46348398, 52.3630037, 4.8415708],
    [46348610, 52.3629958, 4.8405041],
    [46349861, 52.3632538, 4.8360809],
    [46350784, 52.3633976, 4.8351334],
    [46352535, 52.3639701, 4.8365581],
    [46352784, 52.3638593, 4.8365581],
    [46352785, 52.3640078, 4.8404686],
    [46352786, 52.3640518, 4.8441509],
    [46352876, 52.3639078, 4.8404723],
    [46353006, 52.3640641, 4.8351327],
    [46353009, 52.364079, 4.8363498],
    [46353176, 52.3641035, 4.8367209],
    [46353242, 52.3641016, 4.840289],
    [46353310, 52.3641258, 4.8406615],
    [46353511, 52.3641232, 4.8443178],
    [506743622, 52.3622985, 4.8392001],
    [1057816378, 52.3640536, 4.836716],
    [1057816391, 52.3641548, 4.8402892],
    [2613369564, 52.3604759, 4.8382852],
    [2952209635, 52.3638432, 4.8351342],
    [3923400534, 52.3590907, 4.8355732],
    [3923400535, 52.3590934, 4.8359246],
    [3923400536, 52.3590888, 4.8381271],
    [3923400537, 52.3590887, 4.8384592],
    [3923400538, 52.3590934, 4.8378246],
    [3923400539, 52.359091, 4.8374979],
    [3923400540, 52.3590793, 4.8371823],
    [3923400541, 52.3590769, 4.8368576],
    [4502050365, 52.3610577, 4.8393623],
    [4502050366, 52.361048, 4.8382643],
    [4502050429, 52.3604883, 4.8393727],
    [4502050874, 52.3621068, 4.8380689],
    [4946660079, 52.3612335, 4.8381153],
    [4946660080, 52.3612451, 4.8392633],
    [7431281909, 52.3641174, 4.8398825],
    [7431281914, 52.3640819, 4.8371185],
    [7431281915, 52.3641073, 4.8370354],
    [7431281919, 52.3641501, 4.8399388],
  ],
  edges: [
    [46329203, 3923400539, 57.269],
    [46329409, 3923400541, 56.032],
    [46329410, 46331848, 76.739],
    [46329457, 3923400534, 58.507],
    [46329516, 3923400536, 55.558],
    [46329633, 46332487, 67.441],
    [46331848, 46332490, 17.467],
    [46331848, 46329410, 76.739],
    [46332379, 46332380, 43.892],
    [46332379, 3923400534, 21.401],
    [46332380, 46332379, 43.892],
    [46332380, 46332479, 30.973],
    [46332479, 46332481, 12.757],
    [46332479, 46332380, 30.973],
    [46332479, 46335522, 69.306],
    [46332481, 46332486, 43.94],
    [46332481, 46332479, 12.757],
    [46332481, 3923400541, 25.428],
    [46332486, 46332529, 42.785],
    [46332486, 46332481, 43.94],
    [46332486, 3923400539, 24.398],
    [46332487, 46332529, 43.295],
    [46332487, 46332607, 114.04499999999999],
    [46332487, 46329633, 67.441],
    [46332490, 46332798, 162.593],
    [46332490, 46333591, 17.595999999999997],
    [46332529, 46332487, 43.295],
    [46332529, 46332486, 42.785],
    [46332529, 3923400536, 25.165999999999997],
    [46332607, 46332487, 114.045],
    [46332607, 46331848, 17.111],
    [46332798, 46352786, 582.5589999999999],
    [46332798, 46332490, 162.59300000000002],
    [46333591, 46335667, 58.145],
    [46333591, 46332607, 18.255],
    [46335522, 46335667, 267.78799999999995],
    [46335522, 46343024, 186.556],
    [46335522, 46332479, 69.306],
    [46335667, 46336542, 25.857],
    [46335667, 46333591, 58.145],
    [46336542, 46337905, 33.923],
    [46336542, 46335667, 25.857],
    [46336542, 46336632, 33.923],
    [46336632, 46336632, 225.298],
    [46336632, 46336632, 225.298],
    [46336632, 46336542, 33.923],
    [46337902, 2613369564, 57.078],
    [46337905, 46336542, 33.923],
    [46337905, 46342469, 103.603],
    [46337905, 4502050429, 80.82900000000001],
    [46342469, 46343674, 35.842],
    [46342469, 46342594, 58.803],
    [46342469, 46337905, 103.603],
    [46342537, 46342594, 21.098],
    [46342594, 46342537, 21.098],
    [46342594, 46343768, 34.959],
    [46342594, 46342469, 58.803],
    [46342969, 46343024, 80.339],
    [46343024, 46345063, 53.726],
    [46343024, 46342969, 80.339],
    [46343024, 46335522, 186.556],
    [46343674, 46345159, 44.105],
    [46343674, 46342469, 35.842],
    [46343674, 46343706, 30.374000000000002],
    [46343706, 46343768, 28.141],
    [46343706, 46346716, 85.867],
    [46343706, 46343674, 30.374000000000002],
    [46343768, 46342594, 34.959],
    [46343768, 46343706, 28.141],
    [46343768, 46346716, 112.449],
    [46345063, 46346117, 26.888],
    [46345063, 46343024, 53.726],
    [46345063, 4502050874, 100.409],
    [46345064, 46345065, 71.862],
    [46345064, 46347923, 181.48999999999998],
    [46345065, 46345159, 88.475],
    [46345065, 4946660080, 96.762],
    [46345159, 46343674, 44.105],
    [46345159, 46348134, 75.873],
    [46346117, 46347923, 50.671],
    [46346117, 46345063, 26.888],
    [46346117, 46346209, 111.161],
    [46346209, 46346117, 111.161],
    [46346716, 46347442, 20.912],
    [46346716, 46343706, 85.867],
    [46346716, 46343768, 112.44900000000001],
    [46347442, 46346716, 20.912],
    [46347861, 46349861, 52.272],
    [46347861, 46347923, 31.534],
    [46347923, 46346117, 50.671],
    [46347923, 46345064, 181.48999999999998],
    [46347923, 46352784, 119.475],
    [46347923, 46347861, 31.534],
    [46348134, 46348610, 17.929],
    [46348134, 46345159, 75.873],
    [46348134, 506743622, 146.07999999999998],
    [46348398, 46348610, 72.443],
    [46348610, 46348134, 17.929],
    [46348610, 46352876, 101.43299999999999],
    [46348610, 46348398, 72.443],
    [46349861, 46347861, 52.272],
    [46349861, 46350784, 79.01],
    [46349861, 46350784, 79.01],
    [46350784, 2952209635, 49.549],
    [46350784, 46349861, 79.00999999999999],
    [46350784, 46349861, 79.00999999999999],
    [46352535, 1057816378, 14.999],
    [46352535, 46352784, 12.32],
    [46352784, 46352876, 266.09400000000005],
    [46352784, 46352535, 12.32],
    [46352784, 46347923, 119.475],
    [46352784, 2952209635, 96.707],
    [46352785, 46352876, 11.122],
    [46352785, 46353310, 20.687999999999995],
    [46352786, 46332798, 582.559],
    [46352786, 46353511, 14.681999999999999],
    [46352876, 46352785, 11.122],
    [46352876, 46348610, 101.433],
    [46352876, 46352784, 266.09400000000005],
    [46353006, 46353009, 82.658],
    [46353006, 2952209635, 24.564999999999998],
    [46353009, 46353006, 82.658],
    [46353009, 46352535, 20.829],
    [46353242, 46352785, 17.214],
    [506743622, 46348134, 146.08],
    [1057816378, 46353176, 5.559],
    [1057816378, 7431281914, 27.898000000000003],
    [1057816391, 46353242, 5.99],
    [1057816391, 7431281919, 23.808999999999997],
    [2613369564, 46337902, 57.078],
    [2613369564, 4502050366, 63.631],
    [2613369564, 4502050429, 73.861],
    [2952209635, 46350784, 49.549],
    [2952209635, 46353006, 24.564999999999998],
    [2952209635, 46352784, 96.707],
    [3923400534, 46329457, 58.507],
    [3923400534, 3923400535, 23.865],
    [3923400534, 46332379, 21.401],
    [3923400535, 3923400534, 23.865],
    [3923400536, 46329516, 55.558],
    [3923400536, 3923400537, 22.552],
    [3923400536, 46332529, 25.166],
    [3923400537, 3923400536, 22.552],
    [3923400538, 3923400539, 22.187],
    [3923400539, 46329203, 57.269],
    [3923400539, 3923400538, 22.187],
    [3923400539, 46332486, 24.398],
    [3923400540, 3923400541, 22.051],
    [3923400541, 46329409, 56.032],
    [3923400541, 3923400540, 22.051],
    [3923400541, 46332481, 25.428],
    [4502050365, 4502050429, 63.318],
    [4502050366, 2613369564, 63.631],
    [4502050429, 4502050365, 63.318],
    [4502050429, 46337905, 80.82900000000001],
    [4502050429, 2613369564, 73.861],
    [4502050874, 46345064, 6.763],
    [4502050874, 4946660079, 97.158],
    [4946660079, 4502050874, 97.158],
    [4946660080, 46345065, 96.762],
    [7431281909, 7431281914, 187.724],
    [7431281909, 46353242, 28.157999999999998],
    [7431281914, 7431281915, 6.31],
    [7431281914, 7431281909, 187.724],
    [7431281915, 46353176, 21.364],
    [7431281919, 7431281909, 5.276],
  ],
};
