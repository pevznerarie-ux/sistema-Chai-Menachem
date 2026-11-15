/* ================= dados (exemplo) ================= */
const DB={fam:[],ppl:[],pay:[],don:[],prom:[],ev:[],yz:[],ct:[],disp:[],tpl:[],auto:[],seg:[],cfg:{}};
const FAM=new Map(),PPL=new Map(),EV=new Map();
const IX={ppl:new Map(),pay:new Map(),don:new Map(),prom:new Map(),ct:new Map(),yz:new Map(),reg:new Map()};
let SEQ=1,LASTID=0;const nid=()=>{if(PREV)return SEQ++;let v=(Date.now()-1.7e12)*1000+Math.floor(Math.random()*1000);if(v<=LASTID)v=LASTID+1;return LASTID=v};
const ixAdd=(m,k,v)=>{let a=m.get(k);if(!a)m.set(k,a=[]);a.push(v);return v};
const ixOf=(m,k)=>m.get(k)||[];
const ixDel=(m,k,v)=>{const a=m.get(k);if(a){const i=a.indexOf(v);if(i>=0)a.splice(i,1)}};
const arrDel=(a,v)=>{const i=a.indexOf(v);if(i>=0)a.splice(i,1)};
function addFam(f,top){f.id=nid();top?DB.fam.unshift(f):DB.fam.push(f);FAM.set(f.id,f);return f}
function addPerson(p){p.id=nid();DB.ppl.push(p);PPL.set(p.id,p);ixAdd(IX.ppl,p.fid,p);const f=FAM.get(p.fid);if(f)f._s=null;return p}
function addPay(x){x.id=nid();DB.pay.push(x);return ixAdd(IX.pay,x.fid,x)}
function addDon(x){x.id=nid();DB.don.push(x);return ixAdd(IX.don,x.fid,x)}
function addProm(x){x.id=nid();DB.prom.push(x);return ixAdd(IX.prom,x.fid,x)}
function addCt(x){x.id=nid();DB.ct.push(x);return ixAdd(IX.ct,x.fid,x)}
function addYz(x){x.id=nid();DB.yz.push(x);return ixAdd(IX.yz,x.fid,x)}
function addEv(e){e.id=nid();e.regs=[];e.n0=e.n0||0;DB.ev.push(e);EV.set(e.id,e);return e}
function addReg(e,r){e.regs.push(r);ixAdd(IX.reg,r.fid,e);return r}

