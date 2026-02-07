

const templateCoord = { type: 'coord', radius: 0, coord: '' };

function filterCoords(str, arr){
	return arr.filter((i)=>{
		if(str.includes('LAUNCH PAD COORD:'+i.coord)){
			return false;
		}
		return true;
	})
}


function processCoord(str){

	const regexCoord2 = /\b(?<latg>\d{2})(?<latm>\d{2})(?<lats>\d{1,4})?(?<latl>[NS])[\s\/,]*(?<longg>\d{3})(?<lonm>\d{2})(?<lons>\d{1,4})?(?<lonl>[EW])\b/i;
	const regexCoord3 = /\b(?<latl>[NS])(?<latg>\d{2})(?<latm>\d{2})(?<lats>\d{1,4})[\s\/,]*(?<lonl>[EW])(?<longg>\d{3})(?<lonm>\d{2})(?<lons>\d{1,4})\b/i;
	let groups = str.match(regexCoord2) ??  str.match(regexCoord3);
	groups = groups.groups;
	let lat = (Number(groups.latg) + Number(groups.latm / 60) + Number((groups.lats ?? 0) / 3600)) * ((groups.latl == 'S')? -1 : 1);
	let lon = (Number(groups.longg) + Number(groups.lonm / 60) + Number((groups.lons ?? 0) / 3600)) * ((groups.lonl == 'W')? -1 : 1);

	lat= parseFloat(lat.toFixed(4));
	lon= parseFloat(lon.toFixed(4));
	return [lon,lat];
}

function getAeroNatCoord(str){
	str = str.replace(/\.(?!\d+NM)/g, "");

	const regexCoord = /\b\d{4,8}[NS][\s\/,]*\d{5,9}[EW]\b/gi;
	const regexCoord2 = /\b[NS]\d{4,8}[\s\/,]*[EW]\d{5,9}\b/gi;

	const arcsRegex = /\b(?<nm>\d+\.\d+|\d+)\s*NM\s+ARC\b[\s\S]{0,200}?(?<coord>\d{6}[NS]\d{7}[EW])/g;
	const circleRegex =/\b(?<nm>\d+\.\d+|\d+)\s*NM\s+RADIUS\b[\s\S]{0,200}?(?<coord>\d{6}[NS]\d{7}[EW])/g;
	const matches = [...str.matchAll(regexCoord),...str.matchAll(regexCoord2)];
	if (matches.length === 0) {
		return null;
	}
	else{
	}


	const polygons =[];

	for(let g of str.matchAll(arcsRegex)){
		const groups = g.groups;
		const coord = structuredClone(templateCoord);
		coord.type='arc';
		coord.radius=parseInt(groups.nm);
		coord.coord=groups.coord;
		polygons.push(coord);
	}


	for(let g of str.matchAll(circleRegex)){
		const groups = g.groups;
		const coord = structuredClone(templateCoord);
		coord.type='circle';
		coord.radius=(groups.nm);
		coord.coord=groups.coord;
		polygons.push(coord);
	}

	const Coorddata = [];
	for(let g of matches){
		let item = polygons.find(obj => obj.coord === g[0]);
		if(!item){
			item = structuredClone(templateCoord);
			item.coord = g[0];
		}
		item.coords = processCoord(item.coord);
		Coorddata.push(item);
	}
	if(Coorddata.length == 0 &&  polygons.length > 0){
		polygons.forEach((i)=>{
			i.coords = processCoord(i.coord);
			Coorddata.push(i);
		});
	}
	return filterCoords(str, Coorddata);
}

module.exports = getAeroNatCoord;
