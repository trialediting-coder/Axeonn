/*! Axeon website chat. One line on a client's site:
 *    <script defer src="https://axeonstudio.co/chat.js" data-site="ax_xxxxxxxxxxxxxx"></script>
 *  Draws a chat button in the corner once axeonstudio.co says chat is on for this
 *  site. Answers come from the business's own pages and setup answers; it can
 *  book a time or take a message. Lives in a shadow root so the site's CSS and
 *  ours never touch. If Axeon is down the button never appears. Plain ES2017,
 *  no dependencies, never throws into the host page. Keeps the conversation in
 *  sessionStorage for this tab only. Every message is drawn with textContent. */
(function () {
  'use strict';
  try {
    var s = document.currentScript;
    if (!s || window.__axeonChat) return;
    window.__axeonChat = 1;
    var site = s.getAttribute('data-site') || '';
    if (!/^ax_[a-z2-9]{14}$/.test(site)) return; // isValidSiteKey's shape (lib/siteStats.ts)
    var origin = (s.getAttribute('data-origin') || 'https://axeonstudio.co').replace(/\/+$/, '');
    var api = origin + '/api/chat/' + site;
    var KEY = 'axeon_chat_' + site;
    var st = { session: null, log: [], busy: false };
    try {
      var saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (saved && typeof saved === 'object') {
        st.session = typeof saved.session === 'string' ? saved.session : null;
        st.log = Array.isArray(saved.log) ? saved.log.slice(-40) : [];
      }
    } catch (e) {}

    var ICON =
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    var CSS =
      ':host{all:initial}*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}' +
      '.btn{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:56px;height:56px;border-radius:50%;border:0;background:#111827;color:#fff;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center}' +
      '.panel{position:fixed;right:20px;bottom:88px;z-index:2147483000;width:360px;max-width:calc(100vw - 24px);height:520px;max-height:calc(100vh - 120px);background:#fff;color:#111827;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden}' +
      '.panel.open{display:flex}.head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#111827;color:#fff;font-weight:600;font-size:15px}' +
      '.x{background:none;border:0;color:#fff;font-size:24px;line-height:1;cursor:pointer}' +
      '.log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;font-size:14px;line-height:1.45}' +
      '.m{max-width:85%;padding:9px 12px;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere}.a{align-self:flex-start;background:#f3f4f6}.u{align-self:flex-end;background:#111827;color:#fff}' +
      '.chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 8px}.chip{border:1px solid #d1d5db;background:#fff;color:#111827;border-radius:999px;padding:6px 10px;font-size:13px;cursor:pointer}' +
      '.fine{font-size:11px;color:#6b7280;padding:0 14px 8px}form{display:flex;gap:8px;padding:10px;border-top:1px solid #e5e7eb}' +
      'input{flex:1;min-width:0;border:1px solid #d1d5db;border-radius:10px;padding:10px;font-size:16px;color:#111827;background:#fff}' +
      '.send{border:0;border-radius:10px;background:#111827;color:#fff;padding:0 14px;font-size:14px;cursor:pointer}.send:disabled{opacity:.5}' +
      '@media (max-width:480px){.panel{right:0;bottom:0;width:100vw;max-width:100vw;height:85vh;max-height:85vh;border-radius:16px 16px 0 0}}';

    function el(tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    }
    function save() {
      try {
        sessionStorage.setItem(KEY, JSON.stringify({ session: st.session, log: st.log.slice(-40) }));
      } catch (e) {}
    }
    function whenReady(fn) {
      if (document.body) fn();
      else document.addEventListener('DOMContentLoaded', fn);
    }

    function build(cfg) {
      var name = String(cfg.business || 'us');
      var host = el('div');
      host.setAttribute('data-axeon-chat', '');
      var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
      root.appendChild(el('style', null, CSS));

      var btn = el('button', 'btn');
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Chat with ' + name);
      btn.innerHTML = ICON; // a constant, never data from the server
      var panel = el('div', 'panel');
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'Chat with ' + name);
      var head = el('div', 'head');
      head.appendChild(el('span', null, name));
      var x = el('button', 'x', '×');
      x.type = 'button';
      x.setAttribute('aria-label', 'Close chat');
      head.appendChild(x);
      var log = el('div', 'log');
      log.setAttribute('aria-live', 'polite');
      var chips = el('div', 'chips');
      var fine = el('div', 'fine', 'Automatic answers can be wrong. Messages are saved so ' + name + ' can follow up.');
      var form = el('form');
      var input = el('input');
      input.type = 'text';
      input.maxLength = 1000;
      input.placeholder = 'Type a message';
      input.autocomplete = 'off';
      input.setAttribute('aria-label', 'Message');
      var send = el('button', 'send', 'Send');
      send.type = 'submit';
      form.appendChild(input);
      form.appendChild(send);
      panel.appendChild(head);
      panel.appendChild(log);
      panel.appendChild(chips);
      panel.appendChild(fine);
      panel.appendChild(form);
      root.appendChild(panel);
      root.appendChild(btn);
      document.body.appendChild(host);

      function add(role, text, quiet) {
        log.appendChild(el('div', 'm ' + role, text));
        log.scrollTop = log.scrollHeight;
        if (!quiet) {
          st.log.push({ r: role, t: text });
          save();
        }
      }
      function setChips(list) {
        while (chips.firstChild) chips.removeChild(chips.firstChild);
        (Array.isArray(list) ? list : []).slice(0, 6).forEach(function (c) {
          var b = el('button', 'chip', String(c));
          b.type = 'button';
          b.addEventListener('click', function () {
            ask(String(c));
          });
          chips.appendChild(b);
        });
      }
      function toggle(open) {
        panel.classList.toggle('open', open);
        if (open) {
          input.focus();
          log.scrollTop = log.scrollHeight;
        }
      }
      function ask(raw) {
        var text = String(raw || '').trim().slice(0, 1000);
        if (!text || st.busy) return;
        input.value = '';
        setChips([]);
        add('u', text);
        st.busy = true;
        send.disabled = true;
        var typing = el('div', 'm a', '…');
        log.appendChild(typing);
        fetch(api, {
          method: 'POST',
          credentials: 'omit',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ session: st.session, message: text, page: location.pathname }),
        })
          .then(function (r) {
            return r.json().catch(function () {
              return {};
            });
          })
          .then(function (j) {
            if (j && typeof j.session === 'string') {
              st.session = j.session;
              save();
            }
            add('a', String((j && (j.reply || j.error)) || 'Sorry, something went wrong. Please call us instead.'));
            setChips(j && j.choices);
          })
          .catch(function () {
            add('a', 'Sorry, the chat is not reachable right now. Please call us instead.');
          })
          .then(function () {
            if (typing.parentNode) typing.parentNode.removeChild(typing);
            st.busy = false;
            send.disabled = false;
          });
      }

      if (!st.log.length) st.log.push({ r: 'a', t: String(cfg.greeting || 'Hi! How can we help?') });
      st.log.forEach(function (m) {
        add(m && m.r === 'u' ? 'u' : 'a', String(m && m.t), true);
      });
      btn.addEventListener('click', function () {
        toggle(!panel.classList.contains('open'));
      });
      x.addEventListener('click', function () {
        toggle(false);
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        ask(input.value);
      });
    }

    fetch(api, { credentials: 'omit' })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (cfg) {
        if (cfg && cfg.enabled) {
          whenReady(function () {
            try {
              build(cfg);
            } catch (e) {}
          });
        }
      })
      .catch(function () {});
  } catch (e) {}
})();
