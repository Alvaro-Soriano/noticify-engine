
const {getNotams} = require('./sources/FAA');
const {getHazNavPoly} = require('./sources/MSI');
const {getNavWarnings} = require('./sources/NAVCEN');
const {getAdvisories} = require('./sources/CADENAOIS');
const {getBNMS} = require('./sources/BNM');


async function getNotices({pType,pZone = '',PhasCoord = 'T',PstartDate = '',PendDate ='',PstatusN='T',PfreeText=''} = {}){
	const response = {"error":"","data":[]};
	if(pType == 'NOTAM' && pZone ==''){
		response.error="En el caso los NOTAMs el campo zona es obligatorio, prueba con ZMA, ZLA, ZJX, etc..."
		return response;
	}
	if(pType == 'NOTAM'){
		response.data = await getNotams(pZone);
	}
	if(pType == 'MSIB'){
		response.data = await getHazNavPoly();
		if(pZone.length > 0)response.data = response.data.filter(d => d.zone == pZone)
	}
	if(pType == 'NAVWAR'){
		response.data = await getNavWarnings(pZone);
	}
	if(pType == 'CADENAOIS'){
		response.data = await getAdvisories();
		if(pZone.length > 0)response.data = response.data.filter(d => (d.zone).toUpperCase().includes(pZone.toUpperCase()))

	}
	if(pType == 'BNM'){
		response.data = await getBNMS();
	}

	response.data = response.data.filter((d)=>{
		if(PhasCoord =='T') return true;
		const hasCoord =(d.coords && d.coords.length > 0) || (d.coords && typeof(d.coords)==='object' && !Array.isArray(d.coords) && d.coords.coordsPolygon && d.coords.coordsPolygon.length > 0);
		return (PhasCoord =='S' && hasCoord) || (PhasCoord =='N' && !hasCoord);
	})

	if(PstartDate != '' && PendDate != ''){
		const parseDMY = (s) => {
			const [d, m, rest] = s.split("/");
			const [y, time] = rest.split(" ");
			const [hh, mi] = time.split(":");
			return new Date(`${y}-${m}-${d}T${hh}:${mi}`);
		};

		const startDate = new Date(PstartDate + "T00:00");
		const endDate   = new Date(PendDate   + "T23:59");
		response.data=response.data.filter(o => {
			const s = parseDMY(o.startDate);
			const e = parseDMY(o.endDate);
			return s >= startDate && e <= endDate;
		});
	}

	if(PstatusN != 'T'){
		response.data=response.data.filter(o => o.status ==PstatusN);
	}

	if(PfreeText != ''){
		response.data=response.data.filter(o => {
			return String(o.message).toUpperCase().includes(String(PfreeText).toUpperCase())
		});
	}

	return response;
}
(async()=>{
	console.log(await getBNMS());
})()


module.exports = {getNotices,getNotams,getHazNavPoly,getNavWarnings,getAdvisories,getBNMS};

