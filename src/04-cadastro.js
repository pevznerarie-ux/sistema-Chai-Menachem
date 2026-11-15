/* ================= Cadastro: lista de famílias ================= */
const FL_TABS=[['todos','Todos'],['socios','Sócios'],['freq','Frequentadores'],['patr','Patrocinadores'],['vis','Visitantes'],['kids','Chai Kids'],['teens','Chai Teens'],['ausentes','Ausentes']];
const FL_FN={todos:()=>true,socios:f=>f.cat==='Sócio',freq:f=>f.cat==='Frequentador',patr:f=>f.cat==='Patrocinador',vis:f=>f.cat==='Visitante',kids:f=>f.part.kids,teens:f=>f.part.teens,ausentes:isAbsent};
function famSearch(f){if(!f._s){const m=members(f.id);f._s=norm([famName(f),f.tel,f.email,f.end.bairro].concat(f.tags||[],m.map(p=>p.nome+' '+p.tel)).join(' '))+' '+[f.tel].concat(m.map(p=>p.tel)).join(' ').replace(/[^\d ]/g,'')}return f._s}
function famFiltered(){
  const u=S.ui.fl,q=norm(u.q).trim(),qd=u.q.replace(/\D/g,''),d30=addDays(TODAY,-30);
  return DB.fam.filter(f=>(FL_FN[u.tab]||FL_FN.todos)(f)&&(!u.cat||f.cat===u.cat)&&(!u.status||f.status===u.status)&&(!u.mens||mensStatus(f)===u.mens)&&(!u.part||f.part[u.part])
    &&(!u.cad||(u.cad==='ano'?+f.cad.slice(0,4)===Y:f.cad>=d30))&&(!u.tag||(f.tags||[]).includes(u.tag))&&(!q||famSearch(f).includes(q)||(qd.length>=4&&famSearch(f).includes(qd))));
}
function alertCounts(){
  return{late:DB.fam.filter(f=>mensStatus(f)==='late').length,yz:DB.yz.filter(y=>{const n=yzNext(y);return n&&diffDays(n,TODAY)<7}).length,
    aniv:DB.ppl.filter(p=>p.nasc&&p.nasc.slice(5,7)===TODAY.slice(5,7)).length,abs:DB.fam.filter(isAbsent).length};
}
function alertsCard(){
  const a=alertCounts(),row=(tone,icn,n,txt,attr)=>`<button type="button" class="rw" ${attr}>${dotIc(icn,tone)}<span class="grow"><b>${n}</b> ${txt}</span>${ic('next',13)}</button>`;
  return `<div class="card"><div class="cap">Alertas importantes</div><div class="rows">
    ${row('red','alert',a.late,a.late===1?'mensalidade vencida':'mensalidades vencidas','data-go="familias" data-act="alertLate"')}
    ${row('amber','candle',a.yz,'yahrzeits esta semana','data-go="yahrzeits" data-gtab="yz.when:semana"')}
    ${row('green','cake',a.aniv,'aniversários este mês','data-go="aniversariantes"')}
    ${row('blue','clock',a.abs,'ausentes há mais de 3 semanas','data-go="familias" data-gtab="fl.tab:ausentes"')}
  </div></div>`;
}
A.alertLate=()=>{Object.assign(S.ui.fl,{more:true,mens:'late',tab:'todos',page:1,q:'',cat:'',status:''});go('familias');render()};
A.flMore=()=>{S.ui.fl.more=!S.ui.fl.more;render()};
A.flClear=()=>{Object.assign(S.ui.fl,{q:'',cat:'',status:'',mens:'',part:'',cad:'',tag:'',tab:'todos',page:1});render()};
function pgFamilias(){
  const u=S.ui.fl,list=famFiltered(),rows=paginate(list,u,u.size);
  const res=[['users','Famílias cadastradas',DB.fam.length],['user','Pessoas cadastradas',DB.ppl.length],['star','Sócios',DB.fam.filter(f=>f.cat==='Sócio').length],['child','Crianças',DB.ppl.filter(isKid).length],['zap','Chai Teens',DB.ppl.filter(isTeen).length],['heart','Patrocinadores',DB.fam.filter(f=>f.cat==='Patrocinador').length]];
  const quick=[['plus','Nova família','data-go="nova-familia"'],['plus','Nova pessoa','data-act="novaPessoa"'],['candle','Novo yahrzeit','data-act="novoYz"'],['heart','Registrar doação','data-act="doacao"'],['ticket','Inscrever em evento','data-act="inscrever"'],['download','Exportar Excel','data-act="exportFam"'],['upload','Importar contatos','data-act="importar"']];
  return head('Famílias','Gerencie todas as famílias cadastradas na comunidade',btn('Nova família','plus','btn-green','data-go="nova-familia"')+btn('Nova pessoa','plus','btn-purple','data-act="novaPessoa"'))+
  `<div class="split"><div class="card pad0">
    <div class="toolbar">
      <label class="search">${ic('search',15)}<input id="fl-q" type="search" placeholder="Buscar por nome, telefone, email..." aria-label="Buscar família" data-f="fl.q" value="${esc(u.q)}"></label>
      <select class="inp" id="fl-cat" data-f="fl.cat" aria-label="Categoria">${opt('','Todas as categorias',u.cat)}${CATS.map(c=>opt(c,c,u.cat)).join('')}</select>
      <select class="inp" id="fl-st" data-f="fl.status" aria-label="Status">${opt('','Todos os status',u.status)}${opt('Ativo','Ativo',u.status)}${opt('Inativo','Inativo',u.status)}</select>
      <button type="button" class="btn" data-act="flMore" aria-expanded="${!!u.more}">${ic('filter',14)}Mais filtros</button>
    </div>
    ${u.more?`<div class="toolbar">
      <select class="inp" id="fl-mens" data-f="fl.mens" aria-label="Mensalidade">${opt('','Mensalidade: todas',u.mens)}${opt('ok','Em dia',u.mens)}${opt('late','Atrasada',u.mens)}${opt('none','Não possui',u.mens)}</select>
      <select class="inp" id="fl-part" data-f="fl.part" aria-label="Participação">${opt('','Participação: todas',u.part)}${PART.map(p=>opt(p[0],p[1],u.part)).join('')}</select>
      <select class="inp" id="fl-cad" data-f="fl.cad" aria-label="Data de cadastro">${opt('','Cadastro: qualquer data',u.cad)}${opt('30','Últimos 30 dias',u.cad)}${opt('ano','Este ano',u.cad)}</select>
      <select class="inp" id="fl-tag" data-f="fl.tag" aria-label="Etiqueta">${opt('','Etiqueta: todas',u.tag)}${DB.tags.map(t=>opt(t,t,u.tag)).join('')}</select>
      <button type="button" class="btn-link" data-act="flClear">Limpar filtros</button></div>`:''}
    ${pills('fl.tab',u.tab,FL_TABS)}
    <div class="tw"><table class="tbl"><thead><tr><th>Família / Responsável</th><th>Telefone</th><th>Categoria</th><th>Última presença</th><th>Mensalidade</th><th>Próximo evento</th><th class="right">Ações</th></tr></thead><tbody>
    ${rows.map(f=>{const r=respOf(f),[pa,pd]=presInfo(f),ne=nextEv(f.id);return `<tr class="rowlink" tabindex="0" data-go="familia-${f.id}">
      <td><div class="who">${famAv(f)}<div><b>${esc(famName(f))}</b><small>${esc(r?r.nome:'')}</small></div></div></td>
      <td><span class="tel num">${ic('wa',14)}${esc(f.tel)}</span></td>
      <td>${catBadge(f)}${f.status==='Inativo'?' '+badge('Inativa','red'):''}</td>
      <td><div class="two"><span>${pa}</span><small>${pd}</small></div></td>
      <td>${mensBadge(f)}</td>
      <td>${ne?`<div class="two"><span>${esc(ne.nome.split(' – ')[0])}</span><small>${fmtDate(ne.data)}</small></div>`:'<span class="muted">—</span>'}</td>
      <td class="acts"><button type="button" class="ibtn" title="Ver ficha" aria-label="Ver ficha" data-go="familia-${f.id}">${ic('eye',15)}</button><button type="button" class="ibtn" title="Editar" aria-label="Editar" data-go="editar-familia-${f.id}">${ic('edit',15)}</button><button type="button" class="ibtn" title="Mais ações" aria-label="Mais ações" data-menu="1" data-act="famMenu" data-id="${f.id}">${ic('dots',15)}</button></td></tr>`}).join('')}
    </tbody></table></div>
    ${rows.length?'':empty('Nenhuma família encontrada.','Ajuste a busca ou os filtros.')}
    ${pager(list.length,u,u.size,'fl','famílias')}
  </div>
  <aside class="rail">
    <div class="card"><div class="cap">Resumo geral</div><div class="rows">${res.map(x=>`<div class="rw"><span class="muted">${ic(x[0],15)}</span><span class="grow">${x[1]}</span><b class="num">${NUM(x[2])}</b></div>`).join('')}</div>
      <button type="button" class="btn-link" style="margin-top:10px" data-go="relatorios">Ver relatório completo ${ic('next',12)}</button></div>
    ${alertsCard()}
    <div class="card"><div class="cap">Ações rápidas</div><div class="rows">${quick.map(x=>`<button type="button" class="rw" ${x[2]}><span class="muted">${ic(x[0],15)}</span><span class="grow">${x[1]}</span></button>`).join('')}</div></div>
  </aside></div>`;
}
A.famMenu=el=>{const id=+el.dataset.id;openMenu(el,[{label:'Enviar WhatsApp',icon:'wa',act:'wa',id},{label:'Registrar doação',icon:'heart',act:'doacao',id},{label:'Inscrever em evento',icon:'ticket',act:'inscrever',id},{label:'Novo yahrzeit',icon:'candle',act:'novoYz',id},'-',{label:'Financeiro da família',icon:'wallet',go:'financeiro-'+id}])};
A.exportFam=()=>{
  const rows=[['Família','Responsável','Telefone','E-mail','Categoria','Status','Mensalidade','Valor da mensalidade','Última presença','Bairro','Data de cadastro','Membros']];
  famFiltered().forEach(f=>{const r=respOf(f),s=mensStatus(f);rows.push([famName(f),r?r.nome:'',f.tel,f.email,f.cat,f.status,s==='ok'?'Em dia':s==='late'?'Atrasada':'Não possui',f.mens.ativa?String(f.mens.valor).replace('.',','):'',f.pres?fmtDate(f.pres.data):'',f.end.bairro,fmtDate(f.cad),members(f.id).length])});
  saveFile('familias-chai-menachem.csv',rows);
};
A.importar=()=>openModal({title:'Importar contatos',body:`<p class="intro">Na versão online você envia a sua planilha (Excel ou CSV) e o sistema cria as famílias e as pessoas de uma vez.</p>${kv([['Colunas aceitas','Família, responsável, telefone, e-mail, categoria, endereço, membros'],['Duplicados','Conferidos pelo telefone antes de gravar']])}<p class="hint" style="margin-top:12px">Nesta prévia a importação está desligada: os dados aqui são só de exemplo.</p>`,footer:`<button type="button" class="btn btn-navy" data-act="closeModal">Entendi</button>`});

