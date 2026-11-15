/* ================= versão real: login, banco e sincronização ================= */
const COLLS=['fam','ppl','pay','don','prom','ev','yz','ct','disp','tpl','auto','seg','forms','life','camp','aulas','log'];
const J=v=>JSON.stringify(v,(k,x)=>(k&&k[0]==='_')||typeof x==='function'?undefined:x);
const SY={snap:new Map(),busy:false,timer:null,seq:'0',state:'ok',pendingRender:false};

async function apiCall(method,url,body){
  let r;
  try{r=await fetch(url,{method,credentials:'same-origin',headers:{'content-type':'application/json','x-requested-with':'cm'},body:body==null?undefined:(typeof body==='string'?body:JSON.stringify(body))})}
  catch(e){const er=new Error('Sem conexão com o servidor. Confira a internet e tente de novo.');er.status=0;throw er}
  let j=null;try{j=await r.json()}catch(e){}
  if(!r.ok){const er=new Error((j&&j.erro)||'Algo deu errado. Tente de novo.');er.status=r.status;er.data=j;throw er}
  return j;
}

/* ---- ler e gravar os dados ---- */
function eachRec(fn){
  for(const c of COLLS)for(const r of DB[c])if(r&&r.id!=null)fn(c,String(r.id),r);
  for(const k in DB.att)fn('att',k,{ids:[...DB.att[k]]});
  fn('kv','cfg',DB.cfg);fn('kv','tags',{list:DB.tags});
}
function findRec(c,id){
  if(c==='att')return DB.att[id]?{ids:[...DB.att[id]]}:undefined;
  if(c==='kv')return id==='cfg'?DB.cfg:id==='tags'?{list:DB.tags}:undefined;
  return (DB[c]||[]).find(x=>String(x.id)===id);
}
function applyRec(c,id,d,del){
  if(c==='att'){if(del)delete DB.att[id];else DB.att[id]=new Set(d.ids||[]);return}
  if(c==='kv'){if(del)return;if(id==='cfg')Object.assign(DB.cfg,d);else if(id==='tags')DB.tags=d.list||[];return}
  const a=DB[c];if(!a)return;const i=a.findIndex(x=>String(x.id)===id);
  if(del){if(i>=0)a.splice(i,1)}else if(i>=0)a[i]=d;else a.push(d);
}
const segFn=s=>f=>f.status==='Ativo'&&(!s.cat||f.cat===s.cat)&&(!s.part||f.part[s.part])&&(!s.mens||mensStatus(f)===s.mens);
function rebuild(){
  FAM.clear();PPL.clear();EV.clear();for(const k in IX)IX[k].clear();
  DB.fam.sort((a,b)=>norm(a.nome)<norm(b.nome)?-1:norm(a.nome)>norm(b.nome)?1:0);
  DB.fam.forEach(f=>{f._s=null;f.tags=f.tags||[];f.part=f.part||{};f.mens=f.mens||{ativa:false,valor:0,dia:10,forma:'PIX'};f.end=f.end||{};FAM.set(f.id,f)});
  DB.ppl.forEach(p=>{p.grupos=p.grupos||[];PPL.set(p.id,p);ixAdd(IX.ppl,p.fid,p)});
  DB.pay.forEach(x=>ixAdd(IX.pay,x.fid,x));DB.don.forEach(x=>ixAdd(IX.don,x.fid,x));DB.prom.forEach(x=>ixAdd(IX.prom,x.fid,x));
  DB.ct.forEach(x=>ixAdd(IX.ct,x.fid,x));DB.yz.forEach(x=>{x._n=undefined;ixAdd(IX.yz,x.fid,x)});
  const y1=addDays(TODAY,-365);
  DB.fam.forEach(f=>f._ev12=0);
  DB.ev.forEach(e=>{e.regs=e.regs||[];e.n0=e.n0||0;EV.set(e.id,e);e.regs.forEach(r=>{ixAdd(IX.reg,r.fid,e);const f=FAM.get(r.fid);if(f&&!e.cancel&&e.data>=y1&&e.data<TODAY)f._ev12++})});
  DB.seg.forEach(s=>s.fn=segFn(s));
  DB.log.sort(by(l=>l.em||'',-1));
}
function hydrate(recs){
  for(const c of COLLS)DB[c]=[];
  DB.att={};DB.tags=null;
  for(const r of recs)applyRec(r.c,r.id,r.d,false);
  rebuild();
  SY.snap=new Map();eachRec((c,id,r)=>SY.snap.set(c+'|'+id,J(r)));
}
function ensureDefaults(){
  const C=DB.cfg;
  const dft={nome:'Chai Menachem',cidade:'São Paulo – SP',mensPadrao:360,diaPadrao:10,
    regua:[{d:3,on:true,txt:'Lembrete amigável por WhatsApp, com link de pagamento'},{d:10,on:true,txt:'Segundo lembrete por WhatsApp'},{d:20,on:false,txt:'Tarefa para a secretaria ligar para a família'}],
    integr:{site:false,mp:false,wa:false}};
  for(const k in dft)if(C[k]==null)C[k]=dft[k];
  delete C.users;
  if(!Array.isArray(DB.tags))DB.tags=['Voluntário','Comissão','Novo na cidade','Profissional de saúde','Empresário','Fala hebraico'];
  if(!DB.tpl.length)[['Convite para evento','WhatsApp','Shalom {nome}! Convidamos você e sua família para {evento}, no dia {data}. Contamos com a sua presença!'],
    ['Lembrete de Shabat','WhatsApp','Shalom {nome}! Esperamos vocês nesta sexta-feira para o Kabalat Shabat e o Kidush. Shabat Shalom!'],
    ['Lembrete de yahrzeit','WhatsApp','Shalom {nome}. Lembramos que o yahrzeit de {falecido} será em {data_hebraica} ({data}). Se quiser, podemos reservar uma aliá ou organizar um Kidush em memória. Que a neshamá tenha aliá.'],
    ['Agradecimento por doação','WhatsApp','Shalom {nome}! Recebemos a sua doação de {valor}. Muito obrigado por apoiar a nossa comunidade. Tizku lemitzvot!'],
    ['Mensalidade em atraso','WhatsApp','Shalom {nome}! Identificamos que a mensalidade de {competencia} está em aberto. Se precisar de ajuda ou de outra forma de pagamento, fale com a secretaria.'],
    ['Feliz aniversário','WhatsApp','Mazal Tov, {nome}! Toda a comunidade Chai Menachem deseja um ano de saúde, alegria e muitas brachot. Ad mea veesrim!'],
    ['Boas-vindas','WhatsApp','Shalom {nome}! Que alegria ter a sua família conosco no Chai Menachem. Qualquer dúvida, estou à disposição.'],
    ['Mazal Tov','WhatsApp','Mazal Tov, {nome}! Toda a comunidade se alegra com vocês. Que seja com muita saúde e alegria.'],
    ['Informativo semanal','E-mail','Shalom {nome}! Veja a programação da semana no Chai Menachem: horários de Shabat, aulas e próximos eventos.']
  ].forEach(t=>DB.tpl.push({id:nid(),nome:t[0],canal:t[1],txt:t[2]}));
  if(!DB.auto.length)[['Lembrete de yahrzeit','7 dias antes da data, para o responsável da família','Lembrete de yahrzeit',true],['Parabéns no aniversário','No dia do aniversário de cada pessoa','Feliz aniversário',true],
    ['Cobrança de mensalidade','3 dias depois do vencimento sem pagamento','Mensalidade em atraso',true],['Agradecimento por doação','Assim que uma doação é registrada','Agradecimento por doação',true],
    ['Lembrete de evento','1 dia antes, para as famílias inscritas','Convite para evento',false],['Boas-vindas a novas famílias','No dia do cadastro, para o responsável','Boas-vindas',true],
    ['Resumo semanal para o rabino','Todo domingo, às 20h','Resumo da semana',true]
  ].forEach(a=>DB.auto.push({id:nid(),nome:a[0],quando:a[1],modelo:a[2],on:a[3]}));
  if(!DB.forms.length)[['cadastro','Cadastro de nova família','Cria a ficha da família e avisa a equipe para dar as boas-vindas.'],['kids','Inscrição no Chai Kids','Inscreve a criança e pede a autorização dos pais.'],
    ['contato','Pedido de contato com o rabino','Cria uma tarefa para o rabino retornar.'],['evento','Inscrição em evento','Inscreve a família e gera o pagamento, quando houver.']
  ].forEach(x=>DB.forms.push({id:nid(),k:x[0],nome:x[1],desc:x[2],resp:0,on:true}));
  DB.fam.forEach(f=>{if(f.sc0==null||!f.sc0d||diffDays(TODAY,f.sc0d)>30){f.sc0=score(f);f.sc0d=TODAY}});
}

