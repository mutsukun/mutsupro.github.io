/* =====================================================
   ハコアタマ エントランス制御
   - 初期: 画面を cargostack で覆う / 中央メッセージ表示
   - スクロール (wheel/touch/key) を仮想 progress に変換
   - progress 0.0→0.6: cargo を 1.0→0.35 にスケールダウン
   - progress 0.6→1.0: HakoAtama_Phone が右からスライドイン
   - progress >= 1.0: Phone CTA が押下可能に
   - CTA クリック: entrance フェードアウト→本編解放
   - 解放後: cargo は画面下部にフロート常駐
   ===================================================== */
(function () {
  const entrance   = document.getElementById('entrance');
  const cargoLeft  = document.getElementById('cargo-left');
  const cargoRight = document.getElementById('cargo-right');
  const msg        = document.getElementById('entrance-msg');
  const phoneCta   = document.getElementById('phone-cta');
  if (!entrance || !cargoLeft || !cargoRight || !phoneCta) return;

  let progress = 0;        // 0.0 - MAX
  const THRESHOLD = 1400;  // px 相当
  const CARGO_OUT   = 0.6;   // cargo 退避完了
  const PHONE_START = 0.40;  // 早めに Phone 登場開始
  const PHONE_END   = 0.85;  // ここで Phone フル表示
  const HOLD_UNTIL  = 1;  // ここまでスクロールしても何も起きない（マージン）
  const FADE_END    = 1.3;  // ここで Phone が上にはけ完了 → unlock
  const MAX         = FADE_END;

  let rendering = false;
  let unlocked = false;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function render() {
    rendering = false;
    const t1 = clamp(progress / CARGO_OUT, 0, 1);
    cargoLeft.style.transform  = `translateX(${-100 * t1}%)`;
    cargoRight.style.transform = `translateX(${ 100 * t1}%)`;

    msg.style.opacity = String(clamp(1 - progress / 0.4, 0, 1));

    const t2 = clamp((progress - PHONE_START) / (PHONE_END - PHONE_START), 0, 1);
    const startVW = 60;
    const endVW = 5;
    const xVW = startVW + (endVW - startVW) * t2;

    // HOLD_UNTIL 以降に上方向へスライドアウト（その手前ではマージンとして停止）
    const upT = clamp((progress - HOLD_UNTIL) / (FADE_END - HOLD_UNTIL), 0, 1);
    const yVH = -100 * upT;
    phoneCta.style.transform = `translate(${xVW}vw, calc(-50% + ${yVH}vh))`;
    phoneCta.style.opacity = String(t2 * (1 - upT));

    if (progress >= MAX) {
      unlock();
    }
  }

  function requestRender() {
    if (rendering) return;
    rendering = true;
    requestAnimationFrame(render);
  }

  function addProgress(delta) {
    if (unlocked) return;
    progress = clamp(progress + delta / THRESHOLD, 0, MAX);
    requestRender();
  }

  function onWheel(e) {
    if (unlocked) return;
    e.preventDefault();
    addProgress(e.deltaY);
  }

  let touchY = null;
  function onTouchStart(e) {
    if (unlocked) return;
    if (e.touches && e.touches.length) touchY = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (unlocked || touchY === null) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    const delta = touchY - y;
    touchY = y;
    addProgress(delta * 2.5);
  }
  function onTouchEnd() { touchY = null; }

  function onKey(e) {
    if (unlocked) return;
    const keys = { 'ArrowDown': 100, 'PageDown': 400, ' ': 300, 'Spacebar': 300, 'ArrowUp': -100, 'PageUp': -400 };
    if (e.key in keys) {
      e.preventDefault();
      addProgress(keys[e.key]);
    }
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    entrance.classList.add('hidden');
    document.body.classList.remove('locked');
    document.body.classList.add('unlocked');
    phoneCta.style.display = 'none';

    window.removeEventListener('wheel', onWheel, { passive: false });
    window.removeEventListener('touchstart', onTouchStart, { passive: false });
    window.removeEventListener('touchmove', onTouchMove, { passive: false });
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('keydown', onKey);
  }

  // 明示的に初期状態へリセット（ブラウザの style キャッシュ対策）
  progress = 0;

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: false });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd);
  window.addEventListener('keydown', onKey);

  requestRender();
})();