/* ================= ações de cadastro ================= */
function personForm(p,fid){
  formModal({title:p?'Editar pessoa':'Nova pessoa',wide:true,submit:p?'Salvar':'Cadastrar pessoa',fields:[
    !p&&{k:'fid',label:'Família',type:'family',req:true,val:fid},
    {k:'nome',label:'Nome completo',req:true,val:p&&p.nome,half:true},
    {k:'heb',label:'Nome em hebraico',val:p&&p.heb,half:true},
    {k:'papel',label:'Parentesco',type:'select',opts:PAPEIS,val:p?p.papel:'Filho',half:true},
    {k:'nasc',label:'Data de nascimento',type:'date',val:p&&p.nasc,half:true,max:TODAY},
    {k:'tel',label:'Telefone / WhatsApp',type:'tel',val:p&&p.tel,ph:'11 99999-9999',half:true},
    {k:'email',label:'E-mail',type:'email',val:p&&p.email,ph:'exemplo@email.com',half:true},
    {k:'civil',label:'Estado civil',val:p&&p.civil,half:true},
    {k:'prof',label:'Profissão',val:p&&p.prof,half:true},
    {k:'emp',label:'Empresa',val:p&&p.emp,half:true},
    {k:'nac',label:'Nacionalidade',val:p?p.nac:'Brasileira',half:true},
    {k:'obs',label:'Observações',type:'textarea',val:p&&p.obs}
  ].filter(Boolean),onSubmit(v){
    if(p){Object.assign(p,v);const f=FAM.get(p.fid);f._s=null;if(f.respId===p.id){f.tel=p.tel;f.email=p.email}toast('Pessoa atualizada.')}
    else{addPerson(Object.assign({sexo:['Mãe','Filha','Avó'].includes(v.papel)?'F':'M',fixo:'',ativo:true,grupos:[]},v));const f=FAM.get(v.fid);if(kidsOf(f.id).length)f.part.kids=true;if(teensOf(f.id).length)f.part.teens=true;toast('Pessoa cadastrada em '+famName(f)+'.')}
  }});
}
A.novaPessoa=el=>personForm(null,+el.dataset.id||null);
A.editPessoa=el=>personForm(PPL.get(+el.dataset.id));
A.doacao=el=>formModal({title:'Registrar doação',submit:'Registrar doação',fields:[
  {k:'fid',label:'Família',type:'family',req:true,val:+el.dataset.id||null},
  {k:'valor',label:'Valor (R$)',type:'money',req:true,half:true},{k:'data',label:'Data',type:'date',req:true,val:TODAY,half:true,max:TODAY},
  {k:'tipo',label:'Tipo',type:'select',opts:donTipos(),val:el.dataset.arg||'',half:true},{k:'forma',label:'Forma de pagamento',type:'select',opts:FORMAS,half:true},
  {k:'obs',label:'Observação',ph:'Opcional'}],
  onSubmit(v){const f=FAM.get(v.fid);addDon(Object.assign({pid:+el.dataset.pid||f.respId},v));toast('Doação de '+BRL(v.valor)+' registrada para '+famName(f)+'.')}});
A.tarefa=el=>formModal({title:'Adicionar tarefa / follow-up',submit:'Adicionar',fields:[
  {k:'fid',label:'Família',type:'family',req:true,val:+el.dataset.id||null},
  {k:'det',label:'O que precisa ser feito',req:true,val:el.dataset.arg||'',ph:'Ex.: ligar para confirmar presença'},{k:'data',label:'Para quando',type:'date',req:true,val:addDays(TODAY,7),half:true},{k:'resp',label:'Responsável',type:'select',opts:DB.users.map(x=>x.nome),val:me().nome,half:true}],
  onSubmit(v){addCt({fid:v.fid,tipo:'tarefa',titulo:'Follow-up',det:v.det,data:v.data,feito:false,resp:v.resp});toast('Tarefa criada para '+v.resp+': '+v.det)}});