/* ---- sincronização ---- */
const SYNC_TXT={ok:'Tudo salvo',saving:'Salvando…',err:'Sem conexão. Tentando de novo…',auth:'Sessão expirada'};
function syncBadge(){return `<span class="sync ${SY.state==='err'||SY.state==='auth'?'err':''}" role="status">${ic(SY.state==='ok'?'checkc':SY.state==='saving'?'cloud':'alert',13)}${SYNC_TXT[SY.state]}</span>`}
function setSync(s){if(SY.state===s)return;SY.state=s;document.querySelectorAll('.sync').forEach(el=>{el.outerHTML=syncBadge()})}
function scheduleSync(){clearTimeout(SY.timer);SY.timer=setTimeout(syncNow,600)}
async function syncNow(){
  if(SY.busy){scheduleSync();return}
  const ups=[],seen=new Set();
  eachRec((c,id,r)=>{const k=c+'|'+id,j=J(r);seen.add(k);if(SY.snap.get(k)!==j)ups.push([c,id,j])});
  const dels=[];for(const k of SY.snap.keys())if(!seen.has(k))dels.push(k);
  if(!ups.length&&!dels.length){if(SY.state==='saving')setSync('ok');return}
  SY.busy=true;setSync('saving');
  const body='{"up":['+ups.map(u=>'{"c":'+JSON.stringify(u[0])+',"id":'+JSON.stringify(u[1])+',"d":'+u[2]+'}').join(',')+'],"del":'+JSON.stringify(dels.map(k=>{const i=k.indexOf('|');return{c:k.slice(0,i),id:k.slice(i+1)}}))+'}';
  try{
    await apiCall('POST','/api/sync',body);
    ups.forEach(u=>SY.snap.set(u[0]+'|'+u[1],u[2]));dels.forEach(k=>SY.snap.delete(k));
    setSync('ok');
  }catch(e){
    if(e.status===401){setSync('auth');toast('Sua sessão terminou. Entre de novo para continuar salvando.',1);setTimeout(()=>location.reload(),2500)}
    else{setSync('err');setTimeout(scheduleSync,8000)}
  }finally{SY.busy=false}
}
const idle=()=>!S.modal&&!(document.activeElement&&document.activeElement.closest&&document.activeElement.closest('#page')&&/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName));
async function pull(){
  if(SY.busy||!idle()||SY.state==='auth')return;
  let r;try{r=await apiCall('GET','/api/changes?since='+SY.seq)}catch(e){return}
  if(!idle())return;
  let n=0;
  for(const x of r.records){
    const k=x.c+'|'+x.id,cur=findRec(x.c,x.id),curJ=cur===undefined?undefined:J(cur),sj=SY.snap.get(k);
    if(curJ!==sj)continue;
    if(x.del){if(cur===undefined)continue;applyRec(x.c,x.id,null,true);SY.snap.delete(k);n++}
    else{const nj=J(x.d);if(nj===curJ)continue;applyRec(x.c,x.id,x.d,false);SY.snap.set(k,J(findRec(x.c,x.id)));n++}
  }
  SY.seq=r.seq;
  if(n){rebuild();render()}
}
window.addEventListener('beforeunload',e=>{let dirty=SY.busy;if(!dirty)eachRec((c,id,r)=>{if(!dirty&&SY.snap.get(c+'|'+id)!==J(r))dirty=true});if(dirty){scheduleSync();e.preventDefault();e.returnValue=''}});

