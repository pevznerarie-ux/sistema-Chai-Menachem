/* ================= Yahrzeits ================= */
function hebMonthEnd(){const h=HEB.of(TODAY);if(!h)return TODAY;let s=TODAY;for(let i=1;i<31;i++){const d=addDays(TODAY,i);if(HEB.of(d).m!==h.m)break;s=d}return s}
function yzFiltered(when){
  const u=S.ui.yz,q=norm(u.q).trim(),end=hebMonthEnd();when=when||u.when;
  return DB.yz.filter(y=>{
    const n=yzNext(y),dd=n?diffDays(n,TODAY):9999;
    if(when==='semana'&&dd>=7)return false;
    if(when==='mes'&&!(n&&n<=end))return false;
    if(when==='30'&&dd>=30)return false;
    if(u.mes&&y.m!==u.mes)return false;
    if(u.rel&&y.rel!==u.rel)return false;
    return !q||norm(y.nome+' '+famName(FAM.get(y.fid))+' '+y.rel).includes(q);
  }).sort(by(y=>yzNext(y)||'9999'));
}
function yzCalendar(){
  const u=S.ui.yz,[y,m]=u.cal.split('-').map(Number),first=y+'-'+pad(m)+'-01',off=toDate(first).getDay(),dim=new Date(y,m,0).getDate(),weeks=Math.ceil((off+dim)/7);
  const prevM=m===1?(y-1)+'-12':y+'-'+pad(m-1),nextM=m===12?(y+1)+'-01':y+'-'+pad(m+1);
  let cells='';
  for(let i=0;i<weeks*7;i++){
    const d=addDays(first,i-off),h=HEB.of(d),list=h?DB.yz.filter(z=>HEB.same(h,z.m,z.d)):[];
    cells+=`<div class="cell ${d.slice(0,7)!==u.cal?'out':''} ${d===TODAY?'today':''}"><div class="dn"><span>${+d.slice(8)}</span><small>${h?h.d+' '+h.m:''}</small></div>${list.slice(0,3).map(z=>`<button type="button" class="ev" title="${esc(z.nome+' · '+z.rel+' · '+famName(FAM.get(z.fid)))}" data-go="familia-${z.fid}" data-gtab="famTab:yahrzeit">${esc(z.nome)}</button>`).join('')}${list.length>3?`<div class="more">+${list.length-3} mais</div>`:''}</div>`;
  }
  return `<div class="toolbar" style="padding-bottom:12px;justify-content:space-between"><div class="ct">${MESES[m-1]} de ${y}</div><div class="seg"><button type="button" data-tab="yz.cal:${prevM}" aria-label="Mês anterior">${ic('prev',14)}</button><button type="button" data-tab="yz.cal:${YM}">Hoje</button><button type="button" data-tab="yz.cal:${nextM}" aria-label="Próximo mês">${ic('next',14)}</button></div></div>
  <div class="tw"><div class="cal">${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=>`<div class="dw">${d}</div>`).join('')}${cells}</div></div>`;
}
function pgYahrzeits(){
  const u=S.ui.yz,list=yzFiltered(),rows=paginate(list,u,10),h=HEB.of(TODAY);
  const base=Object.assign({},u);u.q='';u.mes='';u.rel='';
  const cnt={semana:yzFiltered('semana').length,mes:yzFiltered('mes').length,'30':yzFiltered('30').length,todos:DB.yz.length};
  Object.assign(u,base);
  const sb=(k,lab,hint)=>`<button type="button" class="stat ${u.when===k?'on':''}" data-tab="yz.when:${k}" aria-pressed="${u.when===k}"><span><span class="lab">${lab}</span><span class="val" style="font-size:20px">${NUM(cnt[k])}</span>${hint?`<small>${hint}</small>`:''}</span></button>`;
  const prox=DB.yz.filter(y=>yzNext(y)).sort(by(yzNext)).slice(0,3);
  return head('Yahrzeits','Gerencie os yahrzeits da comunidade'+(h?' · hoje é '+HEB.txt(h)+' de '+h.y:''),btn('Exportar','download','','data-act="exportYz"')+btn('Novo yahrzeit','plus','btn-green','data-act="novoYz"'))+
  `<div class="card"><div class="toolbar" style="margin:0">
    <label class="search">${ic('search',15)}<input id="yz-q" type="search" placeholder="Buscar por nome do falecido, família..." aria-label="Buscar yahrzeit" data-f="yz.q" value="${esc(u.q)}"></label>
    <select class="inp" id="yz-mes" data-f="yz.mes" aria-label="Mês hebraico">${opt('','Todos os meses',u.mes)}${HEB.MONTHS.map(m=>opt(m,m,u.mes)).join('')}</select>
    <select class="inp" id="yz-rel" data-f="yz.rel" aria-label="Relacionamento">${opt('','Todos os relacionamentos',u.rel)}${RELS_YZ.map(r=>opt(r,r,u.rel)).join('')}</select>
    <span style="flex:1"></span>
    <div class="seg"><button type="button" class="${u.view==='lista'?'on':''}" data-tab="yz.view:lista">${ic('list',14)}Lista</button><button type="button" class="${u.view==='cal'?'on':''}" data-tab="yz.view:cal">${ic('calendar',14)}Calendário</button></div></div></div>
  <div class="g4 keep2 mt">${sb('semana','Esta semana','próximos 7 dias')}${sb('mes','Este mês',h?'até o fim de '+h.m:'')}${sb('30','Próximos 30 dias')}${sb('todos','Todos')}</div>
  <div class="card pad0 mt">${u.view==='cal'?yzCalendar():(rows.length?yzTable(rows,true):empty('Nenhum yahrzeit encontrado.','Ajuste a busca ou os filtros.'))+pager(list.length,u,10,'yz','yahrzeits')}</div>
  <div class="card mt"><div class="ch"><div class="ct">Próximos yahrzeits</div><button type="button" class="btn-link" data-act="yzAll">Ver todos</button></div>
    <div class="g3">${prox.map(y=>`<button type="button" class="stat" data-go="familia-${y.fid}" data-gtab="famTab:yahrzeit">${dotIc('candle','amber')}<span><span class="val">${esc(y.nome)}</span><small>${y.d} de ${esc(y.m)} · ${fmtDate(yzNext(y))}</small><small style="color:var(--green-ink);font-weight:600">${inDays(yzNext(y)).replace(/^./,c=>c.toUpperCase())}</small></span></button>`).join('')||'<span class="muted">Nenhum yahrzeit cadastrado.</span>'}</div></div>`;
}
A.yzAll=()=>{Object.assign(S.ui.yz,{q:'',mes:'',rel:'',when:'todos',view:'lista',page:1});render()};
function yzForm(y,fid){
  buildFamLabels();const fam=FAM.get(y?y.fid:fid);
  openModal({title:y?'Editar yahrzeit':'Novo yahrzeit',wide:true,body:`<div class="fgrid">
    <div class="field half"><label for="yz-nome">Nome do falecido <i class="req">*</i></label><input class="inp" id="yz-nome" placeholder="Ex. Rachel bat Sarah" value="${esc(y?y.nome:'')}"><span class="err" id="yz-nome-e"></span></div>
    <div class="field half"><label for="yz-relf">Relacionamento</label><select class="inp" id="yz-relf">${RELS_YZ.map(r=>opt(r,r,y?y.rel:'Pai')).join('')}</select></div>
    <div class="field"><label for="yz-fam">Família <i class="req">*</i></label><input class="inp" id="yz-fam" list="dl-fam" autocomplete="off" placeholder="Digite o nome da família" value="${esc(fam?fam._lab:'')}"><span class="err" id="yz-fam-e"></span></div>
    <div class="field half"><label for="yz-greg">Data do falecimento (calendário civil)</label><input class="inp" type="date" id="yz-greg" data-on="yzCalc" max="${TODAY}" ${HEB.ok?'':'disabled'}>
      <label class="chk" style="margin-top:4px"><input type="checkbox" id="yz-noite" data-on="yzCalc"> Faleceu depois do pôr do sol</label><span class="hint">Preencha para calcular a data hebraica.</span></div>
    <div class="field half"><span class="flabel">Data hebraica <i class="req">*</i></span><div style="display:flex;gap:8px"><select class="inp" id="yz-d" aria-label="Dia" data-on="yzPrev">${Array.from({length:30},(_,i)=>opt(i+1,i+1,y?y.d:1)).join('')}</select><select class="inp" id="yz-m" aria-label="Mês hebraico" style="flex:1" data-on="yzPrev">${HEB.MONTHS.map(m=>opt(m,m,y?y.m:'Tishrei')).join('')}</select></div><span class="hint" id="yz-prev"></span></div>
    <div class="field"><label for="yz-obs">Observações</label><input class="inp" id="yz-obs" value="${esc(y?y.obs:'')}" placeholder="Opcional"></div>
  </div><datalist id="dl-fam">${DB.fam.map(f=>`<option value="${esc(f._lab)}"></option>`).join('')}</datalist>`,
  footer:`<button type="button" class="btn" data-act="closeModal">Cancelar</button><button type="submit" class="btn btn-green">${y?'Salvar':'Cadastrar yahrzeit'}</button>`,
  onSubmit(){
    const nome=$('#yz-nome').value.trim(),f=famFromLabel($('#yz-fam').value);
    $('#yz-nome-e').textContent=nome?'':'Informe o nome.';$('#yz-fam-e').textContent=f?'':'Escolha uma família da lista.';
    $('#yz-nome').classList.toggle('bad',!nome);$('#yz-fam').classList.toggle('bad',!f);
    if(!nome||!f){(nome?$('#yz-fam'):$('#yz-nome')).focus();return}
    const v={nome,fid:f,rel:$('#yz-relf').value,d:+$('#yz-d').value,m:$('#yz-m').value,obs:$('#yz-obs').value.trim()};
    if(y){if(y.fid!==f){ixDel(IX.yz,y.fid,y);ixAdd(IX.yz,f,y)}Object.assign(y,v);y._n=undefined;toast('Yahrzeit atualizado.')}
    else{addYz(v);toast('Yahrzeit cadastrado.')}
    closeModal();render();
  }});
  A.yzPrev();
}
A.yzCalc=()=>{const g=$('#yz-greg').value;if(!g||!HEB.ok)return;const h=HEB.of($('#yz-noite').checked?addDays(g,1):g);$('#yz-d').value=h.d;$('#yz-m').value=h.m;A.yzPrev()};
A.yzPrev=()=>{const el=$('#yz-prev');if(!el)return;const n=HEB.next($('#yz-m').value,+$('#yz-d').value);el.textContent=n?'Próximo yahrzeit: '+fmtDate(n)+' ('+inDays(n)+')':''};
A.novoYz=el=>yzForm(null,+el.dataset.id||null);
A.editYz=el=>yzForm(DB.yz.find(y=>y.id===+el.dataset.id));
A.delYz=el=>{const y=DB.yz.find(x=>x.id===+el.dataset.id);if(y)confirmModal('Excluir yahrzeit',`Excluir o yahrzeit de <b>${esc(y.nome)}</b>? Os lembretes desta data deixam de ser enviados.`,'Excluir',()=>{arrDel(DB.yz,y);ixDel(IX.yz,y.fid,y);toast('Yahrzeit excluído.')})};
A.yzWa=el=>{const y=DB.yz.find(x=>x.id===+el.dataset.id),n=yzNext(y);openWa(y.fid,null,{tpl:'Lembrete de yahrzeit',vars:{falecido:y.nome,data_hebraica:y.d+' de '+y.m,data:n?fmtDate(n):''}})};

