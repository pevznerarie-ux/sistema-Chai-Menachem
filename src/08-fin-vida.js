/* ================= Campanhas ================= */
function campStats(c){
  const don=DB.don.filter(d=>d.tipo===c.nome),pr=DB.prom.filter(p=>p.desc===c.nome),fs=new Set(don.map(d=>d.fid).concat(pr.map(p=>p.fid)));
  return{arr:sum(don,d=>d.valor)+sum(pr,p=>p.pago),prom:sum(pr,p=>p.total),pend:sum(pr,p=>p.total-p.pago),n:fs.size,don,pr};
}
const campOn=c=>c.fim>=TODAY;
const donTipos=()=>DON_TIPOS.concat((DB.camp||[]).filter(c=>campOn(c)&&!DON_TIPOS.includes(c.nome)).map(c=>c.nome));
function pgCampanhas(){
  const cs=DB.camp.slice().sort((a,b)=>campOn(b)-campOn(a)||(a.fim<b.fim?-1:1)),act=cs.filter(campOn),st=new Map(cs.map(c=>[c,campStats(c)])),tot=sum(act,c=>st.get(c).arr),meta=sum(act,c=>c.meta);
  return head('Campanhas','Arrecadações com meta, doadores e promessas',btn('Nova campanha','plus','btn-green','data-act="novaCamp"'))+
  `<div class="g4 keep2">${kpi('Campanhas ativas',NUM(act.length))}${kpi('Arrecadado nas ativas',BRL0(tot),pct(tot,meta)+'% da meta somada')}${kpi('Meta somada',BRL0(meta))}${kpi('Promessas a receber',BRL0(sum(act,c=>st.get(c).pend)))}</div>
  <div class="g3 mt">${cs.map(c=>{const s=st.get(c),p=Math.min(100,pct(s.arr,c.meta)),on=campOn(c);return `<div class="card camp"><div class="ch" style="margin:0"><div class="ct">${esc(c.nome)}</div>${badge(on?'Ativa':'Encerrada',on?'green':'gray')}</div><p class="muted">${esc(c.desc)}</p>
    <div><b style="font-size:20px" class="num">${BRL0(s.arr)}</b> <span class="muted">de ${BRL0(c.meta)}</span></div><div class="meter m-green" title="${p}% da meta"><i style="width:${p}%"></i></div>
    <div class="legend"><span><b>${p}%</b> da meta</span><span><b>${NUM(s.n)}</b> ${s.n===1?'família':'famílias'}</span><span>${on?'termina '+inDays(c.fim):'encerrada em '+fmtDate(c.fim)}</span></div>
    <div class="pacts">${btn('Ver doadores','eye','btn-sm',`data-act="campDet" data-id="${c.id}"`)}${on?btn('Registrar doação','heart','btn-sm',`data-act="doacao" data-arg="${esc(c.nome)}"`):''}</div></div>`}).join('')}</div>`;
}
A.campDet=el=>{const c=DB.camp.find(x=>x.id===+el.dataset.id),s=campStats(c),m=new Map();
  s.don.forEach(d=>{const x=m.get(d.fid)||{d:0,p:0};x.d+=d.valor;m.set(d.fid,x)});s.pr.forEach(p=>{const x=m.get(p.fid)||{d:0,p:0};x.d+=p.pago;x.p+=p.total-p.pago;m.set(p.fid,x)});
  const rows=[...m.entries()].sort((a,b)=>(b[1].d+b[1].p)-(a[1].d+a[1].p)).slice(0,40);
  openModal({title:c.nome,wide:true,body:`<p class="intro">${BRL(s.arr)} arrecadados de ${BRL(c.meta)} · ${BRL(s.pend)} em promessas a receber · ${pl(s.n,'família','famílias')}</p>
    <div class="tw" style="max-height:52vh;overflow:auto"><table class="tbl" style="min-width:380px"><thead><tr><th>Família</th><th class="num">Já doou</th><th class="num">Falta receber</th></tr></thead><tbody>${rows.map(([fid,x])=>`<tr><td><button type="button" class="btn-link" style="color:var(--ink)" data-go="financeiro-${fid}">${esc(famName(FAM.get(fid)))}</button></td><td class="num"><b>${BRL(x.d)}</b></td><td class="num">${x.p?BRL(x.p):'<span class="muted">—</span>'}</td></tr>`).join('')}</tbody></table></div>${rows.length?'':empty('Nenhuma doação nesta campanha ainda.')}`,
    footer:`<button type="button" class="btn btn-navy" data-act="closeModal">Fechar</button>`})};
A.novaCamp=()=>formModal({title:'Nova campanha',wide:true,submit:'Criar campanha',fields:[
  {k:'nome',label:'Nome da campanha',req:true,ph:'Ex.: Campanha de Pessach'},{k:'desc',label:'Para que serve',ph:'Uma frase para a família entender'},
  {k:'meta',label:'Meta (R$)',type:'money',req:true,half:true},{k:'fim',label:'Termina em',type:'date',req:true,val:addDays(TODAY,60),half:true}],
  onSubmit(v){if(DB.camp.some(c=>norm(c.nome)===norm(v.nome)))return 'Já existe uma campanha com este nome.';if(v.fim<TODAY)return 'A data final precisa ser de hoje em diante.';DB.camp.push({id:nid(),nome:v.nome,desc:v.desc,meta:v.meta,ini:TODAY,fim:v.fim});toast('Campanha "'+v.nome+'" criada.')}});

