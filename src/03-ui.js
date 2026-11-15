/* ================= estado ================= */
const S={route:'familias',menu:null,modal:null,draft:null,famLab:new Map(),ui:{
  fl:{q:'',cat:'',status:'',tab:'todos',page:1,size:'10',more:false,mens:'',part:'',cad:'',tag:''},
  famTab:'geral',pesTab:'geral',finTab:'mensalidades',finAno:String(Y),finSt:'',
  pl:{q:'',page:1},an:{mes:String(+TODAY.slice(5,7))},
  yz:{q:'',mes:'',rel:'',when:'todos',view:'lista',page:1,cal:YM},
  ev:{q:'',tab:'todos',tipo:'',page:1},
  com:{tab:'disparos'},
  rel:{tab:'geral',per:'ano',de:Y+'-01-01',ate:TODAY,tb1:'0',tb2:'0'},
  fg:{tab:'atraso',page:1},
  nf:{tab:'dados'},
  ct:{k:'',page:1},tk:{st:'pend',resp:'',page:1},en:{tab:'queda',page:1},mo:{tipo:'',page:1},rc:{page:1},pr:{data:TODAY,tipo:'Shabat',q:'',page:1},cal:{m:YM},kd:{q:'',pend:false,page:1},cfg:{tab:'geral'},lg:{page:1}
},done:new Set(),uid:1,tick:0};
const A={};
const getPath=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
function setPath(o,p,v){const ks=p.split('.'),last=ks.pop();const t=ks.reduce((a,k)=>a[k]??(a[k]={}),o);t[last]=v}

