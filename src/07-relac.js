/* ================= ícones extras ================= */
Object.assign(IC,{
link:'M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1',
lock:'M6 11h12v9H6zM8.500 11V8a3.500 3.500 0 0 1 7 0v3',
tag:'M3 12V4h8l10 10-8 8zM7.500 8.500v.010',
shield:'M12 3l8 3v6c0 4.500-3.300 8-8 9-4.700-1-8-4.500-8-9V6z',
spark:'M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800zM19 16l.700 2.300L22 19l-2.300.700L19 22l-.700-2.300L16 19l2.300-.700z',
book:'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21a2 2 0 0 1 2-2h13',
grid:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
trend:'M3 7l6 6 4-4 8 8M15 17h6v-6',
receipt:'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
cloud:'M7 18a4 4 0 0 1-.500-8A6 6 0 0 1 18 9.500a4.200 4.200 0 0 1 0 8.500z',
plug:'M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4'
});

/* ================= usuários e permissões ================= */
const ROLES={Administrador:{cfg:1,fin:1,com:1,rel:1,notas:0},'Secretária':{cfg:0,fin:1,com:1,rel:1,notas:0},Rabino:{cfg:0,fin:1,com:1,rel:1,notas:1},'Voluntário':{cfg:0,fin:0,com:0,rel:0,notas:0}};
const SECPERM={financeiro:'fin',configuracoes:'cfg',comunicacao:'com',relatorios:'rel'};
const me=()=>(DB.users||[]).find(u=>u.id===S.uid)||{id:0,nome:'Mendi',papel:'Administrador'};
const can=k=>!!(ROLES[me().papel]||{})[k];
const memo=(k,fn)=>{if(S._mt!==S.tick){S._mt=S.tick;S._m={}}return k in S._m?S._m[k]:(S._m[k]=fn())};
const nowStr=()=>{const d=new Date();return isoOf(d)+' '+pad(d.getHours())+':'+pad(d.getMinutes())};
const lockPage=t=>`<div class="card"><div class="lock">${ic('lock',28)}<b>Acesso restrito</b><p>${t}</p></div></div>`;
A.userMenu=el=>openMenu(el,DB.users.map(u=>({label:'Entrar como '+u.nome+' ('+u.papel+')',icon:'user',act:'setUser',id:u.id})));
A.setUser=el=>{S.uid=+el.dataset.id;render();toast('Você está como '+me().nome+' ('+me().papel+').')};

/* ================= engajamento ================= */
const lastCt=fid=>{let m='';ixOf(IX.ct,fid).forEach(c=>{if(c.feito&&c.tipo!=='pres'&&c.tipo!=='tarefa'&&c.data>m)m=c.data});return m};
function score(f){
  let s=0;const dp=f.pres?diffDays(TODAY,f.pres.data):999;
  s+=dp<=7?40:dp<=14?32:dp<=30?22:dp<=60?10:0;
  s+=Math.min(20,(f.ev12||0)*3+ixOf(IX.reg,f.id).filter(e=>!e.cancel&&e.data>=TODAY).length*4);
  const ms=mensStatus(f);s+=ms==='ok'?15:ms==='late'?5:0;
  if(ixOf(IX.don,f.id).some(d=>d.data>=addDays(TODAY,-365)))s+=10;
  const lc=lastCt(f.id),dc=lc?diffDays(TODAY,lc):999;s+=dc<=30?15:dc<=90?8:0;
  return Math.min(100,s);
}
const scLevel=s=>s>=70?['Alto','green']:s>=40?['Médio','amber']:['Baixo','red'];
const scDrop=f=>(f.sc0||0)-score(f);
const scBadge=f=>{const s=score(f),[l,t]=scLevel(s);return `<span class="badge b-${t}">${ic('chart',11)}Engajamento ${s} · ${l}</span>`};
const scCell=f=>{const s=score(f),t=scLevel(s)[1];return `<span class="sc"><b class="num">${s}</b><span class="meter m-${t}"><i style="width:${s}%"></i></span></span>`};

