/* Trinity Advisory shared advisor loader for client tools.
   Fills a <select> with the senior advisor list from the Trinity Power Automate flow
   (action getAdvisors, the same flow the org-chart tool uses). Keeps the first
   placeholder option, re-applies any value already selected (for example from saved
   state), and falls back to a built-in list if the flow is unreachable.

   Usage:  <script src="trinity-advisors.js"></script>
           <script>trinityLoadAdvisors('advisorName', { extra: ['Not sure'] });</script>
   window.trinityAdvisorsReady resolves with the advisor array once the select is filled.
   window.trinityAdvisorEmail(name) returns the advisor's email, or '' if unknown. */
(function () {
  var URL = 'https://app.trinityadvisory.com.au/api/flow/advisors';  // Trinity app relay; the flow URL stays server-side
  var FALLBACK = [
    { name: 'Andrea Szunyogh-Szasz', email: 'andrea.szasz@trinityadvisory.com.au' },
    { name: 'Conor Sarran',          email: 'conor.sarran@trinityadvisory.com.au' },
    { name: 'Josh Sherrington',      email: 'josh.sherrington@trinityadvisory.com.au' },
    { name: 'Joshua Patten',         email: 'joshua.patten@trinityadvisory.com.au' },
    { name: 'Nick Mulqueen',         email: 'nick.mulqueen@trinityadvisory.com.au' },
    { name: 'Richard Caldecott',     email: 'richard.caldecott@trinityadvisory.com.au' }
  ];
  var byName = {};

  function normalise(list) {
    return (Array.isArray(list) ? list : (list && list.advisors) || [])
      .map(function (a) { return { name: a.name || a.advisorName || '', email: a.email || a.advisorEmail || '' }; })
      .filter(function (a) { return a.name; })
      .sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  function fill(sel, list, extra) {
    var current = sel.value;
    var placeholder = sel.options.length ? sel.options[0] : null;
    sel.innerHTML = '';
    if (placeholder) sel.appendChild(placeholder);
    byName = {};
    list.forEach(function (a) {
      byName[a.name] = a.email;
      var o = document.createElement('option');
      o.value = a.name; o.textContent = a.name; sel.appendChild(o);
    });
    (extra || []).forEach(function (t) {
      var o = document.createElement('option');
      o.value = t; o.textContent = t; sel.appendChild(o);
    });
    if (current) sel.value = current;
  }

  window.trinityAdvisorEmail = function (name) { return byName[name] || ''; };

  window.trinityLoadAdvisors = function (selectId, opts) {
    opts = opts || {};
    var sel = document.getElementById(selectId);
    window.trinityAdvisorsReady = (function () {
      if (!sel) return Promise.resolve([]);
      return fetch(URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'getAdvisors' }) })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (data) { var list = normalise(data); if (!list.length) throw new Error('empty'); return list; })
        .catch(function (err) { console.warn('Advisor list fetch failed, using fallback:', err); return FALLBACK.slice(); })
        .then(function (list) { fill(sel, list, opts.extra); return list; });
    })();
    return window.trinityAdvisorsReady;
  };
})();