/* ================= Financeiro da família ================= */
function finHistory(fid){
  const h=[];
  ixOf(IX.pay,fid).forEach(p=>{if(p.pagoEm)h.push({data:p.pagoEm,txt:'Pagamento mensalidade '+compTxt(p.comp),valor:p.valor,forma:p.forma,tipo:'Mensalidade'})});
  ixOf(IX.don,fid).forEach(d=>h.push({data:d.data,txt:d.tipo,valor:d.valor,forma:d.forma,tipo:'Doação'}));
  ixOf(IX.reg,fid).forEach(e=>{if(e.valor)e.regs.forEach(r=>{if(r.fid===fid&&r.pago&&!r._h){h.push({data:r.em,txt:'Pagamento evento '+e.nome.split(' – ')[0],valor:e.valor*r.q,forma:'—',tipo:'Evento'})}})});
  return h.filter((x,i,a)=>a.findIndex(y=>y.data===x.data&&y.txt===x.txt&&y.valor===x.valor)===i).sort(by(x=>x.data,-1));
}
function pgFinFam(id){
  const f=FAM.get(id);if(!f)return notFound();
  const tab=S.ui.finTab,pays=ixOf(IX.pay,id),dons=ixOf(IX.don,id).slice().sort(by(d=>d.data,-1)),proms=ixOf(IX.prom,id),s=finSummary(id),hist=finHistory(id),np=nextPay(id),yr=x=>+x.slice(0,4)===Y;
  const years=[...new Set(pays.map(p=>p.comp.slice(0,4)).concat(String(Y)))].sort().reverse();
  if(!years.includes(S.ui.finAno))S.ui.finAno=years[0];
  const ano=S.ui.finAno,st=S.ui.finSt,evPago=sum(hist.filter(h=>h.tipo==='Evento'&&yr(h.data)),h=>h.valor),totAno=s.pagoAno+s.donAno+evPago;
  const histCard=n=>`<div class="card"><div class="ct" style="margin-bottom:6px">Histórico recente</div><div class="rows">${hist.slice(0,n).map(h=>`<div class="rw"><small class="num nowrap">${fmtDate(h.data)}</small><span class="grow">${esc(h.txt)}</span><b class="num nowrap" style="color:var(--green-ink)">+ ${BRL(h.valor)}</b></div>`).join('')||empty('Nenhum lançamento.')}</div><button type="button" class="foot-add" data-tab="finTab:historico">Ver histórico completo</button></div>`;
  const outros=`<div class="card"><div class="ct" style="margin-bottom:12px">Outros recebimentos</div><div class="g4 keep2">
    <div><small>Doações (${Y})</small><div style="font-weight:700;font-size:15px" class="num">${BRL(s.donAno)}</div><button type="button" class="btn-link" data-tab="finTab:doacoes">Ver detalhes</button></div>
    <div><small>Promessas</small><div style="font-weight:700;font-size:15px" class="num">${BRL(s.promTot)}</div>${s.promPend?`<small style="color:var(--red-ink);display:block">${BRL(s.promPend)} pendente</small>`:''}<button type="button" class="btn-link" data-tab="finTab:promessas">Ver detalhes</button></div>
    <div><small>Eventos pagos (${Y})</small><div style="font-weight:700;font-size:15px" class="num">${BRL(evPago)}</div><button type="button" class="btn-link" data-tab="finTab:historico">Ver detalhes</button></div>
    <div><small>Total arrecadado (${Y})</small><div style="font-weight:700;font-size:15px" class="num">${BRL(totAno)}</div><button type="button" class="btn-link" data-go="relatorios">Ver relatório completo</button></div></div></div>`;
  let body='';
  if(tab==='mensalidades'){
    const list=pays.filter(p=>p.comp.slice(0,4)===ano&&(!st||payStatus(p)===st)).sort(by(p=>p.comp,-1)),all=pays.filter(p=>p.comp.slice(0,4)===ano);
    body=`<div class="split split-w"><div class="card pad0">
      <div class="toolbar" style="padding-bottom:12px"><div class="ct">Mensalidades</div><span style="flex:1"></span>
        <select class="inp" id="fin-ano" data-f="finAno" aria-label="Ano">${years.map(y=>opt(y,y,ano)).join('')}</select>
        <select class="inp" id="fin-st" data-f="finSt" aria-label="Status">${opt('','Todos',st)}${['Pago','Aberto','Atrasado'].map(x=>opt(x,x,st)).join('')}</select>
        ${btn('Gerar mensalidades','plus','btn-blue',`data-act="gerarMens" data-id="${id}"`)}</div>
      ${list.length?`<div class="tw"><table class="tbl"><thead><tr><th>Mês / Competência</th><th>Vencimento</th><th class="num">Valor</th><th>Status</th><th>Pago em</th><th>Forma de pagamento</th><th class="right">Ações</th></tr></thead><tbody>${list.map(p=>`<tr>
        <td><b>${compTxt(p.comp)}</b></td><td class="num">${fmtDate(p.venc)}</td><td class="num">${BRL(p.valor)}</td><td>${payBadge(p)}</td><td class="num">${p.pagoEm?fmtDate(p.pagoEm):'<span class="muted">—</span>'}</td><td>${p.pagoEm?esc(p.forma):'<span class="muted">—</span>'}</td>
        <td class="acts">${p.pagoEm?`<button type="button" class="ibtn" title="Ver recibo" aria-label="Ver recibo" data-act="recibo" data-id="${id}" data-arg="pay:${p.id}">${ic('receipt',15)}</button>`:`<button type="button" class="ibtn" title="Link de pagamento" aria-label="Link de pagamento" data-act="payLink" data-id="${id}" data-arg="pay:${p.id}">${ic('link',15)}</button><button type="button" class="ibtn" title="Dar baixa (marcar como paga)" aria-label="Dar baixa" data-act="baixa" data-id="${p.id}">${ic('check',15)}</button>`}<button type="button" class="ibtn" title="Editar" aria-label="Editar" data-act="editPay" data-id="${p.id}">${ic('edit',15)}</button></td></tr>`).join('')}</tbody></table></div>`
        :empty(f.mens.ativa||pays.length?'Nenhuma mensalidade com este filtro.':'Esta família não possui mensalidade.','Use “Gerar mensalidades” para criar as cobranças do ano.')}
    </div>
    <div class="card"><div class="ct" style="margin-bottom:6px">Resumo ${ano}</div><div class="rows">
      <div class="rw"><span class="grow">Total mensalidades</span><b class="num" style="color:var(--green-ink)">${BRL(sum(all,p=>p.valor))}</b></div>
      <div class="rw"><span class="grow">Total pago</span><b class="num" style="color:var(--green-ink)">${BRL(sum(all.filter(p=>p.pagoEm),p=>p.valor))}</b></div>
      <div class="rw"><span class="grow">Total em aberto</span><b class="num" style="${all.some(p=>!p.pagoEm&&p.venc<TODAY)?'color:var(--red-ink)':''}">${BRL(sum(all.filter(p=>!p.pagoEm),p=>p.valor))}</b></div>
      <div class="rw"><span class="grow">Próximo vencimento</span><b class="num">${np?fmtDate(np.venc):'—'}</b></div>
      <div class="rw"><span class="grow">Valor</span><b class="num">${f.mens.ativa?BRL(f.mens.valor):'—'}</b></div></div></div></div>
    <div class="g2 mt">${outros}${histCard(4)}</div>`;
  }else if(tab==='resumo'){
    const ms=mensStatus(f);
    body=`<div class="g4">${stat('file',ms==='late'?'red':'green','Mensalidade',ms==='ok'?'Em dia':ms==='late'?'Atrasada · '+BRL(s.aberto):'Não possui',f.mens.ativa?BRL(f.mens.valor)+' por mês, dia '+f.mens.dia:'')}${stat('wallet','blue','Mensalidades pagas em '+Y,BRL(s.pagoAno))}${stat('heart','purple','Doações em '+Y,BRL(s.donAno))}${stat('clock','amber','Promessas pendentes',BRL(s.promPend),s.promTot?'de '+BRL(s.promTot)+' prometidos':'')}</div><div class="g2 mt">${outros}${histCard(6)}</div>`;
  }else if(tab==='doacoes'){
    body=`<div class="card pad0"><div class="toolbar" style="padding-bottom:12px;justify-content:space-between"><div class="ct">Doações (${dons.length})</div>${btn('Registrar doação','heart','btn-navy btn-sm',`data-act="doacao" data-id="${id}"`)}</div>
      ${dons.length?`<div class="tw"><table class="tbl"><thead><tr><th>Data</th><th>Tipo</th><th>Doador</th><th>Forma de pagamento</th><th class="num">Valor</th></tr></thead><tbody>${dons.map(d=>`<tr><td class="num">${fmtDate(d.data)}</td><td>${esc(d.tipo)}</td><td>${esc((PPL.get(d.pid)||{}).nome||'—')}</td><td>${esc(d.forma)}</td><td class="num"><b>${BRL(d.valor)}</b></td></tr>`).join('')}</tbody></table></div>`:empty('Nenhuma doação registrada.')}</div>`;
  }else if(tab==='promessas'){
    body=`<div class="card pad0"><div class="toolbar" style="padding-bottom:12px;justify-content:space-between"><div class="ct">Promessas (${proms.length})</div>${btn('Nova promessa','plus','btn-sm',`data-act="novaProm" data-id="${id}"`)}</div>
      ${proms.length?`<div class="tw"><table class="tbl"><thead><tr><th>Promessa</th><th>Quem prometeu</th><th>Data</th><th class="num">Prometido</th><th class="num">Pago</th><th class="num">Pendente</th><th>Progresso</th><th class="right">Ações</th></tr></thead><tbody>${proms.map(p=>`<tr><td><b>${esc(p.desc)}</b></td><td>${esc((PPL.get(p.pid)||{}).nome||'—')}</td><td class="num">${fmtDate(p.data)}</td><td class="num">${BRL(p.total)}</td><td class="num">${BRL(p.pago)}</td><td class="num" style="${p.total>p.pago?'color:var(--red-ink);font-weight:600':''}">${BRL(p.total-p.pago)}</td>
        <td><div class="meter m-green" title="${pct(p.pago,p.total)}% pago"><i style="width:${pct(p.pago,p.total)}%"></i></div></td>
        <td class="acts">${p.total>p.pago?`<button type="button" class="btn btn-sm" data-act="pagProm" data-id="${p.id}">Registrar pagamento</button>`:badge('Quitada','green')}</td></tr>`).join('')}</tbody></table></div>`:empty('Nenhuma promessa registrada.')}</div>`;
  }else if(tab==='historico'){
    body=`<div class="card pad0"><div class="toolbar" style="padding-bottom:12px"><div class="ct">Histórico completo (${hist.length})</div></div>
      ${hist.length?`<div class="tw"><table class="tbl"><thead><tr><th>Data</th><th>Lançamento</th><th>Tipo</th><th>Forma de pagamento</th><th class="num">Valor</th></tr></thead><tbody>${hist.map(h=>`<tr><td class="num">${fmtDate(h.data)}</td><td>${esc(h.txt)}</td><td>${badge(h.tipo,h.tipo==='Mensalidade'?'blue':h.tipo==='Doação'?'purple':'amber')}</td><td>${esc(h.forma)}</td><td class="num"><b style="color:var(--green-ink)">+ ${BRL(h.valor)}</b></td></tr>`).join('')}</tbody></table></div>`:empty('Nenhum lançamento.')}</div>`;
  }else body=famRecibos(f);
  return `<button type="button" class="back" data-go="familia-${id}">${ic('back',14)}Voltar para família</button>
  ${head(esc(famName(f)),'Financeiro da família · '+esc(f.cat),btn('Registrar pagamento','check','btn-green',`data-act="pagamento" data-id="${id}"`)+`<button type="button" class="btn" data-menu="1" data-act="finMore" data-id="${id}">Mais ações${ic('down',14)}</button>`)}
  ${tabsU('finTab',tab,[['resumo','Resumo'],['mensalidades','Mensalidades'],['doacoes','Doações'],['promessas','Promessas'],['historico','Histórico'],['notas','Recibos']]).replace('class="utabs"','class="utabs" style="margin-top:0"')}
  ${body}`;
}
A.finMore=el=>{const id=+el.dataset.id;openMenu(el,[{label:'Registrar doação',icon:'heart',act:'doacao',id},{label:'Nova promessa',icon:'plus',act:'novaProm',id},{label:'Gerar mensalidades',icon:'calendar',act:'gerarMens',id},{label:'Link de pagamento',icon:'link',act:'payLink',id,arg:'don'},{label:'Informe anual',icon:'file',act:'informe',id},'-',{label:'Exportar extrato',icon:'download',act:'exportFin',id}])};
A.exportFin=el=>{const f=FAM.get(+el.dataset.id),rows=[['Data','Lançamento','Tipo','Forma de pagamento','Valor']];finHistory(f.id).forEach(h=>rows.push([fmtDate(h.data),h.txt,h.tipo,h.forma,String(h.valor).replace('.',',')]));saveFile('extrato-familia-'+norm(f.nome).replace(/[^a-z0-9]+/g,'-')+'.csv',rows)};
A.baixa=el=>{const p=DB.pay.find(x=>x.id===+el.dataset.id);if(!p)return;p.pagoEm=TODAY;render();toast('Mensalidade de '+compTxt(p.comp)+' marcada como paga.')};
A.editPay=el=>{const p=DB.pay.find(x=>x.id===+el.dataset.id);if(!p)return;formModal({title:'Mensalidade de '+compTxt(p.comp),fields:[
  {k:'valor',label:'Valor (R$)',type:'money',req:true,val:String(p.valor).replace('.',','),half:true},{k:'venc',label:'Vencimento',type:'date',req:true,val:p.venc,half:true},
  {k:'sit',label:'Situação',type:'select',opts:[['aberto','Em aberto'],['pago','Paga']],val:p.pagoEm?'pago':'aberto',half:true},{k:'pagoEm',label:'Pago em',type:'date',val:p.pagoEm||'',half:true,max:TODAY},
  {k:'forma',label:'Forma de pagamento',type:'select',opts:FORMAS,val:p.forma}],
  onSubmit(v){p.valor=v.valor;p.venc=v.venc;p.forma=v.forma;p.pagoEm=v.sit==='pago'?(v.pagoEm||TODAY):null;toast('Mensalidade atualizada.')}})};