/* ================= componentes ================= */
const btn=(label,icn,cls,attr)=>`<button type="button" class="btn ${cls||''}" ${attr||''}>${icn?ic(icn,15):''}${label}</button>`;
const badge=(t,tone)=>`<span class="badge b-${tone||'gray'}">${esc(t)}</span>`;
const AVC=['#2463eb','#6a2bd9','#c9453f','#15984a','#0e7f93','#a86b12','#c2410c','#7c3aed'];
const av=(txt,cor,cls)=>`<span class="av ${cls||''}" style="background:${AVC[(cor||0)%8]}" aria-hidden="true">${esc(txt)}</span>`;
const famAv=(f,cls)=>av('F'+(f.nome[0]||'').toUpperCase(),f.cor,cls);
const ROLE_COR={Pai:0,'Mãe':1,Filho:4,Filha:2,'Avô':5,'Avó':7,Outro:3};
const ROLE_TONE={Pai:'blue','Mãe':'purple',Filho:'amber',Filha:'amber','Avô':'gray','Avó':'gray',Outro:'gray'};
const pAv=(p,cls)=>av(initials(p.nome),ROLE_COR[p.papel]??3,cls);
const catBadge=f=>badge(f.cat,CAT_TONE[f.cat]);
const mensBadge=(f,long)=>{if(!can('fin'))return '<span class="muted">—</span>';const s=mensStatus(f);return s==='ok'?badge(long?'Mensalidade em dia':'Em dia','green'):s==='late'?badge(long?'Mensalidade atrasada':'Atrasado','red'):badge(long?'Sem mensalidade':'Não possui','gray')};
const payBadge=p=>{const s=payStatus(p);return badge(s,s==='Pago'?'green':s==='Atrasado'?'red':'amber')};
const EV_TONE={Aberto:'green',Lotado:'amber','Em andamento':'blue','Concluído':'gray',Cancelado:'red'};
const opt=(v,l,cur)=>`<option value="${esc(v)}" ${String(cur)===String(v)?'selected':''}>${esc(l)}</option>`;
const dotIc=(icn,tone)=>`<span class="dot d-${tone}">${ic(icn,14)}</span>`;
const empty=(t,s)=>`<div class="empty"><b>${t}</b>${s||''}</div>`;
function head(title,sub,actions,back){
  return `${back?`<button type="button" class="back" data-go="${back[0]}">${ic('back',14)}${back[1]}</button>`:''}<div class="phead"><div><h1>${title}</h1>${sub?`<p class="sub-t">${sub}</p>`:''}</div><div class="pacts">${actions||''}</div></div>`;
}
const tabsU=(key,cur,items)=>`<div class="utabs" role="tablist">${items.map(([k,l])=>`<button type="button" role="tab" aria-selected="${cur===k}" class="utab ${cur===k?'on':''}" data-tab="${key}:${k}">${l}</button>`).join('')}</div>`;
const pills=(key,cur,items)=>`<div class="pills">${items.map(([k,l])=>`<button type="button" class="pill ${cur===k?'on':''}" data-tab="${key}:${k}">${l}</button>`).join('')}</div>`;
function paginate(list,u,size){size=+size||10;const pages=Math.max(1,Math.ceil(list.length/size));u.page=Math.min(Math.max(1,+u.page||1),pages);return list.slice((u.page-1)*size,u.page*size)}
function pager(total,u,size,key,noun){
  size=+size||10;const pages=Math.max(1,Math.ceil(total/size)),p=+u.page||1;
  if(!total)return '';
  let nums=[];
  if(pages<=7)for(let i=1;i<=pages;i++)nums.push(i);
  else if(p<=4)nums=[1,2,3,4,5,'…',pages];
  else if(p>=pages-3)nums=[1,'…',pages-4,pages-3,pages-2,pages-1,pages];
  else nums=[1,'…',p-1,p,p+1,'…',pages];
  const b=(n,l,dis,on)=>`<button type="button" ${dis?'disabled':''} class="${on?'on':''}" data-tab="${key}.page:${n}" aria-label="Página ${n}">${l}</button>`;
  return `<div class="pager"><span>Mostrando ${(p-1)*size+1} a ${Math.min(total,p*size)} de ${NUM(total)} ${noun}</span><div class="pg">${b(p-1,ic('prev',14),p<=1)}${nums.map(n=>n==='…'?'<span class="muted">…</span>':b(n,n,false,n===p)).join('')}${b(p+1,ic('next',14),p>=pages)}</div></div>`;
}
function presInfo(f){
  if(!f.pres)return['—',''];
  const n=diffDays(TODAY,f.pres.data),t=f.pres.tipo;
  let a;
  if(t==='Shabat'&&n<=7)a='Shabat passado';
  else if(!['Shabat','Aula','Kidush','Evento'].includes(t))a='Evento '+t;
  else a=n<7?'Há '+pl(n,'dia','dias'):n<60?'Há '+pl(Math.round(n/7),'semana','semanas'):'Há '+pl(Math.round(n/30),'mês','meses');
  return[a,fmtDate(f.pres.data)];
}
const kv=rows=>`<dl class="kv">${rows.filter(Boolean).map(r=>`<dt>${r[0]}</dt><dd>${r[1]||'—'}</dd>`).join('')}</dl>`;
const stat=(icn,tone,lab,val,hint,attr)=>`<${attr?'button type="button"':'div'} class="stat" ${attr||''}>${dotIc(icn,tone)}<span><span class="lab">${lab}</span><span class="val" style="display:block">${val}</span>${hint?`<small>${hint}</small>`:''}</span></${attr?'button':'div'}>`;
const kpi=(lab,val,dl)=>`<div class="kpi"><div class="lab">${lab}</div><div class="val">${val}</div>${dl?`<div class="dl">${dl}</div>`:''}</div>`;
const delta=(cur,prev,suf)=>{if(!prev)return '';const d=Math.round((cur-prev)/prev*100);return `<span class="${d>=0?'up':'down'}">${d>=0?'▲ +':'▼ '}${d}%</span> ${suf||'vs ano anterior'}`};
const ctRow=c=>{const [icn,tone]=CT_ICON[c.tipo]||['chat','gray'];return `<div class="rw">${dotIc(icn,c.tipo==='tarefa'&&!c.feito?'amber':tone)}<span class="grow"><b>${esc(c.titulo)}</b><small style="display:block">${esc(c.det)}</small></span><small class="nowrap">${c.tipo==='tarefa'&&!c.feito?inDays(c.data):ago(c.data)}</small>${c.tipo==='tarefa'&&!c.feito?`<button type="button" class="ibtn" title="Concluir" aria-label="Concluir follow-up" data-act="doneTask" data-id="${c.id}">${ic('check',15)}</button>`:''}</div>`};