/* ================= momentos e necessidades de contato ================= */
const LIFE={nasc:['Nascimento','green','child'],brit:['Brit Milá','blue','star'],bar:['Bar ou Bat Mitzvá','purple','star'],noiv:['Noivado','purple','heart'],casam:['Casamento','purple','heart'],luto:['Luto','gray','candle'],mud:['Mudança de endereço','amber','home']};
const lifeBadge=t=>`<span class="badge b-${LIFE[t][1]}">${ic(LIFE[t][2],11)}${LIFE[t][0]}</span>`;
const NEED={luto:['Luto','gray','candle',100],mazal:['Mazal Tov','purple','heart',70],novo:['Nova família','blue','user',60],queda:['Em queda','red','trend',55],ausente:['Ausente','amber','clock',50],yz:['Yahrzeit','amber','candle',45],mens:['Mensalidade','red','wallet',40]};
function needs(f){
  if(f.status!=='Ativo')return[];
  const out=[],lc=lastCt(f.id),add=(k,txt,x)=>{if(!S.done.has(f.id+'|'+k))out.push(Object.assign({k,txt,f,w:NEED[k][3]},x))};
  for(const l of DB.life){
    if(l.fid!==f.id)continue;const d=diffDays(TODAY,l.data);
    if(l.tipo==='luto'&&d>=0&&d<=30&&lc<l.data)add('luto','Luto '+ago(l.data)+'.'+(l.det?' '+l.det:''));
    else if(['nasc','brit','bar','noiv','casam'].includes(l.tipo)&&d>=0&&d<=14&&lc<l.data)add('mazal',LIFE[l.tipo][0]+' '+ago(l.data)+'.'+(l.det?' '+l.det:''),{life:l.tipo});
  }
  if(diffDays(TODAY,f.cad)<=30&&lc<f.cad)add('novo','Cadastrada '+ago(f.cad)+', ainda sem contato da equipe.');
  const quiet=!lc||diffDays(TODAY,lc)>7;
  if(quiet&&scDrop(f)>=20)add('queda','Engajamento caiu de '+f.sc0+' para '+score(f)+'.'+(f.pres?' Última presença '+ago(f.pres.data)+'.':''));
  else if(quiet&&isAbsent(f))add('ausente','Frequenta o Shabat e não vem '+(f.pres?'desde '+fmtDate(f.pres.data):'há várias semanas')+'.');
  const y=nextYz(f.id);if(y&&diffDays(yzNext(y),TODAY)<7)add('yz','Yahrzeit de '+y.nome+' '+inDays(yzNext(y))+' ('+y.d+' de '+y.m+').',{yz:y});
  if(can('fin')&&mensStatus(f)==='late'){const ps=ixOf(IX.pay,f.id).filter(p=>!p.pagoEm&&p.venc<TODAY);add('mens',pl(ps.length,'mensalidade vencida','mensalidades vencidas')+', '+BRL(sum(ps,p=>p.valor))+'.')}
  return out;
}
const allNeeds=()=>memo('needs',()=>{const a=[];DB.fam.forEach(f=>{const n=needs(f);if(n.length)a.push(...n)});const sc=new Map();a.forEach(n=>{if(!sc.has(n.f))sc.set(n.f,score(n.f))});return a.sort((x,y)=>y.w-x.w||sc.get(y.f)-sc.get(x.f))});
function topNeeds(k){const top=[];allNeeds().forEach(n=>{if(top.length<k&&!top.some(t=>t.f===n.f))top.push(n)});return top}
function draftFor(n){
  const f=n.f,r=respOf(f),nm=r?r.nome.split(' ')[0]:'',tp=t=>(DB.tpl.find(x=>x.nome===t)||{txt:''}).txt;
  switch(n.k){
    case 'luto':return `Shalom ${nm}. Soubemos da perda na sua família e queremos que saibam que toda a comunidade está com vocês. Se precisarem de minian, de refeições ou apenas de companhia, contem conosco. HaMakom yenachem etchem.`;
    case 'mazal':return `Mazal Tov, ${nm}! Ficamos muito felizes com a notícia. Que seja com muita saúde e alegria para toda a família. Se pudermos ajudar em algo, é só avisar.`;
    case 'novo':return `Shalom ${nm}! Que alegria ter a sua família conosco no Chai Menachem. Quando puderem, venham ao Kabalat Shabat de sexta-feira, será um prazer recebê-los. Qualquer dúvida, estou à disposição.`;
    case 'queda':case 'ausente':return `Shalom ${nm}! Sentimos a falta de vocês nos últimos Shabatot. Está tudo bem? Nesta sexta teremos Kabalat Shabat e Kidush, seria uma alegria rever a família.`;
    case 'yz':return n.yz?fillTpl(tp('Lembrete de yahrzeit'),{nome:nm,falecido:n.yz.nome,data_hebraica:n.yz.d+' de '+n.yz.m,data:fmtDate(yzNext(n.yz))}):'';
    case 'mens':{const p=ixOf(IX.pay,f.id).filter(x=>!x.pagoEm&&x.venc<TODAY).sort(by(x=>x.venc))[0];return fillTpl(tp('Mensalidade em atraso'),{nome:nm,competencia:p?compTxt(p.comp):''})}
  }
  return '';
}
const needBadge=k=>`<span class="badge b-${NEED[k][1]}">${ic(NEED[k][2],11)}${NEED[k][0]}</span>`;
const needActs=n=>`<button type="button" class="btn btn-sm btn-green" data-act="needWa" data-id="${n.f.id}" data-arg="${n.k}">${ic('wa',13)}WhatsApp</button><button type="button" class="btn btn-sm" data-act="needDone" data-id="${n.f.id}" data-arg="${n.k}">${ic('check',13)}Feito</button>`;
const needCard=n=>`<div class="need"><div class="who">${famAv(n.f,'av-sm')}<button type="button" class="btn-link" style="color:var(--ink)" data-go="familia-${n.f.id}">${esc(famName(n.f))}</button></div><div>${needBadge(n.k)}</div><p>${esc(n.txt)}</p><div class="pacts">${needActs(n)}</div></div>`;
const sugCard=link=>{const t=topNeeds(5);return `<div class="card"><div class="ch"><div class="ct">${ic('spark',16)}Sugestões da semana</div>${link?`<button type="button" class="btn-link" data-go="contatar">Ver todos (${allNeeds().length})</button>`:'<small>As 5 famílias que mais vale a pena procurar agora</small>'}</div>${t.length?`<div class="g5">${t.map(needCard).join('')}</div>`:empty('Ninguém para contatar agora.','A equipe está em dia.')}</div>`};
A.needWa=el=>{const n=allNeeds().find(x=>x.f.id===+el.dataset.id&&x.k===el.dataset.arg);if(n)openWa(n.f.id,null,{txt:draftFor(n),need:n.k,ctx:NEED[n.k][0]+'. '+n.txt})};
A.needDone=el=>{const f=FAM.get(+el.dataset.id),k=el.dataset.arg;S.done.add(f.id+'|'+k);addCt({fid:f.id,tipo:'tel',titulo:'Contato realizado',det:NEED[k][0],data:TODAY,feito:true});render();toast('Contato com '+famName(f)+' registrado.')};
A.engWa=el=>{const f=FAM.get(+el.dataset.id);openWa(f.id,null,{txt:draftFor({k:'ausente',f}),ctx:'A família está participando menos do que antes.'})};

