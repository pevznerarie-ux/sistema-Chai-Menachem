/* ================= início ================= */
const PAGES={painel:pgPainel,familias:pgFamilias,'nova-familia':pgFamForm,'editar-familia':pgFamForm,familia:pgFamilia,pessoa:pgPessoa,pessoas:()=>pgPessoas('pessoas'),criancas:()=>pgKids('criancas'),teens:()=>pgKids('teens'),'bar-mitzva':pgBarMitzva,aniversariantes:pgAniv,yahrzeits:pgYahrzeits,
  contatar:pgContatar,tarefas:pgTarefas,engajamento:pgEngaj,momentos:pgMomentos,
  financeiro:r=>r.id?pgFinFam(r.id):pgFinanceiro(),campanhas:pgCampanhas,cobranca:pgCobranca,recibos:pgRecibos,
  eventos:pgEventos,evento:pgEvento,aulas:pgAulas,presencas:pgPresencas,calendario:pgCalendario,
  comunicacao:pgCom,portal:pgPortal,relatorios:pgRel,configuracoes:pgConfig2};
seed();seed2();
$('#nav-btn').innerHTML=ic('menu',20);
$('.gbar .search').insertAdjacentHTML('afterbegin',ic('search',15));
(function(){let r='';try{r=location.hash.slice(1)}catch(e){}const p=parseRoute(r);S.route=r&&PAGES[p.name]&&!['nova-familia','editar-familia'].includes(p.name)?r:'painel';S.top=true;render()})();
