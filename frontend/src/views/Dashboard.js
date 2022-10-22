/*!

=========================================================
* Black Dashboard React v1.2.1
=========================================================

* Product Page: https://www.creative-tim.com/product/black-dashboard-react
* Copyright 2022 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/black-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from "react";
import mapboxgl from '!mapbox-gl';
// import MapboxDirections from "@mapbox/mapbox-gl-directions/src/directions";
// nodejs library that concatenates classes
import classNames from "classnames";
// react plugin used to create charts
import { Line, Bar } from "react-chartjs-2";
// const Map = mapboxgl({
//   accessToken
// });
// reactstrap components
import {
  Button,
  ButtonGroup,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
  Label,
  FormGroup,
  Input,
  Table,
  Row,
  Col,
  UncontrolledTooltip
} from "reactstrap";

// core components
import {
  chartExample1,
  chartExample2,
  chartExample3,
  chartExample4
} from "variables/charts.js";

const accessToken = "pk.eyJ1IjoicHVsYWttYWxob3RyYSIsImEiOiJja2s2dXZueWgwN21hMm5xem9jbTB1cTRrIn0.pDZFZ1HpWuDeGbYv0sH35w";

function Dashboard(props) {
  const [bigChartData, setbigChartData] = React.useState("data1");
  const setBgChartData = (name) => {
    setbigChartData(name);
  };
  const [longitude, setLongitude] = React.useState(78);
  const [latitude, setLatitude] = React.useState(17);
  const [zoom, setZoom] = React.useState(15);
  const mapContainerRef = React.useRef(null);
  navigator.geolocation.getCurrentPosition(position => {
    setLongitude(position.coords.longitude);
    setLatitude(position.coords.latitude);
    console.log(position.coords.longitude);
    console.log(position.coords.latitude);

    setZoom(5);

  },()=>{
    setLongitude(78);
    setLatitude(17);
    setZoom(5);
   
  },{enableHighAccuracy:true});
  React.useEffect(() => {
    
    mapboxgl.accessToken = accessToken;
    const map = new mapboxgl.Map({
         container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [latitude, longitude],
      zoom: zoom,
    });
    const nav = new mapboxgl.NavigationControl()
    map.addControl(nav)
  
    // var directions = new MapboxDirections({
    //   accessToken: mapboxgl.accessToken
    // })
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.on("move", () => {
      setLongitude(map.getCenter().longitude);
      setLatitude(map.getCenter().latitude);
      setZoom(map.getZoom().toFixed(2));
      });
  }, []);



  return (
    <>
      <div className="content">
        <div className="map__container" ref={mapContainerRef} style={{
          position: "absolute",
          top: "0",
          bottom: "0",
          left: "0",
          right: "0",
        }} />
      </div>
    </>
  );
}

export default Dashboard;
