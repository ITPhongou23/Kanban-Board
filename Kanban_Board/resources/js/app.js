function startKanban() {
  var COLS = [
    { key: 'todo',        name: 'To Do',       desc: 'This is ready to be picked up',    color: 'var(--blue)' },
    { key: 'in_progress', name: 'In Progress', desc: 'This is actively being worked on', color: 'var(--yellow)' },
    { key: 'in_review',   name: 'In Review',   desc: 'This item is in review',           color: 'var(--purple)' },
    { key: 'done',        name: 'Done',        desc: 'This has been completed',          color: 'var(--green)' }
  ];

  var board = document.getElementById('board');
  if (!board) { console.error('Thiếu <div id="board"> trong blade'); return; }

  var meta = document.querySelector('meta[name="csrf-token"]');
  if (!meta) console.error('Thiếu <meta name="csrf-token"> trong <head> của blade');
  var TOKEN = meta ? meta.content : '';

  var B = {};
  var drag = null, composing = null;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  function api(method, url, body) {
    return fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': TOKEN
      },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.status === 204 ? null : r.json();
    });
  }

  function fail(e) {
    console.error(e);
    alert('Có lỗi khi lưu, đang tải lại trang.');
    location.reload();
  }

  function load() {
    var tasks = window.TASKS || [];
    B = {};
    COLS.forEach(function (c) { B[c.key] = []; });
    tasks.forEach(function (t) { if (B[t.status]) B[t.status].push(t); });
    render();
  }

  function saveOrder() {
    var order = {};
    COLS.forEach(function (c) { order[c.key] = B[c.key].map(function (t) { return t.id; }); });
    api('POST', '/tasks/reorder', { order: order }).catch(fail);
  }

  function render() {
    board.innerHTML = '';

    COLS.forEach(function (c) {
      var cards = B[c.key] || [];
      var col = el('section', 'col');

      var h = el('div', 'ch');
      var d = el('span', 'dot'); d.style.borderColor = c.color; h.appendChild(d);
      h.appendChild(el('h2', null, c.name));
      h.appendChild(el('span', 'cnt', cards.length));
      h.appendChild(el('span', 'sp'));
      var plus = el('button', 'ib', '+'); plus.title = 'Thêm thẻ';
      plus.onclick = function () { composing = c.key; render(); };
      h.appendChild(plus);
      col.appendChild(h);
      col.appendChild(el('div', 'desc', c.desc));

      var list = el('div', 'cards');
      if (!cards.length && composing !== c.key) list.appendChild(el('div', 'empty', 'Swipe your card here'));

      cards.forEach(function (t) {
        var cd = el('div', 'card'); cd.draggable = true;
        cd.appendChild(el('div', 't', t.title));
        var m = el('div', 'm');
        m.appendChild(el('span', 'sp', t.description || ''));
        var x = el('button', 'x', '\u00d7'); x.title = 'Xóa thẻ';
        x.onclick = function () {
          B[c.key] = B[c.key].filter(function (z) { return z !== t; });
          render();
          api('DELETE', '/tasks/' + t.id).catch(fail);
        };
        m.appendChild(x); cd.appendChild(m);

        cd.ondragstart = function (ev) {
          drag = { t: t, from: c.key };
          cd.classList.add('drag');
          try { ev.dataTransfer.setData('text/plain', String(t.id)); ev.dataTransfer.effectAllowed = 'move'; } catch (e) {}
        };
        cd.ondragend = function () {
          cd.classList.remove('drag'); drag = null;
          document.querySelectorAll('.over').forEach(function (n) { n.classList.remove('over'); });
        };
        cd.ondblclick = function () {
          var title = prompt('Sửa tiêu đề:', t.title);
          if (title === null || !title.trim()) return;
          var desc = prompt('Sửa mô tả:', t.description || '');
          if (desc === null) desc = t.description || '';
          t.title = title.trim();
          t.description = desc.trim() || null;
          render();
          api('PATCH', '/tasks/' + t.id, { title: t.title, description: t.description }).catch(fail);
        };
        list.appendChild(cd);
      });
      col.appendChild(list);

      col.ondragover = function (ev) { if (!drag) return; ev.preventDefault(); col.classList.add('over'); };
      col.ondragleave = function (ev) { if (!col.contains(ev.relatedTarget)) col.classList.remove('over'); };
      col.ondrop = function (ev) {
        ev.preventDefault(); col.classList.remove('over');
        if (!drag) return;
        var nodes = [].slice.call(list.querySelectorAll('.card'));
        var idx = cards.length;
        for (var i = 0; i < nodes.length; i++) {
          var r = nodes[i].getBoundingClientRect();
          if (ev.clientY < r.top + r.height / 2) { idx = i; break; }
        }
        var src = B[drag.from];
        var fromIdx = src.indexOf(drag.t);
        src.splice(fromIdx, 1);
        if (drag.from === c.key && fromIdx < idx) idx--;
        drag.t.status = c.key;
        B[c.key].splice(idx, 0, drag.t);
        drag = null;
        render();
        saveOrder();
      };

      if (composing === c.key) {
        var f = el('div', 'comp');
        var ta = el('textarea'); ta.placeholder = 'Tiêu đề thẻ…';
        var da = el('textarea'); da.placeholder = 'Mô tả (không bắt buộc)'; da.style.marginTop = '8px';
        var r = el('div', 'r');
        var ok = el('button', 'btn pri', 'Thêm'), no = el('button', 'btn', 'Hủy');
        var add = function () {
          var title = ta.value.trim();
          if (!title) return;
          composing = null;
          api('POST', '/tasks', { title: title, description: da.value.trim() || null, status: c.key })
            .then(function (t) { B[c.key].push(t); render(); })
            .catch(fail);
        };
        ok.onclick = add;
        no.onclick = function () { composing = null; render(); };
        ta.onkeydown = function (e) {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add(); }
          if (e.key === 'Escape') { composing = null; render(); }
        };
        r.appendChild(ok); r.appendChild(no);
        f.appendChild(ta); f.appendChild(da); f.appendChild(r); col.appendChild(f);
        setTimeout(function () { ta.focus(); }, 0);
      }

      board.appendChild(col);
    });
  }

  load();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startKanban);
} else {
  startKanban();
}