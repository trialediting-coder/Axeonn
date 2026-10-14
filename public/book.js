/*! Axeon online booking embed. On a client's site:
 *    <div data-axeon-book data-site="ax_xxxxxxxxxxxxxx">Call (515) 555-0134 to book.</div>
 *    <script defer src="https://axeonstudio.co/book.js"></script>
 *  Puts the booking page (axeonstudio.co/b/<site>) in an iframe inside that div,
 *  so the site's styles and ours never touch. Whatever is inside the div stays
 *  until the booking page reports in, so if Axeon is down visitors still see it.
 *  Plain ES2017, no dependencies, never throws into the host page. */
(function () {
  'use strict';
  try {
    var script = document.currentScript;
    var origin = ((script && script.getAttribute('data-origin')) || 'https://axeonstudio.co').replace(/\/+$/, '');
    var mounted = [];

    function mountOne(host) {
      if (host.getAttribute('data-axeon-mounted')) return;
      var site = host.getAttribute('data-site') || (script && script.getAttribute('data-site')) || '';
      if (!/^ax_[a-z2-9]{14}$/.test(site)) return; // isValidSiteKey's shape (lib/siteStats.ts)
      host.setAttribute('data-axeon-mounted', '1');
      var frame = document.createElement('iframe');
      frame.src = origin + '/b/' + encodeURIComponent(site) + '?embed=1';
      frame.title = 'Book online';
      // Hidden until the page reports its height, so a failed load never replaces the fallback.
      frame.style.cssText = 'display:block;width:100%;height:0;border:0;overflow:hidden;visibility:hidden;background:transparent';
      host.appendChild(frame);
      mounted.push({ host: host, frame: frame, ready: false });
    }

    function mountAll() {
      var nodes = document.querySelectorAll('[data-axeon-book]');
      for (var i = 0; i < nodes.length; i++) mountOne(nodes[i]);
    }

    window.addEventListener('message', function (e) {
      try {
        if (e.origin !== origin || !e.data || e.data.axeonBook !== 1) return;
        for (var i = 0; i < mounted.length; i++) {
          var m = mounted[i];
          if (m.frame.contentWindow !== e.source) continue;
          m.frame.style.height = Math.max(320, Math.min(4000, Number(e.data.height) || 0)) + 'px';
          if (!m.ready) {
            m.ready = true;
            Array.prototype.slice.call(m.host.childNodes).forEach(function (n) {
              if (n !== m.frame) m.host.removeChild(n);
            });
            m.frame.style.visibility = 'visible';
          }
        }
      } catch (err) {}
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll);
    else mountAll();
  } catch (e) {}
})();