/* ================= menu ================= */
const NAV=[
 {k:'painel',r:'painel',t:'Painel',i:'home'},
 {k:'cadastro',r:'familias',t:'Cadastro',i:'users',sub:[['familias','Famílias'],['pessoas','Pessoas'],['criancas','Crianças'],['teens','Chai Teens'],['bar-mitzva','Bar e Bat Mitzvá'],['yahrzeits','Yahrzeits'],['aniversariantes','Aniversariantes']]},
 {k:'relac',r:'contatar',t:'Relacionamento',i:'heart',sub:[['contatar','Para contatar'],['tarefas','Tarefas'],['engajamento','Engajamento'],['momentos','Momentos da vida']]},
 {k:'financeiro',r:'financeiro',t:'Financeiro',i:'wallet',perm:'fin',sub:[['financeiro','Visão geral'],['campanhas','Campanhas'],['cobranca','Cobrança'],['recibos','Recibos']]},
 {k:'eventos',r:'eventos',t:'Eventos',i:'calendar',sub:[['eventos','Eventos'],['aulas','Aulas e shiurim'],['presencas','Presenças'],['calendario','Calendário judaico']]},
 {k:'comunicacao',r:'comunicacao',t:'Comunicação',i:'chat',perm:'com'},
 {k:'portal',r:'portal',t:'Área da família',i:'user'},
 {k:'relatorios',r:'relatorios',t:'Relatórios',i:'chart',perm:'rel'},
 {k:'configuracoes',r:'configuracoes',t:'Configurações',i:'gear',perm:'cfg',side:1}];
const SEC={painel:'painel',familias:'cadastro','nova-familia':'cadastro','editar-familia':'cadastro',familia:'cadastro',pessoa:'cadastro',pessoas:'cadastro',criancas:'cadastro',teens:'cadastro','bar-mitzva':'cadastro',yahrzeits:'cadastro',aniversariantes:'cadastro',
 contatar:'relac',tarefas:'relac',engajamento:'relac',momentos:'relac',financeiro:'financeiro',campanhas:'financeiro',cobranca:'financeiro',recibos:'financeiro',
 eventos:'eventos',evento:'eventos',aulas:'eventos',presencas:'eventos',calendario:'eventos',comunicacao:'comunicacao',portal:'portal',relatorios:'relatorios',configuracoes:'configuracoes'};
