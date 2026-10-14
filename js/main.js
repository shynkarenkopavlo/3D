(() => {
  const G = window.GADGET;
  const $ = (s) => document.querySelector(s);
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const ease = (t) => ((t = clamp(t)), t * t * (3 - 2 * t));
  const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));

  /* ---------- Геометрия деталей (процедурная; потом можно заменить на GLB) ---------- */
  function roundedRect(w, h, r) {
    const x = -w / 2, y = -h / 2, s = new THREE.Shape();
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function slab(o) {
    const shape = roundedRect(o.w, o.h, o.r);
    if (o.hole) shape.holes.push(roundedRect(...o.hole));
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: o.d, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 12
    });
    geo.translate(0, 0, -o.d / 2);
    return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: o.color, metalness: o.metal ?? 0.3, roughness: o.rough ?? 0.5,
      emissive: o.glow ?? 0x000000, emissiveIntensity: o.glow ? 0.5 : 0
    }));
  }
  const solid = (geo, color, metal = 0.4, rough = 0.4) =>
    new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough }));
  const chip = (x, y, z, w, h, d) => { const m = solid(new THREE.BoxGeometry(w, h, d), 0x1b2030); m.position.set(x, y, z); return m; };
  const lens = (x, y) => {
    const g = new THREE.Group();
    g.position.set(x, y, 0.05); g.rotation.x = Math.PI / 2;
    g.add(solid(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 32), 0x9aa2b4, 0.7, 0.25));
    const glass = solid(new THREE.CylinderGeometry(0.11, 0.11, 0.01, 32), 0x05070c, 0.7, 0.1);
    glass.position.y = 0.031; g.add(glass);
    return g;
  };

  // at = положение детали в собранном виде, ключ = slug из data.js
  const SHAPES = {
    back:    { at: [0, 0, 0],       build: (g) => g.add(slab({ w: 1.7, h: 3.4, r: 0.24, d: 0.05, color: 0xaab4c8, metal: 0.6, rough: 0.3 })) },
    frame:   { at: [0, 0, 0.13],    build: (g) => g.add(slab({ w: 1.78, h: 3.48, r: 0.26, d: 0.22, hole: [1.62, 3.32, 0.18], color: 0x6b7488, metal: 0.7, rough: 0.3 })) },
    battery: { at: [0, -0.7, 0.1],  build: (g) => g.add(slab({ w: 1.3, h: 1.55, r: 0.08, d: 0.1, color: 0x2fbf8a, metal: 0.15, rough: 0.5 })) },
    board:   { at: [0, 0.8, 0.1],   build: (g) => { g.add(slab({ w: 1.35, h: 1.2, r: 0.08, d: 0.04, color: 0x1f7a5c })); g.add(chip(-0.3, -0.2, 0.05, 0.4, 0.4, 0.06)); g.add(chip(0.3, -0.3, 0.04, 0.3, 0.3, 0.05)); } },
    camera:  { at: [0.38, 1.0, 0.17], build: (g) => { g.add(slab({ w: 0.8, h: 0.8, r: 0.16, d: 0.06, color: 0x2a3042 })); g.add(lens(-0.17, 0.17)); g.add(lens(0.17, -0.17)); } },
    display: { at: [0, 0, 0.27],    build: (g) => g.add(slab({ w: 1.62, h: 3.34, r: 0.18, d: 0.04, color: 0x0a0f1e, glow: 0x27408f, metal: 0.1, rough: 0.2 })) }
  };

  /* ---------- Сцена ---------- */
  const stage = $("#stage");
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a94a8, 1.0));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(4, 6, 6); scene.add(key);
  const fill = new THREE.DirectionalLight(0xbcd0ff, 0.5); fill.position.set(-5, 1, 3); scene.add(fill);

  const root = new THREE.Group(); scene.add(root);
  const parts = G.parts.map((d) => {
    const s = SHAPES[d.slug];
    const group = new THREE.Group();
    s.build(group);
    group.position.set(...s.at);
    root.add(group);
    const mats = [], accent = new THREE.Color(d.color);
    group.traverse((o) => {
      if (!o.isMesh) return;
      o.userData.slug = d.slug;
      o.material.userData.base = o.material.emissiveIntensity;
      if (!o.material.emissiveIntensity) o.material.emissive.copy(accent);
      mats.push(o.material);
    });
    return { d, group, at: s.at, mats };
  });
  const meshes = [];
  root.traverse((o) => o.isMesh && meshes.push(o));

  let near = 7.6, far = 11;
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const narrow = w / h < 0.9;
    near = narrow ? 10.5 : 7.6; far = narrow ? 15 : 11;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  /* ---------- Интерфейс ---------- */
  $("#gadget-name").textContent = G.name;
  $("#gadget-summary").textContent = G.summary;
  const nav = $("#parts"), panel = $("#panel");
  let hover = null;

  nav.innerHTML = G.parts.map((p) => `<button type="button" data-slug="${p.slug}"><i style="background:${p.color}"></i>${p.name}</button>`).join("");
  nav.addEventListener("mouseover", (e) => { const b = e.target.closest("button"); if (b) setHover(b.dataset.slug); });
  nav.addEventListener("mouseleave", () => setHover(null));
  nav.addEventListener("focusin", (e) => { const b = e.target.closest("button"); if (b) setHover(b.dataset.slug); });

  function setHover(slug) {
    if (slug === hover) return;
    hover = slug;
    nav.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.slug === slug));
    const p = G.parts.find((x) => x.slug === slug);
    panel.innerHTML = p
      ? `<span class="bar" style="background:${p.color}"></span><h2>${p.name}</h2><p class="fn">${p.fn}</p><p class="desc">${p.desc}</p>
         <dl>${p.specs.map((s) => `<div><dt>${s[0]}</dt><dd>${s[1]}</dd></div>`).join("")}</dl>`
      : `<h2>Разберите устройство</h2><p class="fn hint">Крутите колесо мыши (на телефоне проведите пальцем вверх): камера приблизится, а детали разойдутся. Наведите на деталь, чтобы узнать, что это.</p>`;
  }
  setHover(null); hover = undefined; setHover(null);

  /* ---------- Управление: колесо задаёт прогресс 0..1, страница не прокручивается ---------- */
  let progress = 0, target = 0;
  const add = (d) => (target = clamp(target + d));
  window.addEventListener("wheel", (e) => {
    e.preventDefault();
    add((e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY) * 0.0007);
  }, { passive: false });
  window.addEventListener("keydown", (e) => {
    if (["ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); add(0.12); }
    if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); add(-0.12); }
  });
  let ty = 0;
  window.addEventListener("touchstart", (e) => (ty = e.touches[0].clientY), { passive: true });
  window.addEventListener("touchmove", (e) => { const y = e.touches[0].clientY; add((ty - y) * 0.003); ty = y; }, { passive: true });
  $("#btn-assemble").onclick = () => (target = 0);
  $("#btn-explode").onclick = () => (target = 1);

  /* ---------- Наведение / касание по детали ---------- */
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  function pick(e) {
    if (progress < 0.15) return null;
    const r = renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(meshes, false)[0];
    return hit ? hit.object.userData.slug : null;
  }
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const s = pick(e);
    setHover(s);
    renderer.domElement.style.cursor = s ? "pointer" : "default";
  });
  renderer.domElement.addEventListener("pointerup", (e) => { if (e.pointerType === "touch") setHover(pick(e)); });

  /* ---------- Цикл анимации ---------- */
  const fillBar = $("#fill");
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    progress = damp(progress, target, 4, dt);                 // мягкое сглаживание, без рывков
    const k = ease(progress);
    camera.position.z = far + (near - far) * k;             // приближение
    root.rotation.set(0.08, -0.35 - k * 0.5, 0);
    fillBar.style.transform = `scaleX(${progress})`;

    for (const p of parts) {
      const t = ease((progress - p.d.range[0]) / (p.d.range[1] - p.d.range[0]));
      p.group.position.set(p.at[0] + p.d.explode[0] * t, p.at[1] + p.d.explode[1] * t, p.at[2] + p.d.explode[2] * t);
      const on = hover === p.d.slug && progress > 0.15;
      p.group.scale.setScalar(damp(p.group.scale.x, on ? p.d.hoverScale : 1, 10, dt));
      for (const m of p.mats) m.emissiveIntensity = damp(m.emissiveIntensity, (m.userData.base || 0) + (on ? 0.45 : 0), 10, dt);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
