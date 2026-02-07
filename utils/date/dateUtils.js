const monthFormatHH= {'DEC':12,'NOV':11,'OCT':10,'SEP':9,'AUG':8,'JUL':7,'JUN':6,'MAY':5,'APR':4,'MAR':3,'FEB':2,'JAN':1};
function sep_fecha(strFecha){
	const regex = /(?<DD>\d{2})\/(?<MM>\d{2})\/(?<YYYY>\d{4})\s+(?<HH>\d{2}):(?<MI>\d{2})/;
	const obj = {d:null,m:null,yyyy:null,hh:null,mi:null}
	const match = strFecha.match(regex);
	if(!match) return obj;

	obj.d = Number(match.groups.DD);
	obj.m = Number(match.groups.MM);
	obj.yyyy = Number(match.groups.YYYY);
	obj.hh = Number(match.groups.HH);
	obj.mi = Number(match.groups.MI);

	return obj;
}

function genRangeDate(sday,smonth,syear,sh24,smi,eday,emonth,eyear,eh24,emi){
	const sd = new Date(Date.UTC(sday,smonth-1,syear,sh24,smi));
	const ed = new Date(Date.UTC(eday,emonth-1,eyear,eh24,emi));
	const ONE_DAY = 24 * 60 * 60 * 1000;
	const fmt = dt =>`${String(dt.getUTCDate()).padStart(2,'0')}/${String(dt.getUTCMonth()+1).padStart(2,'0')}/${dt.getUTCFullYear()} ` +
	`${String(dt.getUTCHours()).padStart(2,'0')}:${String(dt.getUTCMinutes()).padStart(2,'0')}`;
	let arr =[];
	for (let d = new Date(sd); d <= ed; d = new Date(d.getTime() + ONE_DAY)) {
		const y = d.getUTCFullYear(), mo = d.getUTCMonth(), da = d.getUTCDate();
		const start = new Date(Date.UTC(y, mo, da, sh24, smi));
		let end = new Date(Date.UTC(y, mo, da, eh24, emi));
		if (end <= start) end = new Date(end.getTime() + ONE_DAY);
		arr.push(fmt(start));
		arr.push(fmt(end));
	}

	return arr;

}


function findDatesYYMMDDHHMI(str){
	const regex = /\b(?<YY>\d{2})(?<MM>\d{2})(?<DD>\d{2})(?<HH>\d{2})(?<MI>\d{2})(EST)?\b/gi;
	let arr = [];

	for(let f of str.matchAll(regex)){
		f = f.groups;
		const datetxt = f.DD+'/'+f.MM+'/20'+f.YY+' '+f.HH+':'+f.MI;

		arr.push(datetxt);
	}
	return arr;
}


function findDatesDDHHMIHHMI(str){
	const regex = /(?<!-)\b(?:(?<EDD>\d{1,2})\/)?(?<DD>\d{2})\s+(?<SHH>\d{2})(?<SMI>\d{2})-(?<EHH>\d{2})(?<EMI>\d{2})(EST)?\b/gi;
	let arr = [];

	const date= new Date();
	let month = date.getUTCMonth() +1;
	let year = date.getUTCFullYear();
	let monthMax= new Date(year, month, 0).getDate();

	for(let f of str.matchAll(regex)){
		f = f.groups;

		if(!f.EDD){
			const startDate = String(f.DD).padStart(2,'0')+'/'+String(month).padStart(2,'0')+'/'+year+' '+f.SHH +':'+f.SMI;
			if(f.SHH > f.EHH){
				f.DD=Number(f.DD)+1;
			}
			if(monthMax < f.DD){
				f.DD = 1;
			}
			const EndDate = String(f.DD).padStart(2,'0')+'/'+String(month).padStart(2,'0')+'/'+year+' '+f.EHH +':'+f.EMI;
			arr.push(startDate);
			arr.push(EndDate);
		}
		else{
			const startDate = String(f.EDD).padStart(2,'0')+'/'+String(month).padStart(2,'0')+'/'+year+' '+f.SHH +':'+f.SMI;
			const EndDate = String(f.DD).padStart(2,'0')+'/'+String(month).padStart(2,'0')+'/'+year+' '+f.EHH +':'+f.EMI;

			arr.push(startDate);
			arr.push(EndDate);
		}


	
	}
	return arr;
}

function incdays(baseday,shh,smi,ehh,emi){
	baseday = Number(baseday);
	if(Number(String(shh) + String(smi)) > Number(String(ehh) + String(emi))) baseday++;

	return baseday;
}


