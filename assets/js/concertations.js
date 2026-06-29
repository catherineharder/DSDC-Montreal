/* Section « Concertations » rendu à partir de window.CONC dans #conc-root.
   GABARIT RÉUTILISABLE : pour créer une nouvelle section dans le même style,
   copier ce trio de fichiers (concertations.css / concertations.data.js / concertations.js),
   renommer #conc-root et window.CONC, puis ajouter l'onglet dans index.html (voir README). */
(function () {
  var root = document.getElementById('conc-root');
  if (!root || !window.CONC) return;
  var D = window.CONC;

  var INT = {dir:["Direction","var(--i-dir)"],eusp:["EUSP","var(--i-eusp)"],jeun:["Jeunesse","var(--i-jeun)"],pcmi:["PCMI","var(--i-pcmi)"],ecos:["ÉCoS","var(--i-ecos)"]};
  var SECT = {min:["Ministères","var(--min)"],rss:["Santé / RSSS","var(--rss)"],mun:["Municipal","var(--gov)"],rec:["Recherche","var(--rec)"],fond:["Philanthropie","var(--fond)"],comm:["Communautaire","var(--comm)"],cit:["Citoyens","var(--cit)"],drsp:["DRSP / EUSP","var(--drsp-sect)"]};
  var PAR2SECT = {min:"min",mun:"mun",com:"comm",ciu:"rss",fond:"fond"};
  var NIVL = {strat:"Stratégique",tact:"Tactique",oper:"Opérationnel"};

  function partnersHTML(fams) {
    return fams.map(function (F) {
      var boxes = F.boxes.map(function (b) {
        var rel = b.rel ? '<span class="rel">(' + b.rel + ')</span>' : '';
        var full = b.full ? '<span class="pfull">' + b.full + '</span>' : '';
        return '<button class="pbox' + (b.sub ? ' sub' : '') + '" data-pid="' + b.id + '"><span class="ac">' + b.ac + ' ' + rel + '</span>' + full + '</button>';
      }).join('');
      return '<div class="fam"><h3><span class="fdot ' + F.dot + '"></span>' + F.label + '</h3><div class="boxgrid t-' + F.key + '">' + boxes + '</div></div>';
    }).join('');
  }
  function defsHTML(defs) {
    return defs.map(function (d) {
      return '<div class="def"><dt>' + d.t + (d.ac ? '<span class="ac">' + d.ac + '</span>' : '') + '</dt><dd>' + d.d + '</dd></div>';
    }).join('');
  }
  var LEG = '<div class="legend-box"><div class="legend-row">'
    + '<span class="lg"><span class="sw" style="background:var(--nf-strat)"></span>Stratégique</span>'
    + '<span class="lg"><span class="sw" style="background:var(--nf-tact)"></span>Tactique</span>'
    + '<span class="lg"><span class="sw" style="background:var(--nf-oper)"></span>Opérationnel</span>'
    + '<span class="lg"><span class="sq sq-drsp"></span>DRSP coordonnatrice</span>'
    + '<span class="lg"><span class="star star-new">★</span>Nouveau (&lt; 1 an)</span>'
    + '</div></div>';

  root.innerHTML =
    '<div class="layout"><div class="pane-left">'
    + '<div class="pagehead"><h1>Concertations</h1><div class="conc-search"><span class="conc-noresult" id="conc-noresult">Aucun résultat</span><input id="conc-q" type="search" autocomplete="off" placeholder="Rechercher…"></div></div>'
    + '<section class="cblock" id="c-partenaires"><h2>Partenaires</h2>' + partnersHTML(D.famsP) + '</section>'
    + '<section class="cblock" id="c-comites"><h2>Comités</h2>' + LEG + '<div id="ctree"></div></section>'
    + '<section class="cblock" id="c-definitions"><h2>Définitions</h2><dl>' + defsHTML(D.defs) + '</dl></section>'
    + '</div>'
    + '<div class="pane-right" id="pane-right"><div class="info-inner" id="info">'
    + '<div class="info-empty"><span class="big">Aucune sélection.</span>Cliquez sur un comité ou un partenaire pour afficher l\'information ici.</div>'
    + '</div></div></div>';

  var C = D.committees, P = [];
  D.famsP.forEach(function (F) { F.boxes.forEach(function (b) { P.push(b); }); });

  var tree = root.querySelector('#ctree');
  D.famsC.forEach(function (F) {
    var items = C.filter(function (c) { return c.fam === F.key; });
    if (!items.length) return;
    var fam = document.createElement('div'); fam.className = 'cfam';
    fam.innerHTML = '<h3>' + F.label + '</h3>';
    var grid = document.createElement('div'); grid.className = 'cgrid';
    items.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'cbox nv-' + c.niv + (c.ina ? ' ina' : '');
      b.setAttribute('data-id', c.id);
      var marks = '';
      if (c.drsp === 'lead') marks += '<span class="mk-drsp" title="DRSP porteuse"></span>';
      if (c.neu) marks += '<span class="mk-new" title="Nouveau">★</span>';
      b.innerHTML = '<div class="ctop"><span class="cname">' + c.name + '</span><span class="marks">' + marks + '</span></div>'
        + (c.full && c.full !== c.name ? '<span class="cfull">' + c.full + '</span>' : '')
        + (c.under ? '<span class="under">↳ ' + c.under + '</span>' : '')
        + (c.ina ? '<span class="inatag">inactif</span>' : '');
      grid.appendChild(b);
    });
    fam.appendChild(grid); tree.appendChild(fam);
  });

  var info = root.querySelector('#info'), pane = root.querySelector('#pane-right'), byId = {};
  C.forEach(function (c) { byId[c.id] = c; });
  var cboxes = root.querySelectorAll('.cbox');
  var pboxes = root.querySelectorAll('.pbox');
  function clearActive() { cboxes.forEach(function (x) { x.classList.remove('active'); }); pboxes.forEach(function (x) { x.classList.remove('active'); }); }
  function nivColor(k) { return {strat:'var(--nf-strat)',tact:'var(--nf-tact)',oper:'var(--nf-oper)'}[k]; }
  // Nom complet épelé, acronyme (court) entre parenthèses. Pas de sous-titre séparé.
  // Si « acr » est en réalité un nom court (non un acronyme), on n'affiche que le nom complet.
  function titleAcr(full, acr) {
    if (!full || full === acr) return acr || full;
    return (acr && acr.length <= 14) ? full + ' (' + acr + ')' : full;
  }
  // Champ « sous-titre gras + texte ». Omis si vide (à documenter).
  function fld(label, val) { return val ? '<div class="fld"><p class="fl">' + label + '</p><p class="fv">' + val + '</p></div>' : ''; }
  // Présence interne en liste à puces (sans pastilles de couleur). Omise si vide.
  function presBlock(codes) {
    if (!codes || !codes.length) return '';
    var items = codes.map(function (x) { var m = INT[x]; return m ? '<li>' + m[0] + '</li>' : ''; }).join('');
    return items ? '<div class="fld"><p class="fl">Présence interne (DRSP)</p><ul class="blist">' + items + '</ul></div>' : '';
  }
  // Composition en liste à puces. Omise si rien à afficher.
  // Composition : « membre (catégorie) », ordonnée porteur -> DRSP -> autres.
  function compBlock(c) {
    var list = c.comp || [];
    if (!list.length) return '';
    function rank(cat) { var n = normC(cat); if (n.indexOf('porteur') === 0) return 0; if (n === 'drsp') return 1; return 2; }
    var sorted = list.slice().sort(function (a, b) { return rank(a.cat) - rank(b.cat); });
    var items = sorted.map(function (x) {
      var lab = x.cat ? ' <span class="mcat">(' + x.cat + ')</span>' : '';
      return '<li>' + x.m + lab + '</li>';
    }).join('');
    return '<div class="fld"><p class="fl">Composition</p><ul class="blist">' + items + '</ul></div>';
  }
  function renderCommittee(id) {
    var c = byId[id]; if (!c) return;
    info.innerHTML =
      '<h3 class="info-title">' + titleAcr(c.full, c.name) + '</h3>'
      + fld('Mandat', c.man)
      + compBlock(c);
    pane.scrollTop = 0;
  }
  function renderPartner(pid) {
    var p = null; P.forEach(function (x) { if (x.id === pid) p = x; }); if (!p) return;
    var coms = (p.coms || []).map(function (id) { return byId[id]; }).filter(Boolean), list = '';
    if (coms.length) {
      list = '<div class="fld"><p class="fl">Présent dans les comités</p><ul class="blist">' + coms.map(function (c) {
        return '<li><button class="comlink" data-go="' + c.id + '">' + titleAcr(c.full, c.name) + '</button></li>';
      }).join('') + '</ul></div>';
    }
    info.innerHTML =
      '<h3 class="info-title">' + titleAcr(p.full, p.ac) + '</h3>'
      + list;
    pane.scrollTop = 0;
    info.querySelectorAll('.comlink').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var gid = btn.getAttribute('data-go');
        clearActive(); renderCommittee(gid);
        var tgt = root.querySelector('.cbox[data-id="' + gid + '"]');
        if (tgt) { tgt.classList.add('active'); if (tgt.scrollIntoView) tgt.scrollIntoView({behavior:'smooth', block:'center'}); }
      });
    });
  }
  cboxes.forEach(function (b) { b.addEventListener('click', function () { clearActive(); b.classList.add('active'); renderCommittee(b.getAttribute('data-id')); }); });
  pboxes.forEach(function (b) { b.addEventListener('click', function () { clearActive(); b.classList.add('active'); renderPartner(b.getAttribute('data-pid')); }); });

  /* ---- Recherche : filtre les partenaires, comités et définitions en place ---- */
  function normC(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  var qInput = root.querySelector('#conc-q');
  var noResult = root.querySelector('#conc-noresult');
  if (qInput) {
    qInput.addEventListener('input', function () {
      var nq = normC(qInput.value.trim());
      var total = 0;
      // Partenaires : masque les boites, puis les familles vides
      root.querySelectorAll('#c-partenaires .fam').forEach(function (fam) {
        var any = false;
        fam.querySelectorAll('.pbox').forEach(function (b) {
          var hit = !nq || normC(b.textContent).indexOf(nq) >= 0;
          b.style.display = hit ? '' : 'none'; if (hit) { any = true; total++; }
        });
        fam.style.display = any ? '' : 'none';
      });
      // Comités : masque les boites, puis les familles vides
      root.querySelectorAll('#ctree .cfam').forEach(function (fam) {
        var any = false;
        fam.querySelectorAll('.cbox').forEach(function (b) {
          var hit = !nq || normC(b.textContent).indexOf(nq) >= 0;
          b.style.display = hit ? '' : 'none'; if (hit) { any = true; total++; }
        });
        fam.style.display = any ? '' : 'none';
      });
      // Définitions
      root.querySelectorAll('#c-definitions .def').forEach(function (d) {
        var hit = !nq || normC(d.textContent).indexOf(nq) >= 0;
        d.style.display = hit ? '' : 'none'; if (hit) total++;
      });
      // Masque toute section (Partenaires / Comités / Définitions) sans résultat
      root.querySelectorAll('.cblock').forEach(function (sec) {
        var anyVis = [].some.call(sec.querySelectorAll('.pbox, .cbox, .def'), function (n) { return n.style.display !== 'none'; });
        sec.style.display = (!nq || anyVis) ? '' : 'none';
      });
      if (noResult) noResult.style.display = (nq && total === 0) ? 'inline' : 'none';
    });
  }
})();
