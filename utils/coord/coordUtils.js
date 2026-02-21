function rad(d){return d*Math.PI/180}
function deg(r){return r*180/Math.PI}

function genCircleCoord(lon,lat,nm){
	const R=6371000
	const d=nm*1852
	const a=rad(lat)
	const b=rad(lon)
	const pts=[]

	for(let i=0;i<360;i++){
		const brg=rad(i)
		const lat2=Math.asin(Math.sin(a)*Math.cos(d/R)+Math.cos(a)*Math.sin(d/R)*Math.cos(brg))
		const lon2=b+Math.atan2(
			Math.sin(brg)*Math.sin(d/R)*Math.cos(a),
			Math.cos(d/R)-Math.sin(a)*Math.sin(lat2)
		)
		let lat = deg(lat2);
		let long = ((deg(lon2)+540)%360)-180;

		lat = parseFloat(lat.toFixed(4));
		long = parseFloat(long.toFixed(4));

		pts.push([ long,lat])
	}

	return pts
}


const R = 6371;
const NM_TO_KM = 1.852;

function rad(d){return d*Math.PI/180;}
function deg(r){return r*180/Math.PI;}

function bearing(lat1,lon1,lat2,lon2){
	const f1 = rad(lat1), f2 = rad(lat2), dL = rad(lon2-lon1);
	const y = Math.sin(dL)*Math.cos(f2);
	const x = Math.cos(f1)*Math.sin(f2)-Math.sin(f1)*Math.cos(f2)*Math.cos(dL);
	return (deg(Math.atan2(y,x))+360)%360;
}

function destination(lat,lon,distKm,brgDeg){
	const d = distKm/R, t = rad(brgDeg);
	const f1 = rad(lat), l1 = rad(lon);
	const sf1 = Math.sin(f1), cf1 = Math.cos(f1);
	const sd = Math.sin(d), cd = Math.cos(d), ct = Math.cos(t), st = Math.sin(t);

	const sf2 = sf1*cd+cf1*sd*ct;
	const f2 = Math.asin(sf2);
	const y = st*sd*cf1;
	const x = cd-sf1*sf2;
	const l2 = l1+Math.atan2(y,x);

	return {
		lat: deg(f2),
		lon: ((deg(l2)+540)%360)-180
	};
}

function genArcCoord(cLat,cLon,rNm,sLat,sLon,eLat,eLon,n){
	const rKm = rNm*NM_TO_KM;
	let b1 = bearing(cLat,cLon,sLat,sLon);
	let b2 = bearing(cLat,cLon,eLat,eLon);
	if(b2<=b1)b2+=360;
	const pts = [];
	for(let i=0;i<=n;i++){
		const t = i/n;
		const b = b1+t*(b2-b1);
		const p = destination(cLat,cLon,rKm,b);
		pts.push([p.lon,p.lat]);
	}
	return pts;
}


function densifyCoord(coords){

	if (Array.isArray(coords) && coords.every(Array.isArray)) {
		return coords;
	}
	if(!coords || coords.length == 0) return [];
	let coordArr =[];
	for(let i=0; i<coords.length; i++){
		let coo = coords[i];
		if(coo.type =='coord'){
			coordArr.push(coo.coords);
		}
		if(coo.type =='circle'){
			const circle = genCircleCoord(coo.coords[0],coo.coords[1],coo.radius)
			for(let d of circle){
				coordArr.push(d);
			}
		}
		if(coo.type =='arc' && i-1 >= 0 && i+1 <= coords.length){
			const coordAnt = coords[i-1];
			const coordSig = coords[i+1];

			const cLat = coo.coords[1], cLon =coo.coords[0];
			const sLat = coordAnt.coords[1], sLon = coordAnt.coords[0];
			const eLat =coordSig.coords[1] , eLon = coordSig.coords[0];
			const arcPoints = genArcCoord(cLat,cLon,coo.radius,sLat,sLon,eLat,eLon,100);

			for(let d of arcPoints){
				coordArr.push(d);
			}
		}
	}
	coordArr = coordArr.map(([a, b]) => [b, a]);
	return coordArr;
}


const turf = require('@turf/turf');
const greatCircle = require('@turf/great-circle').default; 





function geodesicRing(coords, { steps = 50, close = true } = {}) {
	const isPt = p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]);
	if (!Array.isArray(coords) || coords.length < 2 || coords.some(p => !isPt(p))) {
		return coords;
	}

	const toLonLat = ([lat, lng]) => [lng, lat];
	const toLatLng = ([lng, lat]) => [lat, lng];

	try {
		const out = [];
		const N = coords.length;
		const segCount = close ? N : N - 1;

		for (let i = 0; i < segCount; i++) {
			const a = toLonLat(coords[i]);
			const b = toLonLat(coords[(i + 1) % N]);

			const gc = greatCircle(a, b, { npoints: steps });
			let seg = gc?.geometry?.coordinates || [];

			seg = seg.map(toLatLng);

			if (seg.length) out.push(...(i ? seg.slice(1) : seg));
		}
		return out.length ? out : coords;
	} catch (e) {
		const msg = e?.message || String(e);
		return /GeoJSON Point|Array of numbers/i.test(msg) ? coords : (() => { throw e; })();
	}
}


function checkMultiPolygon(coords){
	return (
		coords &&
		Array.isArray(coords.coordsPolygon) &&
		coords.coordsPolygon.length > 0 &&
		coords.coordsPolygon.some(
			poly => Array.isArray(poly) && poly.length > 0
		)
	);
}

function _densifyCoordsRing(coords) {
	coords = densifyCoord(coords);
	return  geodesicRing(coords, { steps: 100, close: true });
}

function densifyCoordsRing(coords) {
	if(checkMultiPolygon(coords)){
		return coords.coordsPolygon.map((c)=>{
			return _densifyCoordsRing(c);
		})
	}
	else{
		return _densifyCoordsRing(coords);
	}

}


module.exports = {densifyCoordsRing};