A.gerarMens=el=>{const f=FAM.get(+el.dataset.id);formModal({title:'Gerar mensalidades',intro:'Cria as cobranças mensais de '+esc(famName(f))+' para o ano escolhido. Meses que já existem não são duplicados.',submit:'Gerar',fields:[
  {k:'ano',label:'Ano',type:'number',req:true,val:+S.ui.finAno||Y,half:true,min:2000,max:2100},{k:'dia',label:'Dia de vencimento',type:'select',opts:['1','5','10','15','20','25'],val:String(f.mens.dia||DB.cfg.diaPadrao),half:true},
  {k:'valor',label:'Valor mensal (R$)',type:'money',req:true,val:String(f.mens.valor||DB.cfg.mensPadrao).replace('.',','),half:true},{k:'forma',label:'Forma de pagamento',type:'select',opts:FORMAS,val:f.mens.forma||'PIX',half:true}],
  onSubmit(v){if(v.ano<2000||v.ano>2100)return 'Informe um ano válido.';let n=0;for(let m=1;m<=12;m++){const comp=v.ano+'-'+pad(m);if(!ixOf(IX.pay,f.id).some(p=>p.comp===comp)){addPay({fid:f.id,comp,venc:comp+'-'+pad(+v.dia),valor:v.valor,pagoEm:null,forma:v.forma});n++}}
    f.mens={ativa:true,valor:v.valor,dia:+v.dia,forma:v.forma};S.ui.finAno=String(v.ano);S.ui.finSt='';toast(n?pl(n,'mensalidade gerada','mensalidades geradas')+' para '+v.ano+'.':'Todas as mensalidades de '+v.ano+' já existiam.',!n)}})};
