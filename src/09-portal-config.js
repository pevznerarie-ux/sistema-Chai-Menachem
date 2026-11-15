/* ================= criação de família (formulário e importação) ================= */
function createFam(o){
  const f=addFam({nome:String(o.nome||'').trim().replace(/^fam[ií]lia\s+/i,''),cat:CATS.includes(o.cat)?o.cat:'Visitante',status:'Ativo',fav:false,cor:Math.floor(Math.random()*8),cad:TODAY,origem:o.origem||'',soube:o.soube||'',tel:String(o.tel||'').trim(),fixo:'',email:String(o.email||'').trim(),
    end:{rua:'',comp:'',bairro:o.bairro||'',cid:'São Paulo',uf:'SP',cep:''},part:{shabat:false,eventos:false,aulas:false,kidush:false,kids:false,teens:false},mens:{ativa:false,valor:0,dia:DB.cfg.diaPadrao,forma:'PIX'},
    trib:'Israel',idioma:'Português',okWa:o.okWa!==false,okMail:o.okMail!==false,obs:'',pres:null,tags:[],ev12:0,notaRabino:'',sc0:0},true);
  const p=addPerson({fid:f.id,nome:String(o.resp||o.nome).trim(),heb:'',papel:'Pai',sexo:'M',nasc:'',civil:'',nac:'Brasileira',prof:'',emp:'',tel:f.tel,fixo:'',email:f.email,obs:'',ativo:true,grupos:[]});
  f.respId=p.id;return f;
}

/* ================= Formulários online ================= */
function comForms(){
  return `<div class="card pad0"><div class="toolbar" style="padding-bottom:12px;justify-content:space-between"><div class="ct">Formulários online</div><small>Cada resposta entra direto no cadastro, sem redigitar.</small></div>
  <div class="tw"><table class="tbl"><thead><tr><th>Formulário</th><th>O que faz</th><th class="num">Respostas</th><th>Status</th><th class="right">Ações</th></tr></thead><tbody>${DB.forms.map(f=>`<tr><td><b>${esc(f.nome)}</b></td><td>${esc(f.desc)}</td><td class="num">${NUM(f.resp)}</td><td>${badge(f.on?'Ativo':'Pausado',f.on?'green':'gray')}</td>
    <td class="acts">${btn('Ver formulário','eye','btn-sm',`data-act="formPreview" data-id="${f.id}"`)}</td></tr>`).join('')}</tbody></table></div></div>`;
}
A.formPreview=el=>{
  const f=DB.forms.find(x=>x.id===+el.dataset.id);
  if(f.k!=='cadastro'){openModal({title:f.nome,body:`<p class="intro">${esc(f.desc)}</p><p class="hint">${PREV?'Na versão online este formulário tem um link próprio, para enviar às famílias ou colocar no site.':'O link público, para enviar às famílias ou colocar no site, ainda vai ser ativado.'}</p>`,footer:`<button type="button" class="btn btn-navy" data-act="closeModal">Fechar</button>`});return}
  formModal({title:'Cadastro de nova família',wide:true,intro:'É assim que a família vê o formulário. Ao enviar, a ficha é criada e a equipe recebe o alerta de boas-vindas.',submit:'Enviar cadastro',fields:[
    {k:'nome',label:'Sobrenome da família',req:true,half:true},{k:'resp',label:'Seu nome completo',req:true,half:true},
    {k:'tel',label:'WhatsApp',type:'tel',req:true,ph:'11 99999-9999',half:true},{k:'email',label:'E-mail',type:'email',ph:'exemplo@email.com',half:true},
    {k:'soube',label:'Como conheceu a comunidade?',type:'select',opts:['Indicação','Instagram','Site','Evento','Passou em frente','Outro']},
    {k:'ok',label:'Aceito receber mensagens da comunidade por WhatsApp e e-mail',type:'check',val:true}],
    onSubmit(v){const nf=createFam({nome:v.nome,resp:v.resp,tel:v.tel,email:v.email,origem:'Formulário online',soube:v.soube,okWa:v.ok,okMail:v.ok});f.resp++;toast('Formulário recebido: '+famName(nf)+' criada, com alerta de boas-vindas.');setTimeout(()=>go('familia-'+nf.id),0)}});
};

