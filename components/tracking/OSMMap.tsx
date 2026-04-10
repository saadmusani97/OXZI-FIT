import { useRef, useEffect, memo, useMemo, useState } from 'react'
import { View } from 'react-native'
import { WebView } from 'react-native-webview'

interface Coord {
  latitude: number
  longitude: number
  timestamp?: number
  speedKmh?: number
}

interface OSMMapProps {
  center: Coord
  route: Coord[]
  style?: object
  mapRef?: React.RefObject<WebView | null>
  mapType?: 'standard' | 'satellite' | 'hybrid'
  showPointsOfInterest?: boolean
}

const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%;background:#0a0a0f}</style>
</head>
<body>
<div id="map"></div>
<script>
var map = L.map('map',{zoomControl:true,attributionControl:false}).setView([0,0],17);
var baseLayer = null;
var labelLayer = null;
var dot = L.divIcon({html:'<div style="width:16px;height:16px;background:#f97316;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px rgba(249,115,22,0.9)"></div>',iconSize:[16,16],iconAnchor:[8,8],className:''});
var marker = L.marker([0,0],{icon:dot,zIndexOffset:1000}).addTo(map);
var lineGlow = L.polyline([],{color:'#f97316',weight:11,opacity:0.24,lineCap:'round',lineJoin:'round'}).addTo(map);
var routeSegments = L.layerGroup().addTo(map);
var routePoints = [];
var startMarker = null;
var endMarker = null;
var startIcon = L.divIcon({html:'<div style="width:22px;height:22px;background:#22c55e;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px rgba(34,197,94,0.8)"></div>',iconSize:[22,22],iconAnchor:[11,11],className:''});
var endIcon = L.divIcon({html:'<div style="width:22px;height:22px;background:#ef4444;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px rgba(239,68,68,0.8)"></div>',iconSize:[22,22],iconAnchor:[11,11],className:''});
var following = true;
map.on('dragstart',function(){following=false});
function getTileOptions(url){
  if(url.indexOf('arcgisonline') !== -1){
    return {maxZoom:19};
  }
  return {maxZoom:20,subdomains:'abcd'};
}
function setLayer(target, url){
  if(target){map.removeLayer(target)}
  return L.tileLayer(url,getTileOptions(url)).addTo(map);
}
window.setMapStyle=function(type,showPoi){
  var baseUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  var labelsUrl = '';
  if(type === 'satellite'){
    baseUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  } else if(type === 'hybrid'){
    baseUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    labelsUrl = showPoi ? 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}' : '';
  } else {
    baseUrl = showPoi
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png';
  }
  baseLayer = setLayer(baseLayer, baseUrl);
  if(labelLayer){map.removeLayer(labelLayer);labelLayer=null}
  if(labelsUrl){
    labelLayer = L.tileLayer(labelsUrl,getTileOptions(labelsUrl)).addTo(map);
  }
};
window.setMapStyle('standard', true);
window.setLocation=function(lat,lng){
  marker.setLatLng([lat,lng]);
  if(following){map.panTo([lat,lng],{animate:true,duration:0.5,noMoveStart:true})}
};
function getSegmentColor(speedKmh){
  if(!speedKmh){return '#f97316'}
  if(speedKmh >= 10){return '#22c55e'}
  if(speedKmh >= 6){return '#facc15'}
  if(speedKmh >= 3){return '#f97316'}
  return '#ef4444'
}
function setEndMarker(latLng){
  if(endMarker){map.removeLayer(endMarker);endMarker=null}
  endMarker = L.marker(latLng,{icon:endIcon,zIndexOffset:901}).addTo(map);
}
function renderMarkers(){
  if(startMarker){map.removeLayer(startMarker);startMarker=null}
  if(endMarker){map.removeLayer(endMarker);endMarker=null}
  if(routePoints.length > 1){
    startMarker = L.marker([routePoints[0].latitude,routePoints[0].longitude],{icon:startIcon,zIndexOffset:900}).addTo(map);
    setEndMarker([routePoints[routePoints.length - 1].latitude,routePoints[routePoints.length - 1].longitude]);
  }
}
window.addPoint=function(point){
  var previous = routePoints[routePoints.length - 1];
  routePoints.push(point);
  var latLng = [point.latitude,point.longitude];
  lineGlow.addLatLng(latLng);
  if(previous){
    L.polyline([[previous.latitude,previous.longitude],latLng],{
      color:getSegmentColor(point.speedKmh),
      weight:5,
      opacity:1,
      lineCap:'round',
      lineJoin:'round'
    }).addTo(routeSegments);
    renderMarkers();
  }
  marker.setLatLng(latLng);
  if(following){map.panTo(latLng,{animate:true,duration:0.5,noMoveStart:true})}
};
window.setRoute=function(points){
  routePoints = points.slice();
  var latLngs = points.map(function(point){return [point.latitude,point.longitude]});
  lineGlow.setLatLngs(latLngs);
  routeSegments.clearLayers();
  for(var i=1;i<points.length;i++){
    L.polyline([[points[i-1].latitude,points[i-1].longitude],[points[i].latitude,points[i].longitude]],{
      color:getSegmentColor(points[i].speedKmh),
      weight:5,
      opacity:1,
      lineCap:'round',
      lineJoin:'round'
    }).addTo(routeSegments);
  }
  renderMarkers();
  if(latLngs.length > 0){
    marker.setLatLng(latLngs[latLngs.length - 1]);
    if(following){map.panTo(latLngs[latLngs.length - 1],{animate:true,duration:0.5,noMoveStart:true})}
  }
};
window.clearRoute=function(){
  routePoints = [];
  lineGlow.setLatLngs([]);
  routeSegments.clearLayers();
  if(startMarker){map.removeLayer(startMarker);startMarker=null}
  if(endMarker){map.removeLayer(endMarker);endMarker=null}
  following=true;
};
window.fitRoute=function(){
  if(lineGlow.getLatLngs().length < 2){return}
  following=false;
  map.fitBounds(lineGlow.getBounds(),{padding:[32,32],animate:true});
};
window.recenter=function(){
  following=true;
  map.panTo(marker.getLatLng(),{animate:true});
};
window.ReactNativeWebView.postMessage('ready');
</script>
</body>
</html>`

function OSMMap({
  center,
  route,
  style,
  mapRef,
  mapType = 'standard',
  showPointsOfInterest = true,
}: OSMMapProps) {
  const internalRef = useRef<WebView>(null)
  const ref = mapRef ?? internalRef
  const [mapReady, setMapReady] = useState(false)
  const routeJson = useMemo(() => JSON.stringify(route), [route])
  const source = useMemo(() => ({ html: MAP_HTML }), [])
  const lastRouteLengthRef = useRef(0)
  const lastRouteJsonRef = useRef('')

  function onMessage(e: { nativeEvent: { data: string } }) {
    if (e.nativeEvent.data === 'ready') {
      setMapReady(true)
    }
  }

  useEffect(() => {
    if (!mapReady) return
    ref.current?.injectJavaScript(`window.setLocation(${center.latitude},${center.longitude});true;`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.latitude, center.longitude, mapReady])

  useEffect(() => {
    if (!mapReady) return
    ref.current?.injectJavaScript(`window.setMapStyle('${mapType}',${showPointsOfInterest ? 'true' : 'false'});true;`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, mapType, showPointsOfInterest])

  useEffect(() => {
    if (!mapReady) return
    const isInitialSync = lastRouteJsonRef.current === ''
    const routeShrank = route.length < lastRouteLengthRef.current
    const routeMutatedWithoutGrowth = route.length === lastRouteLengthRef.current && routeJson !== lastRouteJsonRef.current

    if (isInitialSync || routeShrank || routeMutatedWithoutGrowth) {
      ref.current?.injectJavaScript(`window.setRoute(${routeJson});true;`)
      lastRouteLengthRef.current = route.length
      lastRouteJsonRef.current = routeJson
      return
    }
    for (let i = lastRouteLengthRef.current; i < route.length; i++) {
      ref.current?.injectJavaScript(`window.addPoint(${JSON.stringify(route[i])});true;`)
    }
    lastRouteLengthRef.current = route.length
    lastRouteJsonRef.current = routeJson
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.length, routeJson, mapReady])

  return (
    <View style={[{flex:1},style]}>
      <WebView
        ref={ref}
        source={source}
        style={{flex:1,backgroundColor:'#0a0a0f'}}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        onMessage={onMessage}
      />
    </View>
  )
}

export default memo(OSMMap)