A.pagamento=el=>{const f=FAM.get(+el.dataset.id),open=ixOf(IX.pay,f.id).filter(p=>!p.pagoEm).sort(by(p=>p.venc)),proms=ixOf(IX.prom,f.id).filter(p=>p.total>p.pago);
  formModal({title:'Registrar pagamento',submit:'Registrar pagamento',fields:[
  {k:'ref',label:'Referente a',type:'select',opts:open.map(p=>['pay:'+p.id,'Mensalidade '+compTxt(p.comp)+' — '+BRL(p.valor)]).concat(proms.map(p=>['prom:'+p.id,'Promessa: '+p.desc+' — pendente '+BRL(p.total-p.pago)]),[['don','Doação avulsa']])},
  {k:'valor',label:'Valor (R$)',type:'money',hint:'Para mensalidade, deixe em branco para lançar o valor cheio.',half:true},{k:'data',label:'Data do pagamento',type:'date',req:true,val:TODAY,half:true,max:TODAY},
  {k:'forma',label:'Forma de pagamento',type:'select',opts:FORMAS,val:f.mens.forma||'PIX'}],
  onSubmit(v){const [t,i]=v.ref.split(':');
    if(t==='pay'){const p=DB.pay.find(x=>x.id===+i);if(v.valor)p.valor=v.valor;p.pagoEm=v.data;p.forma=v.forma;toast('Pagamento da mensalidade de '+compTxt(p.comp)+' registrado.')}
    else{if(!v.valor)return 'Informe o valor.';
      if(t==='prom'){const p=DB.prom.find(x=>x.id===+i);p.pago=Math.min(p.total,p.pago+v.valor);toast('Pagamento de '+BRL(v.valor)+' lançado na promessa.')}
      else{addDon({fid:f.id,pid:f.respId,data:v.data,valor:v.valor,tipo:'Doação geral',forma:v.forma,obs:''});toast('Doação de '+BRL(v.valor)+' registrada.')}}}})};