/* ================= Cobrança ================= */
function lateList(){const m=new Map();DB.pay.forEach(p=>{if(!p.pagoEm&&p.venc<TODAY)ixAdd(m,p.fid,p)});return[...m.entries()].map(([fid,ps])=>({f:FAM.get(fid),ps:ps.sort(by(p=>p.venc)),n:ps.length,v:sum(ps,p=>p.valor)})).sort(by(x=>x.v,-1))}
function pgCobranca(){
  const list=lateList(),tot=sum(list,x=>x.v);
  return head('Cobrança','Mensalidades em atraso e lembretes automáticos',list.length?btn('Enviar lembrete a todos ('+list.length+')','send','btn-blue','data-act="cobrarTodos"'):'')+
  `<div class="split split-w"><div class="card pad0"><div class="toolbar" style="padding-bottom:12px"><div class="ct">Em atraso: ${BRL(tot)} de ${pl(list.length,'família','famílias')}</div></div>
    ${list.length?`<div class="tw"><table class="tbl"><thead><tr><th>Família</th><th class="num">Meses</th><th class="num">Valor</th><th>Em atraso desde</th><th class="right">Ações</th></tr></thead><tbody>${list.map(x=>`<tr>
      <td><div class="who">${famAv(x.f,'av-sm')}<div><button type="button" class="btn-link" style="color:var(--ink)" data-go="financeiro-${x.f.id}">${esc(famName(x.f))}</button><small>${esc((respOf(x.f)||{}).nome||'')}</small></div></div></td>
      <td class="num">${x.n}</td><td class="num"><b style="color:var(--red-ink)">${BRL(x.v)}</b></td><td class="num">${fmtDate(x.ps[0].venc)} <small>(${ago(x.ps[0].venc)})</small></td>
      <td class="acts"><button type="button" class="ibtn" title="Enviar lembrete" aria-label="Enviar lembrete" data-act="waLate" data-id="${x.f.id}">${ic('wa',15)}</button><button type="button" class="ibtn" title="Link de pagamento" aria-label="Link de pagamento" data-act="payLink" data-id="${x.f.id}" data-arg="pay:${x.ps[0].id}">${ic('link',15)}</button><button type="button" class="ibtn" title="Abrir financeiro" aria-label="Abrir financeiro" data-go="financeiro-${x.f.id}">${ic('eye',15)}</button></td></tr>`).join('')}</tbody></table></div>`:empty('Nenhuma mensalidade em atraso.','Todas as famílias estão em dia.')}
  </div><aside class="rail">
    <div class="card"><div class="cap">Régua de cobrança</div><p class="hint" style="margin-bottom:6px">${PREV?'O sistema lembra a família sozinho, nestes momentos.':'Os lembretes automáticos começam quando o WhatsApp Business for conectado.'}</p><div class="rows">${DB.cfg.regua.map((g,i)=>`<div class="rw"><button type="button" class="switch ${g.on?'on':''}" role="switch" aria-checked="${!!g.on}" aria-label="${esc(g.txt)}" data-act="toggleRegua" data-id="${i}"><i></i></button><span class="grow"><b>${g.d} dias depois do vencimento</b><small style="display:block">${esc(g.txt)}</small></span></div>`).join('')}</div></div>
    <div class="card"><div class="cap">Como a família paga</div><p style="color:var(--ink-2)">O lembrete leva um link de pagamento (PIX ou cartão). Quando a família paga, a baixa entra sozinha e o recibo é enviado.</p></div>
  </aside></div>`;
}
A.toggleRegua=el=>{const g=DB.cfg.regua[+el.dataset.id];g.on=!g.on;render();toast('Lembrete de '+g.d+' dias '+(g.on?'ativado.':'pausado.'))};
A.cobrarTodos=()=>{const n=lateList().length;confirmModal('Enviar lembrete a todos','Preparar um lembrete de mensalidade para <b>'+pl(n,'família','famílias')+'</b> em atraso? '+(PREV?'Na prévia nada é enviado.':'O envio automático começa quando o WhatsApp Business for conectado.')+'','Preparar disparo',()=>{
  DB.disp.push({id:nid(),nome:'Lembrete de mensalidade',data:TODAY,publico:'Mensalidade em atraso',canal:'WhatsApp',env:n,ent:0,resp:0,st:'Rascunho',txt:''});toast('Disparo de cobrança salvo como rascunho. '+(PREV?'Na prévia nada é enviado.':'O envio automático começa quando o WhatsApp Business for conectado.'),1)})};

