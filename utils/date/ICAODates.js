const regexhhmi = '(?:(?:\\d{4})|SR|SS)';
const sepHora = '(?:\\s+|\\/|\\s*-\\s*)';

const regexhhmihhmi = `(HR:|HR\\s+)?((${regexhhmi})${sepHora}((?:\\d{2}\\s+)?${regexhhmi})|H24)`;

let Regexdias = '\\d{2}((-|\\s+-\\s+|\\s+|\\s+-\\s+)\\d{2})?';
let sep = '(\\s+|\\s+AND\\s+|,\\s+|,|\\s+,\\s+)';
let RegexdiasMult = `${Regexdias}(?:${sep}${Regexdias})*`;

let RegexdiasT = '(SUN|MON|TUE|WED|THU|FRI|SAT)';
let RegexMeses = '(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)';
let startRegex = '(?:INTERMITTENT,\\s+)?(?:(?:DAILY|DLY)\\s+)?(?:(?:BTN|AT)\\s+)?'
let endRegex = '(\\s+(DAILY|DLY|EVERY\\s+SAT))?'
let EXRegex = '(\\s+EXC.*)?';

let regexhhmihhmiMult = `${regexhhmihhmi}(?:${sep}${regexhhmihhmi})*`;


function isICAO(id,message){
	let regex = new RegExp(`(\s*)?${id}\\s*NOTAM[A-Z]`, 's');
	return message.startsWith('Q) ') || regex.test(message);
}



const dayMap = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6
};

const mesesCadena = {
	JAN: 0,
	FEB: 1,
	MAR: 2,
	APR: 3,
	MAY: 4,
	JUN: 5,
	JUL: 6,
	AUG: 7,
	SEP: 8,
	OCT: 9,
	NOV: 10,
	DEC: 11
};

function obtenerHorarios(str){
	let arr = [];
	for (const f of str.matchAll(new RegExp(regexhhmihhmi, 'gi'))) {
		const shhsmi = f[3] ?? f[2];
		const ehhemi   = f[4] ?? f[2];
		arr.push({shhsmi,ehhemi});
	}
	return arr;
}

function toDate(date){
	if(date.includes('EST')){
		const d = new Date(`20${date.slice(0,2)}-${date.slice(2,4)}-${date.slice(4,6)}T${date.slice(6,8)}:${date.slice(8,10)}:00-05:00`);
		date = d.getUTCFullYear().toString().slice(2) +
			String(d.getUTCMonth()+1).padStart(2,'0') +
			String(d.getUTCDate()).padStart(2,'0') +
			String(d.getUTCHours()).padStart(2,'0') +
			String(d.getUTCMinutes()).padStart(2,'0');
	}
	return new Date(`20${date.slice(0,2)}-${date.slice(2,4)}-${date.slice(4,6)}T${date.slice(6,8)}:${date.slice(8,10)}:00Z`);
}



function setDateHHMI(date,hh,mi){
	let fecha = new Date(date);
	fecha.setUTCHours(hh);
	fecha.setUTCMinutes(mi);

	return fecha;
}

function _getDateSEarray(date,shh,smi,ehh,emi,edate){
	let s = setDateHHMI(date,shh,smi);
	let e = setDateHHMI(edate ?? date ,ehh,emi);

	if (s > e) {
		e.setUTCDate(e.getUTCDate() + 1);
	}
	return [s,e];
}


const hhmisus = {'SR':'0630','SS':'0630' };

function getDateSEarray(date,shhsmi,ehhemi,edate){
	if(shhsmi =='H24'){
		shhsmi = '0000';
		ehhemi = '2359';
	}
	shhsmi = hhmisus[shhsmi] ?? shhsmi;
	ehhemi = hhmisus[ehhemi] ?? ehhemi;

	const shh = Math.floor(shhsmi / 100);
	const smi = shhsmi % 100;

	const ehh = Math.floor(ehhemi / 100);
	const emi = ehhemi % 100;

	return _getDateSEarray(date,shh,smi,ehh,emi,edate);
}


function parsediaRange(range) {
  const [startStr, endStr] = range.split("-");
  const start = dayMap[startStr];
  const end = dayMap[endStr];

  if (start === undefined || end === undefined) {
    throw new Error(`Rango inválido: ${range}`);
  }
  const days = [start];
  let current = start;
  const maxSteps = start === end ? 7 : 6;
  for (let i = 0; i < maxSteps; i++) {
    current = (current + 1) % 7;
    days.push(current);
    if (current === end && !(start === end && i < 6)) break;
  }
  return days;
}