/* ---- telas de entrada ---- */
const authField=(id,label,type,ac)=>`<div class="field"><label for="${id}">${label}</label><input class="inp" id="${id}" type="${type}" autocomplete="${ac}" required></div>`;
function showAuth(mode){
  $('#app').style.display='none';
  const a=$('#auth');a.style.display='';
  const setup=mode==='setup';
  a.innerHTML=`<div class="auth"><form class="auth-card" id="auth-form" novalidate>
    <div class="auth-brand">${ic('temple',30,1.6)}<b>Chai Menachem</b></div>
    <h1>${setup?'Criar a conta do administrador':'Entrar'}</h1>
    <p class="sub">${setup?'Primeiro acesso ao sistema. Use o código de configuração que você recebeu.':'Use o e-mail e a senha cadastrados pela administração.'}</p>
    ${setup?authField('au-code','Código de configuração','text','one-time-code')+authField('au-nome','Seu nome','text','name'):''}
    ${authField('au-email','E-mail','email','username')}${authField('au-senha',setup?'Crie uma senha (pelo menos 8 caracteres)':'Senha','password',setup?'new-password':'current-password')}
    <p class="err" id="au-err" role="alert"></p>
    <button type="submit" class="btn btn-green" id="au-go">${setup?'Criar conta e entrar':'Entrar'}</button>
    ${setup?'':'<p class="hint" style="margin-top:14px">Esqueceu a senha? Peça para a administração criar uma nova.</p>'}</form></div>`;
  const f=$('#auth-form'),err=$('#au-err'),go=$('#au-go');
  (setup?$('#au-code'):$('#au-email')).focus();
  f.addEventListener('submit',async e=>{
    e.preventDefault();err.textContent='';
    const v=id=>($('#'+id)||{}).value||'',body={email:v('au-email').trim(),senha:v('au-senha')};
    if(setup){body.code=v('au-code').trim();body.nome=v('au-nome').trim();if(!body.code||!body.nome){err.textContent='Preencha todos os campos.';return}}
    if(!body.email||!body.senha){err.textContent='Informe o e-mail e a senha.';return}
    if(setup&&body.senha.length<8){err.textContent='A senha precisa ter pelo menos 8 caracteres.';return}
    go.disabled=true;go.textContent='Entrando…';
    try{await apiCall('POST',setup?'/api/setup':'/api/login',body);a.innerHTML='';a.style.display='none';await boot()}
    catch(x){err.textContent=x.message;go.disabled=false;go.textContent=setup?'Criar conta e entrar':'Entrar'}
  });
}
function showFatal(msg){$('#app').style.display='none';const a=$('#auth');a.style.display='';a.innerHTML=`<div class="auth"><div class="auth-card"><div class="auth-brand">${ic('temple',30,1.6)}<b>Chai Menachem</b></div><h1>Não foi possível abrir o sistema</h1><p class="sub">${esc(msg)}</p><button type="button" class="btn btn-green" onclick="location.reload()">Tentar de novo</button></div></div>`}