//DEC 16/17 TIL 24/25 1500-0259
function findDatesDDHHMITILHHMI(str){
	const regexformat1 = /\b((?<EMO>\w{3})\s+(?<ESDD>\d{2})\/(?<EEDD>\d{2})\s+)?(?<MO>\w{3})\s+(?<SDD>\d{2})\/(?<EDD>\d{2})\s+(?<SHH>\d{2})(?<SMI>\d{2})-(?<EHH>\d{2})(?<EMI>\d{2})\b/g;

	let arr = [];
	const date= new Date();
	let year = date.getUTCFullYear();

	let matches = [...str.matchAll(regexformat1)].map(m => m.groups);

	if(matches.length == 1){
		let m = matches[0];
		let lastEDay = incdays(m.EEDD,m.SHH,m.SMI,m.EHH,m.EMI);
		arr.push(m.ESDD+'/'+monthFormatHH[m.EMO]+'/'+year+' '+m.SHH+':'+m.SMI);
		arr.push(lastEDay+'/'+monthFormatHH[m.EMO]+'/'+year+' '+m.EHH+':'+m.EMI);

		for(let i = lastEDay;i< Number(m.SDD); i++){
			let lastDay = incdays(i,m.SHH,m.SMI,m.EHH,m.EMI);
			arr.push(i+'/'+monthFormatHH[m.EMO]+'/'+year+' '+m.SHH+':'+m.SMI);
			arr.push(lastDay+'/'+monthFormatHH[m.EMO]+'/'+year+' '+m.EHH+':'+m.EMI);
		}

		arr.push(m.SDD+'/'+monthFormatHH[m.EMO]+'/'+year+' '+m.SHH+':'+m.SMI);
		arr.push(m.EDD+'/'+monthFormatHH[m.EMO]+'/'+year+' '+m.EHH+':'+m.EMI);
	}
	else{
		for(let m of matches){
			if(monthFormatHH[m.MO]){
				let lastEDay = incdays(m.SDD,m.SHH,m.SMI,m.EHH,m.EMI);
				arr.push(m.SDD+'/'+monthFormatHH[m.MO]+'/'+year+' '+m.SHH+':'+m.SMI);
				arr.push(lastEDay+'/'+monthFormatHH[m.MO]+'/'+year+' '+m.EHH+':'+m.EMI);
				
			}
			else{
			
				const lastDate = sep_fecha(arr.at(-1));
				for(let i = lastDate.d;i< Number(m.SDD); i++){
					let lastEDay = incdays(i,m.SHH,m.SMI,m.EHH,m.EMI);
					arr.push(i+'/'+lastDate.m+'/'+year+' '+m.SHH+':'+m.SMI);
					arr.push(lastEDay+'/'+lastDate.m+'/'+year+' '+m.EHH+':'+m.EMI);
				}
				arr.push(m.SDD+'/'+lastDate.m+'/'+year+' '+m.SHH+':'+m.SMI);
				arr.push(m.EDD+'/'+lastDate.m+'/'+year+' '+m.EHH+':'+m.EMI);
			
			}
		}
	}

	return arr;

}
//12/19/25 07:45PM
function findMMDDYYYYHIMI(str){
	const regex =/\b(?<MM>\d{2})\/(?<DD>\d{2})\/(?<YYYY>\d{2})\s+(?<HI>\d{2}):(?<MI>\d{2})(?<AMPM>AM|PM)( EST)?\b/gi;
	let arr = []; 
	for(let m of str.matchAll(regex)){
		m= m.groups;
		let dates = String(m.DD).padStart(2,'0')+'/'+String(m.MM).padStart(2,'0')+'/20'+String(m.YYYY);

		dates = dates +' '+ (Number(m.HI) +((m.AMPM.toUpperCase() == 'PM') ? 12 : 0) )+':'+m.MI;
		arr.push(dates);
	}
	return arr;
}

