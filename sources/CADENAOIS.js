
const urlAdv = "https://compass.atfm.aero//public_svcdynamic/?key=public_getadvisories";
const {findDateLaunch} = require('../utils/date/oisdateUtils.js');

function formatearFecha(fechaISO) {
	const fecha = new Date(fechaISO);

	const dia = String(fecha.getDate()).padStart(2, '0');
	const mes = String(fecha.getMonth() + 1).padStart(2, '0');
	const anio = fecha.getFullYear();

	const horas = String(fecha.getHours()).padStart(2, '0');
	const minutos = String(fecha.getMinutes()).padStart(2, '0');

	return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
}

async function getAdvisories(){
	let arr =[];
	try{
		let data = await fetch(urlAdv);
		data = await data.json();
		arr= data.rows.map(e => {
			let coords = (e.geom )? e.geom.coordinates :[];
			coords = coords.map(nivel1 =>nivel1.map(([x, y]) => [y, x]));
			let str = e.summary+'\n'+e.reason+'\n'+e.details;
			return {
				zone:e.summary+' - '+e.country,
				id:e.advisoryid,
				status:'A',//status:e.status,
				issueDate: formatearFecha(e.createtimestamp),
				startDate: formatearFecha(e.advisorystarttime),
				endDate: formatearFecha(e.advisoryendtime),
				message: str,
				type:"CADENAOIS",
				coords:coords,
				dates:findDateLaunch(str)
			}
		});
	}
	catch(e){
		console.error(e);
	}

	return arr;

}
module.exports = {getAdvisories};