A.contato=el=>formModal({title:'Registrar contato',submit:'Registrar',fields:[
  {k:'fid',label:'Família',type:'family',req:true,val:+el.dataset.id||null},
  {k:'tipo',label:'Tipo de contato',type:'select',opts:[['tel','Ligação'],['wa','WhatsApp'],['email','E-mail'],['reuniao','Reunião / visita'],['pres','Presença']],half:true},
  {k:'data',label:'Data',type:'date',req:true,val:TODAY,half:true,max:TODAY},{k:'det',label:'Resumo',req:true,ph:'Sobre o que foi o contato'}],
  onSubmit(v){addCt({fid:v.fid,tipo:v.tipo,titulo:CT_LABEL[v.tipo],det:v.det,data:v.data,feito:true});if(v.tipo==='pres'){const f=FAM.get(v.fid);if(!f.pres||f.pres.data<v.data)f.pres={tipo:'Evento',data:v.data}}toast('Contato registrado.')}});
A.doneTask=el=>{const c=DB.ct.find(x=>x.id===+el.dataset.id);if(c){c.feito=true;c.titulo='Follow-up concluído';c.data=TODAY;render();toast('Follow-up concluído.')}};
A.fav=el=>{const f=FAM.get(+el.dataset.id);f.fav=!f.fav;render()};
A.famMore=el=>{const id=+el.dataset.id,f=FAM.get(id);openMenu(el,[{label:'Inscrever em evento',icon:'ticket',act:'inscrever',id},{label:'Novo yahrzeit',icon:'candle',act:'novoYz',id},{label:'Registrar contato',icon:'phone',act:'contato',id},{label:'Registrar momento',icon:'heart',act:'momento',id},{label:'Link de pagamento',icon:'link',act:'payLink',id,arg:'don'},{label:'Financeiro da família',icon:'wallet',go:'financeiro-'+id},{label:'Ver a área da família',icon:'user',go:'portal-'+id},{label:'Exportar dados (LGPD)',icon:'download',act:'lgpdExport',id},'-',{label:f.status==='Ativo'?'Inativar família':'Reativar família',icon:'x',act:'inativar',id,danger:f.status==='Ativo'}])};
A.inativar=el=>{const f=FAM.get(+el.dataset.id),on=f.status==='Ativo';confirmModal(on?'Inativar família':'Reativar família',on?`${esc(famName(f))} sai das listas de envio e dos alertas. O histórico fica guardado.`:`${esc(famName(f))} volta a aparecer nas listas de envio e nos alertas.`,on?'Inativar':'Reativar',()=>{f.status=on?'Inativo':'Ativo';toast(on?'Família inativada.':'Família reativada.')})};
A.saveObs=el=>{const f=FAM.get(+el.dataset.id);f.obs=$('#obs-fam').value.trim();toast('Observações salvas.');render()};
A.saveObsP=el=>{const p=PPL.get(+el.dataset.id);p.obs=$('#obs-pes').value.trim();toast('Observações salvas.');render()};