/* ---- escrever com IA ---- */
const ALT=[n=>`Shalom ${n}! Tudo bem com vocês? Passando para saber como está a família e lembrar que as portas do Chai Menachem estão sempre abertas. Um abraço de toda a comunidade.`,n=>`Shalom ${n}! Espero que estejam todos bem. Queria convidar a família para estar conosco neste Shabat. Se precisar de qualquer coisa, pode contar com a gente.`];
A.waIA=async()=>{
  const w=S.wa,ta=$('#wa-txt'),b=$('#wa-ia');if(!ta||!w)return;
  const f=FAM.get(w.fid),p=PPL.get(w.pid)||respOf(f),nome=p?p.nome.split(' ')[0]:'',lab=b.querySelector('span');
  let sample=null,done=false;
  if(window.claude&&window.claude.use){b.disabled=true;lab.textContent='Escrevendo…';try{sample=await window.claude.use('sample')}catch(e){}}
  if(sample){
    try{
      const r=await sample('Você escreve mensagens de WhatsApp em português do Brasil para a secretaria de uma comunidade judaica chamada Chai Menachem. Escreva UMA mensagem curta (até 60 palavras), calorosa e respeitosa, sem emojis, começando com "Shalom '+nome+'". Contexto: '+(w.ctx||'contato de rotina com uma família da comunidade')+'. '+(ta.value.trim()?'Reescreva este rascunho de outro jeito, mantendo o sentido: "'+ta.value.trim()+'". ':'')+'Responda só com o texto da mensagem.',{modelTier:'quick',cache:false});
      if($('#wa-txt')===ta&&r&&r.text){ta.value=r.text.trim();done=true}
    }catch(e){}
  }
  if(!done){w.n=(w.n||0)+1;ta.value=ALT[w.n%ALT.length](nome)}
  if($('#wa-txt')===ta){A.waTxt(ta);b.disabled=false;lab.textContent='Escrever com IA'}
};

/* ================= Para contatar ================= */
function pgContatar(){
  const u=S.ui.ct,all=allNeeds(),list=all.filter(n=>!u.k||n.k===u.k),rows=paginate(list,u,10),cnt=k=>all.filter(n=>n.k===k).length;
  return head('Para contatar','Quem a equipe precisa procurar agora, por ordem de prioridade',btn('Resumo da semana','file','','data-act="resumoSemana"')+btn('Nova tarefa','plus','btn-green','data-act="tarefa"'))+sugCard(0)+
  `<div class="card pad0 mt">${pills('ct.k',u.k,[['','Todos ('+all.length+')']].concat(Object.keys(NEED).filter(cnt).map(k=>[k,NEED[k][0]+' ('+cnt(k)+')'])))}
  ${rows.length?`<div class="tw"><table class="tbl"><thead><tr><th>Família</th><th>Motivo</th><th>Detalhe</th><th>Engajamento</th><th class="right">Ações</th></tr></thead><tbody>${rows.map(n=>`<tr>
    <td><div class="who">${famAv(n.f,'av-sm')}<div><button type="button" class="btn-link" style="color:var(--ink)" data-go="familia-${n.f.id}">${esc(famName(n.f))}</button><small>${esc((respOf(n.f)||{}).nome||'')} · <span class="num">${esc(n.f.tel)}</span></small></div></div></td>
    <td>${needBadge(n.k)}</td><td>${esc(n.txt)}</td><td>${scCell(n.f)}</td>
    <td class="acts"><div class="pacts" style="justify-content:flex-end;flex-wrap:nowrap">${needActs(n)}</div></td></tr>`).join('')}</tbody></table></div>`:empty('Nada pendente neste filtro.')}
  ${pager(list.length,u,10,'ct','contatos')}</div>`;
}

