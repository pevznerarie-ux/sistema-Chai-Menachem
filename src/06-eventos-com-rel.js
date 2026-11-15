/* ================= Eventos ================= */
function evFiltered(){
  const u=S.ui.ev,q=norm(u.q).trim(),T={prox:['Aberto','Lotado'],and:['Em andamento'],conc:['Concluído'],canc:['Cancelado']}[u.tab];
  return DB.ev.filter(e=>(!T||T.includes(evStatus(e)))&&(!u.tipo||e.tipo===u.tipo)&&(!q||norm(e.nome).includes(q)))
    .sort((a,b)=>{const pa=evEnd(a)<TODAY,pb=evEnd(b)<TODAY;if(pa!==pb)return pa?1:-1;return pa?(a.data<b.data?1:-1):(a.data<b.data?-1:1)});
}
const evMeter=e=>{const n=evInsc(e),p=Math.min(100,pct(n,e.vagas));return `<div class="meter ${p>=90?'m-amber':''}" title="${p}% das vagas"><i style="width:${p}%"></i></div>`};
function pgEventos(){
  const u=S.ui.ev,list=evFiltered(),rows=paginate(list,u,8),up=DB.ev.filter(e=>!e.cancel&&e.data>=TODAY).sort(by(e=>e.data));
  return head('Eventos','Gerencie os eventos da comunidade e as inscrições',btn('Novo evento','plus','btn-purple','data-act="novoEvento"'))+
  `<div class="split split-w"><div class="card pad0">
    <div class="toolbar"><label class="search">${ic('search',15)}<input id="ev-q" type="search" placeholder="Buscar por nome do evento..." aria-label="Buscar evento" data-f="ev.q" value="${esc(u.q)}"></label>
      <select class="inp" id="ev-tipo" data-f="ev.tipo" aria-label="Tipo">${opt('','Todos os tipos',u.tipo)}${EV_TIPOS.map(t=>opt(t,t,u.tipo)).join('')}</select></div>
    ${pills('ev.tab',u.tab,[['todos','Todos'],['prox','Próximos'],['and','Em andamento'],['conc','Concluídos'],['canc','Cancelados']])}
    ${rows.length?`<div class="tw"><table class="tbl"><thead><tr><th>Evento</th><th>Data</th><th>Tipo</th><th class="num">Vagas</th><th>Inscritos</th><th>Status</th><th class="right">Ações</th></tr></thead><tbody>${rows.map(e=>{const s=evStatus(e),n=evInsc(e);return `<tr class="rowlink" tabindex="0" data-go="evento-${e.id}">
      <td><b>${esc(e.nome)}</b></td><td class="num nowrap">${fmtDate(e.data)}${e.fim?`<small style="display:block">até ${fmtDate(e.fim)}</small>`:''}</td><td>${esc(e.tipo)}</td><td class="num">${NUM(e.vagas)}</td>
      <td><div style="display:flex;align-items:center;gap:8px"><b class="num">${NUM(n)}</b>${evMeter(e)}</div></td><td>${badge(s,EV_TONE[s])}</td>
      <td class="acts">${s==='Aberto'||s==='Em andamento'?`<button type="button" class="ibtn" title="Inscrever família" aria-label="Inscrever família" data-act="inscrever" data-ev="${e.id}">${ic('ticket',15)}</button>`:''}<button type="button" class="ibtn" title="Editar" aria-label="Editar" data-act="editEvento" data-id="${e.id}">${ic('edit',15)}</button><button type="button" class="ibtn" title="Ver inscritos" aria-label="Ver inscritos" data-go="evento-${e.id}">${ic('eye',15)}</button></td></tr>`}).join('')}</tbody></table></div>`:empty('Nenhum evento encontrado.','Ajuste a busca ou crie um novo evento.')}
    ${pager(list.length,u,8,'ev','eventos')}
  </div>
  <aside class="rail"><div class="card"><div class="cap">Ocupação dos próximos eventos</div><div class="rows">${up.slice(0,6).map(e=>`<button type="button" class="rw" data-go="evento-${e.id}"><span class="grow"><b>${esc(e.nome.split(' – ')[0])}</b><small style="display:block">${fmtDate(e.data)} · ${NUM(evInsc(e))} de ${NUM(e.vagas)} vagas</small><span style="display:block;margin-top:5px">${evMeter(e)}</span></span></button>`).join('')||empty('Nenhum evento marcado.')}</div></div></aside></div>
  <div class="card mt"><div class="ch"><div class="ct">Próximos eventos</div><button type="button" class="btn-link" data-tab="ev.tab:prox">Ver todos</button></div>
    <div class="g4">${up.slice(0,4).map(e=>`<button type="button" class="stat" data-go="evento-${e.id}">${dotIc(e.tipo==='Chai Kids'?'child':e.tipo==='Chai Teens'?'zap':e.tipo==='Beneficente'?'heart':'calendar',e.tipo==='Chai Kids'?'green':e.tipo==='Chai Teens'?'purple':e.tipo==='Beneficente'?'amber':'blue')}<span><span class="val">${esc(e.nome.split(' – ')[0])}</span><small>${fmtDate(e.data)}</small><small style="color:var(--green-ink);font-weight:600">${inDays(e.data).replace(/^./,c=>c.toUpperCase())}</small></span></button>`).join('')}</div></div>`;
}
function pgEvento(r){
  const e=EV.get(r.id);if(!e)return notFound();
  const s=evStatus(e),n=evInsc(e),arr=e.valor?sum(e.regs.filter(x=>x.pago),x=>x.q*e.valor):0,open=s==='Aberto'||s==='Em andamento',regs=e.regs.slice().sort(by(x=>x.em,-1));
  return `<button type="button" class="back" data-go="eventos">${ic('back',14)}Voltar para eventos</button>
  ${head(esc(e.nome),(e.fim?fmtDate(e.data)+' a '+fmtDate(e.fim):fmtDate(e.data)+' · '+inDays(e.data))+' · '+esc(e.local),(open?btn('Inscrever família','ticket','btn-green',`data-act="inscrever" data-ev="${e.id}"`):'')+btn('Editar','edit','',`data-act="editEvento" data-id="${e.id}"`)+`<button type="button" class="btn" data-menu="1" data-act="evMore" data-id="${e.id}">Mais ações${ic('down',14)}</button>`)}
  <div class="chips" style="margin:-8px 0 16px">${badge(e.tipo,'blue')}${badge(s,EV_TONE[s])}${e.valor?badge(BRL(e.valor)+' por pessoa','amber'):badge('Gratuito','gray')}</div>
  <div class="g4">${kpi('Vagas',NUM(e.vagas))}${kpi('Inscritos',NUM(n),e.pres!=null?NUM(e.pres)+' presentes':pl(Math.max(0,e.vagas-n),'vaga livre','vagas livres'))}${kpi('Ocupação',pct(n,e.vagas)+'%',evMeter(e))}${kpi(e.valor?'Arrecadado':'Valor',e.valor?BRL(arr):'Gratuito',e.valor?pl(e.regs.filter(x=>x.pago===false).length,'pagamento pendente','pagamentos pendentes'):'')}</div>
  ${mesasCard(e)}
  <div class="card pad0 mt"><div class="toolbar" style="padding-bottom:12px"><div class="ct">Famílias inscritas (${regs.length})</div></div>
    ${regs.length?`<div class="tw"><table class="tbl"><thead><tr><th>Família</th><th class="num">Pessoas</th>${e.mesas?'<th>Mesa</th>':''}<th>Pagamento</th><th>Inscrita em</th><th class="right">Ações</th></tr></thead><tbody>${regs.map(x=>{const f=FAM.get(x.fid);return `<tr><td><div class="who">${famAv(f,'av-sm')}<button type="button" class="btn-link" style="color:var(--ink)" data-go="familia-${f.id}">${esc(famName(f))}</button></div></td><td class="num">${x.q}</td>${e.mesas?`<td>${mesaSel(e,x)}</td>`:''}
      <td>${x.pago===null?'<span class="muted">Gratuito</span>':badge(x.pago?'Pago':'Pendente',x.pago?'green':'amber')}</td><td class="num">${fmtDate(x.em)}</td>
      <td class="acts">${x.pago===false?`<button type="button" class="ibtn" title="Marcar como pago" aria-label="Marcar como pago" data-act="regPago" data-id="${e.id}" data-arg="${f.id}">${ic('check',15)}</button>`:''}<button type="button" class="ibtn" title="Cancelar inscrição" aria-label="Cancelar inscrição" data-act="rmReg" data-id="${e.id}" data-arg="${f.id}">${ic('trash',15)}</button></td></tr>`}).join('')}</tbody></table></div>`:empty('Nenhuma família na lista de inscritos.',e.n0?'':'Use “Inscrever família” para adicionar.')}
    ${e.n0?`<p class="hint" style="padding:10px 16px;border-top:1px solid var(--line-2)">Este evento de exemplo tem ${NUM(e.n0)} inscrições lançadas só como total, sem lista de famílias.</p>`:''}</div>`;
}
function evForm(e){
  formModal({title:e?'Editar evento':'Novo evento',wide:true,submit:e?'Salvar':'Criar evento',fields:[
    {k:'nome',label:'Nome do evento',req:true,val:e&&e.nome,ph:'Ex.: Kidush Comunitário'},
    {k:'tipo',label:'Tipo',type:'select',opts:EV_TIPOS,val:e?e.tipo:'Comunitário',half:true},{k:'local',label:'Local',val:e?e.local:'Sede Chai Menachem',half:true},
    {k:'data',label:'Data',type:'date',req:true,val:e?e.data:addDays(TODAY,14),half:true},{k:'fim',label:'Data final (se durar mais de um dia)',type:'date',val:e?e.fim:'',half:true},
    {k:'vagas',label:'Vagas',type:'number',req:true,val:e?e.vagas:100,half:true,min:1},{k:'valor',label:'Valor por pessoa (R$)',type:'money',val:e&&e.valor?String(e.valor).replace('.',','):'',hint:'Deixe em branco se for gratuito.',half:true}],
    onSubmit(v){
      if(v.fim&&v.fim<v.data)return 'A data final vem depois da data de início.';
      if(!(v.vagas>0))return 'Informe o número de vagas.';
      if(e){const was=!!e.valor;Object.assign(e,v);if(!!e.valor!==was)e.regs.forEach(x=>x.pago=e.valor?false:null);toast('Evento atualizado.')}
      else{const ne=addEv(Object.assign({cancel:false},v));toast('Evento criado.');setTimeout(()=>go('evento-'+ne.id),0)}
    }});
}
A.novoEvento=()=>evForm(null);
A.editEvento=el=>evForm(EV.get(+el.dataset.id));
A.inscrever=el=>{
  const evs=DB.ev.filter(e=>!e.cancel&&evEnd(e)>=TODAY).sort(by(e=>e.data));
  if(!evs.length){toast('Não há eventos abertos para inscrição.',1);return}
  formModal({title:'Inscrever em evento',submit:'Inscrever',fields:[
    {k:'ev',label:'Evento',type:'select',opts:evs.map(e=>[e.id,e.nome+' — '+fmtDate(e.data)]),val:+el.dataset.ev||evs[0].id},
    {k:'fid',label:'Família',type:'family',req:true,val:+el.dataset.id||null},
    {k:'q',label:'Número de pessoas',type:'number',req:true,val:1,min:1,half:true},{k:'pago',label:'Pagamento já recebido',type:'check',half:true}],
    onSubmit(v){const e=EV.get(+v.ev),f=FAM.get(v.fid),livre=e.vagas-evInsc(e);
      if(!(v.q>0))return 'Informe o número de pessoas.';
      if(e.regs.some(x=>x.fid===f.id))return 'Esta família já está inscrita neste evento.';
      if(v.q>livre)return livre>0?'Só '+pl(livre,'vaga livre','vagas livres')+' neste evento.':'Este evento está lotado.';
      addReg(e,{fid:f.id,q:v.q,pago:e.valor?!!v.pago:null,em:TODAY});toast(famName(f)+' inscrita em '+e.nome.split(' – ')[0]+'.')}});
};
A.evMore=el=>{const e=EV.get(+el.dataset.id);openMenu(el,[{label:'Exportar inscritos',icon:'download',act:'exportEv',id:e.id},{label:e.mesas?'Ajustar mapa de mesas':'Ativar mapa de mesas',icon:'grid',act:'ativarMesas',id:e.id},'-',{label:e.cancel?'Reativar evento':'Cancelar evento',icon:'x',act:'cancelEv',id:e.id,danger:!e.cancel}])};
A.cancelEv=el=>{const e=EV.get(+el.dataset.id);confirmModal(e.cancel?'Reativar evento':'Cancelar evento',e.cancel?`Reativar <b>${esc(e.nome)}</b>? As inscrições continuam como estavam.`:`Cancelar <b>${esc(e.nome)}</b>? As inscrições ficam guardadas, mas o evento sai da lista de próximos.`,e.cancel?'Reativar':'Cancelar evento',()=>{e.cancel=!e.cancel;toast(e.cancel?'Evento cancelado.':'Evento reativado.')})};
A.regPago=el=>{const e=EV.get(+el.dataset.id),x=e.regs.find(r=>r.fid===+el.dataset.arg);if(x){x.pago=true;render();toast('Pagamento da inscrição registrado.')}};
A.rmReg=el=>{const e=EV.get(+el.dataset.id),x=e.regs.find(r=>r.fid===+el.dataset.arg),f=FAM.get(+el.dataset.arg);if(x)confirmModal('Cancelar inscrição',`Tirar <b>${esc(famName(f))}</b> da lista de <b>${esc(e.nome)}</b>?`,'Cancelar inscrição',()=>{arrDel(e.regs,x);ixDel(IX.reg,f.id,e);toast('Inscrição cancelada.')})};
A.exportEv=el=>{const e=EV.get(+el.dataset.id),rows=[['Família','Responsável','Telefone','Pessoas','Pagamento','Inscrita em']];e.regs.forEach(x=>{const f=FAM.get(x.fid);rows.push([famName(f),(respOf(f)||{}).nome||'',f.tel,x.q,x.pago===null?'Gratuito':x.pago?'Pago':'Pendente',fmtDate(x.em)])});saveFile('inscritos-'+norm(e.nome).replace(/[^a-z0-9]+/g,'-')+'.csv',rows)};

