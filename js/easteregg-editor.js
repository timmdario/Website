// ========================================
// Karten-Editor für "Hani's Rundgang"
// Bearbeitet easteregg/map.json (Orte, Gebäude, Hütten, Flächen, Hundestart).
// ========================================
(function () {
    'use strict';

    const W = 480;
    const H = 360;

    const DEFAULT_MAP = window.FARMINN_DEFAULT_MAP ||
        { canvas: { w: W, h: H }, dogStart: { x: 122, y: 80 }, features: [], buildings: [], huts: [], areas: [] };

    const canvas = document.getElementById('ed-canvas');
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const el = {
        list: document.getElementById('ed-list'),
        props: document.getElementById('ed-props'),
        json: document.getElementById('ed-json'),
        status: document.getElementById('ed-status'),
        snap: document.getElementById('ed-snap'),
        file: document.getElementById('ed-file')
    };

    let map = null;
    let sel = null;      // { type, idx }  type: feature|building|hut|area|dog
    let drag = null;

    const AREA_KINDS = [
        { v: 'pasture', t: 'Tierweide (Zaun + Alpakas)' },
        { v: 'plaza', t: 'Platz / Hof (gepflastert)' },
        { v: 'parking', t: 'Parkplatz (Camper)' },
        { v: 'tents', t: 'Zeltplatz' }
    ];

    // ---- Helpers ----
    function clone(o) { return JSON.parse(JSON.stringify(o)); }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function round2(v) { return Math.round(v * 100) / 100; }
    function snapv(v) { return el.snap.checked ? Math.round(v / 4) * 4 : round2(v); }
    function norm2(v) { return Math.round(v * 100000) / 100000; }
    function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function isNum(x) { return typeof x === 'number' && isFinite(x); }

    function worldPoints(a) { return a.points.map(c => [c[0] * W, c[1] * H]); }
    function featureXY(f) { return [f.x * W, f.y * H]; }

    function pointInPoly(p, pts) {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
            if (((yi > p.y) !== (yj > p.y)) && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)) inside = !inside;
        }
        return inside;
    }

    function distToSeg(p, a, b) {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const len2 = dx * dx + dy * dy;
        let t = len2 ? ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / len2 : 0;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p.x - (a[0] + t * dx), p.y - (a[1] + t * dy));
    }

    function status(msg) { el.status.textContent = msg || ''; }

    function normalizeMap() {
        map.features = map.features || [];
        map.buildings = map.buildings || [];
        map.huts = map.huts || [];
        map.areas = map.areas || [];
        map.roads = map.roads || [];
        map.ponds = map.ponds || [];
        map.trees = map.trees || [];
        map.parkings = map.parkings || [];
        map.dogStart = map.dogStart || { x: 122, y: 80 };
        map.canvas = { w: W, h: H };
        map.version = map.version || 3;
    }

    function parkingSize(cols) {
        return { w: cols * 8 + 4, h: 14 };
    }

    function drawParkingMark(cx, cy, cols) {
        const s = parkingSize(cols);
        const x = cx - s.w / 2;
        const y = cy - s.h / 2;
        rect(x, y, s.w, s.h, 'rgba(179,173,160,0.95)');
        for (let i = 0; i <= cols; i++) rect(x + 2 + i * 8, y + 2, 1, s.h - 4, 'rgba(233,229,219,0.95)');
    }

    // ---- Zeichnen ----
    function rect(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }

    function poly(pts, fill, stroke) {
        if (!pts.length) return;
        ctx.beginPath();
        pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
    }

    function outlineRect(x, y, w, h, color, dashed) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        if (dashed) ctx.setLineDash([4, 3]);
        ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
        ctx.restore();
    }

    function selected(type, idx) {
        return sel && sel.type === type && (idx === undefined || sel.idx === idx);
    }

    function render() {
        rect(0, 0, W, H, '#84a15a');
        for (let y = 0; y < H; y += 16) {
            for (let x = 0; x < W; x += 16) {
                if (((x / 16) + (y / 16)) % 2 === 0) rect(x, y, 16, 16, '#7a9852');
            }
        }
        // Raster
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke(); }
        for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke(); }

        // Straßen
        map.roads.forEach((r, i) => {
            if (r.points && r.points.length) {
                ctx.save();
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                r.points.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
                ctx.strokeStyle = 'rgba(205,176,131,0.9)';
                ctx.lineWidth = r.w || 14;
                ctx.stroke();
                ctx.restore();
                if (selected('road', i)) {
                    ctx.save();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([4, 3]);
                    ctx.beginPath();
                    r.points.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
                    ctx.stroke();
                    ctx.setLineDash([]);
                    r.points.forEach(p => rect(p[0] - 3, p[1] - 3, 6, 6, '#fff'));
                    r.points.forEach(p => { ctx.strokeStyle = '#6b432d'; ctx.lineWidth = 1; ctx.strokeRect(p[0] - 3.5, p[1] - 3.5, 7, 7); });
                    ctx.restore();
                }
            } else {
                rect(r.x, r.y, r.w, r.h, 'rgba(205,176,131,0.85)');
                rect(r.x, r.y + r.h - 2, r.w, 2, 'rgba(189,159,114,0.9)');
                if (selected('road', i)) outlineRect(r.x, r.y, r.w, r.h, '#fff');
            }
        });
        // Teiche
        map.ponds.forEach((p, i) => {
            ctx.fillStyle = 'rgba(124,158,194,0.9)';
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
            ctx.fill();
            if (selected('pond', i)) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
        });

        // Flächen
        map.areas.forEach((a, i) => {
            const pts = worldPoints(a);
            const fills = { pasture: 'rgba(127,155,84,0.45)', plaza: 'rgba(205,176,131,0.75)', parking: 'rgba(179,173,160,0.8)', tents: 'rgba(201,106,78,0.35)' };
            poly(pts, fills[a.kind] || 'rgba(200,200,200,0.4)', selected('area', i) ? '#fff' : 'rgba(0,0,0,0.25)');
            if (selected('area', i)) {
                pts.forEach(p => rect(p[0] - 3, p[1] - 3, 6, 6, '#fff'));
                pts.forEach(p => { ctx.strokeStyle = '#6b432d'; ctx.lineWidth = 1; ctx.strokeRect(p[0] - 3.5, p[1] - 3.5, 7, 7); });
            }
        });

        // Parkplätze (PKW/Bus)
        map.parkings.forEach((p, i) => {
            drawParkingMark(p.x, p.y, p.cols);
            if (selected('parking', i)) {
                const s = parkingSize(p.cols);
                outlineRect(p.x - s.w / 2, p.y - s.h / 2, s.w, s.h, '#fff');
            }
        });

        // Gebäude
        map.buildings.forEach((b, i) => {
            ctx.save();
            ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
            ctx.rotate((b.rot || 0) * Math.PI / 180);
            const X = -b.w / 2;
            const Y = -b.h / 2;
            rect(X, Y + 6, b.w, b.h - 6, '#ecdcbb');
            for (let k = 0; k < 8; k++) {
                const inset = 7 - k;
                rect(X + inset, Y + k, b.w - inset * 2, 1, k < 2 ? '#c96a4e' : (b.roof || '#8a4b3a'));
            }
            if (selected('building', i)) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.strokeRect(X - 1, Y - 1, b.w + 2, b.h + 2);
            }
            ctx.restore();
            if (b.label && b.w > 30) {
                ctx.fillStyle = 'rgba(43,43,43,0.75)';
                ctx.font = '7px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h + 2, b.w + 40);
            }
        });

        // Hütten
        map.huts.forEach((h, i) => {
            rect(h.x, h.y + 4, 12, 8, '#ecdcbb');
            for (let k = 0; k < 5; k++) {
                const inset = 4 - k;
                rect(h.x + inset, h.y + k, 12 - inset * 2, 1, k < 1 ? '#c96a4e' : '#8a4b3a');
            }
            if (selected('hut', i)) outlineRect(h.x, h.y, 12, 12, '#fff');
        });

        // Bäume
        map.trees.forEach((t, i) => {
            if (t.v === 1) {
                rect(t.x - 1, t.y + 2, 3, 5, 'rgba(107,67,45,0.95)');
                rect(t.x - 5, t.y - 3, 11, 6, 'rgba(63,92,51,0.95)');
                rect(t.x - 4, t.y - 7, 9, 5, 'rgba(63,92,51,0.95)');
                rect(t.x - 3, t.y - 10, 7, 4, 'rgba(79,112,64,0.95)');
            } else {
                rect(t.x - 6, t.y - 8, 13, 9, 'rgba(95,122,63,0.95)');
                rect(t.x - 4, t.y - 11, 9, 4, 'rgba(111,138,74,0.95)');
                rect(t.x - 1, t.y, 3, 7, 'rgba(107,67,45,0.95)');
            }
            if (selected('tree', i)) outlineRect(t.x - 7, t.y - 11, 15, 19, '#fff');
        });

        // Hundestart
        const dog = map.dogStart;
        rect(dog.x - 3, dog.y - 3, 6, 6, selected('dog') ? '#fff' : '#6b432d');
        ctx.strokeStyle = '#f4c04e';
        ctx.lineWidth = 2;
        ctx.strokeRect(dog.x - 6, dog.y - 6, 12, 12);

        // Orte/Marker
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "bold 8px 'Press Start 2P', monospace";
        map.features.forEach((f, i) => {
            const [x, y] = featureXY(f);
            const bx = Math.round(x) - 7;
            const by = Math.round(y) - 7;
            rect(bx, by, 14, 14, selected('feature', i) ? '#c96a4e' : '#6b432d');
            rect(bx + 1, by + 1, 12, 12, '#FFFDF9');
            ctx.fillStyle = '#6b432d';
            ctx.fillText(String(f.n), x, y + 1);
        });
    }

    // ---- Hit-Test ----
    function hitTest(p) {
        if (sel && sel.type === 'area') {
            const pts = worldPoints(map.areas[sel.idx]);
            for (let i = 0; i < pts.length; i++) {
                if (Math.hypot(p.x - pts[i][0], p.y - pts[i][1]) < 8) return { sel: { type: 'area', idx: sel.idx }, dragType: 'vertex', vidx: i };
            }
        }
        for (let i = map.trees.length - 1; i >= 0; i--) {
            if (Math.hypot(p.x - map.trees[i].x, p.y - map.trees[i].y) < 8) return { sel: { type: 'tree', idx: i }, dragType: 'move' };
        }
        for (let i = map.features.length - 1; i >= 0; i--) {
            const [x, y] = featureXY(map.features[i]);
            if (Math.hypot(p.x - x, p.y - y) < 9) return { sel: { type: 'feature', idx: i }, dragType: 'move' };
        }
        if (Math.hypot(p.x - map.dogStart.x, p.y - map.dogStart.y) < 10) return { sel: { type: 'dog' }, dragType: 'move' };
        for (let i = map.huts.length - 1; i >= 0; i--) {
            const h = map.huts[i];
            if (p.x >= h.x - 1 && p.x <= h.x + 13 && p.y >= h.y - 1 && p.y <= h.y + 13) return { sel: { type: 'hut', idx: i }, dragType: 'move' };
        }
        for (let i = map.ponds.length - 1; i >= 0; i--) {
            const q = map.ponds[i];
            if (((p.x - q.x) / q.rx) * ((p.x - q.x) / q.rx) + ((p.y - q.y) / q.ry) * ((p.y - q.y) / q.ry) <= 1) return { sel: { type: 'pond', idx: i }, dragType: 'move' };
        }
        for (let i = map.parkings.length - 1; i >= 0; i--) {
            const q = map.parkings[i];
            const s = parkingSize(q.cols);
            if (p.x >= q.x - s.w / 2 && p.x <= q.x + s.w / 2 && p.y >= q.y - s.h / 2 && p.y <= q.y + s.h / 2) return { sel: { type: 'parking', idx: i }, dragType: 'move' };
        }
        for (let i = map.buildings.length - 1; i >= 0; i--) {
            const b = map.buildings[i];
            if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return { sel: { type: 'building', idx: i }, dragType: 'move' };
        }
        for (let i = map.roads.length - 1; i >= 0; i--) {
            const r = map.roads[i];
            if (r.points && r.points.length) {
                if (sel && sel.type === 'road' && sel.idx === i) {
                    for (let k = 0; k < r.points.length; k++) {
                        if (Math.hypot(p.x - r.points[k][0], p.y - r.points[k][1]) < 8) {
                            return { sel: { type: 'road', idx: i }, dragType: 'vertex', vidx: k };
                        }
                    }
                }
                let bestd = Infinity;
                for (let k = 0; k < r.points.length - 1; k++) {
                    bestd = Math.min(bestd, distToSeg(p, r.points[k], r.points[k + 1]));
                }
                if (bestd < 8) return { sel: { type: 'road', idx: i }, dragType: 'moveRoad' };
            } else if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
                return { sel: { type: 'road', idx: i }, dragType: 'move' };
            }
        }
        for (let i = map.areas.length - 1; i >= 0; i--) {
            if (pointInPoly(p, worldPoints(map.areas[i]))) return { sel: { type: 'area', idx: i }, dragType: 'moveArea' };
        }
        return null;
    }

    function snapshot(hit) {
        const s = hit.sel;
        if (s.type === 'feature') { const f = map.features[s.idx]; return { x: f.x, y: f.y }; }
        if (s.type === 'dog') return { x: map.dogStart.x, y: map.dogStart.y };
        if (s.type === 'hut') { const h = map.huts[s.idx]; return { x: h.x, y: h.y }; }
        if (s.type === 'building') { const b = map.buildings[s.idx]; return { x: b.x, y: b.y }; }
        if (s.type === 'road') {
            const r = map.roads[s.idx];
            if (r.points) {
                if (hit.dragType === 'vertex') return { px: r.points[hit.vidx][0], py: r.points[hit.vidx][1] };
                return { points: r.points.map(c => [c[0], c[1]]) };
            }
            return { x: r.x, y: r.y };
        }
        if (s.type === 'pond') { const q = map.ponds[s.idx]; return { x: q.x, y: q.y }; }
        if (s.type === 'tree') { const t = map.trees[s.idx]; return { x: t.x, y: t.y }; }
        if (s.type === 'parking') { const q = map.parkings[s.idx]; return { x: q.x, y: q.y }; }
        if (s.type === 'area') {
            if (hit.dragType === 'vertex') { const wp = worldPoints(map.areas[s.idx]); return { px: wp[hit.vidx][0], py: wp[hit.vidx][1] }; }
            return { points: map.areas[s.idx].points.map(c => [c[0], c[1]]) };
        }
        return {};
    }

    function applyDrag(p) {
        const dx = p.x - drag.start.x;
        const dy = p.y - drag.start.y;
        const s = drag.hit.sel;
        if (s.type === 'feature') {
            const f = map.features[s.idx];
            const nx = clamp(snapv(drag.orig.x * W + dx), 0, W);
            const ny = clamp(snapv(drag.orig.y * H + dy), 0, H);
            f.x = norm2(nx / W); f.y = norm2(ny / H);
        } else if (s.type === 'dog') {
            map.dogStart.x = clamp(snapv(drag.orig.x + dx), 8, W - 8);
            map.dogStart.y = clamp(snapv(drag.orig.y + dy), 14, H - 6);
        } else if (s.type === 'hut') {
            const h = map.huts[s.idx];
            h.x = clamp(snapv(drag.orig.x + dx), 0, W - 12);
            h.y = clamp(snapv(drag.orig.y + dy), 0, H - 12);
        } else if (s.type === 'building') {
            const b = map.buildings[s.idx];
            b.x = clamp(snapv(drag.orig.x + dx), 0, W - b.w);
            b.y = clamp(snapv(drag.orig.y + dy), 0, H - b.h);
        } else if (s.type === 'road') {
            const r = map.roads[s.idx];
            if (r.points) {
                if (drag.hit.dragType === 'vertex') {
                    r.points[drag.hit.vidx] = [clamp(snapv(drag.orig.px + dx), 0, W), clamp(snapv(drag.orig.py + dy), 0, H)];
                } else {
                    r.points = drag.orig.points.map(c => [clamp(snapv(c[0] + dx), 0, W), clamp(snapv(c[1] + dy), 0, H)]);
                }
            } else {
                r.x = clamp(snapv(drag.orig.x + dx), 0, W - r.w);
                r.y = clamp(snapv(drag.orig.y + dy), 0, H - r.h);
            }
        } else if (s.type === 'pond') {
            const q = map.ponds[s.idx];
            q.x = clamp(snapv(drag.orig.x + dx), 0, W);
            q.y = clamp(snapv(drag.orig.y + dy), 0, H);
        } else if (s.type === 'tree') {
            const t = map.trees[s.idx];
            t.x = clamp(snapv(drag.orig.x + dx), 0, W);
            t.y = clamp(snapv(drag.orig.y + dy), 0, H);
        } else if (s.type === 'parking') {
            const q = map.parkings[s.idx];
            const s2 = parkingSize(q.cols);
            q.x = clamp(snapv(drag.orig.x + dx), s2.w / 2, W - s2.w / 2);
            q.y = clamp(snapv(drag.orig.y + dy), s2.h / 2, H - s2.h / 2);
        } else if (s.type === 'area') {
            const a = map.areas[s.idx];
            if (drag.hit.dragType === 'vertex') {
                const nx = clamp(snapv(drag.orig.px + dx), 0, W);
                const ny = clamp(snapv(drag.orig.py + dy), 0, H);
                a.points[drag.hit.vidx] = [norm2(nx / W), norm2(ny / H)];
            } else {
                a.points = drag.orig.points.map(c => {
                    const nx = clamp(snapv(c[0] * W + dx), 0, W);
                    const ny = clamp(snapv(c[1] * H + dy), 0, H);
                    return [norm2(nx / W), norm2(ny / H)];
                });
            }
        }
    }

    function toWorld(e) {
        const r = canvas.getBoundingClientRect();
        return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
    }

    canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const p = toWorld(e);
        const hit = hitTest(p);
        if (hit) {
            sel = hit.sel;
            drag = { hit, start: p, orig: snapshot(hit) };
            canvas.setPointerCapture(e.pointerId);
        } else {
            sel = null;
            drag = null;
        }
        render();
        refreshProps();
        refreshList();
    });
    canvas.addEventListener('pointermove', (e) => {
        if (!drag) return;
        applyDrag(toWorld(e));
        render();
        refreshProps();
    });
    canvas.addEventListener('pointerup', () => { drag = null; refreshProps(); refreshList(); });
    canvas.addEventListener('pointercancel', () => { drag = null; });

    // ---- Eigenschaften ----
    function row(label, inner) {
        return '<label class="ed-field"><span>' + label + '</span>' + inner + '</label>';
    }
    function numInput(key, value, step) {
        return '<input type="number" data-key="' + key + '" value="' + value + '" step="' + (step || 1) + '">';
    }
    function textInput(key, value) {
        return '<input type="text" data-key="' + key + '" value="' + esc(value) + '">';
    }

    function refreshProps() {
        const box = el.props;
        if (!sel) {
            box.innerHTML = '<p class="ed-empty">Nichts ausgewählt. Klicke ein Objekt auf der Karte oder in der Liste an.</p>';
            return;
        }
        let html = '';
        if (sel.type === 'feature') {
            const f = map.features[sel.idx];
            const [x, y] = featureXY(f);
            html += row('Nummer', numInput('n', f.n));
            html += row('Name', textInput('name', f.name));
            html += row('X', numInput('wx', Math.round(x)));
            html += row('Y', numInput('wy', Math.round(y)));
            html += '<label class="ed-field" style="align-items:flex-start"><span>Hani-Text</span><textarea data-key="d">' + esc(f.d) + '</textarea></label>';
            html += '<div style="font-size:.72rem;color:var(--color-Text-hell)">ID: ' + esc(f.id || '-') + '</div>';
        } else if (sel.type === 'building') {
            const b = map.buildings[sel.idx];
            html += row('Bezeichnung', textInput('label', b.label || ''));
            html += row('X', numInput('x', b.x));
            html += row('Y', numInput('y', b.y));
            html += row('Breite', numInput('w', b.w));
            html += row('Höhe', numInput('h', b.h));
            html += row('Drehung (°)', numInput('rot', b.rot || 0));
            html += row('Dachfarbe', '<input type="color" data-key="roof" value="' + (b.roof || '#8a4b3a') + '">');
            html += '<label class="ed-check" style="margin-top:.3rem"><input type="checkbox" data-key="timber"' + (b.timber ? ' checked' : '') + '> Fachwerk/Holz</label>';
        } else if (sel.type === 'hut') {
            const h = map.huts[sel.idx];
            html += row('Bezeichnung', textInput('label', h.label || ''));
            html += row('X', numInput('x', h.x));
            html += row('Y', numInput('y', h.y));
        } else if (sel.type === 'dog') {
            html += row('Start X', numInput('x', Math.round(map.dogStart.x)));
            html += row('Start Y', numInput('y', Math.round(map.dogStart.y)));
        } else if (sel.type === 'road') {
            const r = map.roads[sel.idx];
            html += row('Bezeichnung', textInput('label', r.label || ''));
            html += row('Breite', numInput('w', r.w || 14));
            if (r.points && r.points.length) {
                html += '<div style="margin:.4rem 0 .2rem;font-size:.78rem;color:var(--color-Text-hell)">Verlauf (Pixel)</div>';
                r.points.forEach((pt, vi) => {
                    html += '<div class="ed-vertex"><span>Punkt ' + (vi + 1) + '</span>' +
                        '<input type="number" data-vidx="' + vi + '" data-axis="0" value="' + Math.round(pt[0]) + '">' +
                        '<input type="number" data-vidx="' + vi + '" data-axis="1" value="' + Math.round(pt[1]) + '">' +
                        '<button class="ed-btn" data-remove-road-vertex="' + vi + '" title="Punkt entfernen">−</button></div>';
                });
                html += '<button class="ed-btn" data-add-road-vertex="1" style="margin-top:.3rem">+ Punkt</button>';
            } else {
                html += row('X', numInput('x', r.x));
                html += row('Y', numInput('y', r.y));
                html += row('Höhe', numInput('h', r.h));
            }
        } else if (sel.type === 'pond') {
            const q = map.ponds[sel.idx];
            html += row('Bezeichnung', textInput('label', q.label || ''));
            html += row('X', numInput('x', q.x));
            html += row('Y', numInput('y', q.y));
            html += row('Breite (rx)', numInput('rx', q.rx));
            html += row('Höhe (ry)', numInput('ry', q.ry));
        } else if (sel.type === 'tree') {
            const t = map.trees[sel.idx];
            html += row('X', numInput('x', Math.round(t.x)));
            html += row('Y', numInput('y', Math.round(t.y)));
            html += row('Art', '<select data-key="v"><option value="0"' + (t.v !== 1 ? ' selected' : '') + '>Laubbaum</option><option value="1"' + (t.v === 1 ? ' selected' : '') + '>Nadelbaum</option></select>');
        } else if (sel.type === 'parking') {
            const q = map.parkings[sel.idx];
            html += row('Bezeichnung', textInput('label', q.label || ''));
            html += row('X (Mitte)', numInput('x', q.x));
            html += row('Y (Mitte)', numInput('y', q.y));
            html += row('Stellplätze', numInput('cols', q.cols));
        } else if (sel.type === 'area') {
            const a = map.areas[sel.idx];
            html += row('Bezeichnung', textInput('label', a.label || ''));
            const opts = AREA_KINDS.map(k => '<option value="' + k.v + '"' + (a.kind === k.v ? ' selected' : '') + '>' + k.t + '</option>').join('');
            html += row('Typ', '<select data-key="kind">' + opts + '</select>');
            html += '<div style="margin:.4rem 0 .2rem;font-size:.78rem;color:var(--color-Text-hell)">Eckpunkte (in Pixel)</div>';
            a.points.forEach((pt, vi) => {
                html += '<div class="ed-vertex"><span>Punkt ' + (vi + 1) + '</span>' +
                    '<input type="number" data-vidx="' + vi + '" data-axis="0" value="' + Math.round(pt[0] * W) + '">' +
                    '<input type="number" data-vidx="' + vi + '" data-axis="1" value="' + Math.round(pt[1] * H) + '">' +
                    '<button class="ed-btn" data-remove-vertex="' + vi + '" title="Punkt entfernen">−</button></div>';
            });
            html += '<button class="ed-btn" data-add-vertex="1" style="margin-top:.3rem">+ Punkt</button>';
        }
        box.innerHTML = html;

        box.querySelectorAll('input,select,textarea').forEach(inp => {
            inp.addEventListener('input', () => onProp(inp));
            inp.addEventListener('change', () => onProp(inp));
        });
        box.querySelectorAll('[data-remove-vertex]').forEach(btn => {
            btn.addEventListener('click', () => {
                const a = map.areas[sel.idx];
                if (a.points.length > 3) { a.points.splice(parseInt(btn.dataset.removeVertex, 10), 1); render(); refreshProps(); refreshList(); }
            });
        });
        const addV = box.querySelector('[data-add-vertex]');
        if (addV) addV.addEventListener('click', () => {
            const a = map.areas[sel.idx];
            const last = a.points[a.points.length - 1];
            a.points.push([norm2(clamp(last[0] + 0.05, 0, 1)), last[1]]);
            render(); refreshProps();
        });

        box.querySelectorAll('[data-remove-road-vertex]').forEach(btn => {
            btn.addEventListener('click', () => {
                const r = map.roads[sel.idx];
                if (r.points && r.points.length > 2) {
                    r.points.splice(parseInt(btn.dataset.removeRoadVertex, 10), 1);
                    render(); refreshProps();
                }
            });
        });
        const addRV = box.querySelector('[data-add-road-vertex]');
        if (addRV) addRV.addEventListener('click', () => {
            const r = map.roads[sel.idx];
            const last = r.points[r.points.length - 1];
            r.points.push([clamp(last[0] + 12, 0, W), clamp(last[1], 0, H)]);
            render(); refreshProps();
        });
    }

    function onProp(inp) {
        if (!sel) return;
        const key = inp.dataset.key;
        const v = inp.value;
        if (sel.type === 'feature') {
            const f = map.features[sel.idx];
            if (key === 'n') f.n = parseInt(v, 10) || 0;
            else if (key === 'name') f.name = v;
            else if (key === 'd') f.d = v;
            else if (key === 'wx') f.x = norm2(clamp(parseFloat(v) || 0, 0, W) / W);
            else if (key === 'wy') f.y = norm2(clamp(parseFloat(v) || 0, 0, H) / H);
        } else if (sel.type === 'building') {
            const b = map.buildings[sel.idx];
            if (key === 'label') b.label = v;
            else if (key === 'x') b.x = clamp(parseFloat(v) || 0, 0, W);
            else if (key === 'y') b.y = clamp(parseFloat(v) || 0, 0, H);
            else if (key === 'w') b.w = clamp(parseFloat(v) || 0, 4, W);
            else if (key === 'h') b.h = clamp(parseFloat(v) || 0, 4, H);
            else if (key === 'roof') b.roof = v;
            else if (key === 'rot') b.rot = parseFloat(v) || 0;
            else if (key === 'timber') b.timber = inp.checked;
        } else if (sel.type === 'hut') {
            const h = map.huts[sel.idx];
            if (key === 'label') h.label = v;
            else if (key === 'x') h.x = clamp(parseFloat(v) || 0, 0, W);
            else if (key === 'y') h.y = clamp(parseFloat(v) || 0, 0, H);
        } else if (sel.type === 'dog') {
            if (key === 'x') map.dogStart.x = clamp(parseFloat(v) || 0, 0, W);
            else if (key === 'y') map.dogStart.y = clamp(parseFloat(v) || 0, 0, H);
        } else if (sel.type === 'road') {
            const r = map.roads[sel.idx];
            if (key === 'label') r.label = v;
            else if (key === 'x') r.x = clamp(parseFloat(v) || 0, 0, W);
            else if (key === 'y') r.y = clamp(parseFloat(v) || 0, 0, H);
            else if (key === 'w') r.w = clamp(parseFloat(v) || 0, 2, W);
            else if (key === 'h') r.h = clamp(parseFloat(v) || 0, 2, H);
            if (r.points && inp.dataset.vidx !== undefined) {
                const vi = parseInt(inp.dataset.vidx, 10);
                const axis = parseInt(inp.dataset.axis, 10);
                const max = axis ? H : W;
                r.points[vi][axis] = clamp(parseFloat(v) || 0, 0, max);
            }
        } else if (sel.type === 'pond') {
            const q = map.ponds[sel.idx];
            if (key === 'label') q.label = v;
            else if (key === 'x') q.x = clamp(parseFloat(v) || 0, 0, W);
            else if (key === 'y') q.y = clamp(parseFloat(v) || 0, 0, H);
            else if (key === 'rx') q.rx = clamp(parseFloat(v) || 0, 3, W);
            else if (key === 'ry') q.ry = clamp(parseFloat(v) || 0, 3, H);
        } else if (sel.type === 'tree') {
            const t = map.trees[sel.idx];
            if (key === 'x') t.x = clamp(parseFloat(v) || 0, 0, W);
            else if (key === 'y') t.y = clamp(parseFloat(v) || 0, 0, H);
            else if (key === 'v') t.v = parseInt(v, 10) === 1 ? 1 : 0;
        } else if (sel.type === 'parking') {
            const q = map.parkings[sel.idx];
            if (key === 'label') q.label = v;
            else if (key === 'x') q.x = clamp(parseFloat(v) || 0, 0, W);
            else if (key === 'y') q.y = clamp(parseFloat(v) || 0, 0, H);
            else if (key === 'cols') q.cols = clamp(Math.round(parseFloat(v) || 1), 1, 12);
        } else if (sel.type === 'area') {
            const a = map.areas[sel.idx];
            if (key === 'label') a.label = v;
            else if (key === 'kind') a.kind = v;
            if (inp.dataset.vidx !== undefined) {
                const vi = parseInt(inp.dataset.vidx, 10);
                const axis = parseInt(inp.dataset.axis, 10);
                const max = axis ? H : W;
                a.points[vi][axis] = norm2(clamp(parseFloat(v) || 0, 0, max) / max);
            }
        }
        render();
        refreshList();
    }

    // ---- Liste ----
    function item(type, idx, label, sub) {
        const active = selected(type, idx) ? ' active' : '';
        return '<li class="ed-item' + active + '" data-type="' + type + '" data-idx="' + idx + '">' +
            '<span class="ed-item-label">' + esc(label) + '</span>' +
            '<span class="ed-item-sub">' + esc(sub || '') + '</span>' +
            '<button class="ed-del" data-del-type="' + type + '" data-del-idx="' + idx + '" title="Löschen">✕</button></li>';
    }

    function refreshList() {
        let html = '<li class="ed-group">Hund</li>';
        html += item('dog', undefined, 'Startpunkt', Math.round(map.dogStart.x) + ',' + Math.round(map.dogStart.y));
        html += '<li class="ed-group">Orte (' + map.features.length + ')</li>';
        map.features.forEach((f, i) => { html += item('feature', i, f.n + '. ' + (f.name || ''), Math.round(f.x * W) + ',' + Math.round(f.y * H)); });
        html += '<li class="ed-group">Gebäude (' + map.buildings.length + ')</li>';
        map.buildings.forEach((b, i) => { html += item('building', i, b.label || ('Gebäude ' + (i + 1)), b.w + '×' + b.h); });
        html += '<li class="ed-group">Hütten (' + map.huts.length + ')</li>';
        map.huts.forEach((h, i) => { html += item('hut', i, h.label || ('Hütte ' + (i + 1)), Math.round(h.x) + ',' + Math.round(h.y)); });
        html += '<li class="ed-group">Flächen (' + map.areas.length + ')</li>';
        map.areas.forEach((a, i) => { html += item('area', i, a.label || a.id || ('Fläche ' + (i + 1)), a.kind); });
        html += '<li class="ed-group">Straßen (' + map.roads.length + ')</li>';
        map.roads.forEach((r, i) => {
            const sub = r.points ? ((r.w || 14) + ' px · ' + r.points.length + ' Pkt') : (r.w + '×' + r.h);
            html += item('road', i, r.label || ('Straße ' + (i + 1)), sub);
        });
        html += '<li class="ed-group">Parkplätze (' + map.parkings.length + ')</li>';
        map.parkings.forEach((p, i) => { html += item('parking', i, p.label || ('Parkplatz ' + (i + 1)), p.cols + ' Plätze'); });
        html += '<li class="ed-group">Teiche (' + map.ponds.length + ')</li>';
        map.ponds.forEach((p, i) => { html += item('pond', i, p.label || ('Teich ' + (i + 1)), p.rx + '×' + p.ry); });
        html += '<li class="ed-group">Bäume (' + map.trees.length + ')</li>';
        map.trees.forEach((t, i) => { html += item('tree', i, 'Baum', Math.round(t.x) + ',' + Math.round(t.y)); });
        el.list.innerHTML = html;

        el.list.querySelectorAll('.ed-item').forEach(li => {
            li.addEventListener('click', (e) => {
                if (e.target.closest('.ed-del')) return;
                const type = li.dataset.type;
                const idx = type === 'dog' ? undefined : parseInt(li.dataset.idx, 10);
                sel = { type, idx };
                render(); refreshProps(); refreshList();
            });
        });
        el.list.querySelectorAll('.ed-del').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const type = btn.dataset.delType;
                const idx = parseInt(btn.dataset.delIdx, 10);
                if (type === 'feature') map.features.splice(idx, 1);
                else if (type === 'building') map.buildings.splice(idx, 1);
                else if (type === 'hut') map.huts.splice(idx, 1);
                else if (type === 'area') map.areas.splice(idx, 1);
                else if (type === 'road') map.roads.splice(idx, 1);
                else if (type === 'pond') map.ponds.splice(idx, 1);
                else if (type === 'tree') map.trees.splice(idx, 1);
                else if (type === 'parking') map.parkings.splice(idx, 1);
                sel = null;
                render(); refreshProps(); refreshList();
            });
        });
    }

    // ---- Hinzufügen ----
    document.querySelectorAll('[data-add]').forEach(btn => {
        btn.addEventListener('click', () => {
            const t = btn.dataset.add;
            if (t === 'feature') {
                const maxN = map.features.reduce((m, f) => Math.max(m, f.n), 0);
                map.features.push({ n: maxN + 1, id: 'marker-neu-' + Date.now(), name: 'Neuer Ort', x: 0.5, y: 0.5, d: 'Hier gibt es etwas zu entdecken.' });
                sel = { type: 'feature', idx: map.features.length - 1 };
            } else if (t === 'building') {
                map.buildings.push({ x: 220, y: 180, w: 40, h: 24, roof: '#8a4b3a', label: 'Neues Gebäude' });
                sel = { type: 'building', idx: map.buildings.length - 1 };
            } else if (t === 'hut') {
                map.huts.push({ x: 200, y: 220, label: 'Neue Hütte' });
                sel = { type: 'hut', idx: map.huts.length - 1 };
            } else if (t === 'area') {
                map.areas.push({ id: 'flaeche-' + Date.now(), label: 'Neue Fläche', kind: 'plaza', points: [[0.4, 0.4], [0.6, 0.4], [0.6, 0.6], [0.4, 0.6]] });
                sel = { type: 'area', idx: map.areas.length - 1 };
            } else if (t === 'road') {
                map.roads.push({ w: 12, label: 'Neue Straße', points: [[200, 200], [260, 200], [300, 230]] });
                sel = { type: 'road', idx: map.roads.length - 1 };
            } else if (t === 'pond') {
                map.ponds.push({ x: 240, y: 300, rx: 16, ry: 10, label: 'Teich' });
                sel = { type: 'pond', idx: map.ponds.length - 1 };
            } else if (t === 'tree') {
                map.trees.push({ x: 240, y: 120 });
                sel = { type: 'tree', idx: map.trees.length - 1 };
            } else if (t === 'parking') {
                map.parkings.push({ x: 220, y: 90, cols: 3, label: 'Neuer Parkplatz' });
                sel = { type: 'parking', idx: map.parkings.length - 1 };
            }
            render(); refreshProps(); refreshList();
        });
    });

    // ---- Tastatur ----
    document.addEventListener('keydown', (e) => {
        if (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
        if (!sel) return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            if (sel.type === 'feature') map.features.splice(sel.idx, 1);
            else if (sel.type === 'building') map.buildings.splice(sel.idx, 1);
            else if (sel.type === 'hut') map.huts.splice(sel.idx, 1);
            else if (sel.type === 'area') map.areas.splice(sel.idx, 1);
            else if (sel.type === 'road') map.roads.splice(sel.idx, 1);
            else if (sel.type === 'pond') map.ponds.splice(sel.idx, 1);
            else if (sel.type === 'tree') map.trees.splice(sel.idx, 1);
            else if (sel.type === 'parking') map.parkings.splice(sel.idx, 1);
            sel = null;
            render(); refreshProps(); refreshList();
            return;
        }
        const step = e.shiftKey ? 10 : 1;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowLeft') dx = -step;
        else if (e.key === 'ArrowRight') dx = step;
        else if (e.key === 'ArrowUp') dy = -step;
        else if (e.key === 'ArrowDown') dy = step;
        else return;
        e.preventDefault();
        nudge(dx, dy);
        render(); refreshProps(); refreshList();
    });

    function nudge(dx, dy) {
        if (sel.type === 'feature') {
            const f = map.features[sel.idx];
            f.x = norm2(clamp(f.x + dx / W, 0, 1));
            f.y = norm2(clamp(f.y + dy / H, 0, 1));
        } else if (sel.type === 'dog') {
            map.dogStart.x = clamp(map.dogStart.x + dx, 8, W - 8);
            map.dogStart.y = clamp(map.dogStart.y + dy, 14, H - 6);
        } else if (sel.type === 'hut') {
            const h = map.huts[sel.idx];
            h.x += dx; h.y += dy;
        } else if (sel.type === 'building') {
            const b = map.buildings[sel.idx];
            b.x += dx; b.y += dy;
        } else if (sel.type === 'road') {
            const r = map.roads[sel.idx];
            if (r.points) {
                r.points = r.points.map(c => [clamp(c[0] + dx, 0, W), clamp(c[1] + dy, 0, H)]);
            } else {
                r.x += dx; r.y += dy;
            }
        } else if (sel.type === 'pond') {
            const q = map.ponds[sel.idx];
            q.x += dx; q.y += dy;
        } else if (sel.type === 'tree') {
            const t = map.trees[sel.idx];
            t.x += dx; t.y += dy;
        } else if (sel.type === 'parking') {
            const q = map.parkings[sel.idx];
            q.x += dx; q.y += dy;
        } else if (sel.type === 'area') {
            const a = map.areas[sel.idx];
            a.points = a.points.map(c => [norm2(clamp(c[0] + dx / W, 0, 1)), norm2(clamp(c[1] + dy / H, 0, 1))]);
        }
    }

    // ---- Export / Import ----
    function buildJSON() { return JSON.stringify(map, null, 2); }

    document.getElementById('ed-refresh-json').addEventListener('click', () => { el.json.value = buildJSON(); status('JSON aktualisiert.'); });
    document.getElementById('ed-copy').addEventListener('click', () => {
        el.json.value = buildJSON();
        if (navigator.clipboard) navigator.clipboard.writeText(el.json.value).then(() => status('In Zwischenablage kopiert.'), () => status('Kopieren nicht möglich.'));
    });
    document.getElementById('ed-download').addEventListener('click', () => {
        const blob = new Blob([buildJSON()], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'map.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        status('map.json erstellt. Datei in easteregg/map.json ersetzen und committen.');
    });
    document.getElementById('ed-import').addEventListener('click', () => {
        try {
            const parsed = JSON.parse(el.json.value);
            map = parsed;
            normalizeMap();
            sel = null;
            render(); refreshProps(); refreshList();
            status('JSON übernommen.');
        } catch (err) {
            status('Fehler im JSON: ' + err.message);
        }
    });
    el.file.addEventListener('change', () => {
        const file = el.file.files && el.file.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            el.json.value = String(reader.result);
            document.getElementById('ed-import').click();
        };
        reader.readAsText(file);
    });

    document.getElementById('ed-reset').addEventListener('click', () => {
        map = clone(DEFAULT_MAP);
        normalizeMap();
        sel = null;
        render(); refreshProps(); refreshList();
        status('Standardkarte geladen.');
    });

    // ---- Start ----
    function start(m) {
        map = clone(m);
        normalizeMap();
        render();
        refreshProps();
        refreshList();
        refreshProps();
    }

    if (typeof fetch === 'function') {
        fetch('map.json', { cache: 'no-store' })
            .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
            .then(start)
            .catch(() => {
                start(DEFAULT_MAP);
                status('map.json konnte nicht geladen werden – Standardkarte wird angezeigt.');
            });
    } else {
        start(DEFAULT_MAP);
    }
})();