/* ================= Tarefas ================= */
function pgTarefas(){
  const u=S.ui.tk,all=DB.ct.filter(c=>c.tipo==='tarefa'),pend=all.filter(c=>!c.feito),late=pend.filter(c=>c.data<TODAY),wk=pend.filter(c=>c.data>=TODAY&&diffDays(c.data,TODAY)<7),done=all.filter(c=>c.feito);
  const list=(u.st==='late'?late:u.st==='done'?done:pend).filter(c=>!u.resp||c.resp===u.resp).sort(by(c=>c.data,u.st==='done'?-1:1)),rows=paginate(list,u,10);
  return head('Tarefas','Follow-ups da equipe, com responsável e prazo',btn('Nova tarefa','plus','btn-green','data-act="tarefa"'))+
  `<div class="g4 keep2">${kpi('Pendentes',NUM(pend.length))}${kpi('Atrasadas',NUM(late.length),late.length?'<span class="down">precisam de atenção</span>':'tudo em dia')}${kpi('Para os próximos 7 dias',NUM(wk.length))}${kpi('Concluídas',NUM(done.length))}</div>
  <div class="card pad0 mt"><div class="toolbar"><select class="inp" id="tk-resp" data-f="tk.resp" aria-label="Responsável">${opt('','Todos os responsáveis',u.resp)}${DB.users.map(x=>opt(x.nome,x.nome,u.resp)).join('')}</select></div>
  ${pills('tk.st',u.st,[['pend','Pendentes'],['late','Atrasadas'],['done','Concluídas']])}
  ${rows.length?`<div class="tw"><table class="tbl"><thead><tr><th>Tarefa</th><th>Família</th><th>Responsável</th><th>${u.st==='done'?'Concluída em':'Prazo'}</th><th class="right">Ações</th></tr></thead><tbody>${rows.map(c=>{const f=FAM.get(c.fid),lt=!c.feito&&c.data<TODAY;return `<tr>
    <td><b>${esc(c.det)}</b></td><td><button type="button" class="btn-link" style="color:var(--ink)" data-go="familia-${f.id}">${esc(famName(f))}</button></td><td>${esc(c.resp||'—')}</td>
    <td class="num">${fmtDate(c.data)} <small style="${lt?'color:var(--red-ink);font-weight:600':''}">(${lt?'atrasada · '+ago(c.data):c.feito?ago(c.data):inDays(c.data)})</small></td>
    <td class="acts">${c.feito?badge('Concluída','green'):`<button type="button" class="btn btn-sm" data-act="doneTask" data-id="${c.id}">${ic('check',13)}Concluir</button>`}</td></tr>`}).join('')}</tbody></table></div>`:empty('Nenhuma tarefa neste filtro.')}
  ${pager(list.length,u,10,'tk','tarefas')}</div>`;
}

/* ================= Engajamento ================= */
function pgEngaj(){
  const u=S.ui.en,arr=memo('eng',()=>DB.fam.filter(f=>f.status==='Ativo').map(f=>({f,s:score(f),d:scDrop(f)}))),n=arr.length||1;
  const hi=arr.filter(x=>x.s>=70).length,mid=arr.filter(x=>x.s>=40&&x.s<70).length,lo=arr.length-hi-mid,drop=arr.filter(x=>x.d>=20);
  const list=u.tab==='queda'?drop.slice().sort(by(x=>x.d,-1)):u.tab==='top'?arr.slice().sort(by(x=>x.s,-1)):arr.filter(x=>x.f.cat!=='Visitante').sort(by(x=>x.s)),rows=paginate(list,u,10);
  return head('Engajamento','Nota de 0 a 100 por família: presença (40), eventos (20), financeiro (25) e contato com a equipe (15)')+
  `<div class="g5">${kpi('Média da comunidade',Math.round(sum(arr,x=>x.s)/n))}${kpi('Alto (70 ou mais)',NUM(hi),pct(hi,n)+'% das famílias ativas')}${kpi('Médio (40 a 69)',NUM(mid),pct(mid,n)+'%')}${kpi('Baixo (menos de 40)',NUM(lo),pct(lo,n)+'%')}${kpi('Em queda',NUM(drop.length),'perderam 20 pontos ou mais')}</div>
  <div class="card pad0 mt">${pills('en.tab',u.tab,[['queda','Em queda'],['top','Mais engajadas'],['low','Menos engajadas']])}
  ${rows.length?`<div class="tw"><table class="tbl"><thead><tr><th>Família</th><th>Categoria</th><th>Engajamento</th><th class="num">Antes</th><th>Variação</th><th>Última presença</th><th class="right">Ações</th></tr></thead><tbody>${rows.map(x=>{const f=x.f;return `<tr class="rowlink" tabindex="0" data-go="familia-${f.id}">
    <td><div class="who">${famAv(f,'av-sm')}<div><b>${esc(famName(f))}</b><small>${esc((respOf(f)||{}).nome||'')}</small></div></div></td><td>${catBadge(f)}</td><td>${scCell(f)}</td><td class="num">${f.sc0||0}</td>
    <td>${x.d>0?`<b style="color:var(--red-ink)">▼ ${x.d}</b>`:x.d<0?`<b style="color:var(--green-ink)">▲ ${-x.d}</b>`:'<span class="muted">=</span>'}</td>
    <td class="num">${f.pres?fmtDate(f.pres.data)+' <small>('+ago(f.pres.data)+')</small>':'—'}</td>
    <td class="acts"><button type="button" class="ibtn" title="Enviar WhatsApp" aria-label="Enviar WhatsApp" data-act="engWa" data-id="${f.id}">${ic('wa',15)}</button></td></tr>`}).join('')}</tbody></table></div>`:empty('Nenhuma família em queda.','Boa notícia.')}
  ${pager(list.length,u,10,'en','famílias')}</div>`;
}