function _genRanges(startDate,endDate,shh,smi,ehh,emi,dia){
	shh = shh ?? startDate.getUTCHours();
	smi = smi ?? startDate.getUTCMinutes();
	ehh = ehh ?? endDate.getUTCHours();
	emi = emi ?? endDate.getUTCMinutes();
	
	let arr = [];
	if(endDate.getUTCFullYear() == 2099){
		arr = [
			..._getDateSEarray(startDate,shh,smi,ehh,emi),
			..._getDateSEarray(endDate,shh,smi,ehh,emi)
		];
	}
	else{
		let d = new Date(startDate);
		d.setUTCHours(0, 0, 0, 0);

		const end = new Date(endDate);
		end.setUTCHours(0, 0, 0, 0);

		while (d <= end) {
			if(!dia ||(dia && d.getUTCDay() == dia)){
				arr.push(..._getDateSEarray(d, shh, smi, ehh, emi));
			}
			d.setUTCDate(d.getUTCDate() + 1);
		}
	}
	return arr;
}

function genRanges(startDate,endDate,shhsmi,ehhemi,dia){
	if(shhsmi =='H24'){
		shhsmi = '0000';
		ehhemi = '2359';
	}
	shhsmi = hhmisus[shhsmi] ?? shhsmi;
	ehhemi = hhmisus[ehhemi] ?? ehhemi;

	const shh = Math.floor(shhsmi / 100);
	const smi = shhsmi % 100;

	const ehh = Math.floor(ehhemi / 100);
	const emi = ehhemi % 100;

	return _genRanges(startDate,endDate,shh,smi,ehh,emi,dia);
}



function findDates1(startDate,endDate,str){
	let regex =new RegExp(`^${startRegex}${regexhhmihhmiMult}${endRegex}${EXRegex}$`,'i');
	let arr = [];
	if(!regex.test(str)) return arr;
	for (const f of str.matchAll(new RegExp(regexhhmihhmi, 'gi'))) {
		const shhsmi = f[3] ?? f[2];
		const ehhemi   = f[4] ?? f[2];
		let arr2 = genRanges(startDate,endDate,shhsmi,ehhemi);
		arr.push(...arr2);


	}

	return arr;
}



function findDates2(startDate, endDate, str) {
  const regex = new RegExp(
    `^${RegexdiasT}((-|\\s+)${RegexdiasT})?\\s+${regexhhmihhmiMult}` +
    `(?:${sep}${RegexdiasT}((-|\\s+)${RegexdiasT})?\\s+${regexhhmihhmiMult})*` +
    `${EXRegex}$`
  );

  if (!regex.test(str)) return [];

  const regex2 = new RegExp(
    `(?<dias>${RegexdiasT}((?<joiner>(-|\\s+))${RegexdiasT})?)\\s+(?<horarios>${regexhhmihhmiMult})`,
    "gi"
  );

  const toDays = (diasText, joiner) => {
    if (joiner === "-") return parsediaRange(diasText);             
    if (joiner) return diasText.split(/\s+/).map(d => dayMap[d]);
    return [dayMap[diasText]];
  };

  const ranges = [];
  for (const match of str.matchAll(regex2)) {
    const { dias, joiner, horarios } = match.groups;
    const days = toDays(dias, joiner);
    const times = obtenerHorarios(horarios);
    for (const d of days) {
      for (const t of times) {
        ranges.push(...genRanges(startDate, endDate, t.shhsmi, t.ehhemi, d));
      }
    }
  }

  return ranges;
}

function findDates3(startDate,endDate,str){
	let regex = new RegExp(`^${RegexMeses}\\s+${RegexdiasMult}\\s+${regexhhmihhmiMult}(?:${sep}(${RegexMeses}\\s+)?${RegexdiasMult}\\s+${regexhhmihhmiMult})*${EXRegex}$`);
	let arr = [];
	if(!regex.test(str)) return arr;

	let yyyy = startDate.getUTCFullYear();
	let regex2 = new RegExp(`(?<mes>${RegexMeses})\\s+(?<dias>${RegexdiasMult})\\s+(?<horarios>${regexhhmihhmiMult})`,'g');
	for(let f of str.matchAll(regex2)){
		let {mes,dias,horarios} = f.groups;
		dias = dias.replace(' - ','-');
		mes = mesesCadena[mes];
		const times = obtenerHorarios(horarios);
		for(let dia of dias.split(/\s+/)){
			let sdia,edia;
			if(dia.includes(' AND ')){
				[sdia,edia] = dia.split(' AND ');
			}
			else{
				[sdia,edia] = dia.split('-');
			}
			
			edia = edia ?? sdia;
			let sdate = new Date(Date.UTC(yyyy,mes,sdia));
			let edate = new Date(Date.UTC(yyyy,mes,edia));
			for(let h of times){
				let arr2 = genRanges(sdate,edate,h.shhsmi,h.ehhemi);
				arr.push(...arr2);

			}

		}

	}
	return arr;
}