/* ================= Link de pagamento ================= */
A.payLink=el=>{
  const f=FAM.get(+el.dataset.id),[t,i]=(el.dataset.arg||'don').split(':'),p=t==='pay'?DB.pay.find(x=>x.id===+i):null;
  const valor=p?p.valor:(f.mens.valor||DB.cfg.mensPadrao),desc=p?'Mensalidade de '+compTxt(p.comp):'Doação';
  S.pl={fid:f.id,pid:p?p.id:null,desc,link:'https://pagamento.exemplo/chai-menachem/'+(f.id*7919+(p?p.id:1)).toString(36)};
  if(!PREV){openModal({title:'Registrar pagamento',body:`<div class="fgrid">
    <div class="field half"><span class="flabel">Família</span><b>${esc(famName(f))}</b></div><div class="field half"><span class="flabel">Referente a</span><b>${esc(desc)}</b></div>
    <div class="field half"><label for="pl-valor">Valor recebido (R$)</label><input class="inp" id="pl-valor" inputmode="decimal" value="${String(valor).replace('.',',')}"></div>
    <div class="field"><span class="hint">O link de pagamento do Mercado Pago, com baixa automática, entra quando a integração for conectada. Por enquanto, registre aqui o que a família já pagou.</span></div></div>`,
    footer:`<button type="button" class="btn" data-act="closeModal">Fechar</button><button type="button" class="btn btn-green" data-act="plPago">${ic('check',15)}Registrar pagamento</button>`});return}
  openModal({title:'Link de pagamento',body:`<div class="fgrid">
    <div class="field half"><span class="flabel">Família</span><b>${esc(famName(f))}</b></div><div class="field half"><span class="flabel">Referente a</span><b>${esc(desc)}</b></div>
    <div class="field half"><label for="pl-valor">Valor (R$)</label><input class="inp" id="pl-valor" inputmode="decimal" value="${String(valor).replace('.',',')}"></div><div class="field half"><span class="flabel">Formas aceitas</span><span>PIX e cartão de crédito</span></div>
    <div class="field"><span class="flabel">Link</span><div class="codebox">${esc(S.pl.link)}</div><span class="hint">Link de exemplo. Na versão online ele é gerado pelo Mercado Pago, e a baixa e o recibo saem sozinhos quando a família paga.</span></div></div>`,
    footer:`<button type="button" class="btn" data-act="closeModal">Fechar</button><button type="button" class="btn" data-act="plWa">${ic('wa',15)}Enviar por WhatsApp</button><button type="button" class="btn btn-green" data-act="plPago">${ic('check',15)}Simular pagamento</button>`});
};
A.plWa=()=>{const x=S.pl,v=parseMoney($('#pl-valor').value),f=FAM.get(x.fid),r=respOf(f);closeModal();openWa(x.fid,null,{txt:`Shalom ${r?r.nome.split(' ')[0]:''}! Segue o link para pagamento de ${x.desc} (${BRL(v)}): ${x.link}`})};
A.plPago=()=>{const x=S.pl,v=parseMoney($('#pl-valor').value),f=FAM.get(x.fid);if(!v){$('#m-err').textContent='Informe o valor.';return}
  if(x.pid){const p=DB.pay.find(z=>z.id===x.pid);p.valor=v;p.pagoEm=TODAY;if(PREV)p.forma='PIX'}else addDon({fid:f.id,pid:f.respId,data:TODAY,valor:v,tipo:'Doação geral',forma:PREV?'PIX':(f.mens.forma||'PIX'),obs:PREV?'Pagamento online':''});
  addCt({fid:f.id,tipo:'email',titulo:PREV?'Recibo enviado':'Pagamento registrado',det:x.desc+' · '+BRL(v),data:TODAY,feito:true});closeModal();render();toast('Pagamento de '+BRL(v)+' '+(PREV?'confirmado':'registrado')+' para '+famName(f)+'.'+(PREV?' Recibo enviado.':''))};

/* ================= Recibos ================= */
function receipts(fid,days){
  const d0=addDays(TODAY,-(days||90)),out=[];
  (fid?ixOf(IX.pay,fid):DB.pay).forEach(p=>{if(p.pagoEm&&p.pagoEm>=d0)out.push({k:'pay',id:p.id,fid:p.fid,data:p.pagoEm,ref:'Mensalidade de '+compTxt(p.comp),valor:p.valor,forma:p.forma})});
  (fid?ixOf(IX.don,fid):DB.don).forEach(d=>{if(d.data>=d0)out.push({k:'don',id:d.id,fid:d.fid,data:d.data,ref:d.tipo,valor:d.valor,forma:d.forma})});
  return out.sort(by(x=>x.data,-1));
}
const rcNum=x=>x.data.slice(0,4)+'-'+String(x.id).padStart(6,'0');
const rcTable=(list,showFam)=>`<div class="tw"><table class="tbl"><thead><tr><th>Recibo</th><th>Data</th>${showFam?'<th>Família</th>':''}<th>Referente a</th><th>Forma de pagamento</th><th class="num">Valor</th><th class="right">Ações</th></tr></thead><tbody>${list.map(x=>`<tr>
  <td class="num"><b>${rcNum(x)}</b></td><td class="num">${fmtDate(x.data)}</td>${showFam?`<td><button type="button" class="btn-link" style="color:var(--ink)" data-go="financeiro-${x.fid}">${esc(famName(FAM.get(x.fid)))}</button></td>`:''}<td>${esc(x.ref)}</td><td>${esc(x.forma)}</td><td class="num"><b>${BRL(x.valor)}</b></td>
  <td class="acts"><button type="button" class="btn btn-sm" data-act="recibo" data-id="${x.fid}" data-arg="${x.k}:${x.id}">${ic('receipt',13)}Ver recibo</button></td></tr>`).join('')}</tbody></table></div>`;