const SUB={'nova-familia':'familias','editar-familia':'familias',familia:'familias',pessoa:'pessoas',evento:'eventos'};
function renderSide(){
  const r=parseRoute(S.route),sec=SEC[r.name]||r.name,sub=SUB[r.name]||r.name,top=window.matchMedia('(min-width:901px)').matches,u=me(),nav=NAV.filter(n=>!n.perm||can(n.perm)),cur=nav.find(n=>n.k===sec),nn=allNeeds().length;
  $('#app').classList.toggle('topnav',top);
  const meB=`<button type="button" class="me" data-menu="1" data-act="userMenu" title="Trocar de usuário" aria-label="Usuário ${esc(u.nome)}, ${esc(u.papel)}. Trocar de usuário"><span class="av" aria-hidden="true">${esc(u.nome[0].toUpperCase())}</span><div><b>${esc(u.nome.split(' ')[0])}</b><small>${esc(u.papel)}</small></div></button>`;
  const subs=(n,cls)=>`<div class="${cls}">${n.sub.map(s=>`<button type="button" class="${sub===s[0]?'on':''}" data-go="${s[0]}">${s[1]}</button>`).join('')}</div>`;
  $('#side').innerHTML=top
   ?`<div class="brand">${ic('temple',24,1.7)}<div><b>Chai Menachem</b></div></div>
  <nav class="nav" aria-label="Menu principal">${nav.filter(n=>!n.side).map(n=>`<button type="button" class="${sec===n.k?'on':''}" data-go="${n.r}"><span>${n.t}</span></button>`).join('')}</nav>
  <div class="gs-wrap"><label class="search">${ic('search',15)}<input id="gs-q" type="search" placeholder="Buscar família, pessoa, evento..." aria-label="Busca geral" data-on="gsearch" autocomplete="off"></label><div class="gs-res" hidden></div></div>
  <button type="button" class="tb-ic ${S.route==='contatar'?'on':''}" data-go="contatar" title="Para contatar" aria-label="Para contatar: ${nn}">${ic('bell',18)}${nn?`<i>${nn>99?'99+':nn}</i>`:''}</button>
  ${PREV?'':syncBadge()}
  ${can('cfg')?`<button type="button" class="tb-ic ${sec==='configuracoes'?'on':''}" data-go="configuracoes" title="Configurações" aria-label="Configurações">${ic('gear',18)}</button>`:''}${meB}
  ${cur&&cur.sub?subs(cur,'subbar'):''}`
   :`<div class="brand">${ic('temple',30,1.6)}<div><b>Chai Menachem</b><span>COMUNIDADE</span></div></div>
  <nav class="nav" aria-label="Menu principal">${nav.map(n=>`<button type="button" class="${sec===n.k?'on':''}" data-go="${n.r}">${ic(n.i,17)}<span>${n.t}</span>${n.sub?`<span class="chev">${ic(sec===n.k?'down':'next',14)}</span>`:''}</button>${n.sub&&sec===n.k?subs(n,'subnav'):''}`).join('')}</nav>${meB}`;
  $('#bnav').innerHTML=[['painel','home','Painel'],['familias','users','Famílias'],['contatar','bell','Contatar'],['eventos','calendar','Eventos']].map(b=>`<button type="button" class="${S.route===b[0]?'on':''}" data-go="${b[0]}">${ic(b[1],19)}${b[2]}</button>`).join('')+`<button type="button" data-act="openNav">${ic('menu',19)}Mais</button>`;
  if(!PREV){$('#pbar').style.display='none';const tb=$('.topbar');let sb=tb&&tb.querySelector('.tb-sync');if(tb&&!sb){sb=document.createElement('span');sb.className='tb-sync';tb.appendChild(sb)}if(sb)sb.innerHTML=syncBadge();return}
  $('#pbar').innerHTML='<span style="display:flex;gap:8px;align-items:flex-start">'+ic('info',14)+'<span><b>Prévia com dados de exemplo.</b> O que você cadastrar aqui serve para testar e não fica salvo.</span></span>';
}
try{window.matchMedia('(min-width:901px)').addEventListener('change',()=>renderSide())}catch(e){}

/* ================= rotas ================= */
function parseRoute(r){const m=/^(.+)-(\d+)$/.exec(r||'');return m?{name:m[1],id:+m[2]}:{name:r}}
function go(r,tab){
  if(typeof hideSearch==='function'){hideSearch();const gm=$('#gs-m');if(gm)gm.value=''}
  if(r!==S.route){
    const p=parseRoute(r);
    if(p.name==='familia')S.ui.famTab='geral';
    if(p.name==='pessoa')S.ui.pesTab='geral';
    if(p.name==='financeiro'&&p.id)S.ui.finTab='mensalidades';
    if(['pessoas','criancas','teens'].includes(p.name)){S.ui.pl.q='';S.ui.pl.page=1;Object.assign(S.ui.kd,{q:'',pend:false,page:1})}
    if(p.name==='nova-familia'){S.draft=newDraft();S.ui.nf.tab='dados'}
    if(p.name==='editar-familia'){S.draft=draftOf(FAM.get(p.id));S.ui.nf.tab='dados'}
    S.route=r;S.top=true;
  }
  if(tab){const i=tab.indexOf(':');setPath(S.ui,tab.slice(0,i),tab.slice(i+1))}
  $('#app').classList.remove('open');
  render();
  try{if(location.hash.slice(1)!==r)location.hash=r}catch(e){}
}
function render(){
  S.tick++;
  const pg=$('#page'),a=document.activeElement,aid=a&&a.id&&pg.contains(a)?a.id:null;
  let pos=null;try{pos=aid?a.selectionStart:null}catch(e){}
  const r=parseRoute(S.route),fn=PAGES[r.name]||PAGES.familias,perm=SECPERM[SEC[r.name]||r.name];
  renderSide();
  let html;
  if(perm&&!can(perm))html=lockPage('O perfil '+esc(me().papel)+' não tem acesso a esta área.'+(PREV?' Clique no seu nome, no alto da tela, para trocar de usuário.':' Fale com a administração se precisar.'));
  else try{html=fn(r)}catch(e){console.error(e);html=`<div class="card">${empty('Não foi possível abrir esta tela.',esc(e.message))}</div>`}
  pg.innerHTML=html;
  if(!PREV)scheduleSync();
  if(S.top){pg.scrollTop=0;S.top=false}
  if(aid){const n=document.getElementById(aid);if(n){n.focus();try{if(pos!=null)n.setSelectionRange(pos,pos)}catch(e){}}}
}
const notFound=()=>`<div class="card">${empty('Registro não encontrado.','Volte para a lista e tente de novo.')}</div>`;