/* ================= Área da família ================= */
function pgPortal(r){
  const f=FAM.get(r.id)||DB.fam.find(x=>x.fav)||DB.fam[0];
  if(!f)return head('Área da família','O que a família vai ver quando tiver o próprio acesso.')+`<div class="card">${empty('Nenhuma família cadastrada ainda.','Cadastre a primeira família para ver a área dela.')}</div>`;
  const rp=respOf(f),ms=mensStatus(f),np=nextPay(f.id),id=f.id;
  const evs=DB.ev.filter(e=>!e.cancel&&e.data>=TODAY).sort(by(e=>e.data)).slice(0,4),rc=receipts(id,400).slice(0,4),yz=ixOf(IX.yz,id).filter(y=>yzNext(y)).sort(by(yzNext));
  buildFamLabels();
  return head('Área da família','O que a família vai ver quando tiver o próprio acesso. Escolha uma família para visualizar.',`<input class="inp" id="pt-fam" list="dl-fam" placeholder="Trocar de família..." aria-label="Família" data-on="portalPick" autocomplete="off" style="width:260px">`)+
  `<datalist id="dl-fam">${DB.fam.map(x=>`<option value="${esc(x._lab)}"></option>`).join('')}</datalist>
  <div class="portal"><div class="portal-hero">${famAv(f,'av-lg')}<div style="flex:1;min-width:200px"><h2>Shalom, ${esc(rp?rp.nome.split(' ')[0]:'')}!</h2><p>Esta é a área da ${esc(famName(f))} no Chai Menachem.</p></div></div>
  <div class="g2 mt">
    <div class="card"><div class="ch"><div class="ct">${ic('wallet',16)}Mensalidade</div>${ms==='ok'?badge('Em dia','green'):ms==='late'?badge('Em atraso','red'):badge('Sem mensalidade','gray')}</div>
      ${np?`<p style="color:var(--ink-2)">Próxima: <b style="color:var(--ink)">${compTxt(np.comp)}</b>, ${BRL(np.valor)}, vence em ${fmtDate(np.venc)}.</p>`:'<p style="color:var(--ink-2)">Nenhuma mensalidade em aberto.</p>'}
      <div class="pacts" style="margin-top:12px">${np?btn('Pagar agora','check','btn-green',`data-act="payLink" data-id="${id}" data-arg="pay:${np.id}"`):''}${btn('Fazer uma doação','heart','',`data-act="payLink" data-id="${id}" data-arg="don"`)}</div></div>
    <div class="card"><div class="ch"><div class="ct">${ic('user',16)}Meus dados</div>${btn('Atualizar','edit','btn-sm',`data-act="portalEdit" data-id="${id}"`)}</div>
      ${kv([['WhatsApp',`<span class="num">${esc(f.tel)}</span>`],['E-mail',esc(f.email)],['Endereço',esc([f.end.rua,f.end.bairro].filter(Boolean).join(', '))],['Família',pl(members(id).length,'pessoa','pessoas')],['Mensagens',f.okWa!==false?'Aceita receber':'Não quer receber']])}</div>
    <div class="card"><div class="ct" style="margin-bottom:6px">${ic('calendar',16)}Próximos eventos</div><div class="rows">${evs.map(e=>{const reg=e.regs.find(x=>x.fid===id),full=e.vagas>0&&evInsc(e)>=e.vagas;return `<div class="rw"><span class="grow"><b>${esc(e.nome)}</b><small style="display:block">${fmtDate(e.data)} · ${e.valor?BRL(e.valor)+' por pessoa':'gratuito'}</small></span>${reg?badge('Inscrita · '+pl(reg.q,'pessoa','pessoas'),'green'):full?badge('Lotado','amber'):`<button type="button" class="btn btn-sm" data-act="inscrever" data-id="${id}" data-ev="${e.id}">Inscrever-se</button>`}</div>`}).join('')||empty('Nenhum evento marcado.')}</div></div>
    <div class="card"><div class="ct" style="margin-bottom:6px">${ic('receipt',16)}Meus recibos</div><div class="rows">${rc.map(x=>`<button type="button" class="rw" data-act="recibo" data-id="${id}" data-arg="${x.k}:${x.id}"><span class="grow"><b>${esc(x.ref)}</b><small style="display:block">${fmtDate(x.data)}</small></span><b class="num">${BRL(x.valor)}</b></button>`).join('')||empty('Nenhum recibo ainda.')}</div></div>
  </div>
  <div class="card mt"><div class="ct" style="margin-bottom:6px">${ic('candle',16)}Yahrzeits da família</div><div class="rows">${yz.map(y=>`<div class="rw"><span class="grow"><b>${esc(y.nome)}</b><small style="display:block">${esc(y.rel)} · ${y.d} de ${esc(y.m)}</small></span><span class="right num">${fmtDate(yzNext(y))}<small style="display:block">${inDays(yzNext(y))}</small></span></div>`).join('')||empty('Nenhum yahrzeit cadastrado.')}</div></div></div>`;
}
A.portalPick=el=>{if(S.famLab.has(el.value))go('portal-'+S.famLab.get(el.value))};
A.portalEdit=el=>{const f=FAM.get(+el.dataset.id);formModal({title:'Atualizar meus dados',intro:'A família corrige os próprios dados e a ficha se atualiza sozinha.',fields:[
  {k:'tel',label:'WhatsApp',type:'tel',req:true,val:f.tel,half:true},{k:'email',label:'E-mail',type:'email',val:f.email,half:true},
  {k:'rua',label:'Rua e número',val:f.end.rua,half:true},{k:'bairro',label:'Bairro',val:f.end.bairro,half:true},
  {k:'ok',label:'Quero receber mensagens da comunidade',type:'check',val:f.okWa!==false}],
  onSubmit(v){f.tel=v.tel;f.email=v.email;f.end.rua=v.rua;f.end.bairro=v.bairro;f.okWa=v.ok;f._s=null;const r=respOf(f);if(r){r.tel=v.tel;r.email=v.email}toast('Dados da '+famName(f)+' atualizados pela área da família.')}})};