function pgRecibos(){
  const u=S.ui.rc,list=memo('rc',()=>receipts(null,90)),rows=paginate(list,u,12);
  return head('Recibos','Um recibo para cada pagamento confirmado. Aqui estão os dos últimos 90 dias.')+
  `<div class="g3">${kpi('Recibos em 90 dias',NUM(list.length))}${kpi('Valor recebido',BRL0(sum(list,x=>x.valor)))}${kpi('Envio','Automático','assim que o pagamento é confirmado')}</div>
  <div class="card pad0 mt">${rows.length?rcTable(rows,true):empty('Nenhum recibo no período.')}${pager(list.length,u,12,'rc','recibos')}</div>`;
}
const famRecibos=f=>{const list=receipts(f.id,800);return `<div class="card pad0"><div class="toolbar" style="padding-bottom:12px;justify-content:space-between"><div class="ct">Recibos (${list.length})</div>${btn('Informe anual '+Y,'file','btn-sm',`data-act="informe" data-id="${f.id}"`)}</div>${list.length?rcTable(list,false):empty('Nenhum recibo emitido para esta família.')}</div>`};
const rcFind=(fid,arg)=>{const [k,id]=arg.split(':');return receipts(fid,4000).find(r=>r.k===k&&r.id===+id)};
const rcText=x=>{const f=FAM.get(x.fid),r=respOf(f);return ['CHAI MENACHEM','Recibo nº '+rcNum(x),'','Recebemos de '+(r?r.nome:famName(f))+' ('+famName(f)+') a quantia de '+BRL(x.valor)+',','referente a: '+x.ref+'.','','Data: '+fmtDate(x.data),'Forma de pagamento: '+x.forma,'','Tizku lemitzvot!'].join('\n')};
A.recibo=el=>{const x=rcFind(+el.dataset.id,el.dataset.arg);if(!x)return;const f=FAM.get(x.fid),r=respOf(f);S.rc=x;
  openModal({title:'Recibo',body:`<div class="rcb"><div class="rcb-h"><b>CHAI MENACHEM</b><span class="num">Recibo nº ${rcNum(x)}</span></div>
    <p>Recebemos de <b>${esc(r?r.nome:famName(f))}</b> (${esc(famName(f))}) a quantia de</p><div class="big num">${BRL(x.valor)}</div>
    ${kv([['Referente a',esc(x.ref)],['Data',fmtDate(x.data)],['Forma de pagamento',esc(x.forma)]])}</div><p class="hint" style="margin-top:10px">${PREV?'Recibo de exemplo, com dados fictícios da prévia.':'O envio automático do recibo começa quando o WhatsApp Business for conectado.'}</p>`,
    footer:`<button type="button" class="btn" data-act="closeModal">Fechar</button><button type="button" class="btn" data-act="rcDown">${ic('download',15)}Baixar</button><button type="button" class="btn btn-green" data-act="rcWa">${ic('wa',15)}Enviar por WhatsApp</button>`})};
A.rcDown=async()=>{const x=S.rc;if((await download('recibo-'+rcNum(x)+'.txt',rcText(x)))==='fail')toast('Não deu para baixar por aqui.',1)};
A.rcWa=()=>{const x=S.rc;closeModal();openWa(x.fid,null,{txt:rcText(x)})};
A.informe=el=>{const f=FAM.get(+el.dataset.id),list=receipts(f.id,800).filter(x=>+x.data.slice(0,4)===Y),m=sum(list.filter(x=>x.k==='pay'),x=>x.valor),d=sum(list.filter(x=>x.k==='don'),x=>x.valor),r=respOf(f);
  const txt=['CHAI MENACHEM · Informe anual '+Y,'',famName(f)+(r?' · '+r.nome:''),'','Mensalidades pagas: '+BRL(m),'Doações: '+BRL(d),'Total do ano: '+BRL(m+d),'',pl(list.length,'pagamento registrado','pagamentos registrados')+' em '+Y+'.'].join('\n');
  openModal({title:'Informe anual '+Y,body:`<textarea class="inp" id="copy-txt" rows="10" readonly>${esc(txt)}</textarea>`,footer:`<button type="button" class="btn" data-act="closeModal">Fechar</button><button type="button" class="btn btn-green" data-act="copyTxt">${ic('copy',15)}Copiar</button>`})};

/* ================= Presenças ================= */
const attKey=()=>S.ui.pr.data+'|'+S.ui.pr.tipo,attSet=()=>DB.att[attKey()]||(DB.att[attKey()]=new Set());
function pgPresencas(){
  const u=S.ui.pr,set=attSet(),q=norm(u.q).trim();
  const list=DB.fam.filter(f=>f.status==='Ativo'&&(!q||famSearch(f).includes(q))).sort((a,b)=>(b.part.shabat-a.part.shabat)||(a.nome<b.nome?-1:a.nome>b.nome?1:0)),rows=paginate(list,u,12);
  const hist=Object.keys(DB.att).filter(k=>k.endsWith('|'+u.tipo)&&DB.att[k].size).sort().reverse().slice(0,6).map(k=>[fmtDate(k.split('|')[0]),DB.att[k].size]);
  return head('Presenças','Marque quem veio. A última presença de cada família se atualiza sozinha.')+
  `<div class="split split-w"><div class="card pad0"><div class="toolbar">
      <input class="inp num" type="date" id="pr-data" aria-label="Data" data-f="pr.data" value="${u.data}" max="${TODAY}">
      <select class="inp" id="pr-tipo" data-f="pr.tipo" aria-label="Tipo">${['Shabat','Kidush','Aula','Evento'].map(t=>opt(t,t,u.tipo)).join('')}</select>
      <label class="search">${ic('search',15)}<input id="pr-q" type="search" placeholder="Buscar família..." aria-label="Buscar família" data-f="pr.q" value="${esc(u.q)}"></label></div>
    <div class="tw" style="margin-top:12px"><table class="tbl"><thead><tr><th>Família</th><th>Categoria</th><th>Última presença</th><th class="right">Presença em ${fmtDM(u.data)}</th></tr></thead><tbody>${rows.map(f=>{const on=set.has(f.id);return `<tr>
      <td><div class="who">${famAv(f,'av-sm')}<div><b>${esc(famName(f))}</b><small>${esc((respOf(f)||{}).nome||'')}</small></div></div></td><td>${catBadge(f)}</td><td class="num">${f.pres?fmtDate(f.pres.data):'—'}</td>
      <td class="acts"><button type="button" class="btn btn-sm ${on?'pres-on':''}" aria-pressed="${on}" data-act="togglePres" data-id="${f.id}">${on?ic('check',13)+'Presente':'Marcar presença'}</button></td></tr>`}).join('')}</tbody></table></div>
    ${rows.length?'':empty('Nenhuma família encontrada.')}${pager(list.length,u,12,'pr','famílias')}
  </div><aside class="rail">
    <div class="kpi"><div class="lab">${esc(u.tipo)} de ${fmtDate(u.data)}</div><div class="val">${NUM(set.size)}</div><div class="dl">${set.size===1?'família presente':'famílias presentes'}, cerca de ${NUM(sum([...set],id=>members(id).length))} pessoas</div></div>
    <div class="card"><div class="cap">Últimos registros de ${esc(u.tipo)}</div>${hist.length?barList(hist):'<span class="muted">Nenhum registro ainda.</span>'}</div>
  </aside></div>`;
}
A.togglePres=el=>{const f=FAM.get(+el.dataset.id),u=S.ui.pr,s=attSet();if(s.has(f.id))s.delete(f.id);else{s.add(f.id);if(!f.pres||f.pres.data<=u.data)f.pres={tipo:u.tipo,data:u.data}}render()};