/* ================= Comunicação ================= */
function pgCom(){
  const u=S.ui.com,sent=DB.disp.filter(d=>d.st==='Enviado'),mes=sent.filter(d=>d.data.slice(0,7)===YM),env=sum(mes,d=>d.env),ent=sum(mes,d=>d.ent),resp=sum(mes,d=>d.resp);
  const disp=DB.disp.slice().sort((a,b)=>(a.st==='Enviado')-(b.st==='Enviado')||(a.data<b.data?1:-1));
  let body='';
  if(u.tab==='disparos'){
    const q=[['send','blue','Novo disparo','Criar mensagem','data-act="novoDisparo"'],['wa','green','Enviar WhatsApp','Mensagem individual','data-act="waPick"'],['layers','purple','Novo segmento','Lista de contatos','data-act="novoSeg"'],['file','amber','Novo modelo','Modelo pronto','data-act="novoModelo"'],['zap','gray','Automatização','Regras e gatilhos','data-tab="com.tab:auto"']];
    body=`<div class="split split-l"><div class="card"><div class="ct" style="margin-bottom:6px">Resumo de disparos</div><div class="cap" style="margin:8px 0 0">Este mês</div><div class="rows">
        <div class="rw"><span class="grow">Disparos</span><b class="num">${NUM(mes.length)}</b></div><div class="rw"><span class="grow">Mensagens enviadas</span><b class="num">${NUM(env)}</b></div>
        <div class="rw"><span class="grow">Entregues</span><span><b class="num">${NUM(ent)}</b> <small>(${pct(ent,env)}%)</small></span></div><div class="rw"><span class="grow">Respondidas</span><span><b class="num">${NUM(resp)}</b> <small>(${pct(resp,ent)}%)</small></span></div></div></div>
      <div class="card pad0"><div class="toolbar" style="padding-bottom:12px"><div class="ct">Últimos disparos</div></div><div class="tw"><table class="tbl"><thead><tr><th>Disparo</th><th>Data</th><th>Público</th><th>Canal</th><th class="num">Enviados</th><th class="num">Entregues</th><th class="num">Respostas</th><th>Status</th></tr></thead><tbody>${disp.map(d=>{const s=d.st==='Enviado';return `<tr>
        <td><b>${esc(d.nome)}</b></td><td class="num">${fmtDate(d.data)}</td><td>Segmento: ${esc(d.publico)}</td><td>${esc(d.canal)}</td><td class="num">${s?NUM(d.env):'<span class="muted">'+NUM(d.env)+' previstos</span>'}</td>
        <td class="num">${s?NUM(d.ent)+` <small>(${pct(d.ent,d.env)}%)</small>`:'—'}</td><td class="num">${s?NUM(d.resp)+` <small>(${pct(d.resp,d.ent)}%)</small>`:'—'}</td><td>${badge(d.st,s?'green':d.st==='Agendado'?'blue':'gray')}</td></tr>`}).join('')}</tbody></table></div></div></div>
    <div class="card mt"><div class="cap">Ações rápidas</div><div class="g5">${q.map(x=>`<button type="button" class="stat" ${x[4]}>${dotIc(x[0],x[1])}<span><span class="val">${x[2]}</span><small>${x[3]}</small></span></button>`).join('')}</div></div>`;
  }else if(u.tab==='mensagens'){
    const list=DB.ct.filter(c=>c.tipo==='wa'||c.tipo==='email').sort(by(c=>c.data,-1)).slice(0,20);
    body=`<div class="card pad0"><div class="toolbar" style="padding-bottom:12px;justify-content:space-between"><div class="ct">Mensagens individuais recentes</div>${btn('Enviar WhatsApp','wa','btn-green btn-sm','data-act="waPick"')}</div><div class="tw"><table class="tbl"><thead><tr><th>Data</th><th>Família</th><th>Canal</th><th>Mensagem</th></tr></thead><tbody>${list.map(c=>`<tr class="rowlink" tabindex="0" data-go="familia-${c.fid}" data-gtab="famTab:comunicacao"><td class="num">${fmtDate(c.data)}</td><td><b>${esc(famName(FAM.get(c.fid)))}</b></td><td>${badge(c.tipo==='wa'?'WhatsApp':'E-mail',c.tipo==='wa'?'green':'purple')}</td><td>${esc(c.det)}</td></tr>`).join('')}</tbody></table></div></div>`;
  }else if(u.tab==='segmentos'){
    body=`<div class="card pad0"><div class="toolbar" style="padding-bottom:12px;justify-content:space-between"><div class="ct">Listas / Segmentos</div>${btn('Novo segmento','plus','btn-sm','data-act="novoSeg"')}</div><div class="tw"><table class="tbl"><thead><tr><th>Segmento</th><th>Critério</th><th class="num">Famílias</th><th class="num">Contatos</th><th class="right">Ações</th></tr></thead><tbody>${allSegs().map(s=>`<tr><td><b>${esc(s.nome)}</b></td><td>${esc(s.crit)}</td><td class="num">${NUM(segFams(s).length)}</td><td class="num">${NUM(segCount(s))}</td><td class="acts"><button type="button" class="btn btn-sm" data-act="novoDisparo" data-arg="${esc(s.nome)}">${ic('send',13)}Novo disparo</button></td></tr>`).join('')}</tbody></table></div></div>`;
  }else if(u.tab==='modelos'){
    body=`<div class="pacts" style="margin-bottom:12px;justify-content:flex-end">${btn('Novo modelo','plus','','data-act="novoModelo"')}</div><div class="g3">${DB.tpl.map(t=>`<div class="card"><div class="ch"><div class="ct">${esc(t.nome)}</div>${badge(t.canal,t.canal==='WhatsApp'?'green':'purple')}</div><p style="color:var(--ink-2);white-space:pre-wrap">${esc(t.txt)}</p><div class="pacts" style="margin-top:12px">${btn('Editar','edit','btn-sm',`data-act="editModelo" data-id="${t.id}"`)}${btn('Usar em disparo','send','btn-sm',`data-act="novoDisparo" data-tpl="${t.id}"`)}</div></div>`).join('')}</div>`;
  }else if(u.tab==='forms'){
    body=comForms();
  }else{
    body=`<div class="card"><div class="ct" style="margin-bottom:4px">Automatizações</div><p class="hint" style="margin-bottom:8px">Mensagens que o sistema prepara sozinho. ${PREV?'Nesta prévia elas ficam só configuradas: nada é enviado.':'Elas começam a funcionar quando o WhatsApp Business for conectado. Por enquanto, nada é enviado sozinho.'}</p><div class="rows">${DB.auto.map(a=>`<div class="rw"><button type="button" class="switch ${a.on?'on':''}" role="switch" aria-checked="${!!a.on}" aria-label="${esc(a.nome)}" data-act="toggleAuto" data-id="${a.id}"><i></i></button><span class="grow"><b>${esc(a.nome)}</b><small style="display:block">${esc(a.quando)} · modelo “${esc(a.modelo)}”</small></span>${badge(a.on?'Ativa':'Pausada',a.on?'green':'gray')}</div>`).join('')}</div></div>`;
  }
  return head('Comunicação','Envie mensagens para contatos, grupos ou segmentos',btn('Novo disparo','plus','btn-blue','data-act="novoDisparo"'))+
    tabsU('com.tab',u.tab,[['disparos','Disparos'],['mensagens','Mensagens'],['segmentos','Listas / Segmentos'],['modelos','Modelos'],['auto','Automatizações'],['forms','Formulários']]).replace('class="utabs"','class="utabs" style="margin-top:0"')+body;
}
A.novoDisparo=el=>{
  const segs=allSegs(),t0=el.dataset.tpl?DB.tpl.find(t=>t.id===+el.dataset.tpl):null;
  formModal({title:'Novo disparo',wide:true,submit:'Salvar disparo',intro:PREV?'Nesta prévia o disparo fica salvo na lista, mas nenhuma mensagem é enviada.':'O disparo fica salvo na lista. O envio automático começa quando o WhatsApp Business for conectado.',fields:[
    {k:'nome',label:'Nome do disparo',req:true,ph:'Ex.: Convite Chanucá',half:true},{k:'canal',label:'Canal',type:'select',opts:['WhatsApp','E-mail'],val:t0?t0.canal:'WhatsApp',half:true},
    {k:'publico',label:'Público',type:'select',opts:segs.map(s=>[s.nome,s.nome+' — '+NUM(segCount(s))+' contatos']),val:el.dataset.arg||'Comunidade',half:true},
    {k:'tpl',label:'Modelo',type:'select',ph:'Escrever do zero',opts:DB.tpl.map(t=>[t.id,t.nome]),val:t0?t0.id:'',on:'dispTpl',half:true},
    {k:'assunto',label:'Assunto (só para e-mail)',ph:'Ex.: Informativo da semana'},
    {k:'txt',label:'Mensagem',type:'textarea',rows:5,req:true,val:t0?t0.txt:'',hint:'Use {nome} para o primeiro nome de cada pessoa.'},
    {k:'quando',label:'Quando enviar',type:'select',opts:[['rascunho','Deixar como rascunho'],['agendar','Agendar para uma data']],half:true},{k:'data',label:'Data do envio',type:'date',val:addDays(TODAY,1),half:true}],
    onSubmit(v){const s=segs.find(x=>x.nome===v.publico),ag=v.quando==='agendar';
      if(ag&&(!v.data||v.data<TODAY))return 'Escolha uma data de hoje em diante.';
      DB.disp.push({id:nid(),nome:v.nome,data:ag?v.data:TODAY,publico:v.publico,canal:v.canal,env:s?segCount(s):0,ent:0,resp:0,st:ag?'Agendado':'Rascunho',txt:v.txt});
      S.ui.com.tab='disparos';toast(ag?'Disparo agendado para '+fmtDate(v.data)+'. '+(PREV?'Na prévia nada é enviado.':'O envio automático começa quando o WhatsApp Business for conectado.'):'Disparo salvo como rascunho. '+(PREV?'Na prévia nada é enviado.':'O envio automático começa quando o WhatsApp Business for conectado.'),1)}});
};
A.dispTpl=el=>{const t=DB.tpl.find(x=>x.id===+el.value),ta=$('#ff-txt');if(ta)ta.value=t?t.txt:''};
A.waPick=()=>formModal({title:'Enviar WhatsApp',submit:'Continuar',fields:[{k:'fid',label:'Para qual família?',type:'family',req:true}],onSubmit(v){setTimeout(()=>openWa(v.fid),0)}});
A.novoSeg=()=>formModal({title:'Novo segmento',submit:'Criar segmento',fields:[
  {k:'nome',label:'Nome do segmento',req:true,ph:'Ex.: Sócios que frequentam aulas'},
  {k:'cat',label:'Categoria',type:'select',ph:'Todas as categorias',opts:CATS,half:true},{k:'part',label:'Participação',type:'select',ph:'Qualquer participação',opts:PART,half:true},
  {k:'mens',label:'Mensalidade',type:'select',ph:'Qualquer situação',opts:[['ok','Em dia'],['late','Atrasada'],['none','Não possui']],half:true}],
  onSubmit(v){if(allSegs().some(s=>norm(s.nome)===norm(v.nome)))return 'Já existe um segmento com este nome.';
    const crit=[v.cat&&'Categoria '+v.cat,v.part&&(PART.find(p=>p[0]===v.part)||[])[1],v.mens&&'Mensalidade '+({ok:'em dia',late:'atrasada',none:'não possui'})[v.mens]].filter(Boolean).join(' · ')||'Todas as famílias ativas';
    DB.seg.push({id:nid(),nome:v.nome,crit,cat:v.cat,part:v.part,mens:v.mens,fn:f=>f.status==='Ativo'&&(!v.cat||f.cat===v.cat)&&(!v.part||f.part[v.part])&&(!v.mens||mensStatus(f)===v.mens)});S.ui.com.tab='segmentos';toast('Segmento criado.')}});