A.pagProm=el=>{const p=DB.prom.find(x=>x.id===+el.dataset.id);formModal({title:'Pagamento de promessa',intro:esc(p.desc)+' · pendente '+BRL(p.total-p.pago),submit:'Registrar',fields:[{k:'valor',label:'Valor pago (R$)',type:'money',req:true,val:String(p.total-p.pago).replace('.',',')}],
  onSubmit(v){p.pago=Math.min(p.total,p.pago+v.valor);toast('Pagamento lançado na promessa.')}})};
A.novaProm=el=>{const f=FAM.get(+el.dataset.id);formModal({title:'Nova promessa',submit:'Registrar promessa',fields:[
  {k:'desc',label:'Campanha ou motivo',req:true,ph:'Ex.: Campanha do novo Sefer Torá'},{k:'pid',label:'Quem prometeu',type:'select',opts:members(f.id).filter(p=>!isKid(p)).map(p=>[p.id,p.nome]),val:f.respId},
  {k:'total',label:'Valor prometido (R$)',type:'money',req:true,half:true},{k:'data',label:'Data',type:'date',req:true,val:TODAY,half:true}],
  onSubmit(v){addProm({fid:f.id,pid:+v.pid,desc:v.desc,total:v.total,pago:0,data:v.data});S.ui.finTab='promessas';toast('Promessa de '+BRL(v.total)+' registrada.')}})};

