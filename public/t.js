/*! Axeon site tracking. One line on a client's site:
 *    <script defer src="https://axeonstudio.co/t.js" data-site="ax_xxxxxxxxxxxxxx"></script>
 *  Sends page views and clicks on the buttons that matter (call, text, email,
 *  form, book online, directions, and any <button> or .btn/.cta link) to
 *  axeonstudio.co/api/t. No cookies, no storage, nothing personal.
 *  Add data-axeon="quote" to any element to name its clicks yourself.
 */
(function () {
  var s = document.currentScript;
  if (!s) return;
  var key = s.getAttribute('data-site');
  if (!key) return;
  var endpoint = s.getAttribute('data-endpoint') || 'https://axeonstudio.co/api/t';
  if (navigator.webdriver) return;
  if (/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname)) return;

  function send(kind, name) {
    var body = JSON.stringify({
      k: key,
      e: kind,
      n: name || undefined,
      p: location.pathname,
      r: document.referrer || undefined,
      h: location.hostname,
    });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(endpoint, new Blob([body], { type: 'text/plain' }))) return;
    } catch (_) {}
    try {
      fetch(endpoint, { method: 'POST', body: body, keepalive: true, mode: 'no-cors', headers: { 'content-type': 'text/plain' } });
    } catch (_) {}
  }

  var lastPath = null;
  function view() {
    if (location.pathname === lastPath) return;
    lastPath = location.pathname;
    send('view');
  }

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

  var BOOKING = /(^|\.)(cal\.com|calendly\.com|acuityscheduling\.com|squareup\.com|square\.site|booksy\.com|housecallpro\.com|getjobber\.com|servicetitan\.com|setmore\.com|vagaro\.com|schedulicity\.com|appointlet\.com|zocdoc\.com)$/i;
  var MAPS = /(maps\.google\.|google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl|apple\.com\/maps|maps\.apple\.com|waze\.com)/i;

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
        host = new URL(href, location.href).hostname;
      } catch (_) {}
      if (host && BOOKING.test(host)) return 'book';
      if (MAPS.test(href)) return 'directions';
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
      if (n) send('click', n);
    },
    true
  );

  document.addEventListener(
    'submit',
    function (ev) {
      var f = ev.target;
      var n = (f && f.getAttribute && f.getAttribute('data-axeon')) || 'form';
      send('click', n);
    },
    true
  );

  view();
})();