function tplForm(t){formModal({title:t?'Editar modelo':'Novo modelo',wide:true,submit:t?'Salvar':'Criar modelo',fields:[
  {k:'nome',label:'Nome do modelo',req:true,val:t&&t.nome,half:true},{k:'canal',label:'Canal',type:'select',opts:['WhatsApp','E-mail'],val:t?t.canal:'WhatsApp',half:true},
  {k:'txt',label:'Texto',type:'textarea',rows:6,req:true,val:t&&t.txt,hint:'Campos automáticos: {nome}, {evento}, {data}, {valor}, {competencia}, {falecido}, {data_hebraica}.'}],
  onSubmit(v){if(t)Object.assign(t,v);else DB.tpl.push(Object.assign({id:nid()},v));S.ui.com.tab='modelos';toast(t?'Modelo atualizado.':'Modelo criado.')}})}
A.novoModelo=()=>tplForm(null);
A.editModelo=el=>tplForm(DB.tpl.find(t=>t.id===+el.dataset.id));
A.toggleAuto=el=>{const a=DB.auto.find(x=>x.id===+el.dataset.id);a.on=!a.on;render();toast(a.nome+(a.on?' ativada.':' pausada.'))};

/* ================= gráficos ================= */
const compact=v=>v>=1e6?(v/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mi':v>=1e3?(v/1e3).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mil':NUM(Math.round(v));
function niceMax(v){if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v))),n=v/p;return(n<=1?1:n<=2?2:n<=2.5?2.5:n<=4?4:n<=5?5:n<=8?8:10)*p}
function axis(max,W,H,L,R,T,B,money){let s='';for(let i=0;i<=4;i++){const v=max*i/4,y=T+(H-T-B)*(1-i/4);s+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="${i?'#e9edf3':'#c9d0de'}" stroke-width="1"/><text x="${L-7}" y="${y+3.5}" text-anchor="end" font-size="10.5" fill="#7f8aa3">${money&&v?'R$ ':''}${compact(v)}</text>`}
  return s+MES3.map((m,i)=>`<text x="${L+(W-L-R)*(i+.5)/12}" y="${H-8}" text-anchor="middle" font-size="10.5" fill="#7f8aa3">${m}</text>`).join('')}
function chartBars(a,b,ya,yb,money){
  const W=600,H=240,L=money?62:38,R=10,T=18,B=26,vals=a.concat(b.filter(x=>x!=null)),max=niceMax(Math.max(1,...vals)),pw=(W-L-R)/12,bw=Math.min(15,(pw-12)/2),y0=H-B,yy=v=>T+(H-T-B)*(1-v/max),f=v=>money?BRL0(v):NUM(v);
  const bar=(x,v,c)=>{if(!v)return '';const y=yy(v),r=Math.min(4,(y0-y)/2);return `<path d="M${x},${y0}V${y+r}Q${x},${y} ${x+r},${y}H${x+bw-r}Q${x+bw},${y} ${x+bw},${y+r}V${y0}Z" fill="${c}"/>`};
  let s=axis(max,W,H,L,R,T,B,money),peak=-1;b.forEach((v,i)=>{if(v!=null&&(peak<0||v>b[peak]))peak=i});
  for(let i=0;i<12;i++){const cx=L+pw*(i+.5);
    s+=bar(cx-bw-1,a[i],'var(--s1-soft)')+(b[i]!=null?bar(cx+1,b[i],'var(--s1)'):'');
    s+=`<rect x="${L+pw*i}" y="${T}" width="${pw}" height="${H-T-B}" fill="transparent" data-tip="${MESES[i]}|${ya}: ${f(a[i])}${b[i]!=null?' · '+yb+': '+f(b[i]):''}"/>`}
  if(peak>=0&&b[peak]){const cx=L+pw*(peak+.5)+1+bw/2;s+=`<text x="${Math.min(W-R-24,Math.max(L+24,cx))}" y="${yy(b[peak])-5}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#0f1a36">${money?'R$ ':''}${compact(b[peak])}</text>`}
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de colunas por mês, ${ya} e ${yb}">${s}</svg></div>`;
}
function chartLine(a,b,ya,yb){
  const W=600,H=240,L=38,R=34,T=18,B=26,vals=a.concat(b.filter(x=>x!=null)),max=niceMax(Math.max(1,...vals)),pw=(W-L-R)/12,xx=i=>L+pw*(i+.5),yy=v=>T+(H-T-B)*(1-v/max);
  const pts=arr=>arr.map((v,i)=>v==null?null:[xx(i),yy(v)]).filter(Boolean),pa=pts(a),pb=pts(b),path=p=>p.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+','+q[1].toFixed(1)).join('');
  let s=axis(max,W,H,L,R,T,B,false);
  if(pb.length>1)s+=`<path d="${path(pb)}L${pb[pb.length-1][0]},${H-B}L${pb[0][0]},${H-B}Z" fill="var(--s1)" opacity=".1"/>`;
  s+=`<path d="${path(pa)}" fill="none" stroke="var(--s1-soft)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><path d="${path(pb)}" fill="none" stroke="var(--s1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  const end=(p,c)=>p.length?`<circle cx="${p[p.length-1][0]}" cy="${p[p.length-1][1]}" r="4.5" fill="${c}" stroke="#fff" stroke-width="2"/>`:'';
  s+=end(pa,'var(--s1-soft)')+end(pb,'var(--s1)');
  if(pb.length){const q=pb[pb.length-1],lv=b.filter(x=>x!=null).pop();s+=`<text x="${q[0]+9}" y="${q[1]+(pa.length===12&&Math.abs(q[1]-pa[pb.length-1][1])<12?-8:3.5)}" font-size="10.5" font-weight="700" fill="#0f1a36">${NUM(lv)}</text>`}
  for(let i=0;i<12;i++)s+=`<rect x="${L+pw*i}" y="${T}" width="${pw}" height="${H-T-B}" fill="transparent" data-tip="${MESES[i]}|${ya}: ${NUM(a[i])}${b[i]!=null?' · '+yb+': '+NUM(b[i]):''}"/>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de linhas por mês, ${ya} e ${yb}">${s}</svg></div>`;
}
function chartDonut(parts,unit){
  const tot=sum(parts,p=>p.v)||1,r=62,C=2*Math.PI*r;let acc=0,s='';
  parts.forEach(p=>{const len=p.v/tot*C;if(p.v)s+=`<circle cx="90" cy="90" r="${r}" fill="none" stroke="${p.c}" stroke-width="24" stroke-dasharray="${Math.max(0,len-2).toFixed(2)} ${(C-Math.max(0,len-2)).toFixed(2)}" stroke-dashoffset="${(-acc).toFixed(2)}" transform="rotate(-90 90 90)" data-tip="${esc(p.l)}|${NUM(p.v)} ${unit} · ${pct(p.v,tot)}%"/>`;acc+=len});
  return `<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><svg viewBox="0 0 180 180" width="170" height="170" role="img" aria-label="Distribuição por categoria">${s}<text x="90" y="88" text-anchor="middle" font-size="24" font-weight="700" fill="#0f1a36" font-family="Figtree,system-ui,sans-serif">${NUM(tot)}</text><text x="90" y="106" text-anchor="middle" font-size="11" fill="#7f8aa3" font-family="Figtree,system-ui,sans-serif">${unit}</text></svg>
    <div class="rows" style="flex:1;min-width:150px">${parts.map(p=>`<div class="rw"><i style="width:10px;height:10px;border-radius:3px;background:${p.c};flex:none"></i><span class="grow" style="min-width:0">${esc(p.l)}</span><b class="num">${NUM(p.v)}</b><small class="num" style="width:36px;text-align:right">${pct(p.v,tot)}%</small></div>`).join('')}</div></div>`;
}
const yearTable=(a,b,ya,yb,f)=>`<div class="tw"><table class="tbl" style="min-width:300px"><thead><tr><th>Mês</th><th class="num">${ya}</th><th class="num">${yb}</th></tr></thead><tbody>${MESES.map((m,i)=>`<tr><td>${m}</td><td class="num">${f(a[i])}</td><td class="num">${b[i]==null?'—':f(b[i])}</td></tr>`).join('')}</tbody></table></div>`;
const legend2=(ya,yb)=>`<div class="legend"><span><i style="background:var(--s1-soft)"></i>${ya}</span><span><i style="background:var(--s1)"></i>${yb}</span></div>`;
const barList=(items,unit)=>{const mx=Math.max(1,...items.map(x=>x[1]));return `<div class="rows">${items.map(x=>`<div class="rw"><span style="width:44%;min-width:0">${esc(x[0])}</span><span class="grow"><div class="meter"><i style="width:${Math.round(x[1]/mx*100)}%"></i></div></span><b class="num" style="min-width:${unit?'96px':'40px'};text-align:right">${unit?BRL0(x[1]):NUM(x[1])}</b></div>`).join('')}</div>`};

