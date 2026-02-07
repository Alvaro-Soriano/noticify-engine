
const templateCoord = { type: 'coord', radius: 0, coord: '' };

function processCoord(str){
	const reCoord = /(?<latg>\d{2})-(?<latm>\d{2})(-(?<lats>\d{2}(\.\d{1,3})?))?(?<latl>[NS])[\s\S]*?(?<longg>\d{3})-(?<lonm>\d{2})(-(?<lons>\d{2}(\.\d{1,3})?))?(?<lonl>[EW])/i;
	let groups = str.match(reCoord);
	groups = groups.groups;
	let lat = (Number(groups.latg) + Number(groups.latm / 60) + Number((groups.lats ?? 0) / 3600)) * ((groups.latl == 'S')? -1 : 1);
	let lon = (Number(groups.longg) + Number(groups.lonm / 60) + Number((groups.lons ?? 0) / 3600)) * ((groups.lonl == 'W')? -1 : 1);

	lat= parseFloat(lat.toFixed(4));
	lon= parseFloat(lon.toFixed(4));
	return [lon,lat];
}

function geBNMCoordWordy(str){

	const latRegex= /(?<lg>\d{2,3})\s*DEGREES\s*(?<lm>\d{2,3})\s*MINUTES\s*(?<ll>(EAST|WEST))/gi;
	const lonRegex= /(?<lg>\d{2,3})\s*DEGREES\s*(?<lm>\d{2,3})\s*MINUTES\s*(?<ll>(NORTH|SOUTH))/gi;
	let coords = [];
	let latArr = [];
	let lonArr = [];
	for(let a of str.matchAll(latRegex)){
		let n = parseFloat(((Number(a.groups.lg) + Number(a.groups.lm / 60)) * ((a.groups.ll == 'WEST')? -1 : 1)).toFixed(4));
		latArr.push({digit:n,text:a[0]});
	}
	for(let a of str.matchAll(lonRegex)){
		let n = parseFloat(((Number(a.groups.lg) + Number(a.groups.lm / 60)) * ((a.groups.ll == 'SOUTH')? -1 : 1)).toFixed(4));
		lonArr.push({digit:n,text:a[0]});
	}
	for(let i=0;i<Math.min(latArr.length,lonArr.length);i++){
		const co = structuredClone(templateCoord);
		co.coord = lonArr[i].text+' '+latArr[i].text;
		co.coords =[latArr[i].digit,lonArr[i].digit];
		coords.push(co);
	}

	return coords;
}


function geBNMCoordNumber(str){
	let polygons = []; 
	const reCircle = /(?<radius>\d+(\.\d{1,2})?)[\s\S]*?(NM|(NAUTICAL[\s\S]*?MILE))[\s\S]*?RADIUS[\s\S]*?(CENTERED[\s\S]*?ON|FROM|OF)[\s\S]*?APPROXIMATE[\s\S]*?POSITION[\s\S]*?(?<coord>\d{2}-\d{2}-\d{2}[NS][\s\S]*?\d{3}-\d{2}-\d{2}[EW])/gi;
	const reCoordGen=/(?<coord>\d{2}-\d{2}(-\d{2}(\.\d{1,3})?)?[NS][\s\S]*?\d{3}-\d{2}(-\d{2}(\.\d{1,3})?)?[EW])/gi;

	for(let a of str.matchAll(reCircle)){
		const coord = structuredClone(templateCoord);
		coord.type='circle';
		coord.radius = Number(a.groups.radius);
		coord.coord = (a.groups.coord);
		polygons.push(coord);
	}
	const Coorddata = [];
	for(let a of str.matchAll(reCoordGen)){
		let item = polygons.find(obj => obj.coord === a.groups.coord);
		if(!item){
			item = structuredClone(templateCoord);
			item.coord = a.groups.coord;
		}
		item.coords = processCoord(item.coord);
		Coorddata.push(item);
	}
	return Coorddata;
}


function getBNMCoord_(str){
	let regex = /(\d{2,3})-(\d{2})\.(\d{4})([NS]),(?:\s+)?(\d{2,3})-(\d{2})\.(\d{4})([EW])(?:;|\.)/gi;
	let arr = [];
	for(let r of str.matchAll(regex)){
		let[,latg,latm,lats,latl,longg,lonm,lons,lonl] = r;
		let lon = (Number(longg) + Number(lonm / 60) + Number((lons ?? 0) / 3600)) * ((lonl == 'W')? -1 : 1);
		let lat = (Number(latg) + Number(latm / 60) + Number((lats ?? 0) / 3600)) * ((latl == 'S')? -1 : 1);
		lon= parseFloat(lon.toFixed(4));
		lat= parseFloat(lat.toFixed(4));
		arr.push([lon,lat]);

	}
	return arr;
}
function getBNMCoordFurther(str){
	let regex = /BEGINNING\s+AT\s+([\s\S]*?)\s+POINT\s+OF\s+BEGINNING/g;
	let regex2 = /(\d{2,3})-(\d{2})\.(\d{2})([NS])\s+(\d{2,3})-(\d{2})\.(\d{2})([EW])/gi
	let arr = [];
	for(let r of str.matchAll(regex)){
		let block = [];
		for(let f of r[1].matchAll(regex2)){
			let[,latg,latm,lats,latl,longg,lonm,lons,lonl] = f;
			let lon = (Number(longg) + Number(lonm / 60) + Number((lons ?? 0) / 3600)) * ((lonl == 'W')? -1 : 1);
			let lat = (Number(latg) + Number(latm / 60) + Number((lats ?? 0) / 3600)) * ((latl == 'S')? -1 : 1);
			lon= parseFloat(lon.toFixed(4));
			lat= parseFloat(lat.toFixed(4));
			block.push([lat,lon]);
		}
		if(block.length > 0){
			block.push(block.at(0));
		}
		arr.push(block);
	}
	return arr;
}


function geBNMCoordNumber2(str){
	let regex = /FROM\s+([\s\S]*?)\s+TO\s+BEGINNING/g;
	const regex2 = /(\d{2})-(\d{2})-(\d{2}(?:\.\d+)?)\s*([NS])\s*\/\s*(\d{3})-(\d{2})-(\d{2}(?:\.\d+)?)\s*([EW])/gi;
	let arr = [];
	for(let g of str.matchAll(regex)){
		const str2 = g[1];
		let block = [];
		for (const f of str2.matchAll(regex2)) {
			const [, latg, latm, lats, latHem, longg, lonm, lons, lonHem] = f;
			const lat = (Number(latg) + Number(latm)/60 + Number(lats)/3600) * (latHem.toUpperCase() === 'S' ? -1 : 1);
			const lon = (Number(longg) + Number(lonm)/60 + Number(lons)/3600) * (lonHem.toUpperCase() === 'W' ? -1 : 1);

			block.push([Number(lat.toFixed(4)), Number(lon.toFixed(4))]);
		}
		if(block.length > 0){
			block.push(block.at(0));
			}
		arr.push(block);
	}
	return arr;
}


function geBNMCoord(str){
	const wordy = geBNMCoordWordy(str);
	let numf = geBNMCoordNumber2(str);
	const numf2 = getBNMCoord_(str);
	const numfurther = getBNMCoordFurther(str);
	if(numf.length <= 0){
 		numf = geBNMCoordNumber(str);
	}

	return [...wordy,...numf,...numf2,...numfurther];

}

module.exports = {geBNMCoordWordy,geBNMCoordNumber,getBNMCoord_,getBNMCoordFurther,geBNMCoord};