/* ================= modal, menu, toast ================= */
function openModal(o){
  S.modal=o;
  $('#modal-root').innerHTML=`<div class="modal-bg" data-act="bgClose"><form class="modal ${o.wide?'wide':''}" role="dialog" aria-modal="true" aria-labelledby="m-title" novalidate><div class="m-h"><h2 id="m-title">${esc(o.title)}</h2><button type="button" class="ibtn" data-act="closeModal" aria-label="Fechar">${ic('x')}</button></div><div class="m-b">${o.body}</div><div class="m-f"><span class="m-err" id="m-err"></span>${o.footer||''}</div></form></div>`;
  const f=$('#modal-root .m-b input,#modal-root .m-b select,#modal-root .m-b textarea');if(f)f.focus();
}
function closeModal(){S.modal=null;$('#modal-root').innerHTML=''}
A.closeModal=closeModal;
A.bgClose=(el,e)=>{if(e.target===el)closeModal()};
function buildFamLabels(){S.famLab=new Map();DB.fam.forEach(f=>{const r=respOf(f);let l=famName(f)+(r?' — '+r.nome:'');if(S.famLab.has(l))l+=' ('+f.id+')';f._lab=l;S.famLab.set(l,f.id)})}
function famFromLabel(v){v=(v||'').trim();if(!v)return null;if(S.famLab.has(v))return S.famLab.get(v);const q=norm(v),hit=[...S.famLab.keys()].filter(l=>norm(l).includes(q));return hit.length===1?S.famLab.get(hit[0]):null}
function fieldHTML(f){
  const id='ff-'+f.k,v=f.val??'',half=f.half?'half':'';
  if(f.type==='note')return `<p class="hint field">${f.label}</p>`;
  if(f.type==='check')return `<label class="chk field ${half}"><input type="checkbox" id="${id}" ${v?'checked':''}> ${esc(f.label)}</label>`;
  let c;
  if(f.type==='select')c=`<select id="${id}" class="inp" ${f.on?`data-on="${f.on}"`:''}>${f.ph?`<option value="">${esc(f.ph)}</option>`:''}${f.opts.map(o=>{const [a,b]=Array.isArray(o)?o:[o,o];return opt(a,b,v)}).join('')}</select>`;
  else if(f.type==='textarea')c=`<textarea id="${id}" class="inp" rows="${f.rows||3}" placeholder="${esc(f.ph||'')}">${esc(v)}</textarea>`;
  else if(f.type==='family')c=`<input id="${id}" class="inp" list="dl-fam" autocomplete="off" placeholder="Digite o nome da família" value="${esc(v&&FAM.get(v)?FAM.get(v)._lab:'')}">`;
  else if(f.type==='person')c=`<input id="${id}" class="inp" list="dl-ppl" autocomplete="off" placeholder="Digite o nome da pessoa">`;
  else if(f.type==='money')c=`<input id="${id}" class="inp" inputmode="decimal" placeholder="0,00" value="${esc(v)}">`;
  else c=`<input id="${id}" class="inp" type="${f.type||'text'}" placeholder="${esc(f.ph||'')}" value="${esc(v)}" ${f.min!=null?`min="${f.min}"`:''} ${f.max!=null?`max="${f.max}"`:''}>`;
  return `<div class="field ${half}"><label for="${id}">${esc(f.label)}${f.req?' <i class="req">*</i>':''}</label>${c}${f.hint?`<span class="hint">${esc(f.hint)}</span>`:''}<span class="err" id="${id}-e"></span></div>`;
}
function formModal(o){
  const needFam=o.fields.some(f=>f.type==='family'),needPpl=o.fields.some(f=>f.type==='person');
  if(needFam)buildFamLabels();if(needPpl)buildPplLabels();
  openModal({title:o.title,wide:o.wide,
    body:(o.intro?`<p class="intro">${o.intro}</p>`:'')+`<div class="fgrid">${o.fields.map(fieldHTML).join('')}</div>`+(needFam?`<datalist id="dl-fam">${DB.fam.map(f=>`<option value="${esc(f._lab)}"></option>`).join('')}</datalist>`:'')+(needPpl?dlPpl():''),
    footer:`<button type="button" class="btn" data-act="closeModal">Cancelar</button><button type="submit" class="btn btn-green">${o.submit||'Salvar'}</button>`,
    onSubmit(form){
      const v={};let bad=false;
      o.fields.forEach(f=>{
        if(f.type==='note')return;
        const el=form.querySelector('#ff-'+f.k),er=form.querySelector('#ff-'+f.k+'-e');let val,msg='';
        if(f.type==='check')val=el.checked;
        else if(f.type==='money')val=parseMoney(el.value);
        else if(f.type==='number')val=el.value===''?null:+el.value;
        else if(f.type==='family'){val=famFromLabel(el.value);if(el.value.trim()&&!val)msg='Escolha uma família da lista.'}
        else if(f.type==='person'){val=pplFromLabel(el.value);if(el.value.trim()&&!val)msg='Escolha uma pessoa da lista.'}
        else val=el.value.trim();
        if(!msg&&f.req&&(val===''||val===null||(f.type==='money'&&!val)))msg=f.type==='family'?'Escolha uma família da lista.':'Preencha este campo.';
        if(er)er.textContent=msg;el.classList.toggle('bad',!!msg);if(msg)bad=true;v[f.k]=val;
      });
      if(bad){const b=form.querySelector('.bad');if(b)b.focus();return}
      const res=o.onSubmit(v);
      if(typeof res==='string'){$('#m-err').textContent=res;return}
      closeModal();render();
    }});
}
function confirmModal(title,text,label,fn){
  openModal({title,body:`<p class="intro" style="margin:0">${text}</p>`,footer:`<button type="button" class="btn" data-act="closeModal">Cancelar</button><button type="submit" class="btn btn-navy">${label}</button>`,onSubmit(){fn();closeModal();render()}});
}
function toast(msg,warn){if(!warn&&DB.log&&!/^(Preparando|Copiado|Arquivo|Mensagem aberta|Você está)/.test(msg))DB.log.unshift({id:nid(),em:nowStr(),quem:me().nome,txt:msg});if(!PREV)scheduleSync();const t=document.createElement('div');t.className='toast'+(warn?' warn':'');t.innerHTML=ic(warn?'info':'checkc',16)+`<span>${esc(msg)}</span>`;$('#toasts').appendChild(t);setTimeout(()=>t.remove(),warn?5200:3600)}
function closeMenu(){if(S.menu){S.menu.el.remove();S.menu=null}}
function openMenu(anchor,items){
  if(S.menu&&S.menu.anchor===anchor){closeMenu();return}
  closeMenu();
  const m=document.createElement('div');m.className='menu';m.setAttribute('role','menu');
  m.innerHTML=items.map(i=>i==='-'?'<hr>':`<button type="button" role="menuitem" class="${i.danger?'danger':''}" ${i.go?`data-go="${i.go}"`:`data-act="${i.act}"`} ${i.tab?`data-gtab="${i.tab}"`:''} ${i.id!=null?`data-id="${i.id}"`:''} ${i.arg!=null?`data-arg="${esc(i.arg)}"`:''}>${i.icon?ic(i.icon,15):''}${esc(i.label)}</button>`).join('');
  document.body.appendChild(m);
  const r=anchor.getBoundingClientRect(),w=m.offsetWidth,h=m.offsetHeight;
  m.style.left=Math.max(8,Math.min(r.right-w,innerWidth-w-8))+'px';
  m.style.top=(r.bottom+h+8>innerHeight?Math.max(8,r.top-h-4):r.bottom+4)+'px';
  S.menu={el:m,anchor};
  const b=m.querySelector('button');if(b)b.focus();
}

