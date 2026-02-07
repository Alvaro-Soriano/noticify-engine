const getAeroNatCoord = require('../utils/coord/aeronatFormat');
const {unifyDateFormat} = require('../utils/date/dateUtils.js');
const {findDatesICAO} = require('../utils/date/ICAODates.js');

const notamPayload = {
	searchType: 0,
	flightPathIncludeNavaids: true,
	flightPathIncludeTfr: true,
	notamsOnly: false,
	offset: 0
};


async function getNotams(location){
	let nPayload = structuredClone(notamPayload);
	nPayload.designatorsForLocation=location;

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15000);
	let payload = structuredClone(nPayload);
	const resp =async (pylod)=>{
		const response = await fetch('https://notams.aim.faa.gov/notamSearch/search', {
			method: 'POST',
			body: new URLSearchParams(pylod),
			signal: controller.signal
		});
		
		clearTimeout(timeout);
		const text = await response.text();
		try {
			return JSON.parse(text);
		} catch (err) {
			console.error("Respuesta no es JSON, es:");
			console.error(text);
			throw('Notam Search Crashed');
		}
	}


	let arr = [];
	let offset =0;
	let interval = 30;
	let total = Infinity;
	while(offset < total){
		payload.offset = offset;
		let response = await resp(payload);
		if(offset ==0) {
			total = response.totalNotamCount;
			if(response.startRecordCount == 1) interval= response.endRecordCount;
		}

		if(response.notamList) arr.push(...response.notamList)
		offset += interval;
	}
	return arr.map((not) =>{
		const message= not.icaoMessage == " "? not.traditionalMessage :not.icaoMessage;
		let coords = getAeroNatCoord(message);

		let startDate=unifyDateFormat(not.startDate,true);
		let endDate=unifyDateFormat(not.endDate,true);


		const dates = findDatesICAO(not.notamNumber,message);

		
		if(dates.length >= 2){
			startDate = dates.at(0);
			endDate = dates.at(-1);
		}
		
		return {
			zone:location,
			id:not.notamNumber,
			status:'A',//status:not.status,
			issueDate: unifyDateFormat(not.issueDate,true),
			startDate: startDate,
			endDate: endDate,
			message: message,
			type:"NOTAM",
			coords,
			dates
		}
	})

}



module.exports = {getNotams};