/* ================= Aulas e shiurim ================= */
function buildPplLabels(){S.pplLab=new Map();DB.ppl.forEach(p=>{let l=p.nome+' — '+famName(FAM.get(p.fid));if(S.pplLab.has(l))l+=' ('+p.id+')';p._lab=l;S.pplLab.set(l,p.id)})}
function pplFromLabel(v){v=(v||'').trim();if(!v)return null;if(S.pplLab.has(v))return S.pplLab.get(v);const q=norm(v),hit=[...S.pplLab.keys()].filter(l=>norm(l).includes(q));return hit.length===1?S.pplLab.get(hit[0]):null}
const dlPpl=()=>`<datalist id="dl-ppl">${DB.ppl.map(p=>`<option value="${esc(p._lab)}"></option>`).join('')}</datalist>`;
const aulaAvg=a=>a.pres.length&&a.insc.length?Math.min(100,Math.round(sum(a.pres,x=>x)/a.pres.length/a.insc.length*100)):0;
function pgAulas(){
  const tot=sum(DB.aulas,a=>a.insc.length),av=DB.aulas.filter(a=>a.insc.length&&a.pres.length);
  return head('Aulas e shiurim','Turmas, inscritos e presença de cada aula',btn('Nova aula','plus','btn-green','data-act="novaAula"'))+
  `<div class="g3">${kpi('Aulas em andamento',NUM(DB.aulas.length))}${kpi('Inscrições',NUM(tot))}${kpi('Presença média',(av.length?Math.round(sum(av,aulaAvg)/av.length):0)+'%','nas últimas aulas')}</div>
  <div class="card pad0 mt"><div class="tw"><table class="tbl"><thead><tr><th>Aula</th><th>Professor</th><th>Quando</th><th>Público</th><th class="num">Inscritos</th><th>Presença média</th><th class="right">Ações</th></tr></thead><tbody>${DB.aulas.map(a=>{const p=aulaAvg(a);return `<tr>
    <td><b>${esc(a.nome)}</b></td><td>${esc(a.prof)}</td><td>${esc(a.quando)}</td><td>${badge(a.publico,'blue')}</td><td class="num">${a.insc.length}</td>
    <td><span class="sc"><b class="num">${p}%</b><span class="meter"><i style="width:${p}%"></i></span></span></td>
    <td class="acts">${btn('Inscritos','users','btn-sm',`data-act="aulaDet" data-id="${a.id}"`)}</td></tr>`}).join('')}</tbody></table></div></div>`;
}
A.aulaDet=el=>{const a=DB.aulas.find(x=>x.id===+el.dataset.id);S.aula=a.id;buildPplLabels();
  openModal({title:a.nome,wide:true,body:`<p class="intro">${esc(a.prof)} · ${esc(a.quando)} · ${esc(a.publico)}.${a.pres.length?' Presentes nas últimas aulas: '+a.pres.join(', ')+'.':''}</p>
    <div style="display:flex;gap:8px"><input class="inp" id="au-p" list="dl-ppl" placeholder="Digite o nome da pessoa para inscrever" aria-label="Pessoa" style="flex:1" autocomplete="off"><button type="button" class="btn btn-green" data-act="aulaAdd">Inscrever</button></div><span class="err" id="au-e"></span>
    <div class="rows" style="max-height:44vh;overflow:auto;margin-top:8px">${a.insc.map(pid=>{const p=PPL.get(pid);return p?`<div class="rw">${pAv(p,'av-sm')}<span class="grow"><b>${esc(p.nome)}</b><small style="display:block">${esc(famName(FAM.get(p.fid)))}</small></span><button type="button" class="ibtn" title="Remover" aria-label="Remover ${esc(p.nome)}" data-act="aulaRm" data-id="${pid}">${ic('x',14)}</button></div>`:''}).join('')||empty('Ninguém inscrito ainda.')}</div>${dlPpl()}`,
    footer:`<button type="button" class="btn btn-navy" data-act="closeModal">Fechar</button>`})};
A.aulaAdd=()=>{const a=DB.aulas.find(x=>x.id===S.aula),pid=pplFromLabel($('#au-p').value);if(!pid){$('#au-e').textContent='Escolha uma pessoa da lista.';return}if(a.insc.includes(pid)){$('#au-e').textContent='Esta pessoa já está inscrita.';return}
  a.insc.unshift(pid);render();toast(PPL.get(pid).nome+' inscrito(a) em '+a.nome+'.');A.aulaDet({dataset:{id:a.id}})};