function findDates4(startDate,endDate,str){
	let regex = new RegExp(`^\\d{10}\\s+TO\\s+\\d{10}(?:\\s+\\d{10}\\s+TO\\s+\\d{10})*${EXRegex}$`,'i');
	let arr = [];
	if(!regex.test(str)) return arr;
	let regex2 = new RegExp(`(\\d{10})\\s+TO\\s+(\\d{10})`,'gi');
	for(let f of str.matchAll(regex2)){
		let sdate = toDate(f[1]);
		let edate = toDate(f[2]);
		arr.push(sdate,edate);
	}
	return arr;
}
function findDates5(startDate,endDate,str){
	let regex = new RegExp(`^\\d{2}\\s+${RegexMeses}(-|\\s+-\\s+)\\d{2}\\s+${RegexMeses}\\s+${regexhhmihhmi}(?:${sep}\\d{2}\\s+${RegexMeses}(-|\\s+-\\s+)\\d{2}\\s+${RegexMeses}\\s+${regexhhmihhmi})*${EXRegex}$`);
	let arr = [];
	if(!regex.test(str)) return arr;
	let yyyy = startDate.getUTCFullYear();
	let regex2 = new RegExp(`(?<sdia>\\d{2})\\s+(?<smes>${RegexMeses})-(?<edia>\\d{2})\\s+(?<emes>${RegexMeses})\\s+(?<horario>${regexhhmihhmi})`,'g');
	let ops = []
	for(let f of str.matchAll(regex2)){
		let {sdia,smes,edia,emes,horario} = f.groups;
		ops.push({sdia,smes,edia,emes,horario});
	}

	let regex3 = new RegExp(`(?<sdia>\\d{2})\\s+(?<smes>${RegexMeses})\\s+-\\s+(?<edia>\\d{2})\\s+(?<emes>${RegexMeses})\\s+(?<horario>${regexhhmihhmi})`,'g');
	for(let f of str.matchAll(regex3)){
		let {sdia,smes,edia,emes,horario} = f.groups;
		ops.push({sdia,smes,edia,emes,horario});
	}
	for(let o of ops){
			let sdate = new Date(Date.UTC(yyyy,mesesCadena[o.smes],o.sdia));
			let edate = new Date(Date.UTC(yyyy,mesesCadena[o.emes],o.edia));
			const times = obtenerHorarios(o.horario);
			for(let h of times){
				let arr2 = genRanges(sdate,edate,h.shhsmi,h.ehhemi);
				arr.push(...arr2);

			}

		}


	return arr;
}

function findDates6(startDate,endDate,str){
	let mon_day_mon_day_hhmi_hhmo = `${RegexMeses}\\s+\\d{2}-${RegexMeses}\\s+\\d{2}\\s+${regexhhmihhmi}`;
	let item = `(?:${mon_day_mon_day_hhmi_hhmo}|(${RegexMeses}\\s+)?${RegexdiasMult}\\s+${regexhhmihhmiMult})`;
	let regex = new RegExp(`^${item}(?:${sep}${item})*$`);
	
	let arr = [];
	if(!regex.test(str)) return arr;
	let yyyy = startDate.getUTCFullYear();
	let smes = startDate.getUTCMonth();


	let Refmon_day_mon_day_hhmi_hhmo = `(?<smes>${RegexMeses})\\s+(?<sdia>\\d{2})-(?<emes>${RegexMeses})\\s+(?<edia>\\d{2})\\s+(?<horario>${regexhhmihhmi})`;

	let regex2 =new RegExp(Refmon_day_mon_day_hhmi_hhmo,'g');

	for(let f of str.matchAll(regex2)){
		let {smes,sdia,emes,edia,horario} = f.groups;
		let sdate = new Date(Date.UTC(yyyy,mesesCadena[smes],sdia));
		let edate = new Date(Date.UTC(yyyy,mesesCadena[emes],edia));
		const times = obtenerHorarios(horario);
		for(let h of times){
			let arr2 = genRanges(sdate,edate,h.shhsmi,h.ehhemi);
			arr.push(...arr2);

		}
	}
	
 let regex3 = new RegExp(`((?<mes>${RegexMeses})\\s+)?(?<dias>${RegexdiasMult})\\s+(?<horarios>${regexhhmihhmiMult})`,'g');
 for(let f of str.matchAll(regex3)){
		let {mes,dias,horarios} = f.groups;
		dias = dias.replace(' - ','-');
		mes = mesesCadena[mes];
		mes = mes ?? smes;
		const times = obtenerHorarios(horarios);
		for(let dia of dias.split(/\s+/)){

			let sdia,edia;
			if(dia.includes(' AND ')){
				[sdia,edia] = dia.split(' AND ');
			}
			else{
				[sdia,edia] = dia.split('-');
			}
			edia = edia ?? sdia;

			let sdate = new Date(Date.UTC(yyyy,mes,sdia));
			let edate = new Date(Date.UTC(yyyy,mes,edia));

			for(let h of times){
				let arr2 = genRanges(sdate,edate,h.shhsmi,h.ehhemi);
				arr.push(...arr2);

			}

		}
	}



	return arr;
}