/* ================= Financeiro geral ================= */
function pgFinanceiro(){
  const u=S.ui.fg,inM=d=>d&&d.slice(0,7)===YM;
  const recM=sum(DB.pay.filter(p=>inM(p.pagoEm)),p=>p.valor)+sum(DB.don.filter(d=>inM(d.data)),d=>d.valor);
  const aRec=DB.pay.filter(p=>!p.pagoEm&&p.venc>=TODAY&&inM(p.venc)),over=DB.pay.filter(p=>!p.pagoEm&&p.venc<TODAY),promP=sum(DB.prom,p=>p.total-p.pago);
  const lateF=new Map();over.forEach(p=>ixAdd(lateF,p.fid,p));
  let body='';
  if(u.tab==='atraso'){
    const list=[...lateF.entries()].map(([fid,ps])=>({f:FAM.get(fid),n:ps.length,v:sum(ps,p=>p.valor),desde:ps.map(p=>p.venc).sort()[0]})).sort(by(x=>x.v,-1));
    body=list.length?`<div class="tw"><table class="tbl"><thead><tr><th>Família</th><th class="num">Meses em atraso</th><th class="num">Valor em atraso</th><th>Em atraso desde</th><th class="right">Ações</th></tr></thead><tbody>${list.map(x=>`<tr class="rowlink" tabindex="0" data-go="financeiro-${x.f.id}"><td><div class="who">${famAv(x.f,'av-sm')}<div><b>${esc(famName(x.f))}</b><small>${esc((respOf(x.f)||{}).nome||'')}</small></div></div></td><td class="num">${x.n}</td><td class="num"><b style="color:var(--red-ink)">${BRL(x.v)}</b></td><td class="num">${fmtDate(x.desde)} <small>(${ago(x.desde)})</small></td>
      <td class="acts"><button type="button" class="ibtn" title="Enviar lembrete" aria-label="Enviar lembrete" data-act="waLate" data-id="${x.f.id}">${ic('wa',15)}</button><button type="button" class="ibtn" title="Abrir financeiro" aria-label="Abrir financeiro" data-go="financeiro-${x.f.id}">${ic('eye',15)}</button></td></tr>`).join('')}</tbody></table></div>`:empty('Nenhuma mensalidade em atraso.');
  }else if(u.tab==='receb'){
    const d0=addDays(TODAY,-60),list=DB.pay.filter(p=>p.pagoEm&&p.pagoEm>=d0).map(p=>({data:p.pagoEm,fid:p.fid,txt:'Mensalidade '+compTxt(p.comp),forma:p.forma,valor:p.valor})).concat(DB.don.filter(d=>d.data>=d0).map(d=>({data:d.data,fid:d.fid,txt:d.tipo,forma:d.forma,valor:d.valor}))).sort(by(x=>x.data,-1)),rows=paginate(list,u,12);
    body=`<div class="tw"><table class="tbl"><thead><tr><th>Data</th><th>Família</th><th>Lançamento</th><th>Forma de pagamento</th><th class="num">Valor</th></tr></thead><tbody>${rows.map(x=>`<tr class="rowlink" tabindex="0" data-go="financeiro-${x.fid}"><td class="num">${fmtDate(x.data)}</td><td><b>${esc(famName(FAM.get(x.fid)))}</b></td><td>${esc(x.txt)}</td><td>${esc(x.forma)}</td><td class="num"><b style="color:var(--green-ink)">+ ${BRL(x.valor)}</b></td></tr>`).join('')}</tbody></table></div>${pager(list.length,u,12,'fg','lançamentos dos últimos 60 dias')}`;
  }else{
    const list=DB.prom.filter(p=>p.total>p.pago).sort(by(p=>p.total-p.pago,-1));
    body=`<div class="tw"><table class="tbl"><thead><tr><th>Família</th><th>Promessa</th><th class="num">Prometido</th><th class="num">Pago</th><th class="num">Pendente</th><th>Progresso</th></tr></thead><tbody>${list.map(p=>`<tr class="rowlink" tabindex="0" data-go="financeiro-${p.fid}" data-gtab="finTab:promessas"><td><b>${esc(famName(FAM.get(p.fid)))}</b></td><td>${esc(p.desc)}</td><td class="num">${BRL(p.total)}</td><td class="num">${BRL(p.pago)}</td><td class="num"><b style="color:var(--red-ink)">${BRL(p.total-p.pago)}</b></td><td><div class="meter m-green"><i style="width:${pct(p.pago,p.total)}%"></i></div></td></tr>`).join('')}</tbody></table></div>`;
  }
  return head('Financeiro','Mensalidades, doações e promessas de toda a comunidade',btn('Registrar doação','heart','btn-navy','data-act="doacao"'))+
  `<div class="g4">${kpi('Recebido em '+MESES[+YM.slice(5)-1],BRL0(recM),'mensalidades e doações')}${kpi('A receber este mês',BRL0(sum(aRec,p=>p.valor)),pl(aRec.length,'mensalidade a vencer','mensalidades a vencer'))}${kpi('Em atraso',BRL0(sum(over,p=>p.valor)),pl(lateF.size,'família','famílias'))}${kpi('Promessas pendentes',BRL0(promP),pl(DB.prom.filter(p=>p.total>p.pago).length,'promessa em aberto','promessas em aberto'))}</div>
  <div class="card pad0 mt">${pills('fg.tab',u.tab,[['atraso','Mensalidades em atraso'],['receb','Últimos recebimentos'],['prom','Promessas pendentes']])}${body}</div>`;
}
A.waLate=el=>{const f=FAM.get(+el.dataset.id),p=ixOf(IX.pay,f.id).filter(x=>!x.pagoEm&&x.venc<TODAY).sort(by(x=>x.venc))[0];openWa(f.id,null,{tpl:'Mensalidade em atraso',vars:{competencia:p?compTxt(p.comp):''}})};