/* ================= ficha da família ================= */
const info=(icn,lab,val)=>`<div>${ic(icn,18)}<span><span class="lab">${lab}</span><span class="val">${val||'—'}</span></span></div>`;
function famRegsTable(f){
  const regs=[];DB.ev.forEach(e=>e.regs.forEach(r=>{if(r.fid===f.id)regs.push([e,r])}));regs.sort(by(x=>x[0].data,-1));
  if(!regs.length)return empty('Nenhuma inscrição em eventos.','Use “Inscrever em evento” para adicionar.');
  return `<div class="tw"><table class="tbl"><thead><tr><th>Evento</th><th>Data</th><th class="num">Pessoas</th><th>Pagamento</th><th>Status</th></tr></thead><tbody>${regs.map(([e,r])=>`<tr class="rowlink" tabindex="0" data-go="evento-${e.id}"><td><b>${esc(e.nome)}</b></td><td class="num">${fmtDate(e.data)}</td><td class="num">${r.q}</td><td>${r.pago===null?'<span class="muted">Gratuito</span>':badge(r.pago?'Pago':'Pendente',r.pago?'green':'amber')}</td><td>${badge(evStatus(e),EV_TONE[evStatus(e)])}</td></tr>`).join('')}</tbody></table></div>`;
}
function yzTable(list,showFam){
  return `<div class="tw"><table class="tbl"><thead><tr><th>Nome do falecido</th><th>Yahrzeit</th><th>Próxima data</th><th>Relacionamento</th>${showFam?'<th>Família</th>':''}<th class="right">Ações</th></tr></thead><tbody>${list.map(y=>{const n=yzNext(y),f=FAM.get(y.fid);return `<tr>
    <td><b>${esc(y.nome)}</b></td><td>${y.d} de ${esc(y.m)}</td><td class="num">${n?fmtDate(n)+` <small>(${inDays(n)})</small>`:'—'}</td><td>${esc(y.rel)}</td>
    ${showFam?`<td><button type="button" class="btn-link" data-go="familia-${f.id}">${esc(famName(f))}</button></td>`:''}
    <td class="acts"><button type="button" class="ibtn" title="Enviar lembrete" aria-label="Enviar lembrete" data-act="yzWa" data-id="${y.id}">${ic('wa',15)}</button><button type="button" class="ibtn" title="Editar" aria-label="Editar" data-act="editYz" data-id="${y.id}">${ic('edit',15)}</button><button type="button" class="ibtn" title="Excluir" aria-label="Excluir" data-act="delYz" data-id="${y.id}">${ic('trash',15)}</button></td></tr>`}).join('')}</tbody></table></div>`;
}
function pplTable(list,showFam){
  return `<div class="tw"><table class="tbl"><thead><tr><th>Nome</th>${showFam?'<th>Família</th>':''}<th>Parentesco</th><th>Idade</th><th>Nascimento</th><th>Telefone</th><th class="right">Ações</th></tr></thead><tbody>${list.map(p=>{const a=age(p.nasc),f=FAM.get(p.fid);return `<tr class="rowlink" tabindex="0" data-go="pessoa-${p.id}">
    <td><div class="who">${pAv(p)}<div><b>${esc(p.nome)}</b>${p.heb?`<small class="${/[֐-׿]/.test(p.heb)?'heb':''}">${esc(p.heb)}</small>`:''}</div></div></td>
    ${showFam?`<td>${esc(famName(f))}</td>`:''}<td>${badge(p.papel,ROLE_TONE[p.papel])}${isKid(p)?' '+badge('Chai Kids','green'):isTeen(p)?' '+badge('Chai Teens','purple'):''}</td>
    <td class="num">${a===null?'—':pl(a,'ano','anos')}</td><td class="num">${fmtDate(p.nasc)}</td><td class="num">${esc(p.tel)||'<span class="muted">—</span>'}</td>
    <td class="acts"><button type="button" class="ibtn" title="Ver ficha" aria-label="Ver ficha" data-go="pessoa-${p.id}">${ic('eye',15)}</button><button type="button" class="ibtn" title="Editar" aria-label="Editar" data-act="editPessoa" data-id="${p.id}">${ic('edit',15)}</button></td></tr>`}).join('')}</tbody></table></div>`;
}
function finSummary(fid){
  const pays=ixOf(IX.pay,fid),dons=ixOf(IX.don,fid),proms=ixOf(IX.prom,fid),yr=x=>+x.slice(0,4)===Y;
  return{pagoAno:sum(pays.filter(p=>p.pagoEm&&yr(p.comp)),p=>p.valor),mensAno:sum(pays.filter(p=>yr(p.comp)),p=>p.valor),aberto:sum(pays.filter(p=>!p.pagoEm&&p.venc<TODAY),p=>p.valor),
    donAno:sum(dons.filter(d=>yr(d.data)),d=>d.valor),promTot:sum(proms,p=>p.total),promPend:sum(proms,p=>p.total-p.pago)};
}
function pgFamilia(r){
  const f=FAM.get(r.id);if(!f)return notFound();
  const tab=S.ui.famTab,rp=respOf(f),ms=mensStatus(f),yz=nextYz(f.id),ld=lastDon(f.id),cts=contacts(f.id),lc=cts.find(c=>c.feito),np=nextPay(f.id),[pa,pd]=presInfo(f),mem=members(f.id),id=f.id;
  const addr=[f.end.rua,f.end.comp].filter(Boolean).join(' – '),addr2=[f.end.bairro,f.end.cid?f.end.cid+' – '+f.end.uf:'',f.end.cep].filter(Boolean).join(', ');
  let body='';
  if(tab==='geral'){
    const show=cts.filter(c=>c.feito).slice(0,4).concat(cts.filter(c=>!c.feito).slice(0,2));
    body=`<div class="geral">
      <div class="card"><div class="ct" style="margin-bottom:12px">${ic('home',16)}Dados da família</div>
        ${kv([['Categoria',esc(f.cat)],['Data de cadastro',fmtDate(f.cad)],['Status',badge(f.status,f.status==='Ativo'?'green':'red')],['Origem / Indicação',esc(f.origem)],['Como conheceu',esc(f.soube)],['Aceita mensagens',[f.okWa!==false&&'WhatsApp',f.okMail!==false&&'E-mail'].filter(Boolean).join(' e ')||badge('Não aceita','red')]])}
        <div class="cap" style="margin-top:16px">Participação da família</div>
        <div class="checks">${PART.filter(p=>f.part[p[0]]).map(p=>`<span>${ic('checkc',16)}${p[1]}</span>`).join('')||'<span class="off">Nenhuma participação marcada</span>'}</div>
        <div class="cap" style="margin-top:16px">Observações internas</div><p style="color:var(--ink-2)">${esc(f.obs)||'Sem observações.'}</p></div>
      <div class="card"><div class="ch"><div class="ct">${ic('users',16)}Membros da família</div><button type="button" class="btn-link" data-tab="famTab:pessoas">Ver todos (${mem.length})</button></div>
        <div class="rows">${mem.slice(0,6).map(p=>`<button type="button" class="rw" data-go="pessoa-${p.id}">${pAv(p,'av-sm')}<span class="grow"><b>${esc(p.nome)}</b> ${badge(p.papel,ROLE_TONE[p.papel])}</span><span class="right">${p.tel?`<span class="tel num">${ic('wa',13)}${esc(p.tel)}</span>`:''}<small style="display:block">${p.email?esc(p.email):isKid(p)?'Vai ao Chai Kids':isTeen(p)?'Vai ao Chai Teens':''}</small></span></button>`).join('')}</div>
        <button type="button" class="foot-add" data-act="novaPessoa" data-id="${id}">${ic('plus',14)}Adicionar pessoa</button></div>
      <div class="card"><div class="ch"><div class="ct">${ic('chat',16)}Últimos contatos / Relacionamento</div><button type="button" class="btn-link" data-tab="famTab:comunicacao">Ver histórico completo</button></div>
        <div class="rows">${show.map(ctRow).join('')||empty('Nenhum contato registrado.')}</div>
        <button type="button" class="foot-add" data-act="tarefa" data-id="${id}">${ic('plus',14)}Adicionar tarefa / follow-up</button></div>
    </div>`;
  }else if(tab==='pessoas'||tab==='criancas'){
    const list=tab==='pessoas'?mem:mem.filter(p=>isKid(p)||isTeen(p));
    body=`<div class="card pad0"><div class="toolbar" style="padding-bottom:12px;justify-content:space-between"><div class="ct">${tab==='pessoas'?'Pessoas da família':'Crianças e jovens'} (${list.length})</div>${btn('Adicionar pessoa','plus','btn-purple btn-sm',`data-act="novaPessoa" data-id="${id}"`)}</div>${list.length?pplTable(list):empty('Nenhuma criança ou jovem nesta família.')}</div>`;
  }else if(tab==='financeiro'){
    const s=finSummary(id),hist=finHistory(id).slice(0,6);
    body=`<div class="g4">${stat('file',ms==='late'?'red':'green','Mensalidade',ms==='ok'?'Em dia':ms==='late'?'Atrasada · '+BRL(s.aberto):'Não possui',f.mens.ativa?BRL(f.mens.valor)+' por mês, dia '+f.mens.dia:'')}${stat('wallet','blue','Mensalidades pagas em '+Y,BRL(s.pagoAno))}${stat('heart','purple','Doações em '+Y,BRL(s.donAno))}${stat('clock','amber','Promessas pendentes',BRL(s.promPend),s.promTot?'de '+BRL(s.promTot)+' prometidos':'')}</div>
      <div class="card mt"><div class="ch"><div class="ct">Histórico recente</div>${btn('Abrir financeiro completo','wallet','btn-sm',`data-go="financeiro-${id}"`)}</div><div class="rows">${hist.map(h=>`<div class="rw"><small class="num nowrap">${fmtDate(h.data)}</small><span class="grow">${esc(h.txt)}</span><b class="num" style="color:var(--green-ink)">+ ${BRL(h.valor)}</b></div>`).join('')||empty('Nenhum lançamento.')}</div></div>`;
  }else if(tab==='eventos'){
    body=`<div class="card pad0"><div class="toolbar" style="padding-bottom:12px;justify-content:space-between"><div class="ct">Eventos da família</div>${btn('Inscrever em evento','ticket','btn-purple btn-sm',`data-act="inscrever" data-id="${id}"`)}</div>${famRegsTable(f)}</div>`;
  }else if(tab==='yahrzeit'){
    const list=ixOf(IX.yz,id).slice().sort(by(y=>yzNext(y)||'9'));
    body=`<div class="card pad0"><div class="toolbar" style="padding-bottom:12px;justify-content:space-between"><div class="ct">Yahrzeits da família (${list.length})</div>${btn('Novo yahrzeit','plus','btn-green btn-sm',`data-act="novoYz" data-id="${id}"`)}</div>${list.length?yzTable(list):empty('Nenhum yahrzeit cadastrado para esta família.')}</div>`;
  }else if(tab==='comunicacao'){
    body=`<div class="card"><div class="ch"><div class="ct">Histórico de contatos</div><div class="pacts">${btn('Registrar contato','phone','btn-sm',`data-act="contato" data-id="${id}"`)}${btn('Adicionar follow-up','plus','btn-sm',`data-act="tarefa" data-id="${id}"`)}</div></div><div class="rows">${cts.filter(c=>!c.feito).concat(cts.filter(c=>c.feito)).map(ctRow).join('')||empty('Nenhum contato registrado.')}</div></div>`;
  }else if(tab==='momentos'){
    body=famMomentos(f);
  }else{
    body=`<div class="card"><div class="ct" style="margin-bottom:10px">Observações internas</div><textarea class="inp" id="obs-fam" rows="6" placeholder="Informações importantes sobre esta família...">${esc(f.obs)}</textarea><div class="pacts" style="margin-top:10px">${btn('Salvar observações','check','btn-green',`data-act="saveObs" data-id="${id}"`)}</div></div>${rabCard(f)}`;
  }
  if(tab==='financeiro'&&!can('fin'))body=lockPage('O perfil '+esc(me().papel)+' não vê os dados financeiros.');
  return `<button type="button" class="back" data-go="familias">${ic('back',14)}Voltar para lista</button>
  <div class="card"><div class="prof-top">${famAv(f,'av-xl')}
    <div class="prof-id"><div class="prof-name"><h1>${esc(famName(f))}</h1><button type="button" class="star ${f.fav?'on':''}" data-act="fav" data-id="${id}" aria-pressed="${!!f.fav}" aria-label="Marcar como favorita" title="Favorita">★</button></div>
      <div class="chips">${catBadge(f)}${f.part.shabat?badge('Frequenta Shabat','purple'):''}${mensBadge(f,true)}${scBadge(f)}${f.status==='Inativo'?badge('Inativa','red'):''}</div>${tagChips(f)}</div>
    <div class="prof-acts"><div class="r">${btn('Enviar WhatsApp','wa','btn-green',`data-act="wa" data-id="${id}"`)}${btn('Registrar doação','heart','btn-navy',`data-act="doacao" data-id="${id}"`)}<button type="button" class="btn" data-menu="1" data-act="famMore" data-id="${id}">Mais ações${ic('down',14)}</button></div>
      <div class="r">${btn('Editar família','edit','',`data-go="editar-familia-${id}"`)}</div></div></div>
    <div class="info">${info('wa','Telefone / WhatsApp',`<span class="num">${esc(f.tel)}</span>`)}${info('phone','Telefone fixo',`<span class="num">${esc(f.fixo)}</span>`)}${info('mail','E-mail',esc(f.email))}${info('pin','Endereço',addr?esc(addr)+`<small style="display:block;font-weight:400">${esc(addr2)}</small>`:'')}</div>
  </div>
  <div class="g6 keep2 mt">
    ${stat('calendar','blue','Última presença',f.pres?esc(f.pres.tipo)+' '+pd:'—',f.pres?'('+ago(f.pres.data)+')':'')}
    ${stat('heart','purple','Última doação',ld?BRL(ld.valor):'—',ld?fmtDate(ld.data):'Nenhuma doação')}
    ${stat('file',ms==='late'?'red':ms==='ok'?'green':'gray','Mensalidade',ms==='ok'?'Em dia':ms==='late'?'Atrasada':'Não possui',np?'Próximo vencimento: '+fmtDM(np.venc):'')}
    ${stat('candle','amber','Próximo yahrzeit',yz?yz.d+' de '+esc(yz.m):'—',yz?fmtDate(yzNext(yz))+' ('+inDays(yzNext(yz))+')':'Nenhum cadastrado')}
    ${stat('wa','green','Último contato',lc?esc(lc.titulo):'—',lc?fmtDate(lc.data)+' ('+ago(lc.data)+')':'')}
    ${stat('users','gray','Origem / Indicação',esc(f.origem)||'—','Cadastro em '+f.cad.slice(0,4))}
  </div>
  ${tabsU('famTab',tab,[['geral','Geral'],['pessoas','Pessoas'],['criancas','Crianças'],['financeiro','Financeiro'],['eventos','Eventos'],['yahrzeit','Yahrzeit'],['momentos','Momentos'],['comunicacao','Comunicação'],['observacoes','Observações']])}
  ${body}`;
}