/* ================= Relatórios ================= */
function relRange(){const u=S.ui.rel;if(u.per==='mes')return[YM+'-01',TODAY];if(u.per==='3m')return[addDays(TODAY,-90),TODAY];if(u.per==='ano')return[Y+'-01-01',TODAY];return[u.de||Y+'-01-01',u.ate||TODAY]}
function relData(){
  const cm=+YM.slice(5),mk=()=>Array(12).fill(0),arr={[Y-1]:mk(),[Y]:mk()},part={[Y-1]:mk(),[Y]:mk()},novos={[Y-1]:mk(),[Y]:mk()};
  const add=(o,d,v)=>{const y=+d.slice(0,4);if(o[y])o[y][+d.slice(5,7)-1]+=v};
  DB.pay.forEach(p=>{if(p.pagoEm)add(arr,p.pagoEm,p.valor)});DB.don.forEach(d=>add(arr,d.data,d.valor));
  DB.ev.forEach(e=>{if(e.pres)add(part,e.data,e.pres)});DB.fam.forEach(f=>add(novos,f.cad,1));
  const cut=a=>a.map((v,i)=>i<cm?v:null);
  return{arrA:arr[Y-1],arrB:cut(arr[Y]),partA:part[Y-1],partB:cut(part[Y]),novA:novos[Y-1],novB:cut(novos[Y])};
}
A.relDate=()=>{const u=S.ui.rel;u.de=$('#rel-de').value||u.de;u.ate=$('#rel-ate').value||u.ate;if(u.de>u.ate)[u.de,u.ate]=[u.ate,u.de];u.per='custom';render()};
function pgRel(){
  const u=S.ui.rel,[de,ate]=relRange(),D=relData(),inR=d=>d&&d>=de&&d<=ate,ya=String(Y-1),yb=String(Y),sh=d=>(+d.slice(0,4)-1)+d.slice(4);
  const before=DB.fam.filter(f=>f.cad<Y+'-01-01'),novos=DB.fam.filter(f=>inR(f.cad)).length,novosPrev=DB.fam.filter(f=>f.cad>=sh(de)&&f.cad<=sh(ate)).length;
  const pplBefore=sum(before,f=>members(f.id).length),ret=pct(before.filter(f=>f.status==='Ativo').length,before.length);
  const catParts=CATS.map((c,i)=>({l:({'Sócio':'Sócios','Frequentador':'Frequentadores','Patrocinador':'Patrocinadores','Visitante':'Visitantes'})[c],v:DB.fam.filter(f=>f.cat===c).length,c:['var(--s1)','var(--s2)','var(--s3)','var(--s4)'][i]}));
  const chartCard=(title,key,chart,table)=>`<div class="card"><div class="ch"><div class="ct">${title}</div><button type="button" class="btn-link" data-tab="rel.${key}:${u[key]==='1'?'0':'1'}">${u[key]==='1'?'Ver gráfico':'Ver tabela'}</button></div>${legend2(ya,yb)}<div style="margin-top:8px">${u[key]==='1'?table:chart}</div></div>`;
  const arrCard=()=>chartCard('Arrecadação (R$)','tb1',chartBars(D.arrA,D.arrB,ya,yb,true),yearTable(D.arrA,D.arrB,ya,yb,BRL0));
  const partCard=()=>chartCard('Participações em eventos','tb2',chartLine(D.partA,D.partB,ya,yb),yearTable(D.partA,D.partB,ya,yb,NUM));
  const catCard=`<div class="card"><div class="ct" style="margin-bottom:12px">Distribuição por categoria</div>${chartDonut(catParts,'famílias')}</div>`;
  const pays=DB.pay.filter(p=>inR(p.pagoEm)),dons=DB.don.filter(d=>inR(d.data)),group=(list,k,v)=>{const m=new Map();list.forEach(x=>m.set(k(x),(m.get(k(x))||0)+v(x)));return[...m.entries()].sort((a,b)=>b[1]-a[1])};
  let body='';
  if(u.tab==='geral'){
    body=`<div class="g4 keep2">${kpi('Famílias',NUM(DB.fam.length),delta(DB.fam.length,before.length))}${kpi('Pessoas',NUM(DB.ppl.length),delta(DB.ppl.length,pplBefore))}${kpi('Novos cadastros',NUM(novos),delta(novos,novosPrev,'vs mesmo período de '+ya)||'no período')}${kpi('Retenção',ret+'%','famílias de anos anteriores ainda ativas')}</div>
      <div class="g3 mt" style="grid-template-columns:repeat(auto-fit,minmax(380px,1fr))">${arrCard()}${partCard()}${catCard}</div>`;
  }else if(u.tab==='financeiro'){
    const over=DB.pay.filter(p=>!p.pagoEm&&p.venc<TODAY);
    body=`<div class="g4 keep2">${kpi('Arrecadado no período',BRL0(sum(pays,p=>p.valor)+sum(dons,d=>d.valor)))}${kpi('Mensalidades',BRL0(sum(pays,p=>p.valor)),pl(pays.length,'pagamento','pagamentos'))}${kpi('Doações',BRL0(sum(dons,d=>d.valor)),pl(dons.length,'doação','doações'))}${kpi('Em atraso hoje',BRL0(sum(over,p=>p.valor)),pl(new Set(over.map(p=>p.fid)).size,'família','famílias'))}</div>
      <div class="g2 mt">${arrCard()}<div class="stack"><div class="card"><div class="ct" style="margin-bottom:8px">Por forma de pagamento</div>${barList(group(pays.concat(dons),x=>x.forma,x=>x.valor),true)}</div><div class="card"><div class="ct" style="margin-bottom:8px">Doações por tipo</div>${dons.length?barList(group(dons,x=>x.tipo,x=>x.valor),true):empty('Nenhuma doação no período.')}</div></div></div>`;
  }else if(u.tab==='cadastros'){
    body=`<div class="g4 keep2">${kpi('Famílias',NUM(DB.fam.length),delta(DB.fam.length,before.length))}${kpi('Pessoas',NUM(DB.ppl.length),delta(DB.ppl.length,pplBefore))}${kpi('Novos cadastros',NUM(novos),'no período')}${kpi('Famílias inativas',NUM(DB.fam.filter(f=>f.status==='Inativo').length))}</div>
      <div class="g2 mt"><div class="card"><div class="ct" style="margin-bottom:8px">Novos cadastros por mês</div>${legend2(ya,yb)}<div style="margin-top:8px">${chartBars(D.novA,D.novB,ya,yb,false)}</div></div>
      <div class="stack">${catCard}<div class="card"><div class="ct" style="margin-bottom:8px">Como conheceram a comunidade</div>${barList(group(DB.fam.filter(f=>f.soube),f=>f.soube,()=>1))}</div></div></div>`;
  }else if(u.tab==='eventos'){
    const evs=DB.ev.filter(e=>inR(e.data)&&!e.cancel&&evEnd(e)<TODAY),tp=sum(evs,e=>e.pres||0);
    body=`<div class="g4 keep2">${kpi('Eventos realizados',NUM(evs.length),'no período')}${kpi('Participações',NUM(tp))}${kpi('Média por evento',NUM(evs.length?Math.round(tp/evs.length):0))}${kpi('Ocupação média',pct(sum(evs,e=>e.n0),sum(evs,e=>e.vagas))+'%','inscritos sobre vagas')}</div>
      <div class="g2 mt">${partCard()}<div class="card"><div class="ct" style="margin-bottom:8px">Participações por tipo de evento</div>${evs.length?barList(group(evs,e=>e.tipo,e=>e.pres||0)):empty('Nenhum evento no período.')}</div></div>`;
  }else if(u.tab==='comunicacao'){
    const ds=DB.disp.filter(d=>d.st==='Enviado'&&inR(d.data)),env=sum(ds,d=>d.env),ent=sum(ds,d=>d.ent),resp=sum(ds,d=>d.resp);
    body=`<div class="g4 keep2">${kpi('Disparos',NUM(ds.length),'no período')}${kpi('Mensagens enviadas',NUM(env))}${kpi('Taxa de entrega',pct(ent,env)+'%')}${kpi('Taxa de resposta',pct(resp,ent)+'%')}</div>
      <div class="card pad0 mt">${ds.length?`<div class="tw"><table class="tbl"><thead><tr><th>Disparo</th><th>Data</th><th>Público</th><th>Canal</th><th class="num">Enviados</th><th class="num">Entrega</th><th class="num">Resposta</th></tr></thead><tbody>${ds.slice().sort(by(d=>d.data,-1)).map(d=>`<tr><td><b>${esc(d.nome)}</b></td><td class="num">${fmtDate(d.data)}</td><td>${esc(d.publico)}</td><td>${esc(d.canal)}</td><td class="num">${NUM(d.env)}</td><td class="num">${pct(d.ent,d.env)}%</td><td class="num">${pct(d.resp,d.ent)}%</td></tr>`).join('')}</tbody></table></div>`:empty('Nenhum disparo no período.')}</div>`;
  }else{
    const act=DB.fam.filter(f=>f.status==='Ativo'),abs=act.filter(isAbsent).sort(by(f=>f.pres?f.pres.data:''));
    body=`<div class="g2"><div class="card"><div class="ct" style="margin-bottom:8px">Participação das famílias ativas</div>${barList(PART.map(p=>[p[1],act.filter(f=>f.part[p[0]]).length]))}</div>
      <div class="card pad0"><div class="toolbar" style="padding-bottom:12px;justify-content:space-between"><div class="ct">Ausentes há mais de 3 semanas (${abs.length})</div><button type="button" class="btn-link" data-go="familias" data-gtab="fl.tab:ausentes">Abrir lista</button></div>
        <div class="tw"><table class="tbl" style="min-width:320px"><thead><tr><th>Família</th><th>Última presença</th><th class="right">Ações</th></tr></thead><tbody>${abs.slice(0,8).map(f=>`<tr><td><button type="button" class="btn-link" style="color:var(--ink)" data-go="familia-${f.id}">${esc(famName(f))}</button></td><td class="num">${f.pres?fmtDate(f.pres.data)+' <small>('+ago(f.pres.data)+')</small>':'—'}</td><td class="acts"><button type="button" class="ibtn" title="Enviar WhatsApp" aria-label="Enviar WhatsApp" data-act="wa" data-id="${f.id}">${ic('wa',15)}</button></td></tr>`).join('')}</tbody></table></div></div></div>`;
  }
  const sg=(k,l)=>`<button type="button" class="${u.per===k?'on':''}" data-tab="rel.per:${k}">${l}</button>`;
  return head('Relatórios','Acompanhe os principais indicadores da comunidade',btn('Gerar relatório','file','','data-act="relGerar"')+btn('Exportar','download','','data-act="relExport"'))+
  `<div class="card"><div class="toolbar" style="margin:0"><input class="inp num" type="date" id="rel-de" aria-label="De" value="${de}" max="${TODAY}" data-on="relDate"><span class="muted">até</span><input class="inp num" type="date" id="rel-ate" aria-label="Até" value="${ate}" max="${TODAY}" data-on="relDate">
    <div class="seg">${sg('mes','Este mês')}${sg('3m','Últimos 3 meses')}${sg('ano','Este ano')}${sg('custom','Personalizado')}</div></div></div>
  ${tabsU('rel.tab',u.tab,[['geral','Visão geral'],['financeiro','Financeiro'],['cadastros','Cadastros'],['eventos','Eventos'],['comunicacao','Comunicação'],['participacao','Participação']])}${body}`;
}
function relText(){
  const [de,ate]=relRange(),inR=d=>d&&d>=de&&d<=ate,pays=DB.pay.filter(p=>inR(p.pagoEm)),dons=DB.don.filter(d=>inR(d.data)),over=DB.pay.filter(p=>!p.pagoEm&&p.venc<TODAY),evs=DB.ev.filter(e=>inR(e.data)&&!e.cancel&&evEnd(e)<TODAY);
  return ['Chai Menachem — relatório de '+fmtDate(de)+' a '+fmtDate(ate),'',
    'Cadastro: '+NUM(DB.fam.length)+' famílias e '+NUM(DB.ppl.length)+' pessoas. Novas famílias no período: '+NUM(DB.fam.filter(f=>inR(f.cad)).length)+'.',
    'Categorias: '+CATS.map(c=>c+' '+DB.fam.filter(f=>f.cat===c).length).join(', ')+'.',
    'Arrecadação: '+BRL(sum(pays,p=>p.valor)+sum(dons,d=>d.valor))+' ('+BRL(sum(pays,p=>p.valor))+' em mensalidades e '+BRL(sum(dons,d=>d.valor))+' em doações).',
    'Mensalidades em atraso hoje: '+BRL(sum(over,p=>p.valor))+' de '+pl(new Set(over.map(p=>p.fid)).size,'família','famílias')+'.',
    'Eventos realizados: '+NUM(evs.length)+', com '+NUM(sum(evs,e=>e.pres||0))+' participações.',
    'Famílias ausentes há mais de 3 semanas: '+NUM(DB.fam.filter(isAbsent).length)+'.'].join('\n');
}
A.relGerar=()=>openModal({title:'Relatório do período',wide:true,body:`<textarea class="inp" id="copy-txt" rows="10" readonly>${esc(relText())}</textarea>`,footer:`<button type="button" class="btn" data-act="closeModal">Fechar</button><button type="button" class="btn btn-green" data-act="copyTxt">${ic('copy',15)}Copiar texto</button>`});
A.relExport=()=>{const D=relData(),rows=[['Mês','Arrecadação '+(Y-1),'Arrecadação '+Y,'Participações '+(Y-1),'Participações '+Y,'Novos cadastros '+(Y-1),'Novos cadastros '+Y]];MESES.forEach((m,i)=>rows.push([m,D.arrA[i],D.arrB[i]??'',D.partA[i],D.partB[i]??'',D.novA[i],D.novB[i]??'']));saveFile('relatorio-chai-menachem-'+Y+'.csv',rows)};