function findDates7(startDate,endDate,str){
	let regex = new RegExp(`(?<horario>${regexhhmihhmi})\\s+ON\\s+(?<mes>${RegexMeses})\\s+(?<dias>${RegexdiasMult})`);
	let arr = [];
	let match = str.match(regex);
	if(!match) return arr;

	let {horario,mes,dias} = match.groups;
	
	const times = obtenerHorarios(horario);
	mes = mesesCadena[mes];
	let yyyy = startDate.getUTCFullYear();
	
	for(let dia of dias.split(/\s+/)){
		let sdia,edia;
		if(dia.includes(' AND ')){
			[sdia,edia] = dia.split(' AND ');
		}
		else{
			[sdia,edia] = dia.split('-');
		}
		edia = edia ?? sdia;
		let sdate = new Date(Date.UTC(yyyy,mes,sdia));
		let edate = new Date(Date.UTC(yyyy,mes,edia));

		for(let h of times){
			let arr2 = genRanges(sdate,edate,h.shhsmi,h.ehhemi);
			arr.push(...arr2);

		}

	}
	return arr;

}


function findDates8(startDate,endDate,str){
	let DayToken = `\\d{2}(?:-\\d{2}|-${RegexMeses}\\s+\\d{2})?`;
	let RegexdiasMult2 = `${DayToken}(?:${sep}${DayToken})*`;
	let regex = new RegExp(
		`^(?<dias_meses>${RegexMeses}\\s+${RegexdiasMult2}(?:${sep}(?:${RegexMeses}\\s+)${RegexdiasMult2})*)\\s+(?<horario>${regexhhmihhmi})$`
	);
	let arr = [];
	let match = str.match(regex);
	if(!match) return arr;

	let {dias_meses,horario} = match.groups;
	let regMes = new RegExp(RegexMeses);
	let regex2 = new RegExp(`(?<mes>${RegexMeses})\\s+(?<dias>${RegexdiasMult2})`,'g');
	dias_meses = dias_meses.replaceAll(/\s+AND\s+/g,' ');
	let yyyy = startDate.getUTCFullYear();
	const times = obtenerHorarios(horario)[0];
	for(let f of dias_meses.matchAll(regex2)){
		let {mes,dias} = f.groups;
		mes = mesesCadena[mes];
		for(let dia of dias.split(/\s+/)){
			let [sdia,edia] = dia.split('-');

			edia = edia ?? sdia;
			if(regMes.test(edia)){
				let sdate = new Date(Date.UTC(yyyy,mes,sdia));
				let arr2 = genRanges(sdate,sdate,times.shhsmi,times.ehhemi);
				arr.push(...arr2);
;
				mes = mesesCadena[edia];

			}
			if(sdia && edia && !regMes.test(edia)){
				let sdate = new Date(Date.UTC(yyyy,mes,sdia));
				let edate = new Date(Date.UTC(yyyy,mes,edia));

				let arr2 = genRanges(sdate,edate,times.shhsmi,times.ehhemi);
				arr.push(...arr2);
;

			}
		}
	}

	return arr;
}

