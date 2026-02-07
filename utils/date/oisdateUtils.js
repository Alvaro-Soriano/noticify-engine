//Launch Day 14 JAN 1801Z-2244Z
function findDateLaunch(str) {
	const M = {JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};
	const r = /\blaunch\s+day\s*(\d{2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{2})(\d{2})Z-(\d{2})(\d{2})Z\b/gi;
	const y = new Date().getUTCFullYear();
	const p = n => String(n).padStart(2,'0');
	const f = d => `${p(d.getUTCDate())}/${p(d.getUTCMonth()+1)}/${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
	const out = [];

	for (const m of str.matchAll(r)) {
		const s = new Date(Date.UTC(y, M[m[2]], m[1], m[3], m[4]));
		const e = new Date(Date.UTC(y, M[m[2]], m[1], m[5], m[6]));
		if (e <= s) e.setUTCDate(e.getUTCDate() + 1);
		out.push(f(s));
		out.push(f(e));
	}
	return out;
}

module.exports = {findDateLaunch};