/* ---- usuário: senha e saída ---- */
async function loadUsers(){try{DB.users=(await apiCall('GET','/api/users')).users}catch(e){}}
A.userMenu=el=>openMenu(el,[{label:me().nome+' · '+me().papel,icon:'user',act:'noop'},'-',{label:'Alterar minha senha',icon:'lock',act:'trocarSenha'},{label:'Sair',icon:'back',act:'sair',danger:true}]);
A.noop=()=>{};
A.sair=async()=>{await syncNow();try{await apiCall('POST','/api/logout',{})}catch(e){}location.reload()};
function asyncForm(o){
  openModal({title:o.title,body:(o.intro?`<p class="intro">${o.intro}</p>`:'')+`<div class="fgrid">${o.fields.map(fieldHTML).join('')}</div>`,
    footer:`<button type="button" class="btn" data-act="closeModal">Cancelar</button><button type="submit" class="btn btn-green" id="af-go">${o.submit||'Salvar'}</button>`,
    async onSubmit(form){
      const v={};o.fields.forEach(f=>{const el=form.querySelector('#ff-'+f.k);v[f.k]=f.type==='check'?el.checked:el.value.trim()});
      const b=$('#af-go');b.disabled=true;
      try{const msg=await o.run(v);closeModal();render();if(msg)toast(msg)}catch(e){const m=$('#m-err');if(m)m.textContent=e.message;b.disabled=false}
    }});
}
A.trocarSenha=()=>asyncForm({title:'Alterar minha senha',submit:'Alterar senha',fields:[{k:'atual',label:'Senha atual',type:'password',req:true},{k:'nova',label:'Nova senha (pelo menos 8 caracteres)',type:'password',req:true,half:true},{k:'nova2',label:'Repita a nova senha',type:'password',req:true,half:true}],
  async run(v){if(v.nova!==v.nova2)throw new Error('As duas senhas novas não são iguais.');await apiCall('POST','/api/senha',{atual:v.atual,nova:v.nova});return 'Senha alterada.'}});