/* ---- derivados ---- */
const members=fid=>ixOf(IX.ppl,fid);
const respOf=f=>PPL.get(f.respId)||members(f.id)[0]||null;
const famName=f=>'Família '+f.nome;
const payStatus=p=>p.pagoEm?'Pago':p.venc<TODAY?'Atrasado':'Aberto';
function mensStatus(f){if(!f.mens||!f.mens.ativa)return 'none';return ixOf(IX.pay,f.id).some(p=>!p.pagoEm&&p.venc<TODAY)?'late':'ok'}
const nextPay=fid=>ixOf(IX.pay,fid).filter(p=>!p.pagoEm).sort(by(p=>p.venc))[0]||null;
const lastDon=fid=>ixOf(IX.don,fid).slice().sort(by(d=>d.data,-1))[0]||null;
const yzNext=y=>{if(y._n===undefined)y._n=HEB.next(y.m,y.d)||null;return y._n};
const nextYz=fid=>ixOf(IX.yz,fid).filter(y=>yzNext(y)).sort(by(yzNext))[0]||null;
const contacts=fid=>ixOf(IX.ct,fid).slice().sort(by(c=>c.data,-1));
const evEnd=e=>e.fim||e.data;
const evInsc=e=>e.n0+sum(e.regs,r=>r.q);
function evStatus(e){if(e.cancel)return 'Cancelado';if(evEnd(e)<TODAY)return 'Concluído';if(e.data<=TODAY)return 'Em andamento';return e.vagas>0&&evInsc(e)>=e.vagas?'Lotado':'Aberto'}
const nextEv=fid=>ixOf(IX.reg,fid).filter(e=>!e.cancel&&e.data>=TODAY).sort(by(e=>e.data))[0]||null;
const isAbsent=f=>f.status==='Ativo'&&f.part.shabat&&(!f.pres||diffDays(TODAY,f.pres.data)>21);
const isKid=p=>{const a=age(p.nasc);return a!==null&&a<13};
const isTeen=p=>{const a=age(p.nasc);return a!==null&&a>=13&&a<18};
const kidsOf=fid=>members(fid).filter(isKid);
const teensOf=fid=>members(fid).filter(isTeen);
const CT_LABEL={wa:'WhatsApp enviado',tel:'Ligação realizada',email:'E-mail enviado',pres:'Presença registrada',reuniao:'Reunião',tarefa:'Follow-up'};
const CT_ICON={wa:['wa','green'],tel:['phone','blue'],email:['mail','purple'],pres:['checkc','green'],reuniao:['users','amber'],tarefa:['clock','amber']};
const CATS=['Sócio','Frequentador','Patrocinador','Visitante'];
const CAT_TONE={'Sócio':'green','Frequentador':'purple','Patrocinador':'amber','Visitante':'gray'};
const FORMAS=['PIX','Cartão de crédito','Boleto','Débito automático','Dinheiro'];
const PAPEIS=['Pai','Mãe','Filho','Filha','Avô','Avó','Outro'];
const RELS_YZ=['Pai','Mãe','Avô','Avó','Irmão','Irmã','Cônjuge','Filho','Filha','Tio','Tia','Sogro','Sogra','Outro'];
const EV_TIPOS=['Comunitário','Chai Kids','Chai Teens','Beneficente','Aula'];
const DON_TIPOS=['Doação geral','Aliá','Tzedaká','Campanha de Pessach','Campanha de Tishrei','Kidush','Em memória (yahrzeit)'];
const PART=[['shabat','Frequenta Shabat à noite'],['eventos','Frequenta eventos'],['aulas','Frequenta aulas'],['kidush','Participa do Kidush'],['kids','Chai Kids'],['teens','Chai Teens']];
const SEGS=[
 ['Comunidade','Todas as famílias ativas',f=>f.status==='Ativo'],
 ['Sócios','Categoria Sócio',f=>f.status==='Ativo'&&f.cat==='Sócio'],
 ['Frequentadores','Categoria Frequentador',f=>f.status==='Ativo'&&f.cat==='Frequentador'],
 ['Patrocinadores','Categoria Patrocinador',f=>f.status==='Ativo'&&f.cat==='Patrocinador'],
 ['Visitantes','Categoria Visitante',f=>f.status==='Ativo'&&f.cat==='Visitante'],
 ['Chai Kids','Famílias com crianças no Chai Kids',f=>f.status==='Ativo'&&f.part.kids],
 ['Chai Teens','Famílias com jovens no Chai Teens',f=>f.status==='Ativo'&&f.part.teens],
 ['Doadores','Doaram nos últimos 12 meses',f=>ixOf(IX.don,f.id).some(d=>d.data>=addDays(TODAY,-365))],
 ['Mensalidade em atraso','Mensalidade vencida e não paga',f=>mensStatus(f)==='late'],
 ['Ausentes','Frequentam o Shabat e não vêm há mais de 3 semanas',isAbsent]
];
const allSegs=()=>SEGS.map(s=>({nome:s[0],crit:s[1],fn:s[2]})).concat(DB.seg);
const segFams=s=>DB.fam.filter(s.fn);
const segCount=s=>sum(segFams(s).filter(f=>f.okWa!==false),f=>members(f.id).filter(p=>p.tel).length);

