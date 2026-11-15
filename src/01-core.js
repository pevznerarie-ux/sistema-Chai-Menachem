'use strict';
/* ================= helpers ================= */
const $=(s,el=document)=>el.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const pad=n=>String(n).padStart(2,'0');
const isoOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const toDate=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d,12)};
const addDays=(s,n)=>{const d=toDate(s);d.setDate(d.getDate()+n);return isoOf(d)};
const diffDays=(a,b)=>Math.round((toDate(a)-toDate(b))/864e5);
const TODAY=isoOf(new Date()), Y=+TODAY.slice(0,4), YM=TODAY.slice(0,7);
const fmtDate=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'—';
const fmtDM=s=>s?s.slice(8,10)+'/'+s.slice(5,7):'—';
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MES3=MESES.map(m=>m.slice(0,3));
const compTxt=c=>MESES[+c.slice(5,7)-1]+'/'+c.slice(0,4);
const pl=(n,s,p)=>n+' '+(n===1?s:p);
function ago(s){const n=diffDays(TODAY,s);if(n<0)return inDays(s);if(n===0)return 'hoje';if(n===1)return 'ontem';if(n<60)return n+' dias atrás';if(n<365)return Math.round(n/30)+' meses atrás';return pl(Math.floor(n/365),'ano','anos')+' atrás'}
function inDays(s){const n=diffDays(s,TODAY);if(n<0)return ago(s);if(n===0)return 'hoje';if(n===1)return 'amanhã';return 'em '+n+' dias'}
const BRL=v=>(+v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const BRL0=v=>(+v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const NUM=v=>(+v||0).toLocaleString('pt-BR');
const pct=(a,b)=>b?Math.round(a/b*100):0;
function parseMoney(s){s=String(s??'').replace(/[^\d,.-]/g,'');if(!s)return 0;if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');return parseFloat(s)||0}
const age=n=>{if(!n)return null;let a=Y-+n.slice(0,4);if(TODAY.slice(5)<n.slice(5))a--;return a};
const initials=n=>{const p=String(n||'').trim().split(/\s+/);return(((p[0]||'')[0]||'')+(p.length>1?p[p.length-1][0]:'')).toUpperCase()};
const sum=(a,f)=>a.reduce((t,x)=>t+(+f(x)||0),0);
const by=(f,dir=1)=>(a,b)=>{const x=f(a),y=f(b);return x<y?-dir:x>y?dir:0};
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ================= calendário hebraico ================= */
const HEB=(()=>{
  const PT={Tishri:'Tishrei',Heshvan:'Cheshvan',Kislev:'Kislev',Tevet:'Tevet',Shevat:'Shevat',Adar:'Adar','Adar I':'Adar I','Adar II':'Adar II',Nisan:'Nissan',Iyar:'Iyar',Sivan:'Sivan',Tamuz:'Tamuz',Av:'Av',Elul:'Elul'};
  const MONTHS=['Tishrei','Cheshvan','Kislev','Tevet','Shevat','Adar','Adar I','Adar II','Nissan','Iyar','Sivan','Tamuz','Av','Elul'];
  let fmt=null;
  try{
    const f=new Intl.DateTimeFormat('en-u-ca-hebrew',{day:'numeric',month:'long',year:'numeric'});
    const p=f.formatToParts(new Date(2026,10,15,12));
    if(p.some(x=>x.type==='month'&&x.value==='Kislev')&&p.some(x=>x.type==='day'&&x.value==='5'))fmt=f;
  }catch(e){}
  const cache=new Map();
  function of(iso){
    if(!fmt||!iso)return null;
    let v=cache.get(iso);if(v)return v;
    const p=fmt.formatToParts(toDate(iso)),g=t=>(p.find(x=>x.type===t)||{}).value;
    v={d:+g('day'),m:PT[g('month')]||g('month'),y:+g('year')};cache.set(iso,v);return v;
  }
  const fwd=new Map(),back=new Map();
  if(fmt){
    for(let i=0;i<400;i++){const s=addDays(TODAY,i),h=of(s),k=h.m+'|'+h.d;if(!fwd.has(k))fwd.set(k,s)}
    for(let i=1;i<=400;i++){const s=addDays(TODAY,-i),h=of(s),k=h.m+'|'+h.d;if(!back.has(k))back.set(k,s)}
  }
  // Adar em ano comum x ano embolísmico: yahrzeit de Adar é observado em Adar I; Adar I/II caem em Adar no ano comum
  const alts=m=>m==='Adar'?['Adar','Adar I']:m==='Adar I'?['Adar I','Adar']:m==='Adar II'?['Adar II','Adar']:[m];
  function find(map,m,d,dir){
    let best=null;
    for(const a of alts(m)){const s=map.get(a+'|'+d);if(s&&(!best||(dir>0?s<best:s>best)))best=s}
    if(!best&&d===30)return find(map,m,29,dir);
    return best;
  }
  const same=(h,m,d)=>!!h&&h.d===d&&alts(m).includes(h.m);
  return{ok:!!fmt,MONTHS,of,alts,same,next:(m,d)=>find(fwd,m,d,1),prev:(m,d)=>find(back,m,d,-1),txt:h=>h?h.d+' de '+h.m:'—'};
})();

/* ================= ícones ================= */
const IC={
home:'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
users:'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.500 11a3.500 3.500 0 1 0 0-7 3.500 3.500 0 0 0 0 7zM21 20v-1a4 4 0 0 0-3-3.870M15.500 4.130a3.500 3.500 0 0 1 0 6.750',
user:'M19 20v-1a5 5 0 0 0-5-5h-4a5 5 0 0 0-5 5v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
wallet:'M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16.500 14h.010',
calendar:'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 10h16M8 3v4M16 3v4',
chat:'M4 5h16v11H9l-5 4z',
chart:'M5 20V10M11 20V4M17 20v-7M2 20h20',
gear:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.400 13a7.500 7.500 0 0 0 0-2l2-1.500-2-3.400-2.300.900a7.500 7.500 0 0 0-1.700-1L15 3.500h-4l-.400 2.500a7.500 7.500 0 0 0-1.700 1l-2.300-.900-2 3.400L6.600 11a7.500 7.500 0 0 0 0 2l-2 1.500 2 3.400 2.300-.900a7.500 7.500 0 0 0 1.700 1l.400 2.500h4l.400-2.500a7.500 7.500 0 0 0 1.700-1l2.300.900 2-3.400z',
search:'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
plus:'M12 5v14M5 12h14',
down:'M6 9l6 6 6-6',next:'M9 6l6 6-6 6',prev:'M15 6l-6 6 6 6',
phone:'M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z',
mail:'M3 6h18v12H3zM3 7l9 6 9-6',
pin:'M12 21s-6-5.300-6-10a6 6 0 1 1 12 0c0 4.700-6 10-6 10zM12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
wa:'M20 11.500a8 8 0 0 1-11.800 7L4 20l1.500-4A8 8 0 1 1 20 11.500z',
eye:'M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
edit:'M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4',
trash:'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
dots:'M12 5.500v.010M12 12v.010M12 18.500v.010',
download:'M12 4v11M7 11l5 5 5-5M4 20h16',
upload:'M12 16V5M7 9l5-5 5 5M4 20h16',
check:'M5 12.500l4.500 4.500L19 7.500',
checkc:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.500l2.700 2.700L16 9.800',
clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
bell:'M6 16v-5a6 6 0 1 1 12 0v5l1.500 2h-15zM10 20a2 2 0 0 0 4 0',
alert:'M12 3l10 18H2zM12 10v5M12 18v.010',
heart:'M12 20s-7-4.400-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.600-9 9-9 9z',
candle:'M12 3c1.600 2 2.500 3.300 2.500 4.600a2.500 2.500 0 0 1-5 0C9.500 6.300 10.400 5 12 3zM9 12h6v9H9zM12 10v2',
cake:'M4 20h16v-7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2zM4 16c2 1.500 3 1.500 4 0s2-1.500 4 0 2 1.500 4 0 2-1.500 4 0M12 7v4M12 4.500v.010',
star:'M12 3l2.700 5.600 6.100.800-4.500 4.300 1.100 6.100L12 16.900l-5.400 2.900 1.100-6.100L3.200 9.400l6.100-.800z',
filter:'M4 5h16l-6 7v6l-4 2v-8z',
x:'M6 6l12 12M18 6L6 18',
back:'M19 12H5M11 6l-6 6 6 6',
send:'M21 3L10 14M21 3l-7 18-4-7-7-4z',
file:'M6 3h8l4 4v14H6zM14 3v4h4',
list:'M8 6h12M8 12h12M8 18h12M4 6v.010M4 12v.010M4 18v.010',
ticket:'M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4zM14 6v12',
child:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 14c1 1.300 5 1.300 6 0M9 10v.010M15 10v.010',
menu:'M4 6h16M4 12h16M4 18h16',
copy:'M9 9h11v11H9zM5 15V4h11',
zap:'M13 2L4 14h7l-1 8 9-12h-7z',
layers:'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
info:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.500v.010',
temple:'M3 9l9-5 9 5M5 9h14M6.500 11v7M10.300 11v7M13.700 11v7M17.500 11v7M4 20h16'
};
const ic=(n,s=16,sw=1.8)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${n==='dots'?2.6:sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IC[n]||''}"/></svg>`;