A.aulaRm=el=>{const a=DB.aulas.find(x=>x.id===S.aula);arrDel(a.insc,+el.dataset.id);render();A.aulaDet({dataset:{id:a.id}})};
A.novaAula=()=>formModal({title:'Nova aula',submit:'Criar aula',fields:[{k:'nome',label:'Nome da aula',req:true,ph:'Ex.: Tanya semanal'},{k:'prof',label:'Professor',req:true,val:'Rabino',half:true},{k:'publico',label:'Público',type:'select',opts:['Adultos','Homens','Mulheres','Jovens','Crianças'],half:true},{k:'quando',label:'Dia e horário',req:true,ph:'Ex.: Terça-feira, 20h'}],
  onSubmit(v){DB.aulas.push(Object.assign({id:nid(),insc:[],pres:[]},v));toast('Aula "'+v.nome+'" criada.')}});

/* ================= Calendário judaico ================= */
const LOC={lat:-23.55,lng:-46.63,tz:-3};
function sunAt(iso,zen){
  const d=toDate(iso),N=Math.round((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(d.getFullYear(),0,1))/864e5)+1,g=2*Math.PI/365*(N-.5);
  const eq=229.18*(0.000075+0.001868*Math.cos(g)-0.032077*Math.sin(g)-0.014615*Math.cos(2*g)-0.040849*Math.sin(2*g));
  const dec=0.006918-0.399912*Math.cos(g)+0.070257*Math.sin(g)-0.006758*Math.cos(2*g)+0.000907*Math.sin(2*g)-0.002697*Math.cos(3*g)+0.00148*Math.sin(3*g);
  const la=LOC.lat*Math.PI/180,ha=Math.acos(Math.cos(zen*Math.PI/180)/(Math.cos(la)*Math.cos(dec))-Math.tan(la)*Math.tan(dec))*180/Math.PI;
  return 720-4*(LOC.lng-ha)-eq+LOC.tz*60;
}
const hm=m=>{m=Math.round(m);return pad(Math.floor(m/60))+':'+pad(m%60)};
const velas=iso=>hm(sunAt(iso,90.833)-18),havdala=iso=>hm(sunAt(iso,98.5));
const HOLS={'Tishrei|1':'Rosh Hashaná','Tishrei|2':'Rosh Hashaná','Tishrei|10':'Yom Kipur','Tishrei|15':'Sucot','Tishrei|16':'Sucot','Tishrei|21':'Hoshaná Rabá','Tishrei|22':'Shemini Atseret','Tishrei|23':'Simchat Torá','Kislev|19':'Yud-Tes Kislev','Shevat|10':'Yud Shevat','Shevat|15':'Tu BiShvat','Adar|14':'Purim','Adar II|14':'Purim','Nissan|11':'Yud-Alef Nissan','Nissan|15':'Pessach','Nissan|16':'Pessach','Nissan|21':'Pessach','Nissan|22':'Pessach','Iyar|18':'Lag BaOmer','Sivan|6':'Shavuot','Sivan|7':'Shavuot','Tamuz|3':'Guimel Tamuz','Elul|18':'Chai Elul'};
function holiday(iso){
  const h=HEB.of(iso);if(!h)return '';const k=HOLS[h.m+'|'+h.d];if(k)return k;
  if(h.m==='Tishrei'&&h.d>=17&&h.d<=20)return 'Chol Hamoed Sucot';if(h.m==='Nissan'&&h.d>=17&&h.d<=20)return 'Chol Hamoed Pessach';
  if(h.m==='Kislev'||h.m==='Tevet')for(let n=0;n<8;n++){const x=HEB.of(addDays(iso,-n));if(x.m==='Kislev'&&x.d===25)return 'Chanucá · dia '+(n+1)}
  const dow=toDate(iso).getDay();if(h.m==='Av'&&((h.d===9&&dow!==6)||(h.d===10&&dow===0)))return 'Tishá BeAv';
  return h.d===1||h.d===30?'Rosh Chodesh':'';
}
function pgCalendario(){
  if(!HEB.ok)return head('Calendário judaico','')+`<div class="card">${empty('Este navegador não calcula o calendário judaico.','Abra em um navegador atualizado.')}</div>`;
  const u=S.ui.cal,[y,m]=u.m.split('-').map(Number),first=u.m+'-01',off=toDate(first).getDay(),dim=new Date(y,m,0).getDate(),weeks=Math.ceil((off+dim)/7);
  const prevM=m===1?(y-1)+'-12':y+'-'+pad(m-1),nextM=m===12?(y+1)+'-01':y+'-'+pad(m+1),bd=memo('bd',()=>{const o={};DB.ppl.forEach(p=>{if(p.nasc){const k=p.nasc.slice(5);o[k]=(o[k]||0)+1}});return o});
  let cells='';
  for(let i=0;i<weeks*7;i++){
    const d=addDays(first,i-off),h=HEB.of(d),hol=holiday(d),dow=i%7,evs=DB.ev.filter(e=>!e.cancel&&e.data===d),yz=DB.yz.filter(z=>HEB.same(h,z.m,z.d)).length,b=bd[d.slice(5)]||0;
    cells+=`<div class="cell ${d.slice(0,7)!==u.m?'out':''} ${d===TODAY?'today':''}"><div class="dn"><span>${+d.slice(8)}</span><small>${h.d} ${h.m}</small></div>
      ${hol?`<span class="hol" title="${esc(hol)}">${esc(hol)}</span>`:''}${dow===5?`<span class="tm">Velas ${velas(d)}</span>`:dow===6?`<span class="tm">Havdalá ${havdala(d)}</span>`:''}
      ${evs.slice(0,2).map(e=>`<button type="button" class="ev evb" title="${esc(e.nome)}" data-go="evento-${e.id}">${esc(e.nome)}</button>`).join('')}
      ${yz?`<span class="ct2">${pl(yz,'yahrzeit','yahrzeits')}</span>`:''}${b?`<span class="ct2">${pl(b,'aniversário','aniversários')}</span>`:''}</div>`;
  }
  const fri=addDays(TODAY,(5-toDate(TODAY).getDay()+7)%7),sat=addDays(fri,1),prox=[];
  for(let i=0;i<220&&prox.length<8;i++){const d=addDays(TODAY,i),n=holiday(d).split(' · ')[0];if(n&&n!=='Rosh Chodesh'&&!n.startsWith('Chol')&&!prox.some(p=>p[0]===n))prox.push([n,d])}
  return head('Calendário judaico','Datas hebraicas, festas, horários de Shabat, eventos, yahrzeits e aniversários no mesmo lugar')+
  `<div class="split split-w"><div class="card pad0"><div class="toolbar" style="padding-bottom:12px;justify-content:space-between"><div class="ct">${MESES[m-1]} de ${y}</div><div class="seg"><button type="button" data-tab="cal.m:${prevM}" aria-label="Mês anterior">${ic('prev',14)}</button><button type="button" data-tab="cal.m:${YM}">Hoje</button><button type="button" data-tab="cal.m:${nextM}" aria-label="Próximo mês">${ic('next',14)}</button></div></div>
    <div class="tw"><div class="cal cal2">${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=>`<div class="dw">${d}</div>`).join('')}${cells}</div></div></div>
  <aside class="rail">
    <div class="card"><div class="cap">Shabat desta semana</div><div class="rows"><div class="rw"><span class="grow">Acendimento das velas<small style="display:block">Sexta-feira, ${fmtDM(fri)}</small></span><b class="num">${velas(fri)}</b></div><div class="rw"><span class="grow">Havdalá<small style="display:block">Sábado, ${fmtDM(sat)}</small></span><b class="num">${havdala(sat)}</b></div></div>
      <p class="hint" style="margin-top:8px">Horários aproximados para São Paulo, calculados pelo pôr do sol. Confira com o calendário oficial da comunidade.</p></div>
    <div class="card"><div class="cap">Próximas datas</div><div class="rows">${prox.map(p=>`<div class="rw"><span class="grow"><b>${esc(p[0])}</b><small style="display:block">${HEB.txt(HEB.of(p[1]))}</small></span><span class="right num">${fmtDate(p[1])}<small style="display:block">${inDays(p[1])}</small></span></div>`).join('')}</div></div>
  </aside></div>`;
}

