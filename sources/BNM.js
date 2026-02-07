const {finddatesBNM,findCancelDate} = require('../utils/date/BNMDateUtils.js');
const {geBNMCoord} = require('../utils/coord/BNMCoords.js');

let Parser = require('rss-parser');
let parser = new Parser();
const fs = require('fs');
let rssFeeds = [
	{"url":"https://public.govdelivery.com/topics/USDHSCG_376/feed.rss","id":"1",label: "1st Coast Guard District"},
	{"url":"https://public.govdelivery.com/topics/USDHSCG_250/feed.rss","id":"5",label: "5th Coast Guard District"},
	{"url":"https://public.govdelivery.com/topics/USDHSCG_422/feed.rss","id":"7",label: "7th Coast Guard District"},
	{"url":"https://public.govdelivery.com/topics/USDHSCG_414/feed.rss","id":"8",label: "8th Coast Guard District"},
	{"url":"https://public.govdelivery.com/topics/USDHSCG_430/feed.rss","id":"9",label: "9th Coast Guard District"},
	{"url":"https://public.govdelivery.com/topics/USDHSCG_435/feed.rss","id":"11",label: "11th Coast Guard District"},
	{"url":"https://public.govdelivery.com/topics/USDHSCG_393/feed.rss","id":"13",label: "13th Coast Guard District"}
];

function parseFecha(fechaStr) {
	if(!fechaStr) return null;
  const [fecha, hora] = fechaStr.split(' ');
  const [dd, mm, yyyy] = fecha.split('/');
  const [hh, min] = hora.split(':');
  return new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(min)
  );
}


async function getBNMS(){
	const tareas = rssFeeds.map(async (d) => {
  	let feed = await parser.parseURL(d.url);
		return {label:d.label,feed};
	});

	let arr = [];
	const data = await Promise.all(tareas);
	data.forEach((d)=>{
		d.feed.items.forEach(item => {
			if(item.title.startsWith('CANCELLATION')) return;
			item.label = d.label;
			arr.push(item);
		});
	})

	const regex = /BNM\s\d{4}-\d{2}$/;
	arr = arr.filter(a => regex.test(a.title));
	arr = arr.map((a) =>{

		const id = a.title.match(regex);
		const date = new Date(a.isoDate);
		const issueDate =
			String(date.getDate()).padStart(2, "0") + "/" +
			String(date.getMonth() + 1).padStart(2, "0") + "/" +
			date.getFullYear() + " " +
			String(date.getHours()).padStart(2, "0") + ":" +
			String(date.getMinutes()).padStart(2, "0");

		let startDate;
		let endDate;
		let dates = finddatesBNM(a.contentSnippet);
		let cancelDate= findCancelDate(a.contentSnippet);
		if(dates.length > 2){
			startDate = dates.at(0);
			endDate = dates.at(-1);
		}
		else{
			startDate = issueDate;
			endDate = cancelDate ?? '01/01/2099 23:59';
		}
		return {
			zone:a.label,
			id:id[0],
			title:a.title,
			status:'A',
			issueDate: issueDate,
			startDate: startDate,
			endDate: endDate,
			message: a.contentSnippet,
			type:"BNM",
			coords:geBNMCoord(a.contentSnippet),
			dates:dates,
			cancelDate:cancelDate
		}
	});
	const ahora = new Date();
	/*
	arr = arr.filter(a => {
		const cancelDate = parseFecha(a.cancelDate);
		const lastDate = parseFecha(a.dates.at(-1));
		let fechaDate;
		if(lastDate  < cancelDate){
			fechaDate = lastDate;
		}
		const keep = ahora <= fechaDate;
		return keep;
	});
	*/

	arr = arr
  .map(a => {
    const fechaDate = [parseFecha(a.cancelDate), parseFecha(a.dates.at(-1))]
      .filter(Boolean)
      .sort((x, y) => x - y)[0] ?? null;

    if (fechaDate && fechaDate.getFullYear() !== 2099 && ahora > fechaDate) {
      a.status = 'C';
    }

    return { ...a, fechaDate };
  })
  .sort((a, b) => (a.fechaDate ?? Infinity) - (b.fechaDate ?? Infinity));
	return arr;
}


module.exports = {getBNMS};