function findDatesDDHIMIZTODDHIMIZ(str){
	function backfillMon(arr) {
		let lastMon;

		for (let i = arr.length - 1; i >= 0; i--) {
			const mon = arr[i].MON;
			if (mon != null) {
				lastMon = mon;
			} else if (lastMon != null) {
				arr[i].MON = lastMon;
			}
		}
		return arr;
	}

	let regex= /\b(?<SDD>\d{2})(?<SHH>\d{2})(?<SMI>\d{2})Z\s+TO\s+(?<EDD>\d{2})(?<EHH>\d{2})(?<EMI>\d{2})Z(\s+(?<MON>(DEC|NOV|OCT|SEP|AUG|JUL|JUN|MAY|APR|MAR|FEB|JAN)))?\b/gi;

	const date= new Date();
	let month = date.getUTCMonth() +1;
	let year = date.getUTCFullYear();
	let monthMax= new Date(year, month, 0).getDate();
	let arr = [];
	let arr2 = [];
	for(let d of str.matchAll(regex)){
		let {SDD,SHH,SMI,EDD,EHH,EMI,MON} = d.groups;
		arr2.push({SDD,SHH,SMI,EDD,EHH,EMI,MON});
	}
	arr2 = backfillMon(arr2);
	for(let f of arr2){

		let {SDD,SHH,SMI,EDD,EHH,EMI,MON} = f;
		MON = monthFormatHH[MON] || month;
		const startDate = SDD+'/'+String(MON).padStart(2,'0')+'/'+year+' '+SHH +':'+SMI;
		SDD = String(SDD).padStart(2,'0');
		SHH = String(SHH).padStart(2,'0');
		SMI = String(SMI).padStart(2,'0');
		EDD = String(EDD).padStart(2,'0');
		EHH = String(EHH).padStart(2,'0');
		EMI = String(EMI).padStart(2,'0');

		const EndDate = EDD+'/'+String(MON).padStart(2,'0')+'/'+year+' '+EHH +':'+EMI;
		arr.push(startDate);
		arr.push(EndDate);
	}
	return arr;
}
/*
function findDatesDDHIMIZTODDHIMIZ(str){
	let regex= /\b(?<SDD>\d{2})(?<SHH>\d{2})(?<SMI>\d{2})Z\s+TO\s+(?<EDD>\d{2})(?<EHH>\d{2})(?<EMI>\d{2})Z\b/gi;

	const date= new Date();
	let month = date.getUTCMonth() +1;
	let year = date.getUTCFullYear();
	let monthMax= new Date(year, month, 0).getDate();
	let arr = [];

	for(let d of str.matchAll(regex)){
		let {SDD,SHH,SMI,EDD,EHH,EMI} = d.groups;
		const startDate = SDD+'/'+String(month).padStart(2,'0')+'/'+year+' '+SHH +':'+SMI;

		SDD = String(SDD).padStart(2,'0');
		SHH = String(SHH).padStart(2,'0');
		SMI = String(SMI).padStart(2,'0');
		EDD = String(EDD).padStart(2,'0');
		EHH = String(EHH).padStart(2,'0');
		EMI = String(EMI).padStart(2,'0');

		const EndDate = EDD+'/'+String(month).padStart(2,'0')+'/'+year+' '+EHH +':'+EMI;
		arr.push(startDate);
		arr.push(EndDate);

	}
	return arr;
}
*/


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



const monthFormat3 = {'DEC':12,'NOV':11,'OCT':10,'SEP':9,'AUG':8,'JUL':7,'JUN':6,'MAY':5,'APR':4,'MAR':3,'FEB':2,'JAN':1};
function findDateDDHHMI_MON_YYYY(str){
	const regex = /\b(?<DD>\d{2})(?<HH>\d{2})(?<MI>\d{2})Z\s+(?<MON>\w{3})\s+(?<YY>\d{4})\b/i;
	let match = str.match(regex);
	if(!match) return null;

	match = match.groups;

	let dd = String(match.DD).padStart('2',0);
	let mo = String(monthFormat3[match.MON]).padStart('2',0);
	let yyyy = String(match.YY);
	let hh = String(match.HH).padStart('2',0);
	let mi = String(match.MI).padStart('2',0);

	return dd+'/'+mo+'/'+yyyy+' '+hh+':'+mi;
}
function findDatesDDHHMI_MON_YYYY(str){
	const regex = /\b(?<DD>\d{2})(?<HH>\d{2})(?<MI>\d{2})Z\s+(?<MON>\w{3})\s+(?<YY>\d{2})\b/gi;
	let arr =[];
	for(let match of str.matchAll(regex)){
		if(str.startsWith(match[0])) continue;
		if(str.includes('CANCEL THIS MSG '+match[0])) continue;
		match = match.groups;
		let dd = String(match.DD).padStart('2',0);
		let mo = String(monthFormat3[match.MON]).padStart('2',0);
		let yyyy = '20'+String(match.YY);
		let hh = String(match.HH).padStart('2',0);
		let mi = String(match.MI).padStart('2',0);
		arr.push(dd+'/'+mo+'/'+yyyy+' '+hh+':'+mi);
	}
	return arr;
}