/* ================= nova família / editar ================= */
function newDraft(){return{id:null,nome:'',cat:'',status:'Ativo',origem:'',cad:TODAY,soube:'',rNome:'',rPar:'Pai',rTel:'',rFixo:'',rEmail:'',part:{},mensAtiva:'nao',mensValor:'',mensDia:String(DB.cfg.diaPadrao||10),mensForma:'',membros:[],end:{cep:'',rua:'',comp:'',bairro:'',cid:'São Paulo',uf:'SP'},trib:'Israel',idioma:'Português',okWa:true,okMail:true,obs:'',err:{}}}
function draftOf(f){const r=respOf(f);return{id:f.id,nome:f.nome,cat:f.cat,status:f.status,origem:f.origem,cad:f.cad,soube:f.soube,rNome:r?r.nome:'',rPar:r?r.papel:'Pai',rTel:f.tel,rFixo:f.fixo,rEmail:f.email,part:Object.assign({},f.part),mensAtiva:f.mens.ativa?'sim':'nao',mensValor:f.mens.valor?String(f.mens.valor).replace('.',','):'',mensDia:String(f.mens.dia||10),mensForma:f.mens.forma||'',membros:[],end:Object.assign({},f.end),trib:f.trib,idioma:f.idioma,okWa:f.okWa,okMail:f.okMail,obs:f.obs,err:{}}}
function dF(k,label,o){
  o=o||{};const d=S.draft,v=getPath(d,k)??'',id='d-'+k.replace(/\./g,'-'),e=d.err[k];let c;
  if(o.opts)c=`<select class="inp ${e?'bad':''}" id="${id}" data-d="${k}">${o.ph?`<option value="">${o.ph}</option>`:''}${o.opts.map(x=>opt(x,x,v)).join('')}</select>`;
  else if(o.area)c=`<textarea class="inp" id="${id}" data-d="${k}" rows="${o.area}" placeholder="${esc(o.ph||'')}">${esc(v)}</textarea>`;
  else c=`<input class="inp ${e?'bad':''}" id="${id}" data-d="${k}" type="${o.type||'text'}" value="${esc(v)}" placeholder="${esc(o.ph||'')}" ${o.im?`inputmode="${o.im}"`:''}>`;
  return `<div class="field ${o.full?'':'half'}"><label for="${id}">${label}${o.req?' <i class="req">*</i>':''}</label>${c}<span class="err">${e||''}</span></div>`;
}
function pgFamForm(){
  const d=S.draft||(S.draft=newDraft()),edit=!!d.id,tab=S.ui.nf.tab,backTo=edit?'familia-'+d.id:'familias';
  const tabs=[['dados','Dados principais'],!edit&&['membros','Membros da família'],['endereco','Endereço'],['info','Informações adicionais'],['obs','Observações']].filter(Boolean);
  let left;
  if(tab==='dados')left=`<h2 class="fsec">Dados da família</h2><div class="fgrid">
      ${dF('nome','Nome da família',{req:1,ph:'Ex. Família Cohen',full:1})}
      ${dF('cat','Categoria',{req:1,opts:CATS,ph:'Selecione...'})}${dF('status','Status',{req:1,opts:['Ativo','Inativo']})}
      ${dF('origem','Origem / Indicação',{ph:'Quem indicou a família'})}${dF('cad','Data de cadastro',{req:1,type:'date'})}
      ${dF('soube','Como ficou sabendo da comunidade?',{opts:['Indicação','Instagram','Site','Evento','Passou em frente','WhatsApp','Outro'],ph:'Selecione...'})}</div>
    <h2 class="fsec">Contato principal (responsável)</h2><div class="fgrid">
      ${dF('rNome','Nome completo',{req:1,ph:'Ex. David Cohen'})}${dF('rPar','Parentesco',{opts:PAPEIS})}
      ${dF('rTel','Telefone / WhatsApp',{req:1,ph:'11 99999-9999',type:'tel'})}${dF('rFixo','Telefone fixo',{ph:'11 3081-3080',type:'tel'})}
      ${dF('rEmail','E-mail',{ph:'exemplo@email.com',type:'email'})}</div>`;
  else if(tab==='membros')left=`<h2 class="fsec">Membros da família</h2><p class="hint" style="margin-bottom:12px">O responsável já entra como primeiro membro. Adicione aqui cônjuge, filhos e quem mais fizer parte da família.</p>
      ${d.membros.map((m,i)=>`<div class="fgrid" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr) minmax(0,1.2fr) minmax(0,1.3fr) auto;align-items:end;margin-bottom:10px">
        <div class="field half"><label for="d-membros-${i}-nome">Nome completo</label><input class="inp" id="d-membros-${i}-nome" data-d="membros.${i}.nome" value="${esc(m.nome)}"></div>
        <div class="field half"><label for="d-membros-${i}-papel">Parentesco</label><select class="inp" id="d-membros-${i}-papel" data-d="membros.${i}.papel">${PAPEIS.map(x=>opt(x,x,m.papel)).join('')}</select></div>
        <div class="field half"><label for="d-membros-${i}-nasc">Nascimento</label><input class="inp" type="date" id="d-membros-${i}-nasc" data-d="membros.${i}.nasc" value="${esc(m.nasc)}"></div>
        <div class="field half"><label for="d-membros-${i}-tel">Telefone</label><input class="inp" type="tel" id="d-membros-${i}-tel" data-d="membros.${i}.tel" value="${esc(m.tel)}"></div>
        <button type="button" class="ibtn" style="height:34px" title="Remover" aria-label="Remover membro" data-act="rmMembro" data-id="${i}">${ic('trash',15)}</button></div>`).join('')}
      ${btn('Adicionar membro','plus','','data-act="addMembro"')}`;
  else if(tab==='endereco')left=`<h2 class="fsec">Endereço</h2><div class="fgrid">${dF('end.cep','CEP',{ph:'00000-000',im:'numeric'})}${dF('end.rua','Rua e número',{ph:'Rua das Palmeiras, 123'})}${dF('end.comp','Complemento',{ph:'Apto, bloco...'})}${dF('end.bairro','Bairro')}${dF('end.cid','Cidade')}${dF('end.uf','Estado',{opts:['SP','RJ','MG','PR','RS','SC','BA','PE','DF','GO','CE','AM','PA','ES','Outro']})}</div>`;
  else if(tab==='info')left=`<h2 class="fsec">Informações adicionais</h2><div class="fgrid">${dF('trib','Cohen, Levi ou Israel',{opts:['Cohen','Levi','Israel']})}${dF('idioma','Idioma preferido',{opts:['Português','Hebraico','Inglês','Espanhol','Francês']})}
      <label class="chk field half"><input type="checkbox" id="d-okWa" data-d="okWa" ${d.okWa?'checked':''}> Aceita receber mensagens por WhatsApp</label>
      <label class="chk field half"><input type="checkbox" id="d-okMail" data-d="okMail" ${d.okMail?'checked':''}> Aceita receber e-mails</label></div>`;
  else left=`<h2 class="fsec">Observações</h2><div class="fgrid">${dF('obs','Observações internas',{area:8,ph:'Informações importantes sobre esta família...',full:1})}</div>`;
  const mens=d.mensAtiva==='sim';
  return `<button type="button" class="back" data-go="${backTo}">${ic('back',14)}${edit?'Voltar para família':'Voltar para lista'}</button>
  ${head(edit?'Editar '+esc(famName(FAM.get(d.id))):'Nova família',edit?'Atualize os dados da família':'Cadastre uma nova família na comunidade',btn('Cancelar','x','',`data-go="${backTo}"`)+btn(edit?'Salvar alterações':'Salvar família','check','btn-green','data-act="saveFam"'))}
  <div class="split split-w"><div class="card">${tabsU('nf.tab',tab,tabs).replace('class="utabs"','class="utabs" style="margin-top:0"')}${left}</div>
  <div class="rail">
    <div class="card"><div class="ct" style="margin-bottom:12px">Participação da família</div><div class="checks">${PART.map(p=>`<label class="chk"><input type="checkbox" id="d-part-${p[0]}" data-d="part.${p[0]}" ${d.part[p[0]]?'checked':''}> ${p[1]}</label>`).join('')}</div></div>
    <div class="card"><div class="ct" style="margin-bottom:12px">Mensalidade</div>
      <span class="flabel">Possui mensalidade?</span><div class="radios" style="margin:6px 0 12px"><label class="radio"><input type="radio" name="mensAtiva" id="d-mens-sim" value="sim" data-d="mensAtiva" data-rr="1" ${mens?'checked':''}> Sim</label><label class="radio"><input type="radio" name="mensAtiva" id="d-mens-nao" value="nao" data-d="mensAtiva" data-rr="1" ${mens?'':'checked'}> Não</label></div>
      ${mens?`<div class="fgrid">${dF('mensValor','Valor da mensalidade',{ph:'R$ 0,00',im:'decimal'})}${dF('mensDia','Dia de vencimento',{opts:['1','5','10','15','20','25']})}${dF('mensForma','Forma de pagamento',{opts:FORMAS,ph:'Selecione...',full:1})}</div>`:'<p class="hint">Sem cobrança mensal para esta família.</p>'}</div>
    <div class="card"><div class="ct" style="margin-bottom:10px">${edit?'Observações internas':'Observações iniciais'}</div><textarea class="inp" id="d-obs-side" data-d="obs" rows="4" placeholder="Informações importantes sobre esta família...">${esc(d.obs)}</textarea></div>
  </div></div>`;
}
A.addMembro=()=>{S.draft.membros.push({nome:'',papel:'Filho',nasc:'',tel:''});render()};
A.rmMembro=el=>{S.draft.membros.splice(+el.dataset.id,1);render()};
A.saveFam=()=>{
  const d=S.draft,e=d.err={};
  [['nome','Informe o nome da família.'],['cat','Escolha a categoria.'],['cad','Informe a data de cadastro.'],['rNome','Informe o nome do responsável.'],['rTel','Informe o telefone.']].forEach(([k,m])=>{if(!String(d[k]||'').trim())e[k]=m});
  const mens=d.mensAtiva==='sim',valor=parseMoney(d.mensValor);
  if(mens&&!valor)e.mensValor='Informe o valor.';
  if(Object.keys(e).length){if(Object.keys(e).some(k=>k!=='mensValor'))S.ui.nf.tab='dados';render();const b=$('#page .inp.bad');if(b)b.focus();toast('Preencha os campos obrigatórios.',1);return}
  if(!d.id&&!d.dupOk){const dg=d.rTel.replace(/\D/g,''),dup=dg.length>=8&&DB.fam.find(x=>x.tel.replace(/\D/g,'')===dg);if(dup){confirmModal('Família já cadastrada?','Já existe a <b>'+esc(famName(dup))+'</b> com este telefone. Cadastrar mesmo assim?','Cadastrar mesmo assim',()=>{d.dupOk=true;A.saveFam()});return}}
  const nome=d.nome.trim().replace(/^fam[ií]lia\s+/i,''),part={};PART.forEach(p=>part[p[0]]=!!d.part[p[0]]);
  const base={nome,cat:d.cat,status:d.status,cad:d.cad,origem:d.origem.trim(),soube:d.soube,tel:d.rTel.trim(),fixo:d.rFixo.trim(),email:d.rEmail.trim(),end:Object.assign({},d.end),part,trib:d.trib,idioma:d.idioma,okWa:!!d.okWa,okMail:!!d.okMail,obs:d.obs.trim()};
  const mk=(fid,nm,papel,x)=>addPerson(Object.assign({fid,nome:nm.trim(),heb:'',papel,sexo:['Mãe','Filha','Avó'].includes(papel)?'F':'M',nasc:'',civil:'',nac:'Brasileira',prof:'',emp:'',tel:'',fixo:'',email:'',obs:'',ativo:true,grupos:[]},x));
  let f;
  if(d.id){
    f=FAM.get(d.id);const had=f.mens.ativa;Object.assign(f,base);f.mens={ativa:mens,valor:mens?valor:0,dia:+d.mensDia||10,forma:d.mensForma||'PIX'};f._s=null;
    const r=respOf(f);if(r){r.nome=d.rNome.trim();r.papel=d.rPar;r.tel=f.tel;r.fixo=f.fixo;r.email=f.email}
    if(mens&&!had)firstPay(f);
    toast('Família atualizada.');
  }else{
    f=addFam(Object.assign({tags:[],ev12:0,notaRabino:'',sc0:0,fav:false,cor:SEQ%8,mens:{ativa:mens,valor:mens?valor:0,dia:+d.mensDia||10,forma:d.mensForma||'PIX'},pres:null},base),true);
    f.respId=mk(f.id,d.rNome,d.rPar,{tel:f.tel,fixo:f.fixo,email:f.email}).id;
    d.membros.filter(m=>m.nome.trim()).forEach(m=>mk(f.id,m.nome,m.papel,{nasc:m.nasc,tel:m.tel.trim()}));
    if(kidsOf(f.id).length)f.part.kids=true;if(teensOf(f.id).length)f.part.teens=true;
    if(mens)firstPay(f);
    toast(famName(f)+' cadastrada.');
  }
  S.draft=null;go('familia-'+f.id);
};
function firstPay(f){let [y,m]=YM.split('-').map(Number);if(+TODAY.slice(8)>f.mens.dia){m++;if(m>12){m=1;y++}}const comp=y+'-'+pad(m);if(!ixOf(IX.pay,f.id).some(p=>p.comp===comp))addPay({fid:f.id,comp,venc:comp+'-'+pad(f.mens.dia),valor:f.mens.valor,pagoEm:null,forma:f.mens.forma})}

