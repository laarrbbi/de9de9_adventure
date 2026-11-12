// Small drawings of everything the Shop sells, on a 64×64 grid, drawn in
// code like the rest of the game. itemArt(id, size) returns an <svg>.
const INK = '#2f3f47';
const line = `stroke="${INK}" stroke-width="2" stroke-linejoin="round"`;

const wheel = (x, y, r = 6) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x}" cy="${y}" r="${r * 0.4}" fill="#c3cfcd"/>`;
const ground = (y = 54) => `<path d="M4 ${y}H60" stroke="#7cc576" stroke-width="4" stroke-linecap="round"/>`;

const ART = {
  // Homes
  hole: `${ground()}<path d="M14 54Q32 30 50 54Z" fill="#c98f5a" ${line}/><ellipse cx="32" cy="47" rx="7" ry="4.5" fill="#5b3a22"/>`,
  anthill: `${ground()}<path d="M6 54Q32 6 58 54Z" fill="#c98f5a" ${line}/>
    <path d="M26 54V42a6 6 0 0 1 12 0v12Z" fill="#5b3a22"/><circle cx="20" cy="36" r="2" fill="#a8714a"/><circle cx="42" cy="30" r="2" fill="#a8714a"/>`,
  house: `${ground()}<rect x="14" y="30" width="36" height="24" fill="#f7efe0" ${line}/>
    <path d="M9 32L32 12L55 32Z" fill="#e7464e" ${line}/><rect x="28" y="40" width="9" height="14" fill="#a8714a"/>
    <rect x="18" y="36" width="7" height="7" fill="#9fd9ea" stroke="${INK}" stroke-width="1.5"/>`,
  villa: `${ground()}<rect x="8" y="28" width="42" height="26" fill="#fdfbf6" ${line}/><rect x="6" y="24" width="46" height="5" rx="1" fill="#e08a4a" ${line}/>
    <path d="M16 54V44a5 5 0 0 1 10 0v10Z" fill="#65cbc4"/><path d="M32 54V44a5 5 0 0 1 10 0v10Z" fill="#65cbc4"/>
    <path d="M56 54V30" stroke="#a8714a" stroke-width="3"/><path d="M56 30q-8-4-12 2M56 30q5-4 6 3M56 30q-3-7-9-8M56 30q3-6 6-6" stroke="#4f9e4c" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  palace: `${ground(58)}<rect x="12" y="30" width="40" height="28" fill="#f2d9a6" ${line}/>
    <path d="M20 30a12 12 0 0 1 24 0Z" fill="#65cbc4" ${line}/><path d="M32 14v4" stroke="#d99a00" stroke-width="2"/><circle cx="32" cy="13" r="2" fill="#ffc93c"/>
    <rect x="4" y="22" width="8" height="36" fill="#f2d9a6" ${line}/><rect x="52" y="22" width="8" height="36" fill="#f2d9a6" ${line}/>
    <path d="M4 22L8 14L12 22M52 22L56 14L60 22" fill="#65cbc4" ${line}/>
    <path d="M27 58V46a5 5 0 0 1 10 0v12Z" fill="#16736c"/><path d="M14 52h36" stroke="#e7464e" stroke-width="2"/>`,

  // Rooms
  kitchen: `<rect x="16" y="8" width="32" height="50" rx="4" fill="#f7fbfa" ${line}/><path d="M16 26H48" ${line}/>
    <path d="M42 14v8M42 32v12" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="24" cy="16" r="2.5" fill="#e7464e"/><circle cx="26" cy="36" r="2.5" fill="#ffc93c"/>`,
  bathroom: `<path d="M8 32H56L52 48Q32 54 12 48Z" fill="#f7fbfa" ${line}/><ellipse cx="32" cy="32" rx="24" ry="4" fill="#9fd9ea" ${line}/>
    <path d="M14 50l-2 6M50 50l2 6" ${line} stroke-linecap="round"/><path d="M48 32V10H40" fill="none" stroke="#8b9da2" stroke-width="3"/>
    <path d="M36 10h8l-2 4h-4Z" fill="#8b9da2"/><circle cx="22" cy="28" r="3" fill="#fff"/><circle cx="28" cy="26" r="2" fill="#fff"/>`,
  bedroom: `<rect x="6" y="20" width="10" height="38" rx="3" fill="#a8714a" ${line}/><rect x="8" y="36" width="50" height="16" rx="4" fill="#b07a4a" ${line}/>
    <rect x="18" y="28" width="16" height="10" rx="4" fill="#fff" ${line}/><rect x="20" y="34" width="38" height="12" rx="4" fill="#65cbc4" ${line}/>
    <path d="M28 40h28" stroke="#16736c" stroke-width="2"/>`,
  musicRoom: `<rect x="6" y="20" width="14" height="34" rx="3" fill="${INK}"/><circle cx="13" cy="30" r="4" fill="#8b9da2"/><circle cx="13" cy="44" r="5.5" fill="#8b9da2"/>
    <rect x="44" y="20" width="14" height="34" rx="3" fill="${INK}"/><circle cx="51" cy="30" r="4" fill="#8b9da2"/><circle cx="51" cy="44" r="5.5" fill="#8b9da2"/>
    <rect x="22" y="38" width="20" height="16" rx="3" fill="#ff8515" ${line}/><path d="M28 30V14l10-3v15" fill="none" ${line}/><circle cx="26" cy="30" r="3" fill="${INK}"/><circle cx="36" cy="27" r="3" fill="${INK}"/>`,

  // Cars
  leafCart: `<path d="M6 40Q30 14 58 36Q34 50 6 40Z" fill="#7cc576" ${line}/><path d="M10 40Q32 30 54 37" stroke="#3a8f46" stroke-width="2" fill="none"/>${wheel(18, 48)}${wheel(46, 48)}`,
  scooter: `<path d="M14 44H42L48 26" fill="none" ${line} stroke-width="3"/><path d="M44 24h8" ${line} stroke-linecap="round"/>
    <path d="M10 44q2-12 14-12h10v12Z" fill="#e7464e" ${line}/>${wheel(14, 48)}${wheel(48, 48)}`,
  littleCar: `<path d="M6 46V36q0-4 4-5l8-1 6-10h16l8 10 8 2q4 1 4 5v9Z" fill="#65cbc4" ${line}/><path d="M26 24h12l5 7H22Z" fill="#dff4f1" stroke="${INK}" stroke-width="1.5"/>${wheel(18, 47)}${wheel(46, 47)}`,
  pickup: `<path d="M4 46V30h22l4-10h12l6 10h12v16Z" fill="#ff8515" ${line}/><path d="M32 22h8l4 8H30Z" fill="#dff4f1" stroke="${INK}" stroke-width="1.5"/>
    <path d="M6 30h18" stroke="#c96a10" stroke-width="2"/><circle cx="12" cy="26" r="4" fill="#e7464e"/><circle cx="19" cy="25" r="3.5" fill="#ffc93c"/>${wheel(16, 47)}${wheel(48, 47)}`,
  sportsCar: `<path d="M4 44q0-6 6-7l14-3 8-7h12l12 8q4 1 4 5v4Z" fill="#e7464e" ${line}/><path d="M30 29h12l7 6H26Z" fill="#dff4f1" stroke="${INK}" stroke-width="1.5"/>
    <path d="M10 40h44" stroke="#fff" stroke-width="2"/>${wheel(16, 46)}${wheel(48, 46)}`,

  // Equipment
  wateringCan: `<path d="M16 26h26v26H16Z" fill="#65cbc4" ${line}/><path d="M42 30l14-10" ${line} stroke-width="4" stroke-linecap="round"/>
    <path d="M54 16l6 4-4 4Z" fill="#65cbc4" ${line}/><path d="M16 30q-10 0-10 10t10 8" fill="none" ${line} stroke-width="3"/>`,
  sprinkler: `<rect x="28" y="30" width="8" height="24" fill="#8b9da2" ${line}/><rect x="20" y="24" width="24" height="8" rx="3" fill="#65cbc4" ${line}/>
    <path d="M20 22Q10 14 6 20M44 22Q54 14 58 20M32 22V8" stroke="#3aa6dd" stroke-width="2.5" fill="none" stroke-dasharray="3 3" stroke-linecap="round"/>${ground(56)}`,
  toolbox: `<rect x="8" y="26" width="48" height="26" rx="3" fill="#e7464e" ${line}/><path d="M24 26v-6h16v6" fill="none" ${line} stroke-width="3"/>
    <path d="M8 36H56" ${line}/><rect x="28" y="33" width="8" height="6" rx="1" fill="#ffc93c" ${line}/>`,
  tractor: `<path d="M8 42V28h20V14h16l4 14h8v14Z" fill="#7cc576" ${line}/><path d="M30 18h10l3 10H30Z" fill="#dff4f1" stroke="${INK}" stroke-width="1.5"/>
    <path d="M14 28V20" stroke="${INK}" stroke-width="3"/>${wheel(20, 46, 10)}${wheel(50, 48, 7)}`,
  workshop: `${ground(58)}<path d="M8 58V28l24-14 24 14v30Z" fill="#f2d9a6" ${line}/><rect x="22" y="38" width="20" height="20" fill="#a8714a" ${line}/>
    <circle cx="32" cy="27" r="6" fill="#ffc93c" ${line}/><circle cx="32" cy="27" r="2.2" fill="${INK}"/>
    <path d="M32 19v-2M32 37v-2M24 27h-2M42 27h-2" stroke="${INK}" stroke-width="3"/>`,

  // Clothes
  redCap: `<path d="M12 40Q12 14 34 14Q54 14 54 40Z" fill="#e7464e" ${line}/><path d="M8 40Q34 52 60 40Q34 44 8 40Z" fill="#b42f38" ${line}/>
    <circle cx="34" cy="14" r="3" fill="#fff" ${line}/><path d="M24 30h20" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  strawHat: `<ellipse cx="32" cy="42" rx="28" ry="8" fill="#f0c96a" ${line}/><path d="M18 42Q18 16 32 16Q46 16 46 42Z" fill="#f0c96a" ${line}/>
    <path d="M18 36Q32 40 46 36" stroke="#e7464e" stroke-width="5"/>`,
  overalls: `<path d="M16 26h32v14q0 16-16 16T16 40Z" fill="#3d6fb6" ${line}/><rect x="22" y="14" width="20" height="14" rx="2" fill="#3d6fb6" ${line}/>
    <path d="M22 16L14 6M42 16l8-10" ${line} stroke-width="3" stroke-linecap="round"/><circle cx="25" cy="18" r="2" fill="#ffc93c"/><circle cx="39" cy="18" r="2" fill="#ffc93c"/>
    <rect x="27" y="20" width="10" height="6" rx="1" fill="#5b8fd6"/>`,
  sunglasses: `<path d="M6 26H58" ${line} stroke-width="3"/><rect x="8" y="24" width="20" height="16" rx="7" fill="${INK}"/><rect x="36" y="24" width="20" height="16" rx="7" fill="${INK}"/>
    <path d="M12 28l6 0M40 28l6 0" stroke="#8b9da2" stroke-width="2.5" stroke-linecap="round"/>`,
};

export const itemArt = (id, size = 56) =>
  `<svg class="item-art" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">${ART[id] ?? ''}</svg>`;