function findDates_SHHSMI_EHHEMI(str){
	let arr = [];
	let fiReB = str.match(/\bB\) (?<YY>\d{2})(?<MO>\d{1,2})(?<DD>\d{1,2})\d{4}\b/);
	const bloqueHoras = str.match(/\bD\)\s*((?:\d{4}-\d{4})(?:\s+\d{4}-\d{4})*)/);

	if(!fiReB || !bloqueHoras) return arr;
	fiReB = fiReB.groups;
	fiReB.DD = String(fiReB.DD).padStart(2,'0');
	fiReB.MO = String(fiReB.MO).padStart(2,'0');
	fiReB.YY ='20'+fiReB.YY;
	
	for(let b of bloqueHoras[1].matchAll(/\b(?<SHH>\d{2})(?<SMI>\d{2})-(?<EHH>\d{2})(?<EMI>\d{2})\b/g)){
		b= b.groups;
		arr.push(fiReB.DD+'/'+fiReB.MO+'/'+fiReB.YY+' '+b.SHH+':'+b.SMI);
		arr.push(fiReB.DD+'/'+fiReB.MO+'/'+fiReB.YY+' '+b.EHH+':'+b.EMI);
	}

	return arr;
}


function findDatesSDD_EDD_SHH_SMI_EHH_EMI(str){
	const regex = /\b(?<SDD>\d{2})-(?<EDD>\d{2})\s+(?<SHH>\d{2})(?<SMI>\d{2})-(?<EHH>\d{2})(?<EMI>\d{2})\b/gi;
	const date= new Date();
	const month = date.getUTCMonth()+1;
	const year = date.getFullYear();
	const arr = [];
	for(let m of str.matchAll(regex)){
		let g = m.groups;
		for(let i = Number(g.SDD); i<= Number(g.EDD); i++){
			let day = i;
			if(Number(g.SHH+g.SMI) > Number(g.EHH+g.EMI) ){
				day++;
			}

			let startDate = String(i).padStart(2,'0')+'/'+String(month).padStart(2,'0')+'/'+year+' '+g.SHH+':'+g.SMI;
			let endDate = String(day).padStart(2,'0')+'/'+String(month).padStart(2,'0')+'/'+year+' '+g.EHH+':'+g.EMI;

			arr.push(startDate);
			arr.push(endDate);
		}
	}
	return arr;
}


function findDates_SDD_EDD_MON_SHHSMI_EHHEMI(str){
	const regex = /\b(?<SDD>\d{2})-(?<EDD>\d{2})\s+(?<MON>(DEC|NOV|OCT|SEP|AUG|JUL|JUN|MAY|APR|MAR|FEB|JAN))\s+(?<SHH>\d{2})(?<SMI>\d{2})-(?<EHH>\d{2})(?<EMI>\d{2})\b/gi;
	const d = new Date();
	let y = d.getUTCFullYear();
	let arr = [];
	for(let m of str.matchAll(regex)){
		const {SDD,EDD,MON,SHH,SMI,EHH,EMI} = m.groups;
		let month = monthFormatHH[MON];

		for(let day=Number(SDD);day<=Number(EDD);day++){
			let startDay= day;
			let endDay= day;
			if(Number(SHH+SMI) > Number(EHH+EMI) ) endDay++;
			let startDate = String(startDay).padStart(2,'0')+'/'+String(month).padStart(2,'0')+'/'+y+' '+String(SHH).padStart(2,'0')+':'+String(SMI).padStart(2,'0')
			let endDate = String(endDay).padStart(2,'0')+'/'+String(month).padStart(2,'0')+'/'+y+' '+String(EHH).padStart(2,'0')+':'+String(EMI).padStart(2,'0')
			arr.push(startDate);
			arr.push(endDate);
		}
	}
	return arr;
}




