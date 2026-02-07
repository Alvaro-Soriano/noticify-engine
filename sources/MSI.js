const {unifyDateFormat,findDates} = require('../utils/date/dateUtils');
const navcen_url_haz = "https://navcen.uscg.gov/sites/default/files/msi/hazNavPoly_1.geojson";
const navcen_url_safezone = "https://navcen.uscg.gov/sites/default/files/msi/safeZonePoly_1.geojson";



async function getHaz(url){
	let lnms = await fetch(url);
	lnms = await lnms.json();
	if(!lnms || !lnms.features) return [];
	lnms = lnms.features;
	lnms = lnms.map((lnm)=>{

	let coords = lnm.geometry.coordinates.flat();
	coords= coords.map(inner => [...inner].reverse());
	return {
			zone:lnm.properties.WATERWAY_NAME,
			id:lnm.id,
		  status:'A',//status: lnm.properties.STATUS,
			issueDate:unifyDateFormat(lnm.properties.CREATE_DATE),
			startDate:unifyDateFormat(lnm.properties.BEGIN_DATE),
			endDate:unifyDateFormat(lnm.properties.END_DATE),
			message:lnm.properties.DESCRIPTION,
			type:"MSIB",
			coords,
			dates:findDates(lnm.properties.DESCRIPTION)
		}
	})

	return lnms;
}


async function getHazNavPoly(){
	const hazzards = await getHaz(navcen_url_haz);
	const safezone = await getHaz(navcen_url_safezone);
	return [...hazzards,...safezone];
}
module.exports = {getHazNavPoly};