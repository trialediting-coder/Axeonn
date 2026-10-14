/*! Axeon online booking: the hosted page's UI (served with /b/<site>, framed by book.js).
 *  Plain ES2017, no dependencies. Reads its config from <script id="cfg">, lists
 *  open times from /api/book/<site>/slots and books with POST /api/book/<site>.
 *  Every node is built with textContent, so nothing is ever parsed as HTML. */
(function () {
  'use strict';
  var app = document.getElementById('app');
  var cfgNode = document.getElementById('cfg');
  if (!app || !cfgNode) return;
  var cfg;
  try {
    cfg = JSON.parse(cfgNode.textContent || '{}');
  } catch (e) {
    return;
  }
  var tz = cfg.timeZone || 'America/Chicago';
  var dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' });
  var timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' });
  var keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
  var state = { days: [], day: null, slot: null, services: Array.isArray(cfg.services) ? cfg.services : [] };

  function clean(s) {
    return String(s).replace(/[  ]/g, ' ');
  }
  function el(tag, props, kids) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (k === 'text') n.textContent = v;
      else if (k === 'onclick') n.addEventListener('click', v);
      else if (k === 'onsubmit') n.addEventListener('submit', v);
      else n.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) {
      if (c) n.appendChild(c);
    });
    return n;
  }
  // The content's own height (the body box, which is not stretched to the frame), so
  // the iframe can shrink again; the whole document's height never drops below the frame's.
  function contentHeight() {
    var b = document.body;
    return Math.ceil(Math.max(b.scrollHeight, b.getBoundingClientRect().height));
  }
  function resize() {
    if (!cfg.embed || window.parent === window) return;
    try {
      window.parent.postMessage({ axeonBook: 1, site: cfg.site, height: contentHeight() }, '*');
    } catch (e) {}
  }
  function show(nodes) {
    while (app.firstChild) app.removeChild(app.firstChild);
    nodes.forEach(function (n) {
      if (n) app.appendChild(n);
    });
    resize();
  }
  function group(slots) {
    var days = [];
    slots.forEach(function (s) {
      var d = new Date(s.startsAt);
      var key = keyFmt.format(d);
      var last = days[days.length - 1];
      if (!last || last.key !== key) {
        last = { key: key, label: clean(dayFmt.format(d)), slots: [] };
        days.push(last);
      }
      last.slots.push({ startsAt: s.startsAt, time: clean(timeFmt.format(d)) });
    });
    return days;
  }
  function load(note) {
    show([el('p', { class: 'muted', text: 'Loading open times…' })]);
    fetch(cfg.api + '/slots', { credentials: 'omit' })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!data || !data.open) return show([el('p', { text: 'Online booking is not available right now. Please call to book.' })]);
        if (Array.isArray(data.services)) state.services = data.services;
        state.days = group(Array.isArray(data.slots) ? data.slots : []);
        var still = state.days.some(function (d) {
          return d.key === state.day;
        });
        if (!still) state.day = state.days.length ? state.days[0].key : null;
        pick(note);
      })
      .catch(function () {
        show([el('p', { class: 'err', text: 'We could not load open times. Please try again, or call to book.' })]);
      });
  }
  function pick(note) {
    var noteNode = note ? el('p', { class: 'note', role: 'alert', text: note }) : null;
    if (!state.days.length) return show([noteNode, el('p', { text: 'No open times in the next two weeks. Please call to book.' })]);
    var day =
      state.days.filter(function (d) {
        return d.key === state.day;
      })[0] || state.days[0];
    var chips = el(
      'div',
      { class: 'days' },
      state.days.map(function (d) {
        return el('button', {
          type: 'button',
          class: d.key === day.key ? 'chip on' : 'chip',
          'aria-pressed': String(d.key === day.key),
          text: d.label,
          onclick: function () {
            state.day = d.key;
            pick();
          },
        });
      })
    );
    var times = el(
      'div',
      { class: 'times' },
      day.slots.map(function (s) {
        return el('button', {
          type: 'button',
          class: 'time',
          text: s.time,
          onclick: function () {
            state.slot = { startsAt: s.startsAt, label: day.label + ' at ' + s.time };
            form(null, {});
          },
        });
      })
    );
    show([noteNode, el('h2', { text: 'Pick a day' }), chips, el('h2', { text: 'Pick a time' }), times]);
  }
  function field(label, node) {
    return el('label', { class: 'field' }, [el('span', { text: label }), node]);
  }
  function form(error, values) {
    var name = el('input', { name: 'name', type: 'text', autocomplete: 'name', required: 'required', maxlength: '80' });
    var phone = el('input', { name: 'phone', type: 'tel', autocomplete: 'tel', inputmode: 'tel', required: 'required', placeholder: '(515) 555-0134' });
    var email = el('input', { name: 'email', type: 'email', autocomplete: 'email', placeholder: 'Optional' });
    var trap = el('input', { name: 'company_website', type: 'text', tabindex: '-1', autocomplete: 'off' });
    var service = null;
    if (state.services.length) {
      service = el(
        'select',
        { name: 'service', required: 'required' },
        [el('option', { value: '', text: 'Pick a service' })].concat(
          state.services.map(function (s) {
            return el('option', { value: s, text: s });
          })
        )
      );
    }
    name.value = values.name || '';
    phone.value = values.phone || '';
    email.value = values.email || '';
    if (service) service.value = values.service || '';
    var go = el('button', { type: 'submit', class: 'go', text: 'Book ' + state.slot.label });
    var f = el(
      'form',
      {
        onsubmit: function (e) {
          e.preventDefault();
          submit();
        },
      },
      [
        field('Your name', name),
        field('Mobile number', phone),
        field('Email', email),
        service ? field('Service', service) : null,
        el('div', { class: 'hp', 'aria-hidden': 'true' }, [trap]),
        error ? el('p', { class: 'err', role: 'alert', text: error }) : null,
        go,
      ]
    );
    show([
      el('h2', { text: state.slot.label }),
      el('button', {
        type: 'button',
        class: 'link',
        text: 'Pick a different time',
        onclick: function () {
          pick();
        },
      }),
      f,
    ]);
    if (!error) name.focus();
    function current() {
      return { name: name.value, phone: phone.value, email: email.value, service: service ? service.value : '' };
    }
    function submit() {
      var v = current();
      go.disabled = true;
      go.textContent = 'Booking…';
      fetch(cfg.api, {
        method: 'POST',
        credentials: 'omit',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: v.name, phone: v.phone, email: v.email, service: v.service, startsAt: state.slot.startsAt, company_website: trap.value }),
      })
        .then(function (r) {
          return r.json().then(function (j) {
            return { status: r.status, j: j || {} };
          });
        })
        .then(function (res) {
          if (res.j.ok) return done(res.j);
          if (res.status === 409) return load(res.j.error);
          form(res.j.error || 'Something went wrong. Please try again.', v);
        })
        .catch(function () {
          form('We could not reach the booking system. Please try again, or call to book.', v);
        });
    }
  }
  function done(j) {
    show([
      el('h2', { text: "You're booked" }),
      el('div', { class: 'card' }, [j.service ? el('p', { text: j.service }) : null, el('p', { text: j.when })]),
      el('p', { text: (cfg.business || 'We') + ' has your details and will see this right away.' }),
      j.cancelUrl ? el('p', { class: 'muted' }, [el('a', { href: j.cancelUrl, target: '_blank', rel: 'noopener', text: 'Need to cancel?' })]) : null,
    ]);
  }
  if (window.ResizeObserver) {
    try {
      new ResizeObserver(resize).observe(document.body);
    } catch (e) {}
  }
  window.addEventListener('load', resize);
  load();
})();