function seed(){
  const R=rng(5787),ri=(a,b)=>a+Math.floor(R()*(b-a+1)),pick=a=>a[Math.floor(R()*a.length)],ch=p=>R()<p;
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const SUR=['Cohen','Levy','Harari','Sasson','Mizrahi','Levi','Goldberg','Rosenberg','Katz','Friedman','Schwartz','Weiss','Klein','Stern','Kogan','Grinberg','Dayan','Nigri','Douek','Hazan','Mansur','Chalom','Cherem','Politi','Azulay','Benchimol','Abadi','Sutton','Tawil','Dwek','Kassin','Sayeg','Homsi','Blum','Feldman','Gorenstein','Lerner','Milman','Perlman','Rubin','Segal','Shapiro','Tabak','Wainer','Zimmerman','Berger','Edelstein','Fuchs','Gelman','Horowitz','Kaufman','Lewin','Mandel','Novak','Pinto','Toledano','Uziel','Vaisman','Wolff','Yaffe','Zagury','Barzilai','Elbaz','Gabbay','Hadad','Kadosh','Laniado','Maman','Nahum','Zeitune','Kalili','Menache','Bialik','Jacobson','Oren','Sztern','Abramovich','Rabinovich'];
  const MEN=['David','Moshe','Yossef','Avraham','Yaacov','Daniel','Michel','Rafael','Gabriel','Eli','Shlomo','Menachem','Mendel','Ariel','Benjamin','Samuel','Natan','Isaac','Ilan','Marcos','Sergio','Claudio','Roberto','Alberto','Jaime','Leo','Henrique','Ricardo','Fabio','André','Bruno','Jonathan','Yehuda','Meir','Chaim','Zalman','Dov','Uri','Tzvi','João','Moisés'];
  const WOM=['Sara','Rivka','Rachel','Lea','Miriam','Ester','Chana','Devora','Tamar','Yael','Ruth','Débora','Raquel','Marina','Cláudia','Fernanda','Patrícia','Simone','Denise','Ilana','Michal','Shoshana','Batya','Mushka','Chaya','Nechama','Dina','Judith','Ana','Beatriz','Carla','Helena','Karen','Liora','Noa','Tali','Vivian','Paula','Renata','Sofia'];
  const MENH=['Avraham','Yitzchak','Yaacov','Moshe','Aharon','David','Shlomo','Yossef','Eliyahu','Shmuel','Chaim','Meir','Menachem','Mordechai','Tzvi','Dov','Yehuda','Binyamin','Reuven','Shimon','Levi','Natan','Baruch','Zalman','Yisrael'];
  const WOMH=['Sarah','Rivka','Rachel','Lea','Chana','Miriam','Esther','Devora','Ruth','Tzipora','Malka','Feiga','Golda','Bluma','Shoshana','Batya','Chaya','Perla','Dina','Tamar'];
  const NOHEB=new Set(['Michel','Marcos','Sergio','Claudio','Roberto','Alberto','Jaime','Leo','Henrique','Ricardo','Fabio','André','Bruno','João','Marina','Cláudia','Fernanda','Patrícia','Simone','Denise','Ana','Beatriz','Carla','Helena','Karen','Vivian','Paula','Renata','Sofia']);
  const PROF_M=['Empresário','Médico','Advogado','Engenheiro','Professor','Comerciante','Dentista','Arquiteto','Contador','Economista','Psicólogo','Designer','Administrador','Analista de sistemas','Corretor de imóveis'];
  const PROF_F=['Empresária','Médica','Advogada','Engenheira','Professora','Comerciante','Dentista','Arquiteta','Contadora','Economista','Psicóloga','Designer','Administradora','Analista de sistemas','Corretora de imóveis'];
  const RUAS=['Rua Bahia','Rua Piauí','Alameda Santos','Rua Oscar Freire','Rua Haddock Lobo','Rua Maranhão','Avenida Higienópolis','Rua Itacolomi','Rua Sergipe','Rua Tupi','Alameda Franca','Rua Albuquerque Lins','Rua Bela Cintra','Rua da Consolação','Rua Três Rios','Rua Prates','Alameda Jaú','Rua Pará'];
  const BAIRROS=['Higienópolis','Jardim Paulista','Bom Retiro','Jardins','Perdizes','Santa Cecília','Consolação','Morumbi'];
  const GRUPOS=['Comissão de Eventos','Captação','Chesed','Minian diário','Aula de Tanya','Bikur Cholim','Chevra Kadisha'];
  const FRM=['PIX','PIX','Cartão de crédito','Boleto','Débito automático'];
  const tel=()=>'11 9'+ri(1000,9999)+'-'+ri(1000,9999),fixo=()=>'11 3'+ri(100,999)+'-'+ri(1000,9999);
  const mail=n=>norm(n).replace(/[^a-z ]/g,'').trim().replace(/\s+/g,'.')+'@email.com';
  const born=(a,b)=>{const g=ri(a,b),md=pad(ri(1,12))+'-'+pad(ri(1,28));return (md<=TODAY.slice(5)?Y-g:Y-g-1)+'-'+md};
  const mkP=(f,first,papel,male,nasc,x)=>addPerson(Object.assign({fid:f.id,nome:first+' '+f.nome,heb:NOHEB.has(first)?'':first+(male?' ben ':' bat ')+pick(MENH),papel,sexo:male?'M':'F',nasc,civil:'',nac:'Brasileira',prof:'',emp:'',tel:'',fixo:'',email:'',obs:'',ativo:true,grupos:[]},x||{}));
  const fresh=(f,male)=>{for(let g=0;g<50;g++){const n=pick(male?MEN:WOM);if(!members(f.id).some(p=>p.nome===n+' '+f.nome))return n}return pick(male?MEN:WOM)};

  /* ---- famílias ---- */
  const SIX=[{n:'Cohen',c:'Sócio',r:'David',sp:'Sara',sh:1,mens:[1200,10,'PIX']},{n:'Levy',c:'Frequentador',r:'João',sp:'Débora',sh:1,mens:[200,5,'Cartão de crédito']},{n:'Harari',c:'Patrocinador',r:'Moisés',sp:'Raquel',sh:1},{n:'Sasson',c:'Patrocinador',r:'Daniel',sp:'Vivian',sh:0},{n:'Mizrahi',c:'Sócio',r:'Yaacov',sp:'Ilana',sh:1,mens:[500,15,'PIX']},{n:'Levi',c:'Frequentador',r:'Ester',sp:null,sh:1,mens:[300,10,'Boleto'],fem:1}];
  const CNT={'Sócio':236,'Frequentador':262,'Patrocinador':35,'Visitante':56};
  SIX.forEach(s=>CNT[s.c]--);
  const pool=[];for(const k in CNT)for(let i=0;i<CNT[k];i++)pool.push(k);
  shuffle(pool);
  const newIdx=new Set(),lastIdx=new Set();
  for(let i=6;i<589;i++){if(i%8===3||i===8)newIdx.add(i);else if(i%9===4)lastIdx.add(i)}
  const used=new Set();
  for(let i=0;i<589;i++){
    const s=SIX[i],nome=s?s.n:pick(SUR),cat=s?s.c:pool[i-6],male=s?!s.fem:ch(.82);
    let first=s?s.r:null;
    if(!first){let g=0;do{first=pick(male?MEN:WOM)}while(used.has(first+' '+nome)&&g++<60)}
    used.add(first+' '+nome);
    const reg=cat!=='Visitante';
    const shabat=s?!!s.sh:ch(cat==='Sócio'?.6:cat==='Patrocinador'?.55:cat==='Frequentador'?.5:.08);
    const cad=i===0?'2019-03-05':newIdx.has(i)?addDays(Y+'-01-01',ri(0,Math.max(0,diffDays(TODAY,Y+'-01-01')-1))):lastIdx.has(i)?addDays((Y-1)+'-01-01',ri(0,364)):(Y-ri(2,9))+'-'+pad(ri(1,12))+'-'+pad(ri(1,28));
    const hasMens=s?!!s.mens:(cat==='Sócio'?true:cat==='Patrocinador'?ch(.4):cat==='Frequentador'?ch(.1):false);
    const mv=s&&s.mens?s.mens:[cat==='Patrocinador'?pick([1800,2500,3600]):pick([180,250,360,500,720,1000]),pick([5,10,15,20]),pick(FRM)];
    const f=addFam({nome,cat,status:(!s&&!newIdx.has(i)&&ch(.045))?'Inativo':'Ativo',fav:i===0,cor:s?[0,1,2,3,0,1][i]:ri(0,7),cad,
      origem:i===0?'Família Levy':ch(.35)?'Família '+pick(SUR):pick(['','','Rabino','Evento da comunidade']),
      soube:pick(['Indicação','Indicação','Instagram','Site','Evento','Passou em frente','WhatsApp']),
      tel:s?'11 9'+String(9-i).repeat(4)+'-'+String(9-i).repeat(4):tel(),fixo:ch(.45)?fixo():'',email:'',
      end:{rua:pick(RUAS)+', '+ri(20,1900),comp:ch(.6)?'Apto '+ri(11,214):'',bairro:pick(BAIRROS),cid:'São Paulo',uf:'SP',cep:'01'+ri(200,599)+'-'+pad(ri(0,99))+'0'},
      part:{shabat,eventos:reg&&ch(.6),aulas:reg&&ch(.25),kidush:shabat&&ch(.6),kids:false,teens:false},
      mens:{ativa:hasMens,valor:hasMens?mv[0]:0,dia:mv[1],forma:mv[2]},
      trib:nome==='Cohen'?'Cohen':(nome==='Levi'||nome==='Levy')?'Levi':'Israel',idioma:'Português',okWa:true,okMail:true,obs:'',pres:null});
    const ra=ri(30,70);
    const r=mkP(f,first,male?'Pai':'Mãe',male,i===0?'1978-05-20':born(ra,ra),{tel:f.tel,email:mail(first+' '+nome),prof:pick(male?PROF_M:PROF_F),grupos:ch(.2)?[pick(GRUPOS)]:[]});
    f.respId=r.id;f.email=r.email;
    if(s?!!s.sp:ch(.86)){
      const sf=s?s.sp:fresh(f,!male),sa=Math.max(24,age(r.nasc)+ri(-5,3));
      const sp=mkP(f,sf,male?'Mãe':'Pai',!male,born(sa,sa),{tel:tel(),email:mail(sf+' '+nome),prof:ch(.8)?pick(male?PROF_F:PROF_M):''});
      r.civil=male?'Casado':'Casada';sp.civil=male?'Casada':'Casado';
    }else r.civil=pick(male?['Solteiro','Divorciado','Viúvo']:['Solteira','Divorciada','Viúva']);
  }
  const [cohen,levy,harari,sasson,mizrahi,levi]=DB.fam;
  Object.assign(cohen,{fixo:'11 3081-3080',soube:'Indicação',end:{rua:'Rua das Palmeiras, 123',comp:'',bairro:'Jardim Paulista',cid:'São Paulo',uf:'SP',cep:'01454-000'},
    obs:'Família muito participativa. David sempre disposto a ajudar. Potencial para projetos e campanhas de captação.',part:{shabat:true,eventos:true,aulas:true,kidush:true,kids:true,teens:false}});
  const david=PPL.get(cohen.respId),sara=members(cohen.id)[1];
  Object.assign(david,{heb:'דוד בן אברהם',prof:'Empresário',emp:'Cohen & Associados',fixo:'11 3081-3080',obs:'Líder nato, sempre disposto a ajudar.',grupos:['Comissão de Eventos','Captação','Chesed']});
  sara.tel='11 98777-7777';
  mkP(cohen,'Yaacov','Filho',true,born(10,10));mkP(cohen,'Miriam','Filha',false,born(8,8));mkP(cohen,'Avraham','Filho',true,born(6,6));
  mkP(levy,'Benjamin','Filho',true,born(15,15));mkP(levi,'Tamar','Filha',false,born(14,14));

  /* ---- crianças, jovens e demais membros (totais do cadastro) ---- */
  const elig=DB.fam.filter(f=>f!==cohen&&f.cat!=='Visitante'&&f.status==='Ativo'&&age(PPL.get(f.respId).nasc)<=52);
  const cnt=new Map();
  const addChild=(lo,hi,max,key)=>{for(let g=0;g<20000;g++){const f=pick(elig),k=f.id+key,c=cnt.get(k)||0;if(c>=max||members(f.id).length>=6)continue;
    const top=Math.min(hi,age(PPL.get(f.respId).nasc)-20);if(top<lo)continue;const a=ri(lo,top),m=ch(.5);cnt.set(k,c+1);mkP(f,fresh(f,m),m?'Filho':'Filha',m,born(a,a));return}};
  for(let n=0;n<124;n++)addChild(3,12,3,'k');
  for(let n=0;n<46;n++)addChild(13,17,2,'t');
  for(let g=0;DB.ppl.length<1742&&g<60000;g++){
    const f=pick(DB.fam);if(f===cohen||members(f.id).length>=6)continue;
    const ra=age(PPL.get(f.respId).nasc);
    if(ra>=46&&ch(.8)){const a=ri(18,Math.min(34,ra-22)),m=ch(.5);mkP(f,fresh(f,m),m?'Filho':'Filha',m,born(a,a),{tel:tel(),civil:m?'Solteiro':'Solteira'})}
    else if(ra<=60){const m=ch(.4),a=Math.min(93,ra+ri(22,30));mkP(f,fresh(f,m),m?'Avô':'Avó',m,born(a,a),{civil:m?'Casado':'Viúva'})}
  }
  DB.fam.forEach(f=>{f.part.kids=kidsOf(f.id).length>0;f.part.teens=teensOf(f.id).length>0});

  /* ---- presença ---- */
  const lastSat=addDays(TODAY,-((toDate(TODAY).getDay()+1)%7));
  DB.fam.forEach(f=>{const reg=f.cat!=='Visitante';
    if(f.part.shabat)f.pres={tipo:'Shabat',data:addDays(lastSat,-7*(ch(.7)?0:ch(.7)?1:2))};
    else if(reg?ch(.8):ch(.5))f.pres={tipo:pick(['Evento','Aula','Kidush']),data:addDays(TODAY,-ri(reg?3:10,reg?70:200))}});
  const rest=DB.fam.slice(6);
  shuffle(rest.filter(f=>f.part.shabat&&f.status==='Ativo')).slice(0,23).forEach(f=>f.pres.data=addDays(lastSat,-7*ri(4,9)));
  cohen.pres={tipo:'Shabat',data:lastSat};levy.pres={tipo:'Shabat',data:addDays(lastSat,-14)};harari.pres={tipo:'Shabat',data:lastSat};
  mizrahi.pres={tipo:'Shabat',data:lastSat};levi.pres={tipo:'Shabat',data:addDays(lastSat,-22)};

  /* ---- mensalidades ---- */
  const late=new Set([levi.id]);
  shuffle(rest.filter(f=>f.mens.ativa&&f.status==='Ativo'&&f.cad<addDays(TODAY,-150))).slice(0,11).forEach(f=>late.add(f.id));
  DB.fam.forEach(f=>{if(!f.mens.ativa)return;
    let ym=f.cad.slice(0,7)>(Y-1)+'-01'?f.cad.slice(0,7):(Y-1)+'-01';const lateN=late.has(f.id)?ri(1,3):0,list=[];
    const endYM=(()=>{let [y,m]=YM.split('-').map(Number);m++;if(m>12){m=1;y++}return y+'-'+pad(m)})();
    while(ym<=endYM){list.push({fid:f.id,comp:ym,venc:ym+'-'+pad(f.mens.dia),valor:f.mens.valor,pagoEm:null,forma:f.mens.forma});let [y,m]=ym.split('-').map(Number);m++;if(m>12){m=1;y++}ym=y+'-'+pad(m)}
    const due=list.filter(p=>p.venc<TODAY);
    due.forEach((p,k)=>{if(k<due.length-lateN){p.pagoEm=addDays(p.venc,-ri(0,3));if(f===cohen)p.forma=pick(['PIX','PIX','Cartão de crédito','Boleto'])}});
    list.filter(p=>p.venc>=TODAY&&p.comp<=YM).forEach(p=>{if(!lateN&&ch(.3))p.pagoEm=addDays(TODAY,-ri(0,Math.min(5,+TODAY.slice(8)-1)))});
    list.forEach(addPay)});

  /* ---- doações e promessas ---- */
  const W=[.6,.6,.9,1,.7,.7,.6,.8,1,1,.8,1],span=diffDays(TODAY,(Y-1)+'-01-01');
  const rdate=()=>{for(;;){const d=addDays(TODAY,-ri(0,span));if(R()<W[+d.slice(5,7)-1])return d}};
  DB.fam.forEach(f=>{const n=f.cat==='Patrocinador'?ri(4,9):f.cat==='Sócio'?ri(0,4):f.cat==='Frequentador'?ri(0,2):ch(.25)?1:0;
    const vals=f.cat==='Patrocinador'?[1800,2500,3600,5000,7200,10000]:f.cat==='Sócio'?[180,250,360,500,720,1000,1800]:[36,54,100,180,250,360];
    for(let k=0;k<n;k++){const d=rdate();if(d<f.cad)continue;addDon({fid:f.id,pid:f.respId,data:d,valor:pick(vals),tipo:pick(DON_TIPOS),forma:pick(FRM),obs:''})}});
  addDon({fid:cohen.id,pid:david.id,data:addDays(TODAY,-7),valor:500,tipo:'Doação geral',forma:'PIX',obs:''});
  addDon({fid:cohen.id,pid:david.id,data:addDays(TODAY,-40),valor:1800,tipo:'Campanha de Tishrei',forma:'Cartão de crédito',obs:''});
  const CAMP=['Campanha do novo Sefer Torá','Reforma do salão','Campanha anual','Fundo de bolsas Chai Kids'];
  addProm({fid:cohen.id,pid:david.id,desc:'Campanha do novo Sefer Torá',total:10000,pago:6000,data:addDays(TODAY,-150)});
  addProm({fid:cohen.id,pid:sara.id,desc:'Reforma do salão',total:8000,pago:6000,data:addDays(TODAY,-90)});
  shuffle(rest.filter(f=>f.status==='Ativo'&&f.cat!=='Visitante')).slice(0,44).forEach(f=>{const t=pick([1800,3600,5000,10000,18000]);addProm({fid:f.id,pid:f.respId,desc:pick(CAMP),total:t,pago:Math.round(t*pick([0,.25,.5,.5,.75,1])),data:addDays(TODAY,-ri(20,400))})});

  /* ---- eventos ---- */
  const HOL=[['Tishrei',1,'Rosh Hashaná – Jantar comunitário',220,180,-1],['Tishrei',15,'Sucot – Jantar na Sucá',180,120,-1],['Kislev',25,'Chanucá – Acendimento público',300,0,-1],['Shevat',15,'Tu BiShvat – Seder de frutas',120,0,0],['Adar II',14,'Purim – Festa da comunidade',300,60,0],['Nissan',15,'Pessach – Seder comunitário',200,250,-1],['Iyar',18,'Lag BaOmer',300,0,0],['Sivan',6,'Shavuot – Jantar',200,90,-1]];
  const hol=HOL.map((h,k)=>{const n=HEB.next(h[0],h[1]),p=HEB.prev(h[0],h[1]);return{nome:h[2],vagas:h[3],valor:h[4],next:n?addDays(n,h[5]):addDays(TODAY,25+k*40),prev:p?addDays(p,h[5]):addDays(TODAY,-(20+k*40))}}).filter(h=>h.next>TODAY).sort(by(h=>h.next));
  const nextSat=addDays(lastSat,7),act=DB.fam.filter(f=>f.status==='Ativo');
  const E=o=>addEv(Object.assign({nome:'',data:TODAY,fim:'',tipo:'Comunitário',vagas:100,valor:0,local:'Sede Chai Menachem',cancel:false},o));
  const fill=(e,target,poolF,first,qf)=>{const seen=new Set();let n=0;
    const put=f=>{if(seen.has(f.id)||n>=target)return;seen.add(f.id);const q=Math.max(1,Math.min(target-n,qf?qf(f):ri(1,members(f.id).length)));addReg(e,{fid:f.id,q,pago:e.valor?ch(.7):null,em:addDays(TODAY,-ri(0,18))});n+=q};
    (first||[]).forEach(put);for(let g=0;g<4000&&n<target&&poolF.length;g++)put(pick(poolF))};
  fill(E({nome:'Kidush Comunitário',data:nextSat,vagas:150}),98,act,[cohen,harari]);
  fill(E({nome:'Chai Teens – Encontro',data:addDays(TODAY,5),tipo:'Chai Teens',vagas:60}),38,act.filter(f=>f.part.teens),[levy,levi],f=>teensOf(f.id).length);
  fill(E({nome:'Chai Kids – Atividade',data:addDays(TODAY,8),tipo:'Chai Kids',vagas:40}),28,act.filter(f=>f.part.kids),[],f=>kidsOf(f.id).length);
  hol.forEach((h,k)=>fill(E({nome:h.nome,data:h.next,vagas:h.vagas,valor:h.valor}),k===0?156:k===1?45:ri(4,18),act,k===0?[cohen,mizrahi]:k===1?[sasson]:[]));
  fill(E({nome:'Jantar Beneficente',data:addDays(TODAY,33),tipo:'Beneficente',vagas:120,valor:360}),67,act.filter(f=>f.cat!=='Visitante'),[harari,sasson]);
  fill(E({nome:'Curso: Tanya para iniciantes',data:addDays(TODAY,-10),fim:addDays(TODAY,25),tipo:'Aula',vagas:40}),26,act,[],()=>1);
  fill(E({nome:'Shabaton da comunidade',data:addDays(TODAY,20),fim:addDays(TODAY,22),vagas:80,valor:450,cancel:true}),12,act,[],()=>2);
  const past=(nome,data,tipo,vagas,n)=>{if(data>=TODAY||data<(Y-1)+'-01-01')return;const e=E({nome,data,tipo,vagas});e.n0=Math.min(vagas,Math.round(n*(+data.slice(0,4)===Y?1.12:1)));e.pres=Math.round(e.n0*(.78+R()*.17))};
  const holAll=HOL.map(h=>{const p=HEB.prev(h[0],h[1]);return p?{nome:h[2],vagas:h[3],prev:addDays(p,h[5])}:null}).filter(Boolean);
  holAll.forEach(h=>past(h.nome,h.prev,'Comunitário',h.vagas,Math.round(h.vagas*(.55+R()*.35))));
  for(let y=Y-1;y<=Y;y++)for(let m=1;m<=12;m++){const b=y+'-'+pad(m)+'-';
    past('Kidush Comunitário',b+pad(ri(1,7)),'Comunitário',150,ri(70,125));
    past('Chai Kids – Atividade',b+pad(ri(8,14)),'Chai Kids',40,ri(18,36));
    past('Chai Teens – Encontro',b+pad(ri(15,21)),'Chai Teens',60,ri(22,48));
    if(ch(.6))past(pick(['Farbrengen','Aula especial com convidado','Shabaton','Jantar de casais','Rosh Chodesh – Encontro de mulheres']),b+pad(ri(22,28)),pick(['Comunitário','Aula']),80,ri(25,70))}
  const lastHol=holAll.slice().sort(by(h=>h.prev,-1))[0];
  const lastHolName=lastHol?lastHol.nome.split(' – ')[0]:'Shabat';
  sasson.pres={tipo:lastHolName,data:lastHol?lastHol.prev:addDays(TODAY,-30)};

  /* ---- yahrzeits ---- */
  [['Rachel bat Sarah','Iyar',19,'Mãe',cohen],['Eliyahu ben David','Tamuz',3,'Pai',cohen],['Yossef ben Moshe','Av',15,'Avô',cohen],['Chana bat Yaacov','Elul',7,'Avó',levy],['Moshe ben Avraham','Tishrei',27,'Tio',harari],['Lea bat Yitzchak','Kislev',5,'Mãe',sasson],['Yaacov ben Shlomo','Shevat',12,'Pai',mizrahi]]
    .forEach(y=>addYz({nome:y[0],m:y[1],d:y[2],rel:y[3],fid:y[4].id,obs:''}));
  const RL=[['Pai',1],['Mãe',0],['Pai',1],['Mãe',0],['Avô',1],['Avó',0],['Tio',1],['Tia',0],['Irmão',1],['Irmã',0],['Sogro',1],['Sogra',0]];
  const yzF=DB.fam.filter(f=>f.cat!=='Visitante');
  while(DB.yz.length<356){const [rel,m]=pick(RL),h=HEB.of(addDays(TODAY,DB.yz.length<12?ri(1,6):ri(0,353)))||{m:pick(['Tishrei','Cheshvan','Kislev','Tevet','Shevat','Adar','Nissan','Iyar','Sivan','Tamuz','Av','Elul']),d:ri(1,29)};
    addYz({nome:pick(m?MENH:WOMH)+(m?' ben ':' bat ')+pick(MENH),m:h.m,d:h.d,rel,fid:pick(yzF).id,obs:''})}

  /* ---- relacionamento ---- */
  const ev1=hol[0]?hol[0].nome.split(' – ')[0]:'o Kidush',ev2=hol[1]?hol[1].nome.split(' – ')[0]:'o Shabat';
  const CTX={wa:['Convite para '+ev1,'Lembrete de Shabat','Lembrete de mensalidade','Mazal Tov pelo aniversário','Convite para o Kidush'],tel:['Ligação de acompanhamento','Convite por telefone','Conversa sobre participação'],email:['Informativo semanal','Recibo de doação'],pres:['Shabat à noite','Kidush','Aula semanal'],reuniao:['Reunião com o rabino','Visita à família']};
  rest.forEach(f=>{const n=f.cat==='Visitante'?ri(0,1):ri(1,3);for(let k=0;k<n;k++){const t=pick(['wa','wa','wa','tel','email','pres','reuniao']);addCt({fid:f.id,tipo:t,titulo:CT_LABEL[t],det:pick(CTX[t]),data:addDays(TODAY,-ri(1,120)),feito:true})}});
  [levy,harari,sasson,mizrahi,levi].forEach(f=>addCt({fid:f.id,tipo:'wa',titulo:CT_LABEL.wa,det:'Convite para '+ev1,data:addDays(TODAY,-3),feito:true}));
  addCt({fid:cohen.id,tipo:'wa',titulo:'WhatsApp enviado',det:'Convite para '+ev1,data:addDays(TODAY,-3),feito:true});
  addCt({fid:cohen.id,tipo:'tel',titulo:'Ligação realizada',det:'Falei com Sara sobre '+ev2,data:addDays(TODAY,-17),feito:true});
  addCt({fid:cohen.id,tipo:'email',titulo:'Convite enviado',det:'Convite para Chai Kids',data:addDays(TODAY,-22),feito:true});
  addCt({fid:cohen.id,tipo:'pres',titulo:'Presença registrada',det:'Shabat à noite',data:addDays(lastSat,-1),feito:true});
  addCt({fid:cohen.id,tipo:'reuniao',titulo:'Reunião',det:'Planejamento da campanha anual',data:addDays(TODAY,-40),feito:true});
  addCt({fid:cohen.id,tipo:'tarefa',titulo:'Próximo follow-up',det:'Lembrar da campanha de doação',data:addDays(TODAY,8),feito:false});
  shuffle(act.slice(6)).slice(0,28).forEach(f=>addCt({fid:f.id,tipo:'tarefa',titulo:'Follow-up',det:pick(['Ligar para confirmar presença','Lembrar da campanha de doação','Agendar visita','Retornar sobre a mensalidade','Convidar para a aula semanal']),data:addDays(TODAY,ri(-3,14)),feito:false}));

  /* ---- comunicação ---- */
  const D=(nome,dd,publico,canal,env,ent,resp)=>DB.disp.push({id:nid(),nome,data:addDays(TODAY,dd),publico,canal,env,ent,resp,st:'Enviado',txt:''});
  D('Convite '+ev1,-2,'Comunidade','WhatsApp',842,813,122);D('Lembrete Shabat',-3,'Chai Kids','WhatsApp',126,124,15);D('Convite Chai Teens',-5,'Chai Teens','WhatsApp',156,150,25);
  D('Convite Jantar Beneficente',-9,'Patrocinadores','WhatsApp',91,89,12);D('Agradecimento '+lastHolName,-12,'Doadores','E-mail',312,298,37);
  D('Informativo semanal',-16,'Comunidade','E-mail',1180,1127,64);D('Lembrete de mensalidade',-20,'Mensalidade em atraso','WhatsApp',14,14,9);
  D('Convite '+lastHolName,-48,'Comunidade','WhatsApp',836,801,141);D('Informativo semanal',-51,'Comunidade','E-mail',1174,1120,58);
  [['Convite para evento','WhatsApp','Shalom {nome}! Convidamos você e sua família para {evento}, no dia {data}. Contamos com a sua presença!'],
   ['Lembrete de Shabat','WhatsApp','Shalom {nome}! Esperamos vocês nesta sexta-feira para o Kabalat Shabat e o Kidush. Shabat Shalom!'],
   ['Lembrete de yahrzeit','WhatsApp','Shalom {nome}. Lembramos que o yahrzeit de {falecido} será em {data_hebraica} ({data}). Se quiser, podemos reservar uma aliá ou organizar um Kidush em memória. Que a neshamá tenha aliá.'],
   ['Agradecimento por doação','WhatsApp','Shalom {nome}! Recebemos a sua doação de {valor}. Muito obrigado por apoiar a nossa comunidade. Tizku lemitzvot!'],
   ['Mensalidade em atraso','WhatsApp','Shalom {nome}! Identificamos que a mensalidade de {competencia} está em aberto. Se precisar de ajuda ou de outra forma de pagamento, fale com a secretaria.'],
   ['Feliz aniversário','WhatsApp','Mazal Tov, {nome}! Toda a comunidade Chai Menachem deseja um ano de saúde, alegria e muitas brachot. Ad mea veesrim!']
  ].forEach(t=>DB.tpl.push({id:nid(),nome:t[0],canal:t[1],txt:t[2]}));
  [['Lembrete de yahrzeit','7 dias antes da data, para o responsável da família','Lembrete de yahrzeit',true],['Parabéns no aniversário','No dia do aniversário de cada pessoa','Feliz aniversário',true],['Cobrança de mensalidade','3 dias depois do vencimento sem pagamento','Mensalidade em atraso',true],['Agradecimento por doação','Assim que uma doação é registrada','Agradecimento por doação',true],['Lembrete de evento','1 dia antes, para as famílias inscritas','Convite para evento',false]
  ].forEach(a=>DB.auto.push({id:nid(),nome:a[0],quando:a[1],modelo:a[2],on:a[3]}));
  DB.cfg={nome:'Chai Menachem',cidade:'São Paulo – SP',mensPadrao:360,diaPadrao:10,users:[{nome:'Mendi',papel:'Administrador'},{nome:'Secretaria',papel:'Secretária'}]};
}
