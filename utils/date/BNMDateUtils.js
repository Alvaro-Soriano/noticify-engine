const M = {JAN:"01",FEB:"02",MAR:"03",APR:"04",MAY:"05",JUN:"06",JUL:"07",AUG:"08",SEP:"09",OCT:"10",NOV:"11",DEC:"12"};
//061542Z SEP TO 062025Z SEP 2025
function finddatesTOTO(str){
	let regex = /(?<sday>\d{2})\/(?<shh>\d{2})(?<smi>\d{2})\s*(?<smon>(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))\s*(?<syyy>\d{2})\s*TO\s*(?<eday>\d{2})\/(?<ehh>\d{2})(?<emi>\d{2})\s*(?<emon>(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))\s*(?<eyyy>\d{2,4})/gi;
	let arr =[];
	for(let d of str.matchAll(regex)){
		let {sday,shh,smi,smon,syyy,eday,ehh,emi,emon,eyyy} =d.groups;
		if(syyy.length == '2') syyy='20'+syyy;
		if(eyyy.length == '2') eyyy='20'+eyyy;
		arr.push(sday+"/"+M[String(smon)]+"/"+syyy+' '+shh+":"+smi);
		arr.push(eday+"/"+M[String(emon)]+"/"+eyyy+' '+ehh+":"+emi);
	}
	return arr;
}

//01MAR25, 1300Z – 1439Z
function finddatesTOTO2(str){
	let regex =/\b(?<sday>\d{2})(?<smon>(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))(?<syy>\d{2}),\s*(?<shh>\d{2})(?<smi>\d{2})Z\s*–\s*(?<ehh>\d{2})(?<emi>\d{2})Z\b/gi;
	let arr =[];
	for(let a of str.matchAll(regex)){
		let {sday,smon,syy,shh,smi,ehh,emi} = a.groups;
		syy='20'+syy;
		arr.push(sday+'/'+M[smon]+'/'+syy+' '+shh+':'+smi);
		arr.push(sday+'/'+M[smon]+'/'+syy+' '+ehh+':'+emi);
	}
	return arr;
}

//03MAR25, 2330Z – 04MAR25, 0109Z
function finddatesTOTO3(str){
	let arr =[];
	let regex =/\b(?<sday>\d{2})(?<smon>(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))(?<syy>\d{2}),\s*(?<shh>\d{2})(?<smi>\d{2})Z\s*–\s*(?<eday>\d{2})(?<emon>(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))(?<eyy>\d{2}),\s*(?<ehh>\d{2})(?<emi>\d{2})Z\b/gi;
	for(let a of str.matchAll(regex)){
		let {sday,smon,syy,shh,smi,eday,emon,eyy,ehh,emi} = a.groups;
		syy='20'+syy;
		eyy='20'+eyy;
		arr.push(sday+'/'+M[smon]+'/'+syy+' '+shh+':'+smi);
		arr.push(eday+'/'+M[emon]+'/'+eyy+' '+ehh+':'+emi);
	}
	return arr;
}
function finddatesTOTO4(str){
	const regex = /\b(?<sday>\d{2})(?<shh>\d{2})(?<smi>\d{2})Z\s*(?<smon>(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))\s*TO\s*(?<eday>\d{2})(?<ehh>\d{2})(?<emi>\d{2})Z\s*(?<emon>(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))\s*(?<yyyy>\d{4})\b/gi;
	let arr =[];
	for(let a of str.matchAll(regex)){
		let {sday,shh,smi,smon,eday,ehh,emi,emon,yyyy} = a.groups;
		arr.push(sday+'/'+M[smon]+'/'+yyyy+' '+shh+':'+smi);
		arr.push(eday+'/'+M[emon]+'/'+yyyy+' '+ehh+':'+emi);
	}
	return arr;
}

function finddatesTOTO5(str){
	const regex= /\b(?<sday>\d{2})(?<smon>(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))(\s*)?(?<syy>\d{2}),\s*(?<shh>\d{2})(?<smi>\d{2})Z\s*-\s*(?<eday>\d{2})(?<emon>(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))(\s*)?(?<eyy>\d{2}),\s*(?<ehh>\d{2})(?<emi>\d{2})Z\b/gi;
	let arr = [];
	for(let m of str.matchAll(regex)){
		let {sday,smon,syy,shh,smi,eday,emon,eyy,ehh,emi} = m.groups;
		syy ='20'+syy;
		eyy ='20'+eyy;
		arr.push(sday+'/'+M[smon]+'/'+syy+' '+shh+':'+smi);
		arr.push(eday+'/'+M[emon]+'/'+eyy+' '+ehh+':'+emi);
	}
	return arr;
}

function sortDates(dates){
	dates=  dates.sort((a, b) => {
		const [diaA, mesA, anioA, horaA, minA] = a.match(/\d+/g).map(Number);
		const [diaB, mesB, anioB, horaB, minB] = b.match(/\d+/g).map(Number);
		if (anioA !== anioB) return anioA - anioB;
		if (mesA !== mesB) return mesA - mesB;
		if (diaA !== diaB) return diaA - diaB;
		if (horaA !== horaB) return horaA - horaB;
		return minA - minB;
	});
	return [...new Set(dates)];
}


function finddatesBNM(str){
	const toto = finddatesTOTO(str);
	const toto2 = finddatesTOTO2(str);
	const toto3 = finddatesTOTO3(str);
	const toto4 = finddatesTOTO4(str);
	const toto5 = finddatesTOTO5(str);

	let dates = [...toto,...toto2,...toto3,...toto4,...toto5];
	return sortDates(dates)
}


function findCancelDate(str){
	let regex = /CANCEL AT\/\/(\d{2})(\d{2})(\d{2})Z\s+([A-Z]{3})\s+(\d{2})\/\//;
	let match = str.match(regex);
	if(!match) return '01/01/2099 23:59';
	let [,dia,hh,mi,mes,yy] = match;
	const monthFormatHH= {'DEC':12,'NOV':11,'OCT':10,'SEP':9,'AUG':8,'JUL':7,'JUN':6,'MAY':5,'APR':4,'MAR':3,'FEB':2,'JAN':1};
	mes =String(monthFormatHH[mes]).padStart(2,'0');
	return dia+'/'+mes+'/20'+yy+' '+hh+':'+mi;
}



module.exports = {finddatesBNM,findCancelDate};