/* ================= ficha da pessoa ================= */
function pgPessoa(r){
  const p=PPL.get(r.id);if(!p)return notFound();
  const f=FAM.get(p.fid),tab=S.ui.pesTab,a=age(p.nasc),id=p.id,yr=x=>+x.slice(0,4)===Y,heb=/[֐-׿]/.test(p.heb||'');
  const dons=ixOf(IX.don,f.id).filter(d=>d.pid===id),proms=ixOf(IX.prom,f.id).filter(x=>x.pid===id),s=finSummary(f.id),ms=mensStatus(f),cts=contacts(f.id).filter(c=>!c.pid||c.pid===id);
  const isAdult=a===null||a>=18;
  let body='';
  if(tab==='geral'){
    body=`<div class="pgeral">
      <div class="card"><div class="ct" style="margin-bottom:12px">Dados pessoais</div>${kv([['Nome completo',esc(p.nome)],['Nome em hebraico',p.heb?`<span class="${heb?'heb':''}">${esc(p.heb)}</span>`:''],['Data de nascimento',p.nasc?fmtDate(p.nasc)+' ('+pl(a,'ano','anos')+')':''],['Estado civil',esc(p.civil)],['Nacionalidade',esc(p.nac)],['Profissão',esc(p.prof)],['Empresa',esc(p.emp)],['Telefone / WhatsApp',`<span class="num">${esc(p.tel)}</span>`],['Telefone fixo',`<span class="num">${esc(p.fixo||f.fixo)}</span>`],['E-mail',esc(p.email)],['Observações',esc(p.obs)]])}</div>
      <div class="stack">
        <div class="card"><div class="ct" style="margin-bottom:12px">Participação</div><div class="checks">${(isAdult?PART.filter(x=>f.part[x[0]]).map(x=>x[1]+(x[0]==='kids'||x[0]==='teens'?' (pai/mãe)':'')):[isKid(p)?'Chai Kids':'Chai Teens']).map(t=>`<span>${ic('checkc',16)}${t}</span>`).join('')||'<span class="off">Nenhuma participação marcada</span>'}</div></div>
        <div class="card"><div class="ct" style="margin-bottom:12px">Grupos / Interesses</div><div class="checks">${p.grupos.map(g=>`<span>${ic('checkc',16)}${esc(g)}</span>`).join('')||'<span class="off">Nenhum grupo</span>'}</div></div>
      </div>
      <div class="card"><div class="ct" style="margin-bottom:6px">Resumo financeiro</div><div class="rows">
        <div class="rw"><span class="grow">Doações (${Y})</span><b class="num">${BRL(sum(dons.filter(d=>yr(d.data)),d=>d.valor))}</b></div>
        <div class="rw"><span class="grow">Mensalidades (${Y})<small style="display:block">da família</small></span><span class="right"><b class="num">${BRL(s.pagoAno)}</b><br>${mensBadge(f)}</span></div>
        <div class="rw"><span class="grow">Promessas</span><span class="right"><b class="num">${BRL(sum(proms,x=>x.total))}</b>${sum(proms,x=>x.total-x.pago)?`<small style="display:block;color:var(--red-ink)">${BRL(sum(proms,x=>x.total-x.pago))} pendente</small>`:''}</span></div></div>
        <button type="button" class="foot-add" data-go="financeiro-${f.id}">Ver histórico completo</button></div>
    </div>
    <div class="card mt"><div class="ch"><div class="ct">Últimos contatos</div><button type="button" class="btn-link" data-tab="pesTab:comunicacao">Ver todos os contatos</button></div>
      <div class="g4">${cts.filter(c=>c.feito).slice(0,4).map(c=>{const [icn,tone]=CT_ICON[c.tipo]||['chat','gray'];return `<div class="rw" style="border:0;padding:0">${dotIc(icn,tone)}<span class="grow"><b>${esc(c.titulo)}</b><small style="display:block">${fmtDate(c.data)} · ${ago(c.data)}</small></span></div>`}).join('')||'<span class="muted">Nenhum contato registrado.</span>'}</div></div>`;
  }else if(tab==='informacoes'){
    body=`<div class="g2"><div class="card"><div class="ct" style="margin-bottom:12px">Família</div>${kv([['Família',`<button type="button" class="btn-link" data-go="familia-${f.id}">${esc(famName(f))}</button>`],['Parentesco',esc(p.papel)],['Categoria',esc(f.cat)],['Cohen, Levi ou Israel',esc(f.trib)],['Idioma preferido',esc(f.idioma)]])}</div>
      <div class="card"><div class="ct" style="margin-bottom:12px">Endereço</div>${kv([['Rua',esc(f.end.rua)],['Complemento',esc(f.end.comp)],['Bairro',esc(f.end.bairro)],['Cidade',esc(f.end.cid+' – '+f.end.uf)],['CEP',esc(f.end.cep)]])}</div></div>`;
  }else if(tab==='financeiro'){
    body=`<div class="card pad0"><div class="toolbar" style="padding-bottom:12px;justify-content:space-between"><div class="ct">Doações de ${esc(p.nome.split(' ')[0])}</div>${btn('Registrar doação','heart','btn-navy btn-sm',`data-act="doacao" data-id="${f.id}" data-pid="${id}"`)}</div>
      ${dons.length?`<div class="tw"><table class="tbl"><thead><tr><th>Data</th><th>Tipo</th><th>Forma de pagamento</th><th class="num">Valor</th></tr></thead><tbody>${dons.slice().sort(by(d=>d.data,-1)).map(d=>`<tr><td class="num">${fmtDate(d.data)}</td><td>${esc(d.tipo)}</td><td>${esc(d.forma)}</td><td class="num"><b>${BRL(d.valor)}</b></td></tr>`).join('')}</tbody></table></div>`:empty('Nenhuma doação registrada em nome desta pessoa.')}</div>`;
  }else if(tab==='eventos'){
    body=`<div class="card pad0"><div class="toolbar" style="padding-bottom:12px"><div class="ct">Eventos da família</div></div>${famRegsTable(f)}</div>`;
  }else if(tab==='comunicacao'){
    body=`<div class="card"><div class="ch"><div class="ct">Histórico de contatos</div>${btn('Registrar contato','phone','btn-sm',`data-act="contato" data-id="${f.id}"`)}</div><div class="rows">${cts.map(ctRow).join('')||empty('Nenhum contato registrado.')}</div></div>`;
  }else if(tab==='observacoes'){
    body=`<div class="card"><div class="ct" style="margin-bottom:10px">Observações</div><textarea class="inp" id="obs-pes" rows="7" placeholder="Anotações sobre esta pessoa...">${esc(p.obs)}</textarea><div class="pacts" style="margin-top:10px">${btn('Salvar observações','check','btn-green',`data-act="saveObsP" data-id="${id}"`)}</div></div>`;
  }else body=`<div class="card">${empty('Nenhum anexo.','O envio de documentos e fotos entra na versão online.')}</div>`;
  return `<button type="button" class="back" data-go="familia-${f.id}">${ic('back',14)}Voltar para família</button>
  <div class="card"><div class="prof-top">${pAv(p,'av-xl')}
    <div class="prof-id"><div class="prof-name" style="flex-wrap:wrap"><h1>${esc(p.nome)}</h1>${badge(p.papel,ROLE_TONE[p.papel])}${badge(p.ativo?'Membro ativo':'Inativo',p.ativo?'green':'gray')}</div><div class="chips"><button type="button" class="btn-link" data-go="familia-${f.id}">${esc(famName(f))}</button></div></div>
    <div class="prof-acts"><div class="r">${p.tel?btn('Enviar WhatsApp','wa','btn-green',`data-act="wa" data-id="${f.id}" data-pid="${id}"`):''}${btn('Editar pessoa','edit','',`data-act="editPessoa" data-id="${id}"`)}</div></div></div>
    <div class="info i6">${info('wa','Telefone / WhatsApp',`<span class="num">${esc(p.tel)}</span>`)}${info('mail','E-mail',esc(p.email))}${info('cake','Data de nascimento',p.nasc?fmtDate(p.nasc)+' ('+pl(a,'ano','anos')+')':'')}${info('users','Parentesco',esc(p.papel))}${info('heart','Estado civil',esc(p.civil))}${info('file','Profissão',esc(p.prof))}</div>
  </div>
  ${tabsU('pesTab',tab,[['geral','Geral'],['informacoes','Informações'],['financeiro','Financeiro'],['eventos','Eventos'],['comunicacao','Comunicação'],['observacoes','Observações'],['anexos','Anexos']])}
  ${body}`;
}