/* ================= Lugares e mesas ================= */
function mesasCard(e){
  if(!e.mesas)return '';const M=e.mesas,occ=Array(M.n+1).fill(0),fam=Array.from({length:M.n+1},()=>[]);
  e.regs.forEach(r=>{if(r.mesa&&r.mesa<=M.n){occ[r.mesa]+=r.q;fam[r.mesa].push(FAM.get(r.fid).nome+' ('+r.q+')')}});const sem=e.regs.filter(r=>!r.mesa).length;
  return `<div class="card mt"><div class="ch"><div class="ct">${ic('grid',16)}Lugares e mesas</div><div class="pacts"><small>${sem?pl(sem,'família sem mesa','famílias sem mesa'):'Todas as famílias têm mesa'}</small>${sem?btn('Distribuir automaticamente','zap','btn-sm',`data-act="autoMesas" data-id="${e.id}"`):''}</div></div>
    <div class="g6">${Array.from({length:M.n},(_,i)=>i+1).map(n=>`<div class="mesa ${occ[n]>=M.cap?'full':''}"><b>Mesa ${n}</b> <span class="muted num">${occ[n]}/${M.cap}</span><small>${esc(fam[n].join(', '))||'Livre'}</small></div>`).join('')}</div></div>`;
}
const mesaSel=(e,x)=>`<select class="inp" style="height:28px" aria-label="Mesa" data-on="setMesa" data-id="${e.id}" data-arg="${x.fid}"><option value="">Sem mesa</option>${Array.from({length:e.mesas.n},(_,i)=>opt(i+1,'Mesa '+(i+1),x.mesa||'')).join('')}</select>`;
A.setMesa=el=>{const e=EV.get(+el.dataset.id),r=e.regs.find(x=>x.fid===+el.dataset.arg),n=+el.value||null;
  if(n){const occ=sum(e.regs.filter(x=>x.mesa===n&&x!==r),x=>x.q);if(occ+r.q>e.mesas.cap){toast('A mesa '+n+' não tem '+pl(r.q,'lugar livre','lugares livres')+'.',1);render();return}}
  r.mesa=n;render()};
A.autoMesas=el=>{const e=EV.get(+el.dataset.id),occ=Array(e.mesas.n+1).fill(0);e.regs.forEach(r=>{if(r.mesa)occ[r.mesa]+=r.q});let n=0,left=0;
  e.regs.filter(r=>!r.mesa).sort(by(r=>r.q,-1)).forEach(r=>{for(let m=1;m<=e.mesas.n;m++)if(occ[m]+r.q<=e.mesas.cap){r.mesa=m;occ[m]+=r.q;n++;return}left++});
  render();toast(pl(n,'família colocada','famílias colocadas')+' nas mesas.'+(left?' '+left+' não couberam.':''),!n)};
