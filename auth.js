// 화면 잠금용 로그인 (UI 수준). 서버가 없는 정적 페이지라 실제 접근 차단은 아닙니다.
// 자격 증명 해시는 auth-config.js 에 있으며 set-password.sh 로 바꿉니다.
(function () {
  var cfg = window.AUTH_CONFIG;
  var KEY = 'blog-auth-user';
  var root = document.documentElement;

  function currentUser() {
    try { return sessionStorage.getItem(KEY); } catch (e) { return null; }
  }

  // 첫 렌더 전에 잠가서 내용이 잠깐 보이는 현상을 막는다
  if (!currentUser()) root.classList.add('locked');

  function sha256Hex(text) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    });
  }

  function buildLogin() {
    var box = document.createElement('div');
    box.id = 'login';
    box.innerHTML =
      '<form class="card login-card" autocomplete="on">' +
      '<h2>로그인</h2>' +
      '<p class="muted">은아의 블로그 정리 페이지입니다. 로그인 후 볼 수 있어요.</p>' +
      '<label>아이디<input name="username" autocomplete="username" required></label>' +
      '<label>비밀번호<input name="password" type="password" autocomplete="current-password" required></label>' +
      '<p class="login-error" role="alert" hidden></p>' +
      '<button type="submit">로그인</button>' +
      '</form>';
    document.body.appendChild(box);

    var form = box.querySelector('form');
    var err = box.querySelector('.login-error');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var id = form.username.value.trim();
      var pw = form.password.value;
      if (!window.crypto || !crypto.subtle) {
        err.textContent = '이 환경에서는 로그인을 사용할 수 없습니다. (HTTPS 필요)';
        err.hidden = false;
        return;
      }
      sha256Hex(cfg.salt + ':' + id + ':' + pw).then(function (hash) {
        if (id === cfg.id && hash === cfg.hash) {
          try { sessionStorage.setItem(KEY, id); } catch (e2) {}
          root.classList.remove('locked');
          addLogout(id);
          form.password.value = '';
        } else {
          err.textContent = '아이디 또는 비밀번호가 올바르지 않습니다.';
          err.hidden = false;
          form.password.value = '';
          form.password.focus();
        }
      });
    });
  }

  function addLogout(id) {
    var nav = document.querySelector('nav.tabs');
    if (!nav || nav.querySelector('.logout')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'logout';
    btn.textContent = id + ' · 로그아웃';
    btn.addEventListener('click', function () {
      try { sessionStorage.removeItem(KEY); } catch (e) {}
      location.href = 'index.html';
    });
    nav.appendChild(btn);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!cfg) { return; }
    buildLogin();
    var user = currentUser();
    if (user) addLogout(user);
    else {
      var first = document.querySelector('#login input');
      if (first) first.focus();
    }
  });
})();
