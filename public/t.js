/*! Axeon site tracking. One line on a client's site:
 *    <script defer src="https://axeonstudio.co/t.js" data-site="ax_xxxxxxxxxxxxxx"></script>
 *  Sends page views, clicks on the buttons that matter (call, text, email,
 *  form, book online, directions, reviews, social links, and any <button> or
 *  .btn/.cta link), and one "leave" ping per page with time spent, scroll
 *  depth and load speed, to axeonstudio.co/api/t. No cookies, nothing
 *  personal. Add data-axeon="quote" to any element to name its clicks.
 *  data-host="example.com" limits recording to that host (previews and staging
 *  stay out). window.axeonTrack('book') records a click by name from your code.
 *  Opening the site once with ?ax_ignore=1 leaves that browser out from then on
 *  (the owner's own phone and laptop); ?ax_ignore=0 counts it again. That flag
 *  in local storage is the only thing the script ever keeps on a device.
 */
(function () {
  var s = document.currentScript;
  if (!s) return;
  var key = s.getAttribute('data-site');
  if (!key) return;
  var endpoint = s.getAttribute('data-endpoint') || 'https://axeonstudio.co/api/t';
  if (navigator.webdriver) return;
  if (/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname)) return;
  var only = s.getAttribute('data-host');
  if (only && location.hostname.replace(/^www\./, '') !== only.replace(/^www\./, '')) return;

  // ── The owner's own devices ──
  // ?ax_ignore=1 marks this browser as "do not count" (the shop owner checking
  // their own site); ?ax_ignore=0 clears it. A small notice confirms the change.
  var IGNORE = 'ax_ignore';
  try {
    var flag = /[?&]ax_ignore=(1|0)(&|$)/.exec(location.search);
    if (flag) {
      if (flag[1] === '1') localStorage.setItem(IGNORE, '1');
      else localStorage.removeItem(IGNORE);
      notice(flag[1] === '1' ? 'Axeon: visits from this device are no longer counted.' : 'Axeon: visits from this device are counted again.');
    }
    if (localStorage.getItem(IGNORE) === '1') return;
  } catch (_) {}

  function notice(msg) {
    function show() {
      try {
        var n = document.createElement('div');
        n.setAttribute('role', 'status');
        n.style.cssText =
          'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:2147483647;max-width:calc(100vw - 32px);padding:10px 16px;border-radius:10px;background:#0B0D12;color:#fff;font:600 14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25)';
        n.textContent = msg;
        document.body.appendChild(n);
        setTimeout(function () {
          if (n.parentNode) n.parentNode.removeChild(n);
        }, 6000);
      } catch (_) {}
    }
    if (document.body) show();
    else addEventListener('DOMContentLoaded', show);
  }

  function post(data) {
    data.k = key;
    data.h = location.hostname;
    var body = JSON.stringify(data);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(endpoint, new Blob([body], { type: 'text/plain' }))) return;
    } catch (_) {}
    try {
      fetch(endpoint, { method: 'POST', body: body, keepalive: true, mode: 'no-cors', headers: { 'content-type': 'text/plain' } });
    } catch (_) {}
  }

  // ── Page state: what the "leave" ping reports ──
  var page = null; // { path, started, active, lastActive, maxScroll, sent }
  var lcp = 0;
  try {
    new PerformanceObserver(function (list) {
      var entries = list.getEntries();
      if (entries.length) lcp = Math.round(entries[entries.length - 1].startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (_) {}

  function loadMs() {
    if (lcp > 0) return lcp;
    try {
      var nav = performance.getEntriesByType('navigation')[0];
      if (nav && nav.domContentLoadedEventEnd > 0) return Math.round(nav.domContentLoadedEventEnd);
    } catch (_) {}
    return 0;
  }

  function scrollPct() {
    var doc = document.documentElement;
    var total = Math.max(1, (doc.scrollHeight || 0) - (window.innerHeight || 0));
    var pct = Math.round(((window.scrollY || doc.scrollTop || 0) / total) * 100);
    return Math.max(0, Math.min(100, pct));
  }

  function tick() {
    if (!page || document.visibilityState !== 'visible') return;
    var now = Date.now();
    // Count time only while the tab is visible and the person did something in the last 30s.
    if (now - page.lastActive < 30000) page.active += Math.min(now - page.tickAt, 5000);
    page.tickAt = now;
    var sp = scrollPct();
    if (sp > page.maxScroll) page.maxScroll = sp;
  }
  setInterval(tick, 5000);

  function touched() {
    if (page) page.lastActive = Date.now();
  }
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) {
    addEventListener(ev, touched, { passive: true, capture: true });
  });

  function leave() {
    if (!page || page.sent) return;
    tick();
    page.sent = true;
    post({ e: 'leave', p: page.path, t: Math.round(page.active / 1000), s: page.maxScroll, ms: loadMs() });
  }

  function view() {
    if (page && page.path === location.pathname) return;
    leave();
    var now = Date.now();
    page = { path: location.pathname, active: 0, lastActive: now, tickAt: now, maxScroll: scrollPct(), sent: false };
    post({ e: 'view', p: location.pathname, r: document.referrer || undefined, w: window.innerWidth, u: location.search || undefined });
  }

  addEventListener('pagehide', leave);
  addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') leave();
    else if (page && page.sent) {
      // Came back to the tab after we already reported: start a fresh count for this page.
      page = { path: page.path, active: 0, lastActive: Date.now(), tickAt: Date.now(), maxScroll: page.maxScroll, sent: false };
    }
  });

  // Sites built as single-page apps change the URL without a reload.
  var push = history.pushState;
  if (push) {
    history.pushState = function () {
      push.apply(this, arguments);
      setTimeout(view, 0);
    };
  }
  addEventListener('popstate', function () {
    setTimeout(view, 0);
  });

  // ── Clicks ──
  var BOOKING = /(^|\.)(cal\.com|calendly\.com|acuityscheduling\.com|squareup\.com|square\.site|booksy\.com|housecallpro\.com|getjobber\.com|servicetitan\.com|setmore\.com|vagaro\.com|schedulicity\.com|appointlet\.com|zocdoc\.com)$/i;
  var MAPS = /(maps\.google\.|google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl|apple\.com\/maps|maps\.apple\.com|waze\.com)/i;
  var REVIEW = /(g\.page\/.*\/review|search\.google\.com\/local\/writereview|writereview|\/review(s)?\/?(\?|$)|yelp\.com\/writeareview|facebook\.com\/.*\/reviews)/i;
  var GOOGLE_BIZ = /(g\.page\/|business\.google\.com|g\.co\/kgs|google\.com\/search\?.*(ludocid|lrd)=)/i;

  function text(el) {
    var t = (el.getAttribute('aria-label') || el.textContent || el.value || '').replace(/\s+/g, ' ').trim().toLowerCase();
    return t.slice(0, 40);
  }

  function nameFor(el) {
    var custom = el.getAttribute('data-axeon');
    if (custom) return custom;
    var href = el.getAttribute('href') || '';
    if (/^tel:/i.test(href)) return 'call';
    if (/^sms:/i.test(href)) return 'text';
    if (/^mailto:/i.test(href)) return 'email';
    if (href) {
      var host = '';
      try {
        host = new URL(href, location.href).hostname.replace(/^www\./, '');
      } catch (_) {}
      if (host && BOOKING.test(host)) return 'book';
      if (REVIEW.test(href)) return 'review';
      if (MAPS.test(href)) return 'directions';
      if (GOOGLE_BIZ.test(href)) return 'google-business';
      if (/(^|\.)(facebook|fb)\.com$/i.test(host)) return 'facebook';
      if (/(^|\.)instagram\.com$/i.test(host)) return 'instagram';
      if (/(^|\.)tiktok\.com$/i.test(host)) return 'tiktok';
      if (/(^|\.)(youtube\.com|youtu\.be)$/i.test(host)) return 'youtube';
    }
    var tag = el.tagName;
    var type = (el.getAttribute('type') || '').toLowerCase();
    // Submit buttons are counted once, by the form's submit event, not per click.
    if ((tag === 'BUTTON' && (type === 'submit' || (!type && el.form))) || (tag === 'INPUT' && type === 'submit')) return null;
    var cls = ' ' + (typeof el.className === 'string' ? el.className : '') + ' ';
    if (tag === 'BUTTON' || el.getAttribute('role') === 'button' || /[\s_-](btn|button|cta)[\s_-]/i.test(cls)) {
      return text(el) || null;
    }
    return null;
  }

  document.addEventListener(
    'click',
    function (ev) {
      var target = ev.target;
      if (!target || !target.closest) return;
      var el = target.closest('a,button,[role="button"],input[type="submit"],[data-axeon]');
      if (!el) return;
      var n = nameFor(el);
      if (n) post({ e: 'click', n: n, p: location.pathname, r: document.referrer || undefined, w: window.innerWidth });
    },
    true
  );

  document.addEventListener(
    'submit',
    function (ev) {
      var f = ev.target;
      var n = (f && f.getAttribute && f.getAttribute('data-axeon')) || 'form';
      post({ e: 'click', n: n, p: location.pathname, r: document.referrer || undefined, w: window.innerWidth });
    },
    true
  );

  // For the site's own code: window.axeonTrack('book') after an embedded calendar confirms, and so on.
  window.axeonTrack = function (name) {
    if (typeof name !== 'string' || !name) return;
    post({ e: 'click', n: name, p: location.pathname, r: document.referrer || undefined, w: window.innerWidth });
  };

  view();
})();