/* ================= Painel e Configurações ================= */
function pgPainel(){
  const h=HEB.of(TODAY),inM=d=>d&&d.slice(0,7)===YM,recM=sum(DB.pay.filter(p=>inM(p.pagoEm)),p=>p.valor)+sum(DB.don.filter(d=>inM(d.data)),d=>d.valor);
  const up=DB.ev.filter(e=>!e.cancel&&e.data>=TODAY).sort(by(e=>e.data)),up30=up.filter(e=>diffDays(e.data,TODAY)<=30);
  const tasks=DB.ct.filter(c=>c.tipo==='tarefa'&&!c.feito).sort(by(c=>c.data)),yz=DB.yz.filter(y=>yzNext(y)).sort(by(yzNext)).slice(0,5),bd=DB.ppl.filter(p=>p.nasc&&p.nasc.slice(5)===TODAY.slice(5));
  const wd=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'][toDate(TODAY).getDay()];
  return head('Painel','Shalom, '+esc(me().nome.split(' ')[0])+'. Hoje é '+wd+', '+fmtDate(TODAY)+(h?' · '+HEB.txt(h)+' de '+h.y:''),btn('Resumo da semana','file','','data-act="resumoSemana"')+btn('Nova família','plus','btn-green','data-go="nova-familia"'))+
  `<div class="g4 keep2">${kpi('Famílias',NUM(DB.fam.length))}${kpi('Pessoas',NUM(DB.ppl.length))}${can('fin')?kpi('Recebido em '+MESES[+YM.slice(5)-1],BRL0(recM),'mensalidades e doações'):kpi('Para contatar',NUM(allNeeds().length),'famílias esperando retorno')}${kpi('Eventos nos próximos 30 dias',NUM(up30.length))}</div>
  <div class="mt">${sugCard(1)}</div>
  <div class="split split-w mt"><div class="stack">
    <div class="card"><div class="ch"><div class="ct">${ic('calendar',16)}Próximos eventos</div><button type="button" class="btn-link" data-go="eventos">Ver todos</button></div><div class="rows">${up.slice(0,5).map(e=>`<button type="button" class="rw" data-go="evento-${e.id}"><span class="grow"><b>${esc(e.nome)}</b><small style="display:block">${fmtDate(e.data)} · ${inDays(e.data)}</small></span><span class="num nowrap">${NUM(evInsc(e))} / ${NUM(e.vagas)}</span><span style="width:70px">${evMeter(e)}</span></button>`).join('')}</div></div>
    <div class="card"><div class="ch"><div class="ct">${ic('clock',16)}Follow-ups pendentes (${tasks.length})</div></div><div class="rows">${tasks.slice(0,7).map(c=>`<div class="rw">${dotIc('clock',c.data<TODAY?'red':'amber')}<span class="grow"><b>${esc(c.det)}</b><button type="button" class="btn-link" style="display:flex" data-go="familia-${c.fid}">${esc(famName(FAM.get(c.fid)))}</button></span><small class="nowrap" style="${c.data<TODAY?'color:var(--red-ink);font-weight:600':''}">${c.data<TODAY?'atrasado · '+ago(c.data):inDays(c.data)}</small><button type="button" class="ibtn" title="Concluir" aria-label="Concluir follow-up" data-act="doneTask" data-id="${c.id}">${ic('check',15)}</button></div>`).join('')||empty('Nenhum follow-up pendente.')}</div></div>
  </div><aside class="rail">${alertsCard()}
    <div class="card"><div class="ch"><div class="cap" style="margin:0">Próximos yahrzeits</div><button type="button" class="btn-link" data-go="yahrzeits">Ver todos</button></div><div class="rows">${yz.map(y=>`<button type="button" class="rw" data-go="familia-${y.fid}" data-gtab="famTab:yahrzeit">${dotIc('candle','amber')}<span class="grow"><b>${esc(y.nome)}</b><small style="display:block">${y.d} de ${esc(y.m)} · ${esc(famName(FAM.get(y.fid)))}</small></span><small class="nowrap">${inDays(yzNext(y))}</small></button>`).join('')}</div></div>
    <div class="card"><div class="ch"><div class="cap" style="margin:0">Aniversariantes de hoje</div><button type="button" class="btn-link" data-go="aniversariantes">Ver mês</button></div><div class="rows">${bd.slice(0,6).map(p=>`<button type="button" class="rw" data-go="pessoa-${p.id}">${pAv(p,'av-sm')}<span class="grow"><b>${esc(p.nome)}</b></span><small class="nowrap">${pl(Y-+p.nasc.slice(0,4),'ano','anos')}</small></button>`).join('')||'<span class="muted">Ninguém faz aniversário hoje.</span>'}</div></div>
  </aside></div>`;
}
function pgConfig(){
  const c=DB.cfg;
  return head('Configurações','Dados da comunidade e ajustes do sistema')+
  `<div class="g2"><div class="card"><div class="ch"><div class="ct">Dados da comunidade</div>${btn('Editar','edit','btn-sm','data-act="editCfg"')}</div>${kv([['Nome',esc(c.nome)],['Cidade',esc(c.cidade)],['Mensalidade padrão',BRL(c.mensPadrao)],['Dia de vencimento padrão','Dia '+c.diaPadrao]])}</div>
    <div class="card"><div class="ct" style="margin-bottom:6px">Usuários e acessos</div><div class="rows">${c.users.map(x=>`<div class="rw">${av(x.nome[0],x.papel==='Administrador'?0:1,'av-sm')}<span class="grow"><b>${esc(x.nome)}</b></span>${badge(x.papel,x.papel==='Administrador'?'blue':'purple')}</div>`).join('')}</div><p class="hint" style="margin-top:10px">Login com senha e permissões por usuário entram na versão online.</p></div>
    <div class="card"><div class="ct" style="margin-bottom:12px">Categorias de família</div><div class="chips" style="margin:0">${CATS.map(x=>`<span class="badge b-${CAT_TONE[x]}">${x} · ${NUM(DB.fam.filter(f=>f.cat===x).length)}</span>`).join('')}</div></div>
    <div class="card"><div class="ct" style="margin-bottom:12px">Formas de pagamento</div><div class="chips" style="margin:0">${FORMAS.map(x=>badge(x,'gray')).join('')}</div></div></div>`;
}
A.editCfg=()=>{const c=DB.cfg;formModal({title:'Dados da comunidade',fields:[{k:'nome',label:'Nome',req:true,val:c.nome,half:true},{k:'cidade',label:'Cidade',val:c.cidade,half:true},{k:'mensPadrao',label:'Mensalidade padrão (R$)',type:'money',req:true,val:String(c.mensPadrao).replace('.',','),half:true},{k:'diaPadrao',label:'Dia de vencimento padrão',type:'select',opts:['1','5','10','15','20','25'],val:String(c.diaPadrao),half:true}],onSubmit(v){Object.assign(c,v,{diaPadrao:+v.diaPadrao});toast('Configurações salvas.')}})};