/* ================= arquivos ================= */
const csv=rows=>'﻿'+rows.map(r=>r.map(c=>{c=String(c??'');return /[";\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c}).join(';')).join('\r\n');
async function download(name,data){
  if(!(window.claude&&window.claude.use)){try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data]));a.download=name;document.body.appendChild(a);a.click();a.remove();toast('Arquivo baixado: '+name);return 'ok'}catch(e){return 'fail'}}
  toast('Preparando o arquivo…');let dl=null;try{dl=await window.claude.use('downloads')}catch(e){}
  if(dl){try{await dl.save({filename:name,data});toast('Arquivo salvo: '+name);return 'ok'}catch(e){if(e&&e.code==='declined')return 'no'}}
  return 'fail';
}
async function saveFile(name,rows){
  if((await download(name,csv(rows)))!=='fail')return;
  openModal({title:name,wide:true,body:`<p class="intro">Não deu para baixar o arquivo por aqui. Copie o conteúdo e cole no Excel ou no Google Planilhas.</p><textarea class="inp" id="copy-txt" rows="10" readonly>${esc(rows.map(r=>r.join('\t')).join('\n'))}</textarea>`,
    footer:`<button type="button" class="btn" data-act="closeModal">Fechar</button><button type="button" class="btn btn-green" data-act="copyTxt">${ic('copy',15)}Copiar</button>`});
}
A.copyTxt=()=>{const t=$('#copy-txt');if(!t)return;t.select();const ok=()=>toast('Copiado.'),no=()=>toast('Selecione o texto e copie com Ctrl+C.',1);try{navigator.clipboard.writeText(t.value).then(ok,no)}catch(e){no()}};