/* ================= Momentos da vida ================= */
function lifeTable(list,showFam){
  return `<div class="tw"><table class="tbl"><thead><tr><th>Data</th>${showFam?'<th>Família</th>':''}<th>Momento</th><th>Detalhe</th><th class="right">Ações</th></tr></thead><tbody>${list.map(l=>{const f=FAM.get(l.fid);return `<tr>
    <td class="num">${fmtDate(l.data)} <small>(${ago(l.data)})</small></td>${showFam?`<td><button type="button" class="btn-link" style="color:var(--ink)" data-go="familia-${f.id}">${esc(famName(f))}</button></td>`:''}
    <td>${lifeBadge(l.tipo)}</td><td>${esc(l.det)||'<span class="muted">—</span>'}</td>
    <td class="acts"><button type="button" class="ibtn" title="Enviar mensagem" aria-label="Enviar mensagem" data-act="lifeWa" data-id="${l.id}">${ic('wa',15)}</button><button type="button" class="ibtn" title="Excluir" aria-label="Excluir" data-act="delMomento" data-id="${l.id}">${ic('trash',15)}</button></td></tr>`}).join('')}</tbody></table></div>`;
}
function pgMomentos(){
  const u=S.ui.mo,list=DB.life.filter(l=>!u.tipo||l.tipo===u.tipo).sort(by(l=>l.data,-1)),rows=paginate(list,u,10);
  return head('Momentos da vida','Nascimentos, casamentos, Bar e Bat Mitzvá, lutos e mudanças de cada família',btn('Registrar momento','plus','btn-green','data-act="momento"'))+
  `<div class="card pad0">${pills('mo.tipo',u.tipo,[['','Todos']].concat(Object.keys(LIFE).map(k=>[k,LIFE[k][0]])))}
  ${rows.length?lifeTable(rows,true):empty('Nenhum momento registrado neste filtro.')}${pager(list.length,u,10,'mo','momentos')}</div>`;
}
const famMomentos=f=>{const list=DB.life.filter(l=>l.fid===f.id).sort(by(l=>l.data,-1));return `<div class="card pad0"><div class="toolbar" style="padding-bottom:12px;justify-content:space-between"><div class="ct">Momentos da família (${list.length})</div>${btn('Registrar momento','plus','btn-green btn-sm',`data-act="momento" data-id="${f.id}"`)}</div>${list.length?lifeTable(list,false):empty('Nenhum momento registrado.','Nascimentos, casamentos, lutos e mudanças ficam aqui.')}</div>`};
A.momento=el=>formModal({title:'Registrar momento',submit:'Registrar',fields:[
  {k:'fid',label:'Família',type:'family',req:true,val:+el.dataset.id||null},
  {k:'tipo',label:'Momento',type:'select',opts:Object.keys(LIFE).map(k=>[k,LIFE[k][0]]),half:true},{k:'data',label:'Data',type:'date',req:true,val:TODAY,half:true,max:TODAY},
  {k:'det',label:'Detalhe',ph:'Opcional'}],
  onSubmit(v){DB.life.push({id:nid(),fid:v.fid,tipo:v.tipo,data:v.data,det:v.det});toast(LIFE[v.tipo][0]+' registrado para '+famName(FAM.get(v.fid))+'.')}});
A.delMomento=el=>{const l=DB.life.find(x=>x.id===+el.dataset.id);if(l)confirmModal('Excluir momento','Excluir este registro de <b>'+esc(LIFE[l.tipo][0])+'</b>?','Excluir',()=>{arrDel(DB.life,l);toast('Momento excluído.')})};
A.lifeWa=el=>{const l=DB.life.find(x=>x.id===+el.dataset.id),f=FAM.get(l.fid);openWa(f.id,null,{txt:l.tipo==='mud'?'':draftFor({k:l.tipo==='luto'?'luto':'mazal',f}),ctx:LIFE[l.tipo][0]+(l.det?'. '+l.det:'')})};

