/* KAIROS — botões que estavam sem ação (ordens, filtros, detalhes, histórico, agendar) */
(function(){
  const $q=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>[...(r||document).querySelectorAll(s)];
  const go=id=>showView(id, document.querySelector('.nav-item[data-view="'+id+'"]'));

  /* ---- Ordens de Serviço: botões de escolha (só um selecionado por grupo) ---- */
  $$('#ordens .choice-row').forEach(row=>{
    row.addEventListener('click',e=>{
      const b=e.target.closest('.choice-btn'); if(!b||b.disabled) return;
      $$('.choice-btn',row).forEach(x=>{ x.classList.remove('sel-red','sel-green','sel-orange','sel-blue'); });
      b.classList.add(b.dataset.sel||'sel-blue');
    });
  });

  /* ---- Ordens de Serviço: abrir nova ordem ---- */
  const abrir=$q('#os-abrir');
  if(abrir) abrir.addEventListener('click',()=>{
    const maq=$q('#os-maquina').value;
    const tipo=($q('#os-tipo .choice-btn[class*="sel-"]')||{dataset:{}}).dataset.value;
    const urg=($q('#os-urg .choice-btn[class*="sel-"]')||{dataset:{}}).dataset.value;
    const desc=$q('#os-desc').value.trim();
    if(!maq) return toast('Escolha a máquina que precisa de atenção',true);
    if(!tipo||!urg) return toast('Escolha o tipo e a urgência',true);
    if(!desc) return toast('Descreva o problema em poucas palavras',true);
    const cor={Corretiva:'red',Preventiva:'green',Preditiva:''}[tipo];
    const nome=(typeof U!=='undefined'&&U.nome)?U.nome:'Você';
    const row=document.createElement('div'); row.className='list-row';
    const tag=document.createElement('span'); tag.className='tag '+cor; tag.textContent=tipo;
    const main=document.createElement('div'); main.className='row-main';
    const t=document.createElement('div'); t.className='row-title'; t.textContent=maq+' · '+urg;
    const s=document.createElement('div'); s.className='row-sub'; s.textContent='Aberta por: '+nome+' — '+desc;
    main.append(t,s);
    const d=document.createElement('div'); d.className='row-date'; d.textContent='Aberta agora';
    row.append(tag,main,d);
    $q('#os-lista').prepend(row);
    const n=$$('#os-lista .list-row').length;
    $q('#os-titulo').firstChild.textContent='Ordens abertas ('+n+')';
    $q('#os-maquina').value=''; $q('#os-desc').value='';
    toast('Ordem de serviço aberta para '+maq);
  });

  /* ---- Equipamentos: filtros + busca ---- */
  const chips=$$('#equipamentos .toolbar .chip'), busca=$q('#eq-busca'), grid=$q('#eq-grid');
  const cores=[null,'green','orange','red'];
  let vazio=null;
  function filtrar(){
    const ativo=Math.max(0,chips.findIndex(c=>c.classList.contains('active')));
    const q=(busca.value||'').toLowerCase().trim();
    let n=0;
    $$('.item-card',grid).forEach(card=>{
      const okCor=!cores[ativo]||card.querySelector('.item-top .tag').classList.contains(cores[ativo]);
      const okNome=!q||card.querySelector('.item-name').textContent.toLowerCase().includes(q);
      const show=okCor&&okNome; card.style.display=show?'':'none'; if(show) n++;
    });
    if(!n&&!vazio){ vazio=document.createElement('div'); vazio.className='help-strip'; vazio.innerHTML='<span>🔍</span><div><b>Nenhuma máquina encontrada</b>Tente outro filtro ou outro nome.</div>'; grid.after(vazio); }
    if(vazio) vazio.style.display=n?'none':'';
  }
  chips.forEach(c=>c.addEventListener('click',()=>{ chips.forEach(x=>x.classList.toggle('active',x===c)); filtrar(); }));
  if(busca) busca.addEventListener('input',filtrar);

  /* ---- Equipamentos: Ver detalhes / ordem de serviço ---- */
  function painel(card,html){
    let p=card.querySelector(':scope > .det');
    if(p){ p.remove(); return; }
    p=document.createElement('div'); p.className='com det'; p.innerHTML=html;
    const btn=card.querySelector(':scope > button'); btn.after(p);
  }
  const esc2=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  $$('#equipamentos .item-card > button').forEach(btn=>{
    btn.type='button';
    btn.addEventListener('click',()=>{
      const card=btn.closest('.item-card');
      if(/ordem/i.test(btn.textContent)){
        go('ordens');
        const nome=card.querySelector('.item-name').textContent.trim();
        const sel=$q('#os-maquina'); const op=[...sel.options].find(o=>o.textContent.trim()===nome);
        if(op&&!sel.disabled) sel.value=op.value;
        return;
      }
      const nome=card.querySelector('.item-name').textContent, setor=card.querySelector('.item-loc').textContent, st=card.querySelector('.item-top .tag').textContent;
      const fatos=$$('.fact',card).map(f=>esc2(f.firstChild.textContent.trim())+': <b>'+esc2(f.querySelector('b').textContent)+'</b>').join('<br>');
      painel(card,'<b>'+esc2(nome)+'</b><br>Setor: '+esc2(setor)+'<br>Situação: '+esc2(st)+'<br>'+fatos);
    });
  });

  /* ---- Técnicos: Ver histórico (usa as ordens abertas da página) ---- */
  $$('#tecnicos .item-card > button').forEach(btn=>{
    btn.type='button';
    btn.addEventListener('click',()=>{
      const card=btn.closest('.item-card'), nome=card.querySelector('.item-name').textContent.trim();
      const ordens=$$('#os-lista .list-row').filter(r=>r.querySelector('.row-sub').textContent.includes(nome));
      const html=ordens.length
        ? '<b>Ordens abertas com '+esc2(nome)+'</b><br>'+ordens.map(r=>esc2(r.querySelector('.row-title').textContent)).join('<br>')
        : 'Nenhuma ordem aberta com '+esc2(nome)+' no momento.';
      painel(card,html);
    });
  });

  /* ---- Preventiva: Agendar agora ---- */
  $$('#preventiva .list-row > button').forEach(btn=>{
    btn.type='button';
    btn.addEventListener('click',()=>{
      const row=btn.closest('.list-row'), nome=row.querySelector('.row-title').textContent.trim();
      const tag=row.querySelector('.tag'); if(tag){ tag.className='tag orange'; tag.textContent='Agendada'; }
      const d=document.createElement('div'); d.className='row-date'; d.textContent='Agendada';
      btn.replaceWith(d);
      toast('Revisão de '+nome+' agendada');
    });
  });
})();
