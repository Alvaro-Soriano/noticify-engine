const {unifyDateFormat,findDates} = require('../utils/date/dateUtils');
const getMaritCoord = require('../utils/coord/maritimeFormat');
const msi_url = "https://msi.nga.mil/api/publications/smaps";

const filters = {
	"NAVAREA IV":"4",
	"NAVAREA XII":"12",
	"HYDROLANT":"A",
	"HYDROPAC":"P",
	"HYDROARC":"C"
};
async function getNavWarnings(navArea){
	let url_for = new URL(msi_url);
	const statusS = "active";
	const category = 14;
	navArea= filters[navArea] || navArea;
	url_for.search = new URLSearchParams({ navArea, statusS, category,output:"json" });

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15000);


	const res = await fetch(url_for.href, {
		headers: { "Accept": "application/xml" },
		signal: controller.signal,
		redirect: "follow"
	});

	clearTimeout(timeout);

	let arr = (await res.json()).smaps ?? [];	

	arr = arr.map((a)=>{
		let regexMotice = a.msgText.match(/(?<noticeZone>\b(NAVAREA\s(?:IV|XII)|HYDROLANT|HYDROPAC|HYDROARC))\s(?<noticeID>\d+\/\d+\b)/i);
		if(!regexMotice) return;
		let dates = findDates(a.msgText);
		let coords = getMaritCoord(a.msgText) || null; 

		let startDate = '';
		let endDate = '';

		if(dates.length > 1){
			startDate = dates.at(0);
			endDate = dates.at(-1);
		}
		else if(dates.length == 1){
			startDate = dates.at(0);
			endDate = '31/12/2099 23:59';
		}
		else if(dates.length == 0){
			startDate = unifyDateFormat(a.createdOn);
			endDate = '31/12/2099 23:59';
		}

		return {
			zone:regexMotice.groups.noticeZone,
			id:regexMotice.groups.noticeID,
			status:'A',//status: a.status,
			issueDate:unifyDateFormat(a.createdOn),
			startDate:startDate,
			endDate:endDate,
			message:a.msgText,
		//	messageArr:a.msgText.split('\n'),
			type:"NAVWAR",
			coords:coords,
			dates:dates
		}
	})
	return arr;
}

module.exports = {getNavWarnings};