/* ---- usuários (administrador) ---- */
const userActs=x=>`<button type="button" class="btn btn-sm" data-act="editUser" data-id="${x.id}">${ic('edit',13)}Editar</button>`;
A.novoUser=()=>asyncForm({title:'Novo usuário',submit:'Criar usuário',intro:'Passe o e-mail e a senha temporária para a pessoa. Ela pode trocar a senha depois de entrar.',fields:[
  {k:'nome',label:'Nome',req:true,half:true},{k:'email',label:'E-mail',type:'email',req:true,ph:'nome@email.com',half:true},
  {k:'papel',label:'Perfil',type:'select',opts:Object.keys(ROLES),val:'Secretária',half:true},{k:'senha',label:'Senha temporária (pelo menos 8 caracteres)',req:true,half:true}],
  async run(v){await apiCall('POST','/api/users',v);await loadUsers();return 'Usuário '+v.nome+' criado com o perfil '+v.papel+'.'}});
A.editUser=el=>{const x=DB.users.find(u=>u.id===+el.dataset.id);if(!x)return;asyncForm({title:'Editar '+x.nome,submit:'Salvar',fields:[
  {k:'papel',label:'Perfil',type:'select',opts:Object.keys(ROLES),val:x.papel,half:true},{k:'senha',label:'Nova senha (deixe em branco para manter)',half:true},
  {k:'ativo',label:'Acesso ativo',type:'check',val:x.ativo!==false}],
  async run(v){await apiCall('PATCH','/api/users/'+x.id,{papel:v.papel,ativo:v.ativo,senha:v.senha||undefined});await loadUsers();if(x.id===S.uid){const u=DB.users.find(y=>y.id===x.id);if(u)S.user=u}return 'Usuário '+x.nome+' atualizado.'}})};

/* ---- início ---- */
const PAGES={painel:pgPainel,familias:pgFamilias,'nova-familia':pgFamForm,'editar-familia':pgFamForm,familia:pgFamilia,pessoa:pgPessoa,pessoas:()=>pgPessoas('pessoas'),criancas:()=>pgKids('criancas'),teens:()=>pgKids('teens'),'bar-mitzva':pgBarMitzva,aniversariantes:pgAniv,yahrzeits:pgYahrzeits,
  contatar:pgContatar,tarefas:pgTarefas,engajamento:pgEngaj,momentos:pgMomentos,
  financeiro:r=>r.id?pgFinFam(r.id):pgFinanceiro(),campanhas:pgCampanhas,cobranca:pgCobranca,recibos:pgRecibos,
  eventos:pgEventos,evento:pgEvento,aulas:pgAulas,presencas:pgPresencas,calendario:pgCalendario,
  comunicacao:pgCom,portal:pgPortal,relatorios:pgRel,configuracoes:pgConfig2};
let booted=false;
async function boot(){
  let meR;
  try{meR=await apiCall('GET','/api/me')}
  catch(e){if(e.status===401)return showAuth(e.data&&e.data.setup?'setup':'login');return showFatal(e.message)}
  S.user=meR.user;S.uid=meR.user.id;DB.users=[meR.user];
  let data;
  try{await loadUsers();data=await apiCall('GET','/api/data')}catch(e){return showFatal(e.message)}
  hydrate(data.records);SY.seq=data.seq;
  ensureDefaults();
  $('#auth').style.display='none';$('#app').style.display='';
  if(!booted){
    booted=true;
    $('#nav-btn').innerHTML=ic('menu',20);
    $('.gbar .search').insertAdjacentHTML('afterbegin',ic('search',15));
    setInterval(pull,30000);
    window.addEventListener('focus',()=>pull());
  }
  let r='';try{r=location.hash.slice(1)}catch(e){}
  const p=parseRoute(r);S.route=r&&PAGES[p.name]&&!['nova-familia','editar-familia'].includes(p.name)?r:'painel';S.top=true;render();
}
boot();