//0451Z TO 0612Z DAILY 17 DEC THRU 16 JAN 26
//0100Z TO 1300Z DAILY 06 THRU 08 JAN
function findDatesDaily(str){
	const regex1 = /(?<SHH>\d{2})(?<SMI>\d{2})Z\s+TO\s+(?<EHH>\d{2})(?<EMI>\d{2})Z\s+DAILY\s+(?<SDAY>\d{2})\s+AND\s+(?<EDAY>\d{2})\s+(?<MON>(DEC|NOV|OCT|SEP|AUG|JUL|JUN|MAY|APR|MAR|FEB|JAN))/gi;
	const regex2 = /(?<SHH>\d{2})(?<SMI>\d{2})Z\s+TO\s+(?<EHH>\d{2})(?<EMI>\d{2})Z\s+DAILY\s+(?<SDAY>\d{2})(\s+(?<SMON>(DEC|NOV|OCT|SEP|AUG|JUL|JUN|MAY|APR|MAR|FEB|JAN)))?\s+THRU\s+(?<EDAY>\d{2})\s+(?<EMON>(DEC|NOV|OCT|SEP|AUG|JUL|JUN|MAY|APR|MAR|FEB|JAN))(\s+(?<YEAR>\d{2}))?/gi;
	let year = (new Date()).getUTCFullYear();
	let arr = [];

	for (const m of str.matchAll(regex2)) {
		let { SHH, SMI, EHH, EMI, SDAY, SMON, EDAY, EMON, YEAR } = m.groups;
		SMON = monthFormatHH[SMON || EMON];
		EMON = monthFormatHH[EMON];
		const Y = YEAR ? Number(`20${YEAR}`) : Number(year);
		let arr2 = genRangeDate(YEAR ? Y - 1 : Y, SMON, SDAY,SHH,SMI,Y, EMON, EDAY,EHH, EMI);
		arr = arr2;
	}

	for (const m of str.matchAll(regex1)) {
		let {SHH,SMI,EHH,EMI,SDAY,EDAY,MON} = m.groups;
		MON = monthFormatHH[MON];
		let arr2 = genRangeDate(year, MON, SDAY,SHH,SMI,year, MON, EDAY,EHH, EMI);
		arr = arr2;
	}
	return arr;
}


function findDates(str){
	const dates1 = findDatesYYMMDDHHMI(str);
	const dates2 = findDatesDDHHMIHHMI(str);
	const dates3 = findMMDDYYYYHIMI(str);
	const dates5 = findDatesDDHIMIZTODDHIMIZ(str);
	const dates6 = findDates_SHHSMI_EHHEMI(str);
	const dates7 = findDatesDDHHMITILHHMI(str);
	const dates8 = findDatesSDD_EDD_SHH_SMI_EHH_EMI(str);
	const dates9 = findDates_SDD_EDD_MON_SHHSMI_EHHEMI(str);
	const dates4 = dates5.length ==0 ? findDatesDDHHMI_MON_YYYY(str) : dates5;
	let dates10 = dates9.length > 0? [] : dates1;
	let dates11 = findDatesDaily(str);
	const finalDates = [...dates2,...dates3,...dates4,...dates5,...dates6,...dates7,...dates8,...dates9,...dates10,...dates11];


	if( str.includes('000/000')){
		console.log({
		dates1:dates1.length,
		dates2:dates2.length,
		dates3:dates3.length,
		dates4:dates4.length,
		dates5:dates5.length,
		dates6:dates6.length,
		dates7:dates7.length,
		dates8:dates8.length,
		dates9:dates9.length,
		dates11:dates11.length
		}
		);
	}

	const permRegex = /\bPERM\b/i;
	if(permRegex.test(str)){
		finalDates.push('31/12/2099 00:00');
	}
	
	return sortDates(finalDates);
}

function unifyDateFormat(strDate,reverseNum=false){
	const permRegex = /\bPERM\b/i;
	if(permRegex.test(strDate)){
		return ('31/12/2099 00:00');
	}

	if (typeof strDate === 'number') {
    let d = new Date(strDate);
    return String(d.getUTCDate()).padStart(2, '0') + '/' +
			String(d.getUTCMonth() + 1).padStart(2, '0') + '/' +
			d.getUTCFullYear() + ' ' +
			String(d.getUTCHours()).padStart(2, '0') + ':' +
			String(d.getUTCMinutes()).padStart(2, '0');
	}

  const m = strDate.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2})(\d{2})(EST)?$/);
  if (m) {
		let [ , p1, p2, y, hh, mi ] = m;
		if (reverseNum) {
			[p1, p2] = [p2, p1];
		}
	  return `${p1}/${p2}/${y} ${hh}:${mi}`;
	}

	let dateFormat3 = findDateDDHHMI_MON_YYYY(strDate);
	if(dateFormat3 != null) return dateFormat3;

 
	return strDate;
}



module.exports = {findDates,unifyDateFormat};