A.ativarMesas=el=>{const e=EV.get(+el.dataset.id);formModal({title:'Mapa de mesas',intro:'Defina as mesas de '+esc(e.nome)+'.',fields:[
  {k:'n',label:'Número de mesas',type:'number',req:true,val:e.mesas?e.mesas.n:12,min:1,max:60,half:true},{k:'cap',label:'Lugares por mesa',type:'number',req:true,val:e.mesas?e.mesas.cap:10,min:1,max:30,half:true}],
  onSubmit(v){if(!(v.n>0&&v.cap>0))return 'Informe números maiores que zero.';e.mesas={n:Math.min(60,Math.round(v.n)),cap:Math.min(30,Math.round(v.cap))};e.regs.forEach(r=>{if(r.mesa>e.mesas.n)r.mesa=null});toast('Mapa de mesas de '+e.nome+' atualizado.')}})};

/* ================= Chai Kids e Chai Teens ================= */
function pgKids(kind){
  const isK=kind==='criancas',u=S.ui.kd,all=DB.ppl.filter(isK?isKid:isTeen),q=norm(u.q).trim(),pend=all.filter(p=>!p.aut).length;
  const list=all.filter(p=>(!u.pend||!p.aut)&&(!q||norm(p.nome+' '+famName(FAM.get(p.fid))).includes(q))).sort(by(p=>p.nasc,-1)),rows=paginate(list,u,12);
  const fx=isK?[['Até 5 anos',0,5],['6 a 8 anos',6,8],['9 a 12 anos',9,12]]:[['13 e 14 anos',13,14],['15 a 17 anos',15,17]];
  return head(isK?'Crianças':'Chai Teens',isK?'Crianças de até 12 anos, público do Chai Kids':'Jovens de 13 a 17 anos',btn('Exportar','download','',`data-act="exportKids" data-arg="${kind}"`)+btn('Nova pessoa','plus','btn-purple','data-act="novaPessoa"'))+
  `<div class="g${fx.length+2} keep2">${kpi(isK?'Crianças':'Jovens',NUM(all.length))}${fx.map(x=>kpi(x[0],NUM(all.filter(p=>{const a=age(p.nasc);return a>=x[1]&&a<=x[2]}).length))).join('')}${kpi('Autorização pendente',NUM(pend),pend?'<span class="down">pais ainda não autorizaram</span>':'todos autorizados')}</div>
  <div class="card pad0 mt"><div class="toolbar" style="padding-bottom:12px"><label class="search">${ic('search',15)}<input id="kd-q" type="search" placeholder="Buscar por nome ou família..." aria-label="Buscar" data-f="kd.q" value="${esc(u.q)}"></label><label class="chk"><input type="checkbox" id="kd-pend" data-f="kd.pend" ${u.pend?'checked':''}> Só autorização pendente</label></div>
  ${rows.length?`<div class="tw"><table class="tbl"><thead><tr><th>Nome</th><th>Família</th><th>Idade</th><th>Nascimento</th><th>Responsável</th><th>Autorização dos pais</th><th class="right">Ações</th></tr></thead><tbody>${rows.map(p=>{const f=FAM.get(p.fid),r=respOf(f);return `<tr>
    <td><div class="who">${pAv(p,'av-sm')}<button type="button" class="btn-link" style="color:var(--ink)" data-go="pessoa-${p.id}">${esc(p.nome)}</button></div></td><td><button type="button" class="btn-link" data-go="familia-${f.id}">${esc(famName(f))}</button></td>
    <td class="num">${pl(age(p.nasc),'ano','anos')}</td><td class="num">${fmtDate(p.nasc)}</td><td><div class="two"><span>${esc(r?r.nome:'')}</span><small class="num">${esc(f.tel)}</small></div></td>
    <td><button type="button" class="badge b-${p.aut?'green':'amber'} tagx" title="Clique para alterar" data-act="toggleAut" data-id="${p.id}">${ic(p.aut?'check':'clock',11)}${p.aut?'Autorizado':'Pendente'}</button></td>
    <td class="acts"><button type="button" class="ibtn" title="Falar com os pais" aria-label="Falar com os pais" data-act="wa" data-id="${f.id}">${ic('wa',15)}</button><button type="button" class="ibtn" title="Editar" aria-label="Editar" data-act="editPessoa" data-id="${p.id}">${ic('edit',15)}</button></td></tr>`}).join('')}</tbody></table></div>`:empty('Ninguém encontrado.','Ajuste a busca.')}
  ${pager(list.length,u,12,'kd',isK?'crianças':'jovens')}</div>`;
}
A.toggleAut=el=>{const p=PPL.get(+el.dataset.id);p.aut=!p.aut;render();toast('Autorização de '+p.nome+(p.aut?' confirmada.':' marcada como pendente.'))};
A.exportKids=el=>{const isK=el.dataset.arg==='criancas',rows=[['Nome','Família','Idade','Nascimento','Responsável','Telefone','Autorização']];DB.ppl.filter(isK?isKid:isTeen).forEach(p=>{const f=FAM.get(p.fid),r=respOf(f);rows.push([p.nome,famName(f),age(p.nasc),fmtDate(p.nasc),r?r.nome:'',f.tel,p.aut?'Autorizado':'Pendente'])});saveFile((isK?'chai-kids':'chai-teens')+'.csv',rows)};
A.exportYz=()=>{const rows=[['Falecido','Dia','Mês hebraico','Próxima data','Relacionamento','Família','Telefone']];yzFiltered().forEach(y=>{const f=FAM.get(y.fid);rows.push([y.nome,y.d,y.m,yzNext(y)?fmtDate(yzNext(y)):'',y.rel,famName(f),f.tel])});saveFile('yahrzeits.csv',rows)};