/* ================= WhatsApp ================= */
const fillTpl=(txt,vars)=>txt.replace(/\{(\w+)\}/g,(m,k)=>vars[k]!=null&&vars[k]!==''?vars[k]:m);
const waHref=(num,txt)=>{const d=String(num||'').replace(/\D/g,'');return 'https://wa.me/'+(d?'55'+d:'')+(txt?'?text='+encodeURIComponent(txt):'')};
function openWa(fid,pid,o){
  o=o||{};const f=FAM.get(fid);if(!f)return;const p=pid?PPL.get(pid):respOf(f),num=(p&&p.tel)||f.tel;
  const vars=Object.assign({nome:p?p.nome.split(' ')[0]:''},o.vars||{}),t0=o.tpl?DB.tpl.find(t=>t.nome===o.tpl):null,txt=o.txt||(t0?fillTpl(t0.txt,vars):'');
  S.wa={fid,pid:p?p.id:null,num,vars,need:o.need,ctx:o.ctx||'',n:0};
  openModal({title:'Enviar WhatsApp',
    body:`<div class="fgrid"><div class="field"><span class="flabel">Para</span><div><b>${esc(p?p.nome:famName(f))}</b> · <span class="num">${esc(num||'sem telefone cadastrado')}</span></div>${f.okWa===false?'<span class="err">Esta família pediu para não receber mensagens da comunidade por WhatsApp.</span>':''}</div>
      <div class="field"><label for="wa-tpl">Modelo</label><select class="inp" id="wa-tpl" data-on="waTpl"><option value="">Escrever do zero</option>${DB.tpl.map(t=>opt(t.id,t.nome,t0?t0.id:'')).join('')}</select></div>
      <div class="field"><label for="wa-txt">Mensagem</label><textarea class="inp" id="wa-txt" rows="6" data-on="waTxt">${esc(txt)}</textarea><div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><span class="hint">A mensagem abre no WhatsApp para você conferir e enviar por lá.</span><button type="button" class="btn btn-sm" id="wa-ia" data-act="waIA">${ic('spark',13)}<span>Escrever com IA</span></button></div></div></div>`,
    footer:`<button type="button" class="btn" data-act="closeModal">Cancelar</button><a class="btn btn-green" id="wa-go" target="_blank" rel="noopener" href="${esc(waHref(num,txt))}" data-act="waOpen">${ic('wa',15)}Abrir no WhatsApp</a>`});
}
A.wa=el=>openWa(+el.dataset.id,+el.dataset.pid||null,el.dataset.arg?{tpl:el.dataset.arg}:null);
A.waTpl=el=>{const t=DB.tpl.find(x=>x.id===+el.value),ta=$('#wa-txt');ta.value=t?fillTpl(t.txt,S.wa.vars):'';A.waTxt(ta)};
A.waTxt=el=>{const a=$('#wa-go');if(a)a.href=waHref(S.wa.num,el.value)};
A.waOpen=()=>{const w=S.wa,txt=($('#wa-txt')||{}).value||'';if(w.need)S.done.add(w.fid+'|'+w.need);addCt({fid:w.fid,pid:w.pid,tipo:'wa',titulo:'WhatsApp aberto',det:txt.slice(0,70)||'Mensagem individual',data:TODAY,feito:true});setTimeout(()=>{closeModal();render();toast('Mensagem aberta no WhatsApp. Confira e envie por lá.')},120)};

/* ================= eventos globais ================= */
A.openNav=()=>$('#app').classList.add('open');
A.closeNav=()=>$('#app').classList.remove('open');
document.addEventListener('click',e=>{
  const t=e.target,trig=t.closest('[data-menu]');
  const el=t.closest('[data-act],[data-go],[data-tab]');
  if(!el){if(!t.closest('.menu'))closeMenu();return}
  if(el.dataset.act){const fn=A[el.dataset.act];if(fn)fn(el,e);if(!trig)closeMenu();return}
  closeMenu();
  if(el.dataset.tab){const s=el.dataset.tab,i=s.indexOf(':'),k=s.slice(0,i);setPath(S.ui,k,s.slice(i+1));
    if(!k.endsWith('.page')&&k.includes('.')){const par=getPath(S.ui,k.split('.')[0]);if(par&&'page' in par)par.page=1}
    render();return}
  if(el.dataset.go){closeModal();go(el.dataset.go,el.dataset.gtab)}
});
document.addEventListener('input',e=>{
  const el=e.target;
  if(el.dataset.on){const fn=A[el.dataset.on];if(fn)fn(el,e);return}
  if(el.dataset.f){const k=el.dataset.f;setPath(S.ui,k,el.type==='checkbox'?el.checked:el.value);const par=getPath(S.ui,k.split('.')[0]);if(par&&typeof par==='object'&&'page' in par)par.page=1;render();return}
  if(el.dataset.d&&S.draft){setPath(S.draft,el.dataset.d,el.type==='checkbox'?el.checked:el.value);if(el.dataset.rr)render()}
});
document.addEventListener('submit',e=>{e.preventDefault();if(S.modal&&S.modal.onSubmit)S.modal.onSubmit(e.target)});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(S.menu)closeMenu();else if(S.modal)closeModal()}
  if(e.key==='Enter'&&e.target.matches&&e.target.matches('tr[data-go]'))go(e.target.dataset.go);
});
document.addEventListener('mousemove',e=>{
  const tip=$('#tip'),el=e.target.closest?e.target.closest('[data-tip]'):null;
  if(!el){tip.style.display='none';return}
  const [a,b]=el.dataset.tip.split('|');tip.innerHTML=`<b>${esc(a)}</b>${esc(b||'')}`;tip.style.display='block';
  const w=tip.offsetWidth,h=tip.offsetHeight;
  tip.style.left=Math.max(6,Math.min(e.clientX+12,innerWidth-w-6))+'px';tip.style.top=Math.max(6,e.clientY-h-10)+'px';
});
window.addEventListener('hashchange',()=>{const r=location.hash.slice(1);if(r&&r!==S.route&&PAGES[parseRoute(r).name])go(r)});