/* ================= Configurações ================= */
const INTEGR=[['site','Site da comunidade','home','Inscrições e doações feitas no site entram direto no cadastro.','Só precisa ligar o site ao sistema, depois que os dois estiverem online.'],['mp','Mercado Pago','wallet','Pagamento por PIX e cartão, com baixa automática e recibo.','Usa a conta do Mercado Pago da associação. É preciso gerar uma chave de acesso nessa conta.'],['wa','WhatsApp Business','wa','Disparos, mensagens automáticas e histórico na ficha de cada família.','Precisa de uma conta do WhatsApp Business (API oficial da Meta) e de um número só para a comunidade.']];
const PERM_ROWS=[['Cadastro, relacionamento e eventos',null],['Comunicação','com'],['Financeiro','fin'],['Relatórios','rel'],['Anotações privadas do rabino','notas'],['Configurações e usuários','cfg']];
function pgConfig2(){
  const u=S.ui.cfg,c=DB.cfg,roles=Object.keys(ROLES);let body='';
  if(u.tab==='geral'){
    body=`<div class="g2"><div class="card"><div class="ch"><div class="ct">Dados da comunidade</div>${btn('Editar','edit','btn-sm','data-act="editCfg"')}</div>${kv([['Nome',esc(c.nome)],['Cidade',esc(c.cidade)],['Mensalidade padrão',BRL(c.mensPadrao)],['Dia de vencimento padrão','Dia '+c.diaPadrao]])}</div>
      <div class="card"><div class="ct" style="margin-bottom:12px">Categorias de família</div><div class="chips" style="margin:0">${CATS.map(x=>`<span class="badge b-${CAT_TONE[x]}">${x} · ${NUM(DB.fam.filter(f=>f.cat===x).length)}</span>`).join('')}</div>
        <div class="ct" style="margin:16px 0 12px">Etiquetas</div><div class="chips" style="margin:0">${DB.tags.map(t=>`<span class="badge b-gray">${ic('tag',11)}${esc(t)} · ${DB.fam.filter(f=>(f.tags||[]).includes(t)).length}</span>`).join('')}</div>
        <div class="ct" style="margin:16px 0 12px">Formas de pagamento</div><div class="chips" style="margin:0">${FORMAS.map(x=>badge(x,'gray')).join('')}</div></div></div>`;
  }else if(u.tab==='users'){
    body=`<div class="g2"><div class="card pad0"><div class="toolbar" style="padding-bottom:12px;justify-content:space-between"><div class="ct">Usuários</div>${btn('Novo usuário','plus','btn-green btn-sm','data-act="novoUser"')}</div>
        <div class="tw"><table class="tbl" style="min-width:360px"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th>${PREV?'':'<th class="right">Ações</th>'}</tr></thead><tbody>${DB.users.map(x=>`<tr><td><div class="who">${av(x.nome[0].toUpperCase(),x.id,'av-sm')}<b>${esc(x.nome)}</b></div></td><td>${esc(x.email||'')}</td><td>${badge(x.papel,x.papel==='Administrador'?'blue':x.papel==='Rabino'?'purple':x.papel==='Voluntário'?'gray':'green')}</td>${PREV?'':`<td class="acts">${x.ativo===false?badge('Desativado','gray')+' ':''}${userActs(x)}</td>`}</tr>`).join('')}</tbody></table></div>
        <p class="hint" style="padding:10px 16px;border-top:1px solid var(--line-2)">${PREV?'Para testar os perfis, clique no seu nome, no alto da tela, e escolha outro usuário. O login com senha entra na versão online.':'Cada pessoa entra com o próprio e-mail e senha. Ao desativar um acesso, a pessoa sai do sistema na hora.'}</p></div>
      <div class="card pad0"><div class="toolbar" style="padding-bottom:12px"><div class="ct">O que cada perfil pode ver</div></div><div class="tw"><table class="tbl mx" style="min-width:420px"><thead><tr><th>Área</th>${roles.map(r=>`<th>${r}</th>`).join('')}</tr></thead><tbody>${PERM_ROWS.map(p=>`<tr><td>${p[0]}</td>${roles.map(r=>`<td>${!p[1]||ROLES[r][p[1]]?`<span style="color:var(--green-ink)" title="Tem acesso">${ic('check',15)}</span>`:'<span class="muted" title="Sem acesso">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div></div>`;
  }else if(u.tab==='integr'){
    body=`<div class="g3">${INTEGR.map(x=>`<div class="card camp"><div class="ch" style="margin:0"><div class="ct">${ic(x[2],16)}${x[1]}</div>${badge(c.integr[x[0]]?'Conectado':'A conectar',c.integr[x[0]]?'green':'amber')}</div><p style="color:var(--ink-2);flex:1">${x[3]}</p><div class="pacts">${btn('Como conectar','plug','btn-sm',`data-act="integr" data-arg="${x[0]}"`)}</div></div>`).join('')}</div>
      <p class="hint mt">${PREV?'As integrações são ligadas quando o sistema estiver online. Na prévia, os pagamentos e os envios são simulados.':'As integrações são ligadas uma a uma, com as contas da comunidade. Até lá, pagamentos e mensagens são registrados à mão.'}</p>`;
  }else if(u.tab==='dados'){
    body=`<div class="g2"><div class="card"><div class="ct" style="margin-bottom:8px">${ic('cloud',16)}Backup</div><p style="color:var(--ink-2)">${PREV?`Na versão online, o sistema guarda uma cópia de todos os dados todos os dias, de madrugada, e mantém as cópias dos últimos 30 dias.</p><p class="hint" style="margin:8px 0 12px">A prévia não faz backup automático, porque os dados são de exemplo. O botão abaixo já funciona.</p>`:`Os dados ficam guardados no banco de dados do sistema. Baixe uma cópia completa de vez em quando, por segurança: recomendo uma vez por semana.</p><p class="hint" style="margin:8px 0 12px">A cópia é um arquivo com todas as famílias, pessoas, pagamentos, eventos e anotações.</p>`}${btn('Baixar cópia dos dados agora','download','btn-green','data-act="backup"')}</div>
      <div class="card"><div class="ct" style="margin-bottom:8px">${ic('upload',16)}Importar planilha</div><p style="color:var(--ink-2)">Traga as famílias que já estão no Excel. O sistema reconhece as colunas e confere duplicados pelo telefone antes de gravar.</p><div class="pacts" style="margin-top:12px">${btn('Importar planilha','upload','btn-green','data-act="importar"')}${btn('Baixar modelo','download','','data-act="impModelo"')}</div></div></div>`;
  }else if(u.tab==='lgpd'){
    const act=DB.fam.filter(f=>f.status==='Ativo'),noWa=act.filter(f=>f.okWa===false),noMail=act.filter(f=>f.okMail===false);
    body=`<div class="g3">${kpi('Aceitam WhatsApp',pct(act.length-noWa.length,act.length)+'%',NUM(act.length-noWa.length)+' de '+NUM(act.length)+' famílias ativas')}${kpi('Aceitam e-mail',pct(act.length-noMail.length,act.length)+'%',NUM(act.length-noMail.length)+' famílias')}${kpi('Pediram para não receber',NUM(noWa.length),'ficam fora de todos os disparos')}</div>
      <div class="g2 mt"><div class="card pad0"><div class="toolbar" style="padding-bottom:12px"><div class="ct">Não querem receber WhatsApp (${noWa.length})</div></div><div class="rows" style="padding:0 16px 8px;max-height:320px;overflow:auto">${noWa.map(f=>`<button type="button" class="rw" data-go="familia-${f.id}">${famAv(f,'av-sm')}<span class="grow"><b>${esc(famName(f))}</b></span>${ic('next',13)}</button>`).join('')||empty('Nenhuma família.')}</div></div>
      <div class="card"><div class="ct" style="margin-bottom:8px">${ic('shield',16)}Direitos da família</div><p style="color:var(--ink-2)">Cada família pode pedir uma cópia dos próprios dados ou mudar o que aceita receber. O consentimento fica registrado na ficha, e quem recusou sai sozinho dos disparos.</p>
        <div class="pacts" style="margin-top:12px">${btn('Exportar dados de uma família','download','','data-act="lgpdPick"')}</div></div></div>`;
  }else{
    const ul=S.ui.lg,rows=paginate(DB.log,ul,12);
    body=`<div class="card pad0"><div class="toolbar" style="padding-bottom:12px"><div class="ct">Histórico de alterações</div></div>${rows.length?`<div class="tw"><table class="tbl"><thead><tr><th>Quando</th><th>Quem</th><th>O que foi feito</th></tr></thead><tbody>${rows.map(l=>`<tr><td class="num nowrap">${fmtDate(l.em.slice(0,10))} ${l.em.slice(11)}</td><td><b>${esc(l.quem)}</b></td><td>${esc(l.txt)}</td></tr>`).join('')}</tbody></table></div>`:empty('Nenhuma alteração registrada.')}${pager(DB.log.length,ul,12,'lg','registros')}</div>`;
  }
  return head('Configurações','Dados da comunidade, acessos, integrações e segurança')+
    tabsU('cfg.tab',u.tab,[['geral','Geral'],['users','Usuários e acessos'],['integr','Integrações'],['dados','Backup e importação'],['lgpd','LGPD'],['log','Histórico de alterações']]).replace('class="utabs"','class="utabs" style="margin-top:0"')+body;
}
A.novoUser=()=>formModal({title:'Novo usuário',submit:'Criar usuário',fields:[{k:'nome',label:'Nome',req:true,half:true},{k:'email',label:'E-mail',type:'email',req:true,ph:'exemplo@email.com',half:true},{k:'papel',label:'Perfil',type:'select',opts:Object.keys(ROLES),val:'Secretária'}],
  onSubmit(v){DB.users.push({id:Math.max(...DB.users.map(u=>u.id))+1,nome:v.nome,email:v.email,papel:v.papel});toast('Usuário '+v.nome+' criado com o perfil '+v.papel+'.')}});
A.integr=el=>{const x=INTEGR.find(i=>i[0]===el.dataset.arg);openModal({title:x[1],body:`<p class="intro">${x[3]}</p>${kv([['O que é preciso',x[4]],['Situação','A conectar']])}`,footer:`<button type="button" class="btn btn-navy" data-act="closeModal">Entendi</button>`})};
A.backup=async()=>{const data=JSON.stringify({geradoEm:nowStr(),familias:DB.fam,pessoas:DB.ppl,mensalidades:DB.pay,doacoes:DB.don,promessas:DB.prom,eventos:DB.ev,yahrzeits:DB.yz,contatos:DB.ct,momentos:DB.life,campanhas:DB.camp,aulas:DB.aulas},(k,v)=>k[0]==='_'?undefined:v);
  if((await download('backup-chai-menachem-'+TODAY+'.json',data))==='fail')toast('Não deu para baixar por aqui.',1)};
async function lgpdExport(f){const data=JSON.stringify({exportadoEm:nowStr(),familia:f,pessoas:members(f.id),mensalidades:ixOf(IX.pay,f.id),doacoes:ixOf(IX.don,f.id),promessas:ixOf(IX.prom,f.id),yahrzeits:ixOf(IX.yz,f.id),contatos:ixOf(IX.ct,f.id),momentos:DB.life.filter(l=>l.fid===f.id)},(k,v)=>k[0]==='_'||k==='notaRabino'?undefined:v,1);
  if((await download('dados-familia-'+norm(f.nome).replace(/[^a-z0-9]+/g,'-')+'.json',data))==='fail')toast('Não deu para baixar por aqui.',1)}
A.lgpdExport=el=>lgpdExport(FAM.get(+el.dataset.id));
A.lgpdPick=()=>formModal({title:'Exportar dados de uma família',submit:'Exportar',fields:[{k:'fid',label:'Família',type:'family',req:true}],onSubmit(v){setTimeout(()=>lgpdExport(FAM.get(v.fid)),0)}});

/* ================= Importação de planilha ================= */
function loadXLSX(){return new Promise((res,rej)=>{if(window.XLSX)return res();const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=()=>res();s.onerror=()=>rej(new Error('rede'));document.head.appendChild(s)})}
function parseCSV(t){
  t=t.replace(/^﻿/,'');const l1=t.split(/\r?\n/)[0]||'',sep=(l1.match(/;/g)||[]).length>=(l1.match(/,/g)||[]).length?';':',',rows=[];let row=[],cur='',q=false;
  for(let i=0;i<t.length;i++){const c=t[i];
    if(q){if(c==='"'){if(t[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c}
    else if(c==='"')q=true;else if(c===sep){row.push(cur);cur=''}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(cur);cur='';if(row.some(x=>x.trim()))rows.push(row);row=[]}
    else cur+=c}
  row.push(cur);if(row.some(x=>x.trim()))rows.push(row);return rows;
}
function impAnalyze(rows){
  if(rows.length<2)return{err:'O arquivo precisa ter uma linha de títulos e pelo menos uma família.'};
  const H=rows[0].map(h=>norm(h)),find=(ks,not)=>H.findIndex((h,i)=>i!==not&&ks.some(k=>h.includes(k)));
  const c={fam:find(['famil','sobrenome'])};c.resp=find(['respons']);if(c.resp<0)c.resp=find(['nome'],c.fam);
  c.tel=find(['telefone','whats','celular','fone']);c.email=find(['mail']);c.cat=find(['categ']);c.bairro=find(['bairro']);
  if(c.fam<0&&c.resp<0)return{err:'Não encontrei as colunas Família ou Responsável na primeira linha.'};
  const dig=s=>String(s||'').replace(/\D/g,''),seen=new Set(DB.fam.map(f=>dig(f.tel)).filter(d=>d.length>=8)),novos=[],dup=[];
  rows.slice(1).forEach(r=>{const g=i=>i>=0?String(r[i]??'').trim():'',resp=g(c.resp),nome=g(c.fam)||resp.split(/\s+/).pop();if(!nome)return;
    const o={nome,resp:resp||nome,tel:g(c.tel),email:g(c.email),cat:CATS.find(x=>norm(x)===norm(g(c.cat)))||'Visitante',bairro:g(c.bairro)},d=dig(o.tel);
    if(d.length>=8&&seen.has(d))dup.push(o);else{novos.push(o);if(d.length>=8)seen.add(d)}});
  return{novos,dup,cols:Object.keys(c).filter(k=>c[k]>=0).length};
}
A.importar=()=>{S.imp=null;openModal({title:'Importar planilha',wide:true,body:`<p class="intro">Envie um arquivo Excel (.xlsx) ou CSV com uma família por linha. O sistema reconhece as colunas pelo título e confere duplicados pelo telefone.</p>
  <div class="fgrid"><div class="field"><label for="imp-file">Arquivo</label><input class="inp" style="padding:5px 8px;height:auto" type="file" id="imp-file" accept=".csv,.txt,.xlsx,.xls" data-on="impFile"><span class="hint">Colunas reconhecidas: Família, Responsável, Telefone, E-mail, Categoria, Bairro.</span></div></div><div id="imp-out" style="margin-top:12px"></div>`,
  footer:`<button type="button" class="btn" data-act="impModelo">${ic('download',15)}Baixar modelo</button><button type="button" class="btn" data-act="closeModal">Cancelar</button><button type="button" class="btn btn-green" id="imp-go" data-act="impGo" disabled>Importar</button>`})};
A.impFile=async el=>{
  const file=el.files&&el.files[0],out=$('#imp-out'),goB=$('#imp-go');if(!file||!out)return;S.imp=null;goB.disabled=true;out.innerHTML='<span class="muted">Lendo o arquivo…</span>';
  let rows;
  try{
    if(/\.(csv|txt)$/i.test(file.name))rows=parseCSV(await file.text());
    else{await loadXLSX();const wb=window.XLSX.read(await file.arrayBuffer(),{type:'array'});rows=window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:''}).filter(r=>r.some(x=>String(x).trim()))}
  }catch(e){if($('#imp-out'))out.innerHTML=`<p class="err">Não consegui ler este arquivo. ${e.message==='rede'?'Para arquivos Excel é preciso estar conectado à internet. Você também pode salvar a planilha como CSV.':'Salve a planilha como CSV e tente de novo.'}</p>`;return}
  if(!$('#imp-out'))return;
  const r=impAnalyze(rows);if(r.err){out.innerHTML=`<p class="err">${r.err}</p>`;return}
  S.imp=r;goB.disabled=!r.novos.length;goB.textContent=r.novos.length?'Importar '+pl(r.novos.length,'família','famílias'):'Importar';
  out.innerHTML=`<div class="g3">${stat('users','green','Famílias novas',NUM(r.novos.length))}${stat('copy','amber','Duplicadas',NUM(r.dup.length),'mesmo telefone, não entram')}${stat('list','blue','Colunas reconhecidas',r.cols+' de 6')}</div>
    ${r.novos.length?`<div class="tw" style="margin-top:12px"><table class="tbl" style="min-width:420px"><thead><tr><th>Família</th><th>Responsável</th><th>Telefone</th><th>Categoria</th></tr></thead><tbody>${r.novos.slice(0,5).map(o=>`<tr><td><b>${esc(o.nome)}</b></td><td>${esc(o.resp)}</td><td class="num">${esc(o.tel)}</td><td>${esc(o.cat)}</td></tr>`).join('')}</tbody></table></div>${r.novos.length>5?`<p class="hint" style="margin-top:6px">E mais ${r.novos.length-5}.</p>`:''}`:''}`;
};
A.impGo=()=>{const r=S.imp;if(!r||!r.novos.length)return;r.novos.forEach(o=>createFam(Object.assign({origem:'Importação de planilha'},o)));const n=r.novos.length;S.imp=null;closeModal();Object.assign(S.ui.fl,{q:'',cat:'',status:'',mens:'',part:'',cad:'',tag:'',tab:'todos',page:1});go('familias');render();toast(pl(n,'família importada','famílias importadas')+(r.dup.length?'. '+pl(r.dup.length,'duplicada ficou','duplicadas ficaram')+' de fora.':'.'))};
A.impModelo=async()=>{if((await download('modelo-importacao-familias.csv',csv([['Família','Responsável','Telefone','E-mail','Categoria','Bairro'],['Cohen','David Cohen','11 99999-9999','david.cohen@email.com','Sócio','Jardim Paulista']])))==='fail')toast('Não deu para baixar por aqui.',1)};

/* ================= Busca geral ================= */
A.gsearch=el=>{
  const box=el.closest('.gs-wrap').querySelector('.gs-res'),q=norm(el.value).trim(),qd=el.value.replace(/\D/g,'');
  if(q.length<2){box.hidden=true;return}
  const fam=DB.fam.filter(f=>famSearch(f).includes(q)||(qd.length>=4&&famSearch(f).includes(qd))).slice(0,5),ppl=DB.ppl.filter(p=>norm(p.nome).includes(q)).slice(0,5);
  const evs=DB.ev.filter(e=>norm(e.nome).includes(q)).sort((a,b)=>(a.data<TODAY)-(b.data<TODAY)||(a.data<b.data?-1:1)).slice(0,3),yz=DB.yz.filter(y=>norm(y.nome).includes(q)).slice(0,3);
  const sec=(t,h)=>h?`<div class="cap">${t}</div>${h}`:'';
  box.innerHTML=sec('Famílias',fam.map(f=>`<button type="button" data-go="familia-${f.id}">${famAv(f,'av-sm')}<span><b>${esc(famName(f))}</b><small>${esc((respOf(f)||{}).nome||'')} · ${esc(f.tel)}</small></span></button>`).join(''))+
    sec('Pessoas',ppl.map(p=>`<button type="button" data-go="pessoa-${p.id}">${pAv(p,'av-sm')}<span><b>${esc(p.nome)}</b><small>${esc(famName(FAM.get(p.fid)))}</small></span></button>`).join(''))+
    sec('Eventos',evs.map(e=>`<button type="button" data-go="evento-${e.id}">${dotIc('calendar','blue')}<span><b>${esc(e.nome)}</b><small>${fmtDate(e.data)}</small></span></button>`).join(''))+
    sec('Yahrzeits',yz.map(y=>`<button type="button" data-go="familia-${y.fid}" data-gtab="famTab:yahrzeit">${dotIc('candle','amber')}<span><b>${esc(y.nome)}</b><small>${y.d} de ${esc(y.m)} · ${esc(famName(FAM.get(y.fid)))}</small></span></button>`).join(''))
    ||`<div class="empty" style="padding:16px"><b>Nada encontrado.</b>Tente outro nome ou telefone.</div>`;
  box.hidden=false;
};
const hideSearch=()=>document.querySelectorAll('.gs-res').forEach(b=>{b.hidden=true});
document.addEventListener('click',e=>{if(!e.target.closest('.gs-wrap'))hideSearch()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideSearch()});

/* ================= Resumo da semana ================= */
function resumoTxt(){
  const d7=addDays(TODAY,-7),n7=addDays(TODAY,7),inW=d=>d&&d>d7&&d<=TODAY,nv=DB.fam.filter(f=>inW(f.cad)),late=lateList(),life=DB.life.filter(l=>inW(l.data)),top=topNeeds(5);
  const rec=sum(DB.pay.filter(p=>inW(p.pagoEm)),p=>p.valor)+sum(DB.don.filter(d=>inW(d.data)),d=>d.valor),yz=DB.yz.filter(y=>{const n=yzNext(y);return n&&n<=n7}).sort(by(yzNext)),evs=DB.ev.filter(e=>!e.cancel&&e.data>=TODAY&&e.data<=n7).sort(by(e=>e.data));
  const lastSat=addDays(TODAY,-((toDate(TODAY).getDay()+1)%7)),att=DB.att[lastSat+'|Shabat'];
  return ['Resumo da semana · Chai Menachem · '+fmtDate(TODAY),'',
    'Presença no último Shabat: '+(att?att.size:0)+' famílias.',
    'Novas famílias: '+nv.length+(nv.length?' ('+nv.map(f=>f.nome).join(', ')+').':'.'),
    'Recebido na semana: '+BRL(rec)+'.',
    'Mensalidades em atraso: '+pl(late.length,'família','famílias')+', '+BRL(sum(late,x=>x.v))+'.',
    'Momentos: '+(life.length?life.map(l=>LIFE[l.tipo][0]+' na '+famName(FAM.get(l.fid))).join('; ')+'.':'nenhum registrado.'),
    'Yahrzeits nos próximos 7 dias: '+(yz.length?yz.map(y=>y.nome+' ('+fmtDM(yzNext(y))+', '+famName(FAM.get(y.fid))+')').join('; ')+'.':'nenhum.'),
    'Eventos da semana: '+(evs.length?evs.map(e=>e.nome+' em '+fmtDM(e.data)+' ('+evInsc(e)+' inscritos)').join('; ')+'.':'nenhum.'),
    '','Para contatar primeiro:'].concat(top.map((n,i)=>(i+1)+'. '+famName(n.f)+': '+NEED[n.k][0]+'. '+n.txt)).join('\n');
}
A.resumoSemana=()=>{const t=resumoTxt();openModal({title:'Resumo da semana',wide:true,body:`<p class="intro">Resumo pronto para enviar ao rabino.</p><textarea class="inp" id="copy-txt" rows="14" readonly>${esc(t)}</textarea>`,
  footer:`<button type="button" class="btn" data-act="closeModal">Fechar</button><button type="button" class="btn" data-act="copyTxt">${ic('copy',15)}Copiar</button><a class="btn btn-green" target="_blank" rel="noopener" href="${esc(waHref('',t))}">${ic('wa',15)}Enviar por WhatsApp</a>`})};
