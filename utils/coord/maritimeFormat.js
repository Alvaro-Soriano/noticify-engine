const templateCoord = { type: 'coord', radius: 0, coord: '' };

function formatLongLat(longg,lonm,lons,lonl,latg,latm,lats,latl){
	let lon = (Number(longg) + Number(lonm / 60) + Number((lons ?? 0) / 3600)) * ((lonl == 'W')? -1 : 1);
	let lat = (Number(latg) + Number(latm / 60) + Number((lats ?? 0) / 3600)) * ((latl == 'S')? -1 : 1);
	lon= parseFloat(lon.toFixed(4));
	lat= parseFloat(lat.toFixed(4));

	return [lon,lat];
}


function findCoordsinareaboundby(str){
	const regex = /IN AREA BOUND BY([\s\S]*?)(?=IN AREA BOUND BY|$)/gi;
	const formatCoord = /\b(?<latg>\d{2})-(?<latm>\d{2}).(?<lats>\d{1,4})?(?<latl>[NS])\s(?<longg>\d{2,3})-(?<lonm>\d{2}).(?<lons>\d{1,4})?(?<lonl>[EW])\b/gi;

	let coordsPolygon = [];
	let i = 0;
	let z = 0;

	for(let m of str.matchAll(regex)){
		let polygon = [];
		for(let finds of m[1].matchAll(formatCoord)){
			let groups = finds.groups;
			item = structuredClone(templateCoord);
			item.coords = formatLongLat(groups.longg,groups.lonm,groups.lons,groups.lonl,groups.latg,groups.latm,groups.lats,groups.latl);
			item.coord = finds[0];
			polygon.push(item);
		}
		i++;
		if(polygon.length > 0) coordsPolygon.push(polygon);
	}

	return coordsPolygon.length>0 ? {coordsPolygon} : null;
}

function findCoordsA(str){
	let regexF= /\b[A-Z]\.\s\d{2}-\d{2}(?:\.\d{1,4})?[NS]\s\d{2,3}-\d{2}(?:\.\d{1,4})?[EW]\b/;
	let prueba = !regexF.test(str);


	if(prueba) return;

	let regex = /\b(?:(?<prefix>[A-Z])\.\s)?(?<latg>\d{2})-(?<latm>\d{2})(?:\.(?<lats>\d{1,4}))?(?<latl>[NS])\s(?<longg>\d{2,3})-(?<lonm>\d{2})(?:\.(?<lons>\d{1,4}))?(?<lonl>[EW])\b/gi;
	
	const coordsPolygon = [];
	let grupo = [],
	prev = null;

	for (let m of str.matchAll(regex)) {
		let groups = m.groups;
		const p = groups.prefix;

		if (p && prev && p !== prev) {
			coordsPolygon.push(grupo);
			grupo = [];
		}

		const item = structuredClone(templateCoord);
		item.coords = formatLongLat(groups.longg,groups.lonm,groups.lons,groups.lonl,groups.latg,groups.latm,groups.lats,groups.latl);
		item.coord = m[0];

		if (p) prev = p;
		grupo.push(item);
	}

	if (grupo.length) coordsPolygon.push(grupo);

	return coordsPolygon.length ? {coordsPolygon} : null;
}

function getMaritCoord(str){
	const areaCoords = findCoordsinareaboundby(str);
	const CoordsA = findCoordsA(str);
	return areaCoords || CoordsA;
}

module.exports = getMaritCoord;