/* ================= Bar e Bat Mitzvá ================= */
function bmList(){
  const out=[];if(!HEB.ok)return out;
  DB.ppl.forEach(p=>{if(!p.nasc)return;const a=age(p.nasc);if(a<10||a>13)return;const h=HEB.of(p.nasc),n=HEB.next(h.m,h.d);if(n&&HEB.of(n).y===h.y+(p.sexo==='F'?12:13))out.push({p,h,dt:n})});
  return out.sort(by(x=>x.dt));
}
function pgBarMitzva(){
  const list=memo('bm',bmList),m3=list.filter(x=>diffDays(x.dt,TODAY)<=90).length;
  return head('Bar e Bat Mitzvá','Crianças que completam 13 anos (meninos) ou 12 anos (meninas) pelo calendário judaico nos próximos 13 meses')+
  `<div class="g3">${kpi('Nos próximos 13 meses',NUM(list.length))}${kpi('Nos próximos 3 meses',NUM(m3))}${kpi('Bar Mitzvá · Bat Mitzvá',list.filter(x=>x.p.sexo!=='F').length+' · '+list.filter(x=>x.p.sexo==='F').length)}</div>
  <div class="card pad0 mt">${list.length?`<div class="tw"><table class="tbl"><thead><tr><th>Criança</th><th>Família</th><th>Tipo</th><th>Nascimento</th><th>Data do Bar ou Bat Mitzvá</th><th class="right">Ações</th></tr></thead><tbody>${list.map(x=>{const p=x.p,f=FAM.get(p.fid),bat=p.sexo==='F';return `<tr>
    <td><div class="who">${pAv(p,'av-sm')}<button type="button" class="btn-link" style="color:var(--ink)" data-go="pessoa-${p.id}">${esc(p.nome)}</button></div></td>
    <td><button type="button" class="btn-link" data-go="familia-${f.id}">${esc(famName(f))}</button></td><td>${badge(bat?'Bat Mitzvá':'Bar Mitzvá',bat?'purple':'blue')}</td>
    <td><div class="two"><span class="num">${fmtDate(p.nasc)}</span><small>${x.h.d} de ${esc(x.h.m)} de ${x.h.y}</small></div></td>
    <td><div class="two"><span class="num">${fmtDate(x.dt)}</span><small>${inDays(x.dt)}</small></div></td>
    <td class="acts"><button type="button" class="ibtn" title="Falar com os pais" aria-label="Falar com os pais" data-act="bmWa" data-id="${p.id}">${ic('wa',15)}</button><button type="button" class="ibtn" title="Criar tarefa de preparação" aria-label="Criar tarefa de preparação" data-act="tarefa" data-id="${f.id}" data-arg="Combinar a preparação do ${bat?'Bat':'Bar'} Mitzvá de ${esc(p.nome.split(' ')[0])}">${ic('clock',15)}</button></td></tr>`}).join('')}</tbody></table></div>`:empty('Nenhum Bar ou Bat Mitzvá nos próximos meses.')}
  <p class="hint" style="padding:10px 16px;border-top:1px solid var(--line-2)">Data calculada pela data civil de nascimento. Se a criança nasceu depois do pôr do sol, a data judaica é a do dia seguinte: confirme com a família.</p></div>`;
}
A.bmWa=el=>{const p=PPL.get(+el.dataset.id),f=FAM.get(p.fid),r=respOf(f),x=bmList().find(z=>z.p===p),bat=p.sexo==='F';
  openWa(f.id,null,{txt:`Shalom ${r?r.nome.split(' ')[0]:''}! O ${bat?'Bat':'Bar'} Mitzvá de ${p.nome.split(' ')[0]} está chegando${x?' ('+fmtDate(x.dt)+')':''}. Podemos marcar uma conversa com o rabino para combinar a preparação e a data da comemoração?`,ctx:'Bar ou Bat Mitzvá se aproximando'})};

/* ================= etiquetas e notas do rabino ================= */
A.addTag=el=>{const f=FAM.get(+el.dataset.id);formModal({title:'Adicionar etiqueta',submit:'Adicionar',fields:[
  {k:'tag',label:'Etiqueta existente',type:'select',ph:'Escolher...',opts:DB.tags.filter(t=>!f.tags.includes(t))},{k:'nova',label:'Ou criar uma nova',ph:'Ex.: Coral'}],
  onSubmit(v){const t=(v.nova||v.tag||'').trim();if(!t)return 'Escolha ou escreva uma etiqueta.';if(!DB.tags.includes(t))DB.tags.push(t);if(!f.tags.includes(t))f.tags.push(t);f._s=null;toast('Etiqueta "'+t+'" adicionada a '+famName(f)+'.')}})};
A.rmTag=el=>{const f=FAM.get(+el.dataset.id);arrDel(f.tags,el.dataset.arg);f._s=null;render()};
const tagChips=f=>`<div class="chips">${(f.tags||[]).map(t=>`<button type="button" class="badge b-gray tagx" title="Remover etiqueta" data-act="rmTag" data-id="${f.id}" data-arg="${esc(t)}">${ic('tag',11)}${esc(t)} ×</button>`).join('')}<button type="button" class="badge b-gray tagx" data-act="addTag" data-id="${f.id}">+ etiqueta</button></div>`;
const rabCard=f=>can('notas')
  ?`<div class="card mt"><div class="ct" style="margin-bottom:10px">${ic('lock',16)}Anotações privadas do rabino</div><textarea class="inp" id="obs-rab" rows="5" placeholder="Só o rabino vê estas anotações...">${esc(f.notaRabino||'')}</textarea><div class="pacts" style="margin-top:10px">${btn('Salvar anotação','check','btn-green',`data-act="saveRab" data-id="${f.id}"`)}</div></div>`
  :`<div class="card mt"><div class="ct" style="margin-bottom:6px">${ic('lock',16)}Anotações privadas do rabino</div><p class="hint">Só o rabino vê estas anotações. Para testar, clique no seu nome, no alto da tela, e entre como Rabino.</p></div>`;
A.saveRab=el=>{FAM.get(+el.dataset.id).notaRabino=$('#obs-rab').value.trim();toast('Anotação do rabino salva.');render()};

/* ================= dados de exemplo dos novos módulos ================= */
function seed2(){
  const R=rng(770),ri=(a,b)=>a+Math.floor(R()*(b-a+1)),pick=a=>a[Math.floor(R()*a.length)],ch=p=>R()<p;
  const [cohen,levy,,,,]=DB.fam,lastSat=addDays(TODAY,-((toDate(TODAY).getDay()+1)%7));
  DB.users=[{id:1,nome:'Mendi',papel:'Administrador',email:'mendi@exemplo.com'},{id:2,nome:'Secretaria',papel:'Secretária',email:'secretaria@exemplo.com'},{id:3,nome:'Rabino',papel:'Rabino',email:'rabino@exemplo.com'},{id:4,nome:'Voluntário de eventos',papel:'Voluntário',email:'voluntario@exemplo.com'}];
  DB.tags=['Voluntário','Comissão','Novo na cidade','Profissional de saúde','Empresário','Fala hebraico','Ex-aluno'];
  DB.fam.forEach(f=>{f.tags=[];if(ch(.28))f.tags.push(pick(DB.tags));if(ch(.08)){const t=pick(DB.tags);if(!f.tags.includes(t))f.tags.push(t)}
    if(f!==cohen&&ch(.06))f.okWa=false;if(f!==cohen&&ch(.1))f.okMail=false;
    f.ev12=f.cat==='Visitante'?ri(0,1):f.part.eventos?ri(2,7):ri(0,2);f.notaRabino=''});
  cohen.tags=['Comissão','Empresário'];cohen.ev12=7;cohen.notaRabino='David comentou que gostaria de dedicar uma aula em memória da mãe. Conversar com ele antes do yahrzeit.';
  DB.ct.forEach(c=>{if(c.tipo==='tarefa')c.resp=pick(DB.users.slice(0,3)).nome});
  /* momentos */
  DB.life=[];const act=DB.fam.slice(6).filter(f=>f.status==='Ativo'&&f.cat!=='Visitante');
  const L=(f,tipo,dd,det)=>DB.life.push({id:nid(),fid:f.id,tipo,data:addDays(TODAY,-dd),det:det||''});
  L(pick(act),'luto',4,'Falecimento do pai. Shivá na casa da família.');L(pick(act),'nasc',2,'Nasceu um menino.');L(pick(act),'nasc',9,'Nasceu uma menina.');L(pick(act),'casam',6,'Casamento da filha.');L(levy,'bar',20,'Bar Mitzvá do Benjamin.');
  for(let i=0;i<34;i++)L(pick(act),pick(['nasc','nasc','brit','casam','noiv','luto','bar','mud']),ri(16,360));
  /* campanhas */
  DB.camp=[];const C=(nome,ini,fim,desc)=>DB.camp.push({id:nid(),nome,ini,fim,desc,meta:0});
  C('Campanha do novo Sefer Torá',addDays(TODAY,-200),addDays(TODAY,90),'Escrita de um novo Sefer Torá para a comunidade.');
  C('Reforma do salão',addDays(TODAY,-120),addDays(TODAY,150),'Reforma do salão de festas e da cozinha.');
  C('Campanha anual',Y+'-01-01',Y+'-12-31','Manutenção das atividades do ano.');
  C('Fundo de bolsas Chai Kids',addDays(TODAY,-300),addDays(TODAY,60),'Bolsas para crianças no Chai Kids.');
  C('Campanha de Tishrei',addDays(TODAY,-100),addDays(TODAY,-40),'Despesas das festas de Tishrei.');
  DB.camp.forEach(c=>{const s=campStats(c);c.meta=Math.max(20000,Math.ceil(Math.max(s.prom,s.arr)*(c.fim<TODAY?1.04:1.55)/10000)*10000)});
  /* aulas */
  const ok=p=>{const f=FAM.get(p.fid);return f.status==='Ativo'&&f.cat!=='Visitante'},ad=DB.ppl.filter(p=>ok(p)&&age(p.nasc)>=18),tn=DB.ppl.filter(p=>ok(p)&&isTeen(p));
  DB.aulas=[['Tanya semanal','Rabino','Terça-feira, 20h','Adultos',28,ad],['Parashá da semana','Rabino','Quinta-feira, 20h30','Adultos',34,ad],['Aula para mulheres','Rebetsin','Quarta-feira, 10h','Mulheres',22,ad.filter(p=>p.sexo==='F')],['Talmud para iniciantes','Rabino','Domingo, 9h','Homens',14,ad.filter(p=>p.sexo==='M')],['Hebraico básico','Professora convidada','Segunda-feira, 19h','Adultos',18,ad],['Estudo Chai Teens','Monitor','Domingo, 17h','Jovens',16,tn]]
    .map(a=>{const s=new Set();for(let g=0;g<400&&s.size<Math.min(a[4],a[5].length);g++)s.add(pick(a[5]).id);const n=s.size;return{id:nid(),nome:a[0],prof:a[1],quando:a[2],publico:a[3],insc:[...s],pres:[0,0,0,0].map(()=>Math.round(n*(.55+R()*.35)))}});
  /* presenças */
  DB.att={};
  for(let w=0;w<8;w++){const d=addDays(lastSat,-7*w),s=new Set();DB.fam.forEach(f=>{if(f.status!=='Ativo')return;if(f.pres&&f.pres.tipo==='Shabat'&&f.pres.data>=d){if(f.pres.data===d||ch(.72))s.add(f.id)}else if(w>1&&f.part.shabat&&ch(.6))s.add(f.id)});DB.att[d+'|Shabat']=s}
  S.ui.pr.data=lastSat;
  DB.ppl.forEach(p=>{if(isKid(p)||isTeen(p))p.aut=ch(.82)});
  /* mesas */
  const jantar=DB.ev.find(e=>e.nome==='Jantar Beneficente');
  if(jantar){jantar.mesas={n:12,cap:10};const occ=Array(13).fill(0);jantar.regs.forEach(r=>{if(!ch(.75))return;for(let m=1;m<=12;m++)if(occ[m]+r.q<=10){r.mesa=m;occ[m]+=r.q;break}})}
  /* comunicação */
  DB.forms=[{id:nid(),k:'cadastro',nome:'Cadastro de nova família',desc:'Cria a ficha da família e avisa a equipe para dar as boas-vindas.',resp:23,on:true},{id:nid(),k:'kids',nome:'Inscrição no Chai Kids',desc:'Inscreve a criança e pede a autorização dos pais.',resp:41,on:true},{id:nid(),k:'contato',nome:'Pedido de contato com o rabino',desc:'Cria uma tarefa para o rabino retornar.',resp:12,on:true},{id:nid(),k:'evento',nome:'Inscrição em evento',desc:'Inscreve a família e gera o pagamento, quando houver.',resp:268,on:true}];
  [['Boas-vindas','WhatsApp','Shalom {nome}! Que alegria ter a sua família conosco no Chai Menachem. Qualquer dúvida, estou à disposição.'],['Mazal Tov','WhatsApp','Mazal Tov, {nome}! Toda a comunidade se alegra com vocês. Que seja com muita saúde e alegria.'],['Link de pagamento','WhatsApp','Shalom {nome}! Segue o link para pagamento de {descricao} ({valor}): {link}'],['Informativo semanal','E-mail','Shalom {nome}! Veja a programação da semana no Chai Menachem: horários de Shabat, aulas e próximos eventos.']]
    .forEach(t=>DB.tpl.push({id:nid(),nome:t[0],canal:t[1],txt:t[2]}));
  [['Boas-vindas a novas famílias','No dia do cadastro, para o responsável','Boas-vindas',true],['Recibo automático','Assim que um pagamento é confirmado','Agradecimento por doação',true],['Resumo semanal para o rabino','Todo domingo, às 20h','Resumo da semana',true],['Aviso de Bar ou Bat Mitzvá','12 meses antes, para a equipe','Tarefa para o rabino',true]]
    .forEach(a=>DB.auto.push({id:nid(),nome:a[0],quando:a[1],modelo:a[2],on:a[3]}));
  DB.cfg.regua=[{d:3,on:true,txt:'Lembrete amigável por WhatsApp, com link de pagamento'},{d:10,on:true,txt:'Segundo lembrete por WhatsApp'},{d:20,on:false,txt:'Tarefa para a secretaria ligar para a família'}];
  DB.cfg.integr={site:false,mp:false,wa:false};
  DB.cfg.users=DB.users;
  DB.log=[['-0 09:12','Secretaria','Presença do Shabat registrada: '+DB.att[lastSat+'|Shabat'].size+' famílias.'],['-1 17:40','Mendi','Doação de R$ 500,00 registrada para Família Cohen.'],['-1 11:05','Secretaria','Família Kogan atualizada.'],['-2 16:22','Rabino','Anotação do rabino salva.'],['-3 10:48','Secretaria','Follow-up concluído.'],['-4 15:30','Mendi','Evento criado.'],['-6 09:02','Secretaria','Yahrzeit cadastrado.']]
    .map(x=>({em:addDays(TODAY,+x[0].split(' ')[0])+' '+x[0].split(' ')[1],quem:x[1],txt:x[2]}));
  DB.fam.forEach(f=>{const s=score(f);f.sc0=Math.max(0,Math.min(100,s+(isAbsent(f)?ri(20,34):ri(-8,8))))});
}