function findDates9(startDate,endDate,str){
	let regex = new RegExp(
		`^${RegexMeses}\\s+\\d{2}(\\s+-\\s+\\d{2})?\\s+-\\s+(?:${RegexMeses}\\s+)?\\d{2}(\\s+-\\s+\\d{2})?\\s+${regexhhmihhmi}` +
		`(?:${sep}${RegexMeses}\\s+\\d{2}(\\s+-\\s+\\d{2})?\\s+-\\s+(?:${RegexMeses}\\s+)?\\d{2}(\\s+-\\s+\\d{2})?\\s+${regexhhmihhmi})*$`
	);
	let arr = [];
	if(!regex.test(str)) return arr;
	let yyyy = startDate.getUTCFullYear();

	let regex2 = new RegExp(`(?<smes>${RegexMeses})\\s+(?<sdia>\\d{2}(\\s+-\\s+\\d{2})?)\\s+-\\s+((?<emes>${RegexMeses})\\s+)?(?<edia>\\d{2}(\\s+-\\s+\\d{2})?)?\\s+(?<horario>${regexhhmihhmi})`,'g');
	for(let f of str.matchAll(regex2)){
		let {smes,sdia,emes,edia,horario} = f.groups;
		if(!emes) emes = smes;


		let sdate = new Date(Date.UTC(yyyy,mesesCadena[smes],sdia));
		let edate = new Date(Date.UTC(yyyy,mesesCadena[emes],edia));
		const times = obtenerHorarios(horario);
		for(let h of times){
			let arr2 = genRanges(sdate,edate,h.shhsmi,h.ehhemi);
			arr.push(...arr2);

		}

	}
	return arr;
}

function findDates10(startDate,endDate,str){
	let regex = new RegExp(`^${RegexdiasT}((-|\\s+)${RegexdiasT})?\\s+${regexhhmihhmiMult}(?:,\\s+${RegexdiasT}((-|\\s+)${RegexdiasT})?\\s+${regexhhmihhmiMult})*${EXRegex}$`);
	let arr = [];
	if(!regex.test(str)) return arr;
	let regex2= new RegExp(`(?<dias>${RegexdiasT}((?<sep>(-|\\s+))${RegexdiasT})?)\\s+(?<horarios>${regexhhmihhmiMult})`,'g');

	const toDays = (diasText, joiner) => {
    if (joiner === "-") return parsediaRange(diasText);             
    if (joiner) return diasText.split(/\s+/).map(d => dayMap[d]);
    return [dayMap[diasText]];
  };

	for(let f of str.matchAll(regex2)){
		let {dias,sep,horarios} = f.groups;
		let diasArr = toDays(dias, sep);
		const times = obtenerHorarios(horarios);
    for (const d of diasArr) {
      for (const t of times) {
        arr.push(...genRanges(startDate, endDate, t.shhsmi, t.ehhemi, d));
      }
    }

	}

	return arr;



}

function findString(str,regex){
	let match = str.match(regex);
	return match ? match[1] : '';
}

function formatDate(date) {
  const pad = n => String(n).padStart(2, '0');

  const day = pad(date.getUTCDate());
  const month = pad(date.getUTCMonth() + 1);
  const year = date.getUTCFullYear();

  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function findDatesICAO(id,message){
	if(!isICAO(id,message)) return [];

	const regexB= /\s*B\)\s*([\s\S]*?)\s*C\)\s*/;
	const regexC= /\s*C\)\s*([\s\S]*?)\s*[DE]\)\s*/;
	const regexD= /\s*D\)\s*([\s\S]*?)\s*E\)\s*/;

	let startDate = toDate(findString(message,regexB));
	let endDate = toDate(findString(message,regexC));
	let str = findString(message,regexD);
	if(!str || str =='') return [];

	startDate = new Date(startDate);
	endDate = new Date(endDate);

	let arr1 = findDates1(startDate,endDate,str);
	let arr2 = findDates2(startDate,endDate,str);
	let arr3 = findDates3(startDate,endDate,str);
	let arr4 = findDates4(startDate,endDate,str);
	let arr5 = findDates5(startDate,endDate,str);
	let arr6 = findDates6(startDate,endDate,str);
	let arr7 = findDates7(startDate,endDate,str);
	let arr8 = findDates8(startDate,endDate,str);
	let arr9 = findDates9(startDate,endDate,str);
	let arr10 =findDates10(startDate,endDate,str);
	
	let dates = [...arr1,...arr2,...arr3,...arr4,...arr5,...arr6,...arr7,...arr8,...arr9,...arr10];
	dates = [
		...new Set(dates.map(d => d.getTime()))
	]
		.map(t => new Date(t));


	dates = dates.map(d => formatDate(d));


	return dates;
}
module.exports = {findDatesICAO}