/* ================= listas de pessoas ================= */
function pgPessoas(kind){
  const u=S.ui.pl,T={pessoas:['Pessoas','Todas as pessoas cadastradas na comunidade',()=>true,'pessoas'],criancas:['Crianças','Crianças de até 12 anos, público do Chai Kids',isKid,'crianças'],teens:['Chai Teens','Jovens de 13 a 17 anos',isTeen,'jovens']}[kind];
  const q=norm(u.q).trim(),list=DB.ppl.filter(p=>T[2](p)&&(!q||norm(p.nome+' '+p.tel+' '+p.email+' '+famName(FAM.get(p.fid))).includes(q)));
  if(kind!=='pessoas')list.sort(by(p=>p.nasc,-1));
  const rows=paginate(list,u,12);
  return head(T[0],T[1],btn('Nova pessoa','plus','btn-purple','data-act="novaPessoa"'))+
  `<div class="card pad0"><div class="toolbar" style="padding-bottom:12px"><label class="search">${ic('search',15)}<input id="pl-q" type="search" placeholder="Buscar por nome, telefone, família..." aria-label="Buscar pessoa" data-f="pl.q" value="${esc(u.q)}"></label></div>
  ${rows.length?pplTable(rows,true):empty('Nenhuma pessoa encontrada.','Ajuste a busca.')}${pager(list.length,u,12,'pl',T[3])}</div>`;
}
function pgAniv(){
  const u=S.ui.an,mes=+u.mes,md=TODAY.slice(5),wk=[];for(let i=0;i<7;i++)wk.push(addDays(TODAY,i).slice(5));
  const all=DB.ppl.filter(p=>p.nasc),list=all.filter(p=>+p.nasc.slice(5,7)===mes).sort(by(p=>p.nasc.slice(8)));
  const hoje=all.filter(p=>p.nasc.slice(5)===md).length,sem=all.filter(p=>wk.includes(p.nasc.slice(5))).length;
  return head('Aniversariantes','Aniversários das pessoas cadastradas, mês a mês',`<select class="inp" id="an-mes" data-f="an.mes" aria-label="Mês">${MESES.map((m,i)=>opt(i+1,m,mes)).join('')}</select>`)+
  `<div class="g3">${stat('cake','green','Hoje',pl(hoje,'aniversariante','aniversariantes'))}${stat('calendar','blue','Próximos 7 dias',pl(sem,'aniversariante','aniversariantes'))}${stat('users','purple',MESES[mes-1],pl(list.length,'aniversariante','aniversariantes'))}</div>
  <div class="card pad0 mt">${list.length?`<div class="tw"><table class="tbl"><thead><tr><th>Dia</th><th>Nome</th><th>Família</th><th>Completa</th><th>Telefone</th><th class="right">Ações</th></tr></thead><tbody>${list.map(p=>{const f=FAM.get(p.fid),isT=p.nasc.slice(5)===md,tgt=(p.tel?p:respOf(f))||p;return `<tr>
    <td class="num"><b>${p.nasc.slice(8)}/${p.nasc.slice(5,7)}</b>${isT?' '+badge('Hoje','green'):''}</td>
    <td><div class="who">${pAv(p,'av-sm')}<button type="button" class="btn-link" style="color:var(--ink)" data-go="pessoa-${p.id}">${esc(p.nome)}</button></div></td>
    <td><button type="button" class="btn-link" data-go="familia-${f.id}">${esc(famName(f))}</button></td><td class="num">${pl(Y-+p.nasc.slice(0,4),'ano','anos')}</td><td class="num">${esc(tgt.tel)||'—'}</td>
    <td class="acts"><button type="button" class="ibtn" title="Enviar parabéns" aria-label="Enviar parabéns" data-act="wa" data-id="${f.id}" data-pid="${tgt.id}" data-arg="Feliz aniversário">${ic('wa',15)}</button></td></tr>`}).join('')}</tbody></table></div>`:empty('Nenhum aniversariante neste mês.')}</div>`;
}
