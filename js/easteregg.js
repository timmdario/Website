// ========================================
// EASTER EGG - Hani's Rundgang
// 2D Minispiel: Der Hund Hani zeigt Gäste über das FarmInn
// Kartendaten kommen aus easteregg/map.json (Fallback: js/easteregg-map.js).
// Optik angelehnt an den illustrierten Lageplan des FarmInn.
// Gestalten lässt sich die Karte über easteregg/editor.html.
// ========================================
(function () {
    'use strict';

    const CANVAS_W = 480;
    const CANVAS_H = 360;
    const SCALE = 3;          // Ausgabe-Auflösung = CANVAS * SCALE
    const ZOOM = (function () {
        try { return parseFloat(new URLSearchParams(location.search).get('zoom')) || 1.8; }
        catch (e) { return 1.8; }
    })();                     // Karten-Zoom; Kamera folgt dem Hund
    const OUT_W = Math.round(CANVAS_W * SCALE);
    const OUT_H = Math.round(CANVAS_H * SCALE);
    const VIEW_W = CANVAS_W / ZOOM;
    const VIEW_H = CANVAS_H / ZOOM;
    let camLeft = 0;
    let camTop = 0;

    const DEFAULT_MAP = window.FARMINN_DEFAULT_MAP || { features: [], buildings: [], huts: [], areas: [] };

    // Palette (an den illustrierten Lageplan angelehnt)
    const C = {
        bg: '#aab169',
        grass: '#9aa158',
        grassL: '#bcc17d',
        grassD: '#87904b',
        hedge: '#83904a',
        hedgeD: '#6c7838',
        pine: '#6f7d38',
        pineD: '#57642c',
        path: '#f0e8cd',
        pathEdge: '#d9cca4',
        court: '#f6efd9',
        courtShade: '#e7ddc0',
        wall: '#f8f1df',
        wallShade: '#eee3ca',
        timber: '#8a5a34',
        timberD: '#6b4225',
        roofOL: '#e58b4c',
        roofOD: '#b86027',
        roofBL: '#8d6039',
        roofBD: '#5f3b21',
        roofRL: '#ad5a40',
        roofRD: '#7a3826',
        win: '#a9d3dd',
        winD: '#79b0bf',
        door: '#5b3a22',
        trunk: '#8a6a44',
        trunkW: '#cdae82',
        iron: '#33302a',
        ironL: '#544e42',
        pink: '#e2b0b0',
        pinkD: '#cf9a9a',
        bus: '#e8823f',
        white: '#fbf7ee',
        alpaca: '#f7f2e4',
        alpacaB: '#6b4a30',
        pool: '#7cc3d8',
        straw: '#c9a24a',
        strawL: '#dcc06a'
    };

    const ctx = document.getElementById('egg-canvas').getContext('2d');
    ctx.canvas.width = OUT_W;
    ctx.canvas.height = OUT_H;

    const dialogText = document.getElementById('egg-dialog-text');
    const progressEl = document.getElementById('egg-progress');
    const legendList = document.getElementById('egg-legend-list');
    const resetBtn = document.getElementById('egg-reset');

    // ---- Weltzustand ----
    let FEATURES = [];
    let BUILDINGS = [];
    let HUTS = [];
    let AREAS = [];
    let ROADS = [];
    let PONDS = [];
    let TREES = [];
    let PARKINGS = [];
    let POINTS = [];
    let TOTAL = 0;
    let START = { x: 112, y: 70 };
    let PLAZA_C = null;

    const dog = { x: 112, y: 70, t: 0, frame: 0, moving: false, faceLeft: false };
    const input = { up: false, down: false, left: false, right: false };
    let target = null;
    let currentFeature = null;
    const discovered = new Set();

    const IDLE = 'Wuff! Folgt mir über den Hof – geht einfach in die Nähe eines Ortes, dann erzähle ich euch, was ihr seht!';

    function seededRandom(seed) {
        let s = seed;
        return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    }
    const rand = seededRandom(4242);

    // Grasflecken (weiche, runde Inseln) – fleckig grüne Wiese
    const grassBlobs = [];
    for (let i = 0; i < 90; i++) {
        const edge = rand() < 0.45;
        let x = rand() * CANVAS_W;
        let y = rand() * CANVAS_H;
        if (edge) {
            const side = Math.floor(rand() * 4);
            if (side === 0) y = rand() * 40;
            else if (side === 1) y = CANVAS_H - rand() * 40;
            else if (side === 2) x = rand() * 46;
            else x = CANVAS_W - rand() * 46;
        }
        const r = 8 + rand() * 22;
        const shade = rand();
        grassBlobs.push({ x, y, rx: r, ry: r * (0.55 + rand() * 0.3), c: shade < 0.36 ? C.grass : (shade < 0.72 ? C.grassL : C.grassD) });
    }
    // dunklere Strauch-/Baumgruppen am Rand (wie im Lageplan)
    const bushes = [];
    for (let i = 0; i < 26; i++) {
        const side = Math.floor(rand() * 4);
        let x, y;
        if (side === 0) { x = rand() * CANVAS_W; y = rand() * 24; }
        else if (side === 1) { x = rand() * CANVAS_W; y = CANVAS_H - rand() * 26; }
        else if (side === 2) { x = rand() * 30; y = rand() * CANVAS_H; }
        else { x = CANVAS_W - rand() * 30; y = rand() * CANVAS_H; }
        const r = 9 + rand() * 16;
        bushes.push({ x, y, rx: r, ry: r * (0.6 + rand() * 0.3), c: rand() < 0.5 ? C.hedge : C.hedgeD });
    }
    const tufts = [];
    for (let i = 0; i < 150; i++) tufts.push({ x: Math.floor(rand() * CANVAS_W), y: Math.floor(rand() * CANVAS_H), c: rand() < 0.5 ? C.grassD : C.grassL });

    const sprigs = [
        [40, 90], [70, 244], [110, 58], [162, 300], [212, 40], [246, 212], [330, 58],
        [382, 322], [430, 82], [300, 302], [92, 322], [420, 204], [190, 118], [352, 342]
    ];

    // ---- Helfer ----
    function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
    function roundRect(x, y, w, h, r, fill, stroke) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
    }
    function poly(pts, color) {
        if (!pts.length) return;
        ctx.fillStyle = color;
        ctx.beginPath();
        pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.closePath();
        ctx.fill();
    }
    function path(pts) {
        ctx.beginPath();
        pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    }
    function bbox(pts) {
        const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
        return { x0: Math.min.apply(null, xs), y0: Math.min.apply(null, ys), x1: Math.max.apply(null, xs), y1: Math.max.apply(null, ys) };
    }
    function label(text, x, y, size, color, halo) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "bold " + size + "px 'Press Start 2P', monospace";
        if (halo) { ctx.lineWidth = 3; ctx.strokeStyle = halo; ctx.lineJoin = 'round'; ctx.strokeText(text, x, y); }
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
    }
    function buildingAABB(b) {
        const rot = (b.rot || 0) * Math.PI / 180;
        if (!rot) return { x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h };
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2, hw = b.w / 2, hh = b.h / 2;
        const cos = Math.cos(rot), sin = Math.sin(rot);
        const pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(d => [cx + d[0] * cos - d[1] * sin, cy + d[0] * sin + d[1] * cos]);
        return { x0: Math.min.apply(null, pts.map(p => p[0])), y0: Math.min.apply(null, pts.map(p => p[1])), x1: Math.max.apply(null, pts.map(p => p[0])), y1: Math.max.apply(null, pts.map(p => p[1])) };
    }

    // ---- Boden ----
    function drawGrass() {
        rect(0, 0, CANVAS_W, CANVAS_H, C.bg);
        grassBlobs.forEach(b => {
            ctx.fillStyle = b.c;
            ctx.beginPath();
            ctx.ellipse(b.x, b.y, b.rx, b.ry, 0, 0, Math.PI * 2);
            ctx.fill();
        });
        // dunklere Strauchgruppen am Rand
        bushes.forEach(b => {
            ctx.fillStyle = b.c;
            ctx.beginPath();
            ctx.ellipse(b.x, b.y, b.rx, b.ry, 0, 0, Math.PI * 2);
            ctx.fill();
        });
        // Rand-Wiesenbänder
        ctx.fillStyle = C.hedge;
        ctx.beginPath(); ctx.ellipse(0, 180, 26, 210, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(CANVAS_W, 180, 28, 210, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(240, CANVAS_H, 320, 24, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(240, 0, 340, 18, 0, 0, 7); ctx.fill();
        tufts.forEach(t => { rect(t.x, t.y, 2, 2, t.c); });
    }

    function drawSprig(x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.5);
        ctx.fillStyle = C.pink;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.ellipse(0, -i * 3, 2.4 - i * 0.4, 3.4 - i * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.beginPath();
        ctx.moveTo(-0.6, 2); ctx.lineTo(-0.6, -12); ctx.lineTo(0.6, -12); ctx.lineTo(0.6, 2);
        ctx.fill();
        ctx.restore();
    }

    // ---- Straßen ----
    function drawRoad(r) {
        if (r.points && r.points.length) {
            ctx.save();
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            path(r.points); ctx.strokeStyle = C.pathEdge; ctx.lineWidth = (r.w || 14) + 4; ctx.stroke();
            path(r.points); ctx.strokeStyle = C.path; ctx.lineWidth = r.w || 14; ctx.stroke();
            ctx.restore();
        } else {
            rect(r.x, r.y, r.w, r.h, C.path);
            rect(r.x, r.y, r.w, 2, 'rgba(255,255,255,0.5)');
            rect(r.x, r.y + r.h - 2, r.w, 2, C.pathEdge);
        }
    }
    function drawPond(p) {
        ctx.fillStyle = C.pool;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    }

    // ---- Parkplatz ----
    function drawParking(cx, cy, cols) {
        const w = cols * 10 + 6, h = 16, x = cx - w / 2, y = cy - h / 2;
        roundRect(x, y, w, h, 4, C.court, C.pathEdge);
        for (let i = 0; i <= cols; i++) rect(x + 3 + i * 10, y + 3, 1, h - 6, 'rgba(200,168,110,0.55)');
    }
    function drawCar(x, y, color) {
        roundRect(x, y + 2, 7, 5, 1.5, color);
        rect(x + 1.5, y + 3, 4, 2, C.win);
        rect(x + 1, y + 6.5, 1.5, 1.5, '#3a3a3a');
        rect(x + 4.5, y + 6.5, 1.5, 1.5, '#3a3a3a');
    }
    function drawCarsInParking(cx, cy, cols) {
        const x = cx - (cols * 10 + 6) / 2, y = cy - 6;
        const colors = ['#d97a3a', '#7d9ec0', '#e0b23c', '#8fa04e', '#e9e5db', '#9b755c'];
        for (let i = 0; i < cols; i++) { if (i % 3 === 1) continue; drawCar(x + 3 + i * 10, y + 2, colors[i % colors.length]); }
    }
    function drawBus(x, y) {
        roundRect(x - 13, y - 6, 26, 12, 3, C.bus);
        rect(x - 13, y - 6, 26, 2, '#f2a06a');
        for (let i = 0; i < 5; i++) rect(x - 10 + i * 5, y - 2.5, 4, 4, C.win);
        rect(x - 10, y + 4, 2, 2, '#3a3a3a');
        rect(x + 8, y + 4, 2, 2, '#3a3a3a');
    }
    function drawCamper(x, y) {
        roundRect(x - 13, y - 7, 26, 13, 3, C.bus);
        rect(x - 13, y - 7, 26, 2.5, '#f2a06a');
        for (let i = 0; i < 4; i++) rect(x - 10 + i * 5, y - 3, 4, 4.5, C.win);
        rect(x - 11, y + 5, 2.2, 2.4, '#3a3a3a');
        rect(x + 9, y + 5, 2.2, 2.4, '#3a3a3a');
        // VW-Bus-Gesicht
        ctx.beginPath(); ctx.arc(x + 10.5, y + 1, 1.6, 0, 7); ctx.fillStyle = '#fbf7ee'; ctx.fill();
    }
    function drawCaravan(x, y) {
        roundRect(x - 8, y - 5, 16, 10, 3, C.white);
        roundRect(x - 5, y - 2, 7, 4.5, 1.5, C.win);
        rect(x - 8, y - 5, 16, 2, '#efe8d8');
        rect(x - 6, y + 5, 2, 2, '#3a3a3a');
        rect(x + 4, y + 5, 2, 2, '#3a3a3a');
    }

    // ---- Flächen ----
    function areaWorldPts(a) { return a.points.map(c => [c[0] * CANVAS_W, c[1] * CANVAS_H]); }

    function drawRailFence(pts) {
        ctx.strokeStyle = C.timberD;
        ctx.lineWidth = 1;
        path(pts); ctx.closePath(); ctx.stroke();
        // zweite Rail
        ctx.save();
        ctx.translate(0, -2.2);
        path(pts); ctx.closePath(); ctx.stroke();
        ctx.restore();
        pts.forEach(p => rect(p[0] - 1, p[1] - 3, 2, 5, C.timberD));
    }

    function drawAlpaca(x, y, brown) {
        const body = brown ? C.alpacaB : C.alpaca;
        const head = brown ? '#7d5a3c' : '#ffffff';
        rect(x + 1, y + 8, 2, 4, '#9a9182');
        rect(x + 6, y + 8, 2, 4, '#9a9182');
        roundRect(x, y + 1, 8, 8, 3, body);
        rect(x + 1.5, y + 2, 5, 2, 'rgba(255,255,255,0.4)');
        rect(x - 1, y - 6, 3, 8, body);
        roundRect(x - 3, y - 10, 5, 4.5, 2, head);
        rect(x - 3, y - 11, 2, 2, head);
        rect(x - 3.4, y - 8.6, 0.9, 0.9, '#3a3a3a');
        rect(x + 6.5, y - 6, 2.5, 2.5, head);
    }

    function drawSmallBarn(x, y) {
        roundRect(x, y + 5, 20, 12, 2, C.wall);
        const rl = C.roofOL, rd = C.roofOD;
        ctx.fillStyle = rl;
        ctx.beginPath(); ctx.moveTo(x - 2, y + 6); ctx.lineTo(x + 10, y - 4); ctx.lineTo(x + 10, y + 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = rd;
        ctx.beginPath(); ctx.moveTo(x + 10, y + 6); ctx.lineTo(x + 10, y - 4); ctx.lineTo(x + 22, y + 6); ctx.closePath(); ctx.fill();
        rect(x + 7, y + 10, 6, 7, C.door);
        rect(x + 2, y + 9, 4, 4, C.win);
        rect(x + 14, y + 9, 4, 4, C.win);
    }

    function drawTent(x, y, orange) {
        const c1 = orange ? '#e59a52' : '#f0e6bd';
        const c2 = orange ? '#c87a34' : '#ddd2a4';
        ctx.fillStyle = c1;
        ctx.beginPath(); ctx.moveTo(x, y + 11); ctx.lineTo(x + 9, y - 3); ctx.lineTo(x + 18, y + 11); ctx.closePath(); ctx.fill();
        ctx.fillStyle = c2;
        ctx.beginPath(); ctx.moveTo(x + 9, y + 11); ctx.lineTo(x + 9, y - 3); ctx.lineTo(x + 18, y + 11); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(120,80,40,0.55)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y + 11); ctx.lineTo(x + 9, y - 3); ctx.lineTo(x + 18, y + 11); ctx.closePath(); ctx.stroke();
        rect(x + 7, y + 6, 4, 5, 'rgba(90,60,30,0.5)');
    }

    function drawAreas() {
        AREAS.forEach(a => {
            if (!a.points || !a.points.length) return;
            const pts = areaWorldPts(a);
            const b = bbox(pts);
            if (a.kind === 'pasture') {
                poly(pts, C.grass);
                for (let i = 0; i < 12; i++) {
                    const gx = b.x0 + 6 + ((i * 53) % Math.max(1, b.x1 - b.x0 - 10));
                    const gy = b.y0 + 6 + ((i * 37) % Math.max(1, b.y1 - b.y0 - 10));
                    rect(gx, gy, 6, 4, C.grassD);
                }
                drawSmallBarn(b.x0 + 8, b.y0 + 12);
                drawAlpaca(b.x0 + 40, b.y0 + 30, false);
                drawAlpaca(b.x0 + 60, b.y0 + 44, true);
                drawRailFence(pts);
            } else if (a.kind === 'plaza') {
                poly(pts, C.court);
                ctx.save();
                path(pts); ctx.closePath(); ctx.clip();
                ctx.strokeStyle = 'rgba(214,190,150,0.4)';
                ctx.lineWidth = 9;
                const ccx = (b.x0 + b.x1) / 2;
                ctx.beginPath();
                ctx.moveTo(ccx - 30, b.y0); ctx.lineTo(ccx + 20, b.y1);
                ctx.moveTo(ccx + 34, b.y0); ctx.lineTo(ccx - 16, b.y1);
                ctx.stroke();
                for (let r = 14; r < 90; r += 14) {
                    ctx.beginPath(); ctx.arc(ccx, (b.y0 + b.y1) / 2, r, 0, 7); ctx.strokeStyle = 'rgba(214,190,150,0.22)'; ctx.stroke();
                }
                ctx.restore();
                ctx.strokeStyle = C.pathEdge; ctx.lineWidth = 2;
                path(pts); ctx.closePath(); ctx.stroke();
            } else if (a.kind === 'parking') {
                poly(pts, C.court);
                ctx.strokeStyle = C.pathEdge; ctx.lineWidth = 2;
                path(pts); ctx.closePath(); ctx.stroke();
                const cy = (b.y0 + b.y1) / 2 - 10;
                for (let i = 0; i < 3; i++) rect(b.x0 + 8 + i * 24, b.y0 + 5, 1, b.y1 - b.y0 - 10, 'rgba(200,168,110,0.5)');
                drawCamper(b.x0 + 16, cy + 10);
                drawCaravan(b.x0 + 44, cy + 22);
            } else if (a.kind === 'tents') {
                poly(pts, '#cdc47e');
                drawTent(b.x0 + 6, b.y0 + 16, true);
                drawTent(b.x0 + 26, b.y0 + 24, true);
            }
        });
    }

    // ---- Gebäude ----
    function drawWindows(X, wallY, w, wallH, b) {
        const cols = Math.max(1, Math.round((w - 6) / 15));
        const rows = wallH > 26 ? 2 : 1;
        const step = w / cols;
        const wh = Math.min(7, wallH / (rows + 0.6));
        for (let r = 0; r < rows; r++) {
            const wy = wallY + 4 + r * (wallH / rows - 1);
            for (let c = 0; c < cols; c++) {
                const wx = X + step * c + step / 2 - 3;
                roundRect(wx - 1, wy - 1, 8, wh + 2, 1, C.wall, null);
                rect(wx, wy, 6, wh, C.win);
                rect(wx, wy, 6, 1, C.winD);
                rect(wx + 2, wy, 1, wh, C.winD);
            }
        }
    }
    function drawDiagramm(X, wallY, w, wallH) {
        ctx.strokeStyle = C.timber;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(X + 0.7, wallY + 0.7, w - 1.4, wallH - 1.4);
        ctx.beginPath();
        ctx.moveTo(X + w / 2, wallY); ctx.lineTo(X + w / 2, wallY + wallH);
        ctx.moveTo(X, wallY + wallH * 0.45); ctx.lineTo(X + w, wallY + wallH * 0.45);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(X + 1, wallY + wallH - 1); ctx.lineTo(X + w / 2, wallY + wallH * 0.45);
        ctx.moveTo(X + w - 1, wallY + wallH - 1); ctx.lineTo(X + w / 2, wallY + wallH * 0.45);
        ctx.stroke();
    }
    function drawBuilding(b) {
        const w = b.w, h = b.h;
        const cx = b.x + w / 2, cy = b.y + h / 2;
        const rot = (b.rot || 0) * Math.PI / 180;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        const X = -w / 2, Y = -h / 2;
        const wallH = Math.max(9, h * 0.42);
        const roofH = h - wallH;
        const wallY = Y + roofH;

        // weicher Schatten
        ctx.fillStyle = 'rgba(120,95,55,0.16)';
        ctx.beginPath();
        ctx.ellipse(3, Y + h / 2 + 3, w * 0.55, h * 0.5, 0, 0, 7);
        ctx.fill();

        const tone = b.tone || 'orange';
        const RL = tone === 'brown' ? C.roofBL : tone === 'red' ? C.roofRL : C.roofOL;
        const RD = tone === 'brown' ? C.roofBD : tone === 'red' ? C.roofRD : C.roofOD;

        // Wand
        rect(X, wallY, w, wallH, C.wall);
        rect(X, wallY, w, 3, 'rgba(90,60,25,0.16)');   // Traufschatten unter dem Dach
        rect(X, wallY + wallH - 2, w, 2, C.wallShade);
        drawWindows(X, wallY, w, wallH, b);

        // Tür
        if (h > 26) {
            const dw = Math.min(10, w * 0.28), dh = Math.min(wallH - 3, 13);
            const dx = X + w / 2 - dw / 2, dy = wallY + wallH - dh;
            rect(dx - 1, dy - 1, dw + 2, dh + 1, C.wall);
            roundRect(dx, dy, dw, dh, 1.5, C.door);
            rect(dx + dw / 2 - 0.5, dy, 1, dh, '#4a2e1a');
        }

        if (b.timber) drawDiagramm(X, wallY, w, wallH);

        // Giebel-Dach (zweifarbig)
        ctx.fillStyle = RL;
        ctx.beginPath();
        ctx.moveTo(X - 2, wallY + 1); ctx.lineTo(X + w / 2, Y + 1); ctx.lineTo(X + w / 2, wallY + 1); ctx.closePath(); ctx.fill();
        ctx.fillStyle = RD;
        ctx.beginPath();
        ctx.moveTo(X + w / 2, wallY + 1); ctx.lineTo(X + w / 2, Y + 1); ctx.lineTo(X + w + 2, wallY + 1); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(80,50,20,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(X - 2, wallY + 1); ctx.lineTo(X + w / 2, Y + 1); ctx.lineTo(X + w + 2, wallY + 1);
        ctx.stroke();
        rect(X + w / 2 - 1, Y, 2, roofH, 'rgba(255,255,255,0.18)');

        ctx.restore();
    }
    function drawHut(h) {
        const x = h.x, y = h.y;
        ctx.fillStyle = 'rgba(120,95,55,0.16)';
        ctx.beginPath(); ctx.ellipse(x + 7, y + 13, 9, 3, 0, 0, 7); ctx.fill();
        roundRect(x, y + 5, 14, 9, 2, C.wall);
        ctx.fillStyle = C.roofRL;
        ctx.beginPath(); ctx.moveTo(x - 2, y + 6); ctx.lineTo(x + 7, y - 5); ctx.lineTo(x + 7, y + 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = C.roofRD;
        ctx.beginPath(); ctx.moveTo(x + 7, y + 6); ctx.lineTo(x + 7, y - 5); ctx.lineTo(x + 16, y + 6); ctx.closePath(); ctx.fill();
        rect(x + 5, y + 8, 4, 6, C.door);
        rect(x + 1, y + 8, 3, 3, C.win);
        rect(x + 10, y + 8, 3, 3, C.win);
    }

    // ---- Vegetation ----
    function drawTree(t) {
        const x = t.x, y = t.y;
        ctx.fillStyle = 'rgba(90,80,40,0.18)';
        ctx.beginPath(); ctx.ellipse(x + 1, y + 2, 8, 3, 0, 0, 7); ctx.fill();
        if (t.v === 1) {
            rect(x - 1.5, y + 1, 3, 9, C.trunk);
            ctx.fillStyle = '#4e5b2a';
            ctx.beginPath(); ctx.moveTo(x - 9, y + 3); ctx.lineTo(x, y - 15); ctx.lineTo(x + 9, y + 3); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#63703a';
            ctx.beginPath(); ctx.moveTo(x - 6, y - 5); ctx.lineTo(x, y - 16); ctx.lineTo(x + 5, y - 5); ctx.closePath(); ctx.fill();
        } else {
            const trunk = t.white ? C.trunkW : C.trunk;
            rect(x - 1.5, y - 1, 3, 10, trunk);
            ctx.fillStyle = '#66752f';
            ctx.beginPath(); ctx.ellipse(x, y - 6, 10, 9, 0, 0, 7); ctx.fill();
            ctx.fillStyle = '#7f8d3f';
            ctx.beginPath(); ctx.ellipse(x - 1.8, y - 8, 7, 6, 0, 0, 7); ctx.fill();
        }
    }

    // ---- Gadgets ----
    function drawLogo(x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.05);
        ctx.fillStyle = C.white;
        ctx.beginPath(); ctx.ellipse(-2, 0, 52, 46, 0, 0, 7); ctx.fill();
        // Schild
        ctx.beginPath();
        ctx.moveTo(-30, -24);
        ctx.lineTo(30, -24);
        ctx.quadraticCurveTo(33, 8, 0, 34);
        ctx.quadraticCurveTo(-33, 8, -30, -24);
        ctx.closePath();
        ctx.fillStyle = '#f8eed9';
        ctx.fill();
        ctx.strokeStyle = C.pinkD;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        // Ornament oben
        ctx.strokeStyle = C.pink;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.quadraticCurveTo(-12, -30, -6, -35);
        ctx.quadraticCurveTo(0, -39, 0, -33);
        ctx.quadraticCurveTo(0, -39, 6, -35);
        ctx.quadraticCurveTo(12, -30, 0, -24);
        ctx.stroke();
        // Text
        ctx.fillStyle = C.pinkD;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "italic bold 17px 'Playfair Display', Georgia, serif";
        ctx.fillText('Farm', 0, -6);
        ctx.fillText('Inn', 0, 12);
        ctx.restore();
    }

    function drawLegendOval(x, y) {
        ctx.fillStyle = 'rgba(251,247,238,0.85)';
        ctx.beginPath(); ctx.ellipse(x, y, 66, 56, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(220,200,160,0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(180,150,110,0.22)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 7; i++) {
            const yy = y - 26 + i * 9;
            const w = 44 - Math.abs(i - 3) * 5;
            ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.lineTo(x + w, yy); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(150,120,80,0.75)';
        ctx.beginPath(); ctx.arc(x, y - 44, 4.5, 0, 7); ctx.fill();
        label('1–20', x, y - 44, 4, '#fbf7ee');
    }

    function drawDirections() {
        const t = (text, x, y, ang) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(ang);
            label(text, 0, 0, 6, '#3a3f4a', 'rgba(255,255,255,0.75)');
            ctx.restore();
        };
        t('K 18', 175, 44, 0);
        t('K 18', 448, 150, Math.PI / 2);
        t('Hagen', 300, 42, 0);
        t('Eutzen', 452, 20, Math.PI / 2);
        t('Wittlingen', 452, 300, Math.PI / 2);
    }
    function arrow(x, y, ang) {
        ctx.save();
        ctx.translate(x, y); ctx.rotate(ang);
        ctx.strokeStyle = '#3a3f4a'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(3, -3.5); ctx.lineTo(3, 3.5); ctx.closePath();
        ctx.fillStyle = '#3a3f4a'; ctx.fill();
        ctx.restore();
    }
    function drawSignP(x, y) {
        rect(x - 0.7, y + 4, 1.4, 9, C.timberD);
        ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fillStyle = '#c0392b'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke();
        label('P', x, y + 0.5, 8, '#fff');
    }
    function drawGate(cx, y, span) {
        const half = span / 2;
        const topY = y - 16;
        // steinerne Schwelle
        rect(cx - half - 2, y + 4, span + 4, 3, C.courtShade);
        // Pfeiler
        rect(cx - half - 4, y - 6, 4, 12, C.wall);
        rect(cx + half, y - 6, 4, 12, C.wall);
        rect(cx - half - 4, y - 6, 4, 2, C.wallShade);
        rect(cx + half, y - 6, 4, 2, C.wallShade);
        // Torflügel-Hintergrund
        ctx.strokeStyle = C.iron;
        ctx.lineWidth = 1.6;
        // obere Leiste (leicht gewölbt)
        ctx.beginPath();
        ctx.moveTo(cx - half, y - 8);
        ctx.quadraticCurveTo(cx, topY - 4, cx + half, y - 8);
        ctx.stroke();
        // untere Leiste
        ctx.beginPath(); ctx.moveTo(cx - half, y + 3); ctx.lineTo(cx + half, y + 3); ctx.stroke();
        // Gitterstäbe
        ctx.lineWidth = 1;
        const n = Math.max(6, Math.round(span / 4.5));
        for (let i = 0; i <= n; i++) {
            const bx = cx - half + i * (span / n);
            const tt = i / n;
            const topBar = (1 - tt) * (1 - tt) * (y - 8) + 2 * (1 - tt) * tt * (topY - 6) + tt * tt * (y - 8);
            ctx.beginPath(); ctx.moveTo(bx, y + 3); ctx.lineTo(bx, topBar); ctx.stroke();
            // Speerspitze
            ctx.beginPath();
            ctx.moveTo(bx - 1.6, topBar + 2);
            ctx.lineTo(bx, topBar - 3.5);
            ctx.lineTo(bx + 1.6, topBar + 2);
            ctx.closePath();
            ctx.fillStyle = C.iron; ctx.fill();
        }
        // Mittig ein Riegel
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(cx, y - 6); ctx.lineTo(cx, y + 3); ctx.stroke();
        ctx.fillStyle = C.ironL;
        ctx.beginPath(); ctx.arc(cx, y - 1, 1.6, 0, 7); ctx.fill();
    }
    function drawStrings(x, y) {
        ctx.strokeStyle = 'rgba(70,60,45,0.55)';
        ctx.lineWidth = 0.7;
        ctx.setLineDash([2.5, 2.5]);
        const targets = [[x - 46, y - 24], [x + 52, y - 14], [x + 40, y + 40], [x - 44, y + 34]];
        targets.forEach(tg => {
            ctx.beginPath();
            ctx.moveTo(x, y - 6);
            ctx.quadraticCurveTo((x + tg[0]) / 2, Math.min(y - 6, tg[1]) - 10, tg[0], tg[1]);
            ctx.stroke();
        });
        ctx.setLineDash([]);
        // Mast
        ctx.fillStyle = C.iron;
        rect(x - 1, y - 8, 2, 12, C.iron);
        ctx.beginPath(); ctx.arc(x, y - 9, 1.8, 0, 7); ctx.fillStyle = '#f4d06a'; ctx.fill();
    }
    function drawCarousel(x, y) {
        rect(x - 0.7, y - 5, 1.4, 9, C.trunk);
        ctx.fillStyle = C.roofOL;
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 5);
        ctx.quadraticCurveTo(x, y - 22, x + 10, y - 5);
        ctx.closePath();
        ctx.fill();
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.arc(x + i * 3, y - 5, 1.6, 0, Math.PI);
            ctx.fillStyle = i % 2 ? '#c9743a' : C.roofOL;
            ctx.fill();
        }
    }
    function drawPoolHut(x, y) {
        roundRect(x - 10, y - 6, 20, 13, 2, C.wall);
        rect(x - 11, y - 9, 22, 4, C.roofBL);
        ctx.fillStyle = C.pool;
        ctx.beginPath(); ctx.ellipse(x, y + 2, 5.5, 3.2, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(x - 2, y - 1); ctx.quadraticCurveTo(x - 4, y - 5, x - 2, y - 9); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 2, y - 1); ctx.quadraticCurveTo(x + 4, y - 5, x + 2, y - 9); ctx.stroke();
    }
    function drawHay(x, y) {
        rect(x - 7, y - 4, 14, 8, C.straw);
        rect(x - 7, y - 4, 14, 3, C.strawL);
        ctx.strokeStyle = 'rgba(120,90,40,0.5)'; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); ctx.stroke();
    }
    function drawLounger(x, y) {
        roundRect(x, y, 6, 11, 1.5, C.timber);
        roundRect(x, y - 5, 6, 5, 1.5, '#a9764c');
        rect(x + 0.5, y + 0.5, 5, 1, 'rgba(255,255,255,0.25)');
    }
    function drawLoungers(x, y) {
        drawLounger(x, y); drawLounger(x + 9, y + 3);
        drawLounger(x, y + 14); drawLounger(x + 9, y + 17);
    }

    function drawGadgets() {
        drawLogo(58, 52);
        drawLegendOval(98, 292);
        drawDirections();
        arrow(255, 42, Math.PI);
        arrow(452, 60, -Math.PI / 2);
        arrow(452, 262, Math.PI / 2);
        // Richtungs-Straßenkennzeichnung
        ctx.save();
        // Hof-Eingangstor an der Südseite des Innenhofs
        drawGate(PLAZA_C ? PLAZA_C.x : 330, PLAZA_C ? PLAZA_C.y + 44 : 294, 54);
        drawStrings(PLAZA_C ? PLAZA_C.x - 16 : 314, PLAZA_C ? PLAZA_C.y - 30 : 232);
        drawCarousel(396, 220);
        drawPoolHut(238, 274);
        drawHay(300, 250);
        drawLoungers(300, 158);
        sprigs.forEach(s => drawSprig(s[0], s[1]));

        PARKINGS.forEach(p => {
            const w = p.cols * 10 + 6;
            drawSignP(p.x - w / 2 - 9, p.y - 6);
            if (p.cols === 1) drawBus(p.x, p.y);
            else drawCarsInParking(p.x, p.y, p.cols);
        });
    }

    // ---- Marker ----
    function drawBadges(cl, ct) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "bold 9px 'Press Start 2P', monospace";
        POINTS.forEach(p => {
            const found = discovered.has(p.n);
            const sx = (p.px - cl) * ZOOM;
            const sy = (p.py - ct) * ZOOM;
            if (currentFeature === p) {
                ctx.strokeStyle = 'rgba(214,96,12,0.95)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(sx, sy, 14 + Math.sin(dog.t * 6) * 2, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.fillStyle = found ? '#7f9150' : '#d97a3a';
            ctx.beginPath(); ctx.arc(sx, sy + 1, 10, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillText(String(p.n), sx, sy + 1.5);
        });
    }

    // ---- Hund ----
    function drawDog(dx, dy) {
        const cx = Math.round(dx), cy = Math.round(dy);
        const bob = dog.moving ? (Math.floor(dog.frame) % 2) : 0;
        const by = cy - 16 - bob;

        const pulse = 0.5 + 0.5 * Math.sin(dog.t * 4);
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.4 + 0.35 * pulse).toFixed(2) + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(cx, cy - 2, 14, 7, 0, 0, Math.PI * 2); ctx.stroke();

        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath(); ctx.ellipse(cx, cy - 1, 11, 4, 0, 0, Math.PI * 2); ctx.fill();

        ctx.save();
        if (dog.faceLeft) { ctx.translate(cx * 2, 0); ctx.scale(-1, 1); }

        const walkBack = dog.moving && Math.floor(dog.frame) % 2 === 0;
        const walkFront = dog.moving && Math.floor(dog.frame) % 2 === 1;
        const wag = Math.sin(dog.t * 8) * 3;

        rect(cx - 17, by - 4 + wag, 5, 4, '#5f3b26');
        rect(cx - 16, by - 8 + wag, 4, 5, '#5f3b26');
        rect(cx - 10, cy - 5, 3, 5, '#6b432d');
        rect(cx - 4, cy - 5, 3, 5, '#6b432d');
        rect(cx + 5, cy - 5 - (walkFront ? 1 : 0), 3, 5, '#8a5a3b');
        rect(cx + 9, cy - 5 + (walkBack ? 1 : 0), 3, 5, '#8a5a3b');
        rect(cx - 13, by + 2, 21, 9, '#8a5a3b');
        rect(cx - 11, by + 2, 13, 4, '#6b432d');
        rect(cx - 10, by + 9, 16, 2, '#a5754f');
        rect(cx + 5, by - 3, 11, 10, '#8a5a3b');
        rect(cx + 5, by - 7, 5, 6, '#5f3b26');
        rect(cx + 13, by + 2, 6, 5, '#d9b98f');
        rect(cx + 18, by + 3, 2, 2, '#2b2b2b');
        rect(cx + 10, by, 2, 2, '#2b2b2b');
        rect(cx + 5, by + 5, 11, 2, '#c96a4e');

        ctx.restore();
    }

    // ---- Render ----
    function render() {
        const eff = SCALE * ZOOM;
        camLeft = dog.x - VIEW_W / 2;
        camTop = dog.y - VIEW_H / 2;
        camLeft = Math.max(0, Math.min(CANVAS_W - VIEW_W, camLeft));
        camTop = Math.max(0, Math.min(CANVAS_H - VIEW_H, camTop));

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, OUT_W, OUT_H);

        ctx.setTransform(eff, 0, 0, eff, -camLeft * eff, -camTop * eff);

        drawGrass();
        ROADS.forEach(drawRoad);
        drawAreas();
        PARKINGS.forEach(p => drawParking(p.x, p.y, p.cols));

        BUILDINGS.forEach(drawBuilding);
        HUTS.forEach(drawHut);

        TREES.forEach(drawTree);
        PONDS.forEach(drawPond);

        drawGadgets();

        // Bildschirmfeste Ebene
        ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
        drawBadges(camLeft, camTop);
        drawDog((dog.x - camLeft) * ZOOM, (dog.y - camTop) * ZOOM);
    }

    // ---- Kollision ----
    function collides(x, y) {
        const bx = x - 7, by = y - 12, bw = 14, bh = 12;
        for (let i = 0; i < BUILDINGS.length; i++) {
            const b = BUILDINGS[i]._aabb;
            if (bx < b.x1 && bx + bw > b.x0 && by < b.y1 && by + bh > b.y0) return true;
        }
        return false;
    }

    // ---- Update ----
    const SPEED = 82;
    function update(dt) {
        let dx = 0, dy = 0;
        if (input.up) dy -= 1;
        if (input.down) dy += 1;
        if (input.left) dx -= 1;
        if (input.right) dx += 1;

        if (dx || dy) {
            target = null;
            const len = Math.hypot(dx, dy); dx /= len; dy /= len;
        } else if (target) {
            const tdx = target.x - dog.x, tdy = target.y - dog.y, d = Math.hypot(tdx, tdy);
            if (d < 4) target = null;
            else { dx = tdx / d; dy = tdy / d; }
        }

        const moving = !!(dx || dy);
        const nx = dog.x + dx * SPEED * dt, ny = dog.y + dy * SPEED * dt;
        if (!collides(nx, dog.y)) dog.x = nx; else if (target) target = null;
        if (!collides(dog.x, ny)) dog.y = ny; else if (target) target = null;
        dog.x = Math.max(8, Math.min(CANVAS_W - 8, dog.x));
        dog.y = Math.max(14, Math.min(CANVAS_H - 6, dog.y));

        if (moving) {
            dog.frame += dt * 9;
            if (dx < 0) dog.faceLeft = true; else if (dx > 0) dog.faceLeft = false;
        }
        dog.moving = moving;
        dog.t += dt;
        checkProximity();
    }

    function checkProximity() {
        let best = null, bestDist = Infinity;
        for (let i = 0; i < POINTS.length; i++) {
            const p = POINTS[i];
            const d = Math.hypot(dog.x - p.px, dog.y - p.py);
            if (d < p.r && d < bestDist) { best = p; bestDist = d; }
        }
        if (currentFeature) {
            const cd = Math.hypot(dog.x - currentFeature.px, dog.y - currentFeature.py);
            if (cd <= currentFeature.r + 6 && (!best || bestDist > cd * 0.6)) return;
        }
        if (best !== currentFeature) {
            currentFeature = best;
            if (best) {
                setDialog(best.name, best.d);
                if (!discovered.has(best.n)) { discovered.add(best.n); updateProgress(); }
            } else setDialog(null, IDLE);
        }
    }

    function setDialog(name, text) {
        dialogText.innerHTML = name ? '<strong>' + name + '</strong>' + text : text;
    }
    function updateProgress() {
        progressEl.textContent = 'Entdeckt: ' + discovered.size + ' / ' + TOTAL;
        legendList.querySelectorAll('li').forEach(li => {
            if (discovered.has(parseInt(li.dataset.n, 10))) li.classList.add('found');
            else li.classList.remove('found');
        });
    }

    // ---- Eingabe ----
    function setKey(dir, value) { if (input[dir] !== value) input[dir] = value; }
    const KEYMAP = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' };
    document.addEventListener('keydown', (e) => { const dir = KEYMAP[e.key.toLowerCase()]; if (dir) { e.preventDefault(); setKey(dir, true); } });
    document.addEventListener('keyup', (e) => { const dir = KEYMAP[e.key.toLowerCase()]; if (dir) { e.preventDefault(); setKey(dir, false); } });
    window.addEventListener('blur', () => { setKey('up', false); setKey('down', false); setKey('left', false); setKey('right', false); });

    document.querySelectorAll('.dpad-btn').forEach(btn => {
        const dir = btn.dataset.dir;
        const press = (e) => { e.preventDefault(); setKey(dir, true); btn.classList.add('active'); };
        const release = (e) => { if (e) e.preventDefault(); setKey(dir, false); btn.classList.remove('active'); };
        btn.addEventListener('pointerdown', press);
        btn.addEventListener('pointerup', release);
        btn.addEventListener('pointerleave', release);
        btn.addEventListener('pointercancel', release);
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });

    function canvasToWorld(clientX, clientY) {
        const r = ctx.canvas.getBoundingClientRect();
        return { x: camLeft + (clientX - r.left) / r.width * VIEW_W, y: camTop + (clientY - r.top) / r.height * VIEW_H };
    }
    ctx.canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); target = canvasToWorld(e.clientX, e.clientY); });
    ctx.canvas.addEventListener('touchstart', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

    // ---- Legende ----
    function buildLegend() {
        const seen = new Set(), items = [];
        FEATURES.forEach(f => { if (!seen.has(f.n)) { seen.add(f.n); items.push({ n: f.n, name: f.name }); } });
        items.sort((a, b) => a.n - b.n);
        legendList.innerHTML = items.map(it => '<li data-n="' + it.n + '"><span class="num">' + it.n + '</span><span class="name">' + it.name + '</span></li>').join('');
    }

    function reset() {
        dog.x = START.x; dog.y = START.y;
        dog.faceLeft = false; dog.frame = 0;
        target = null; currentFeature = null;
        discovered.clear();
        Object.keys(input).forEach(k => input[k] = false);
        document.querySelectorAll('.dpad-btn.active').forEach(b => b.classList.remove('active'));
        setDialog(null, IDLE);
        updateProgress();
    }
    resetBtn.addEventListener('click', reset);

    let last = 0;
    function loop(ts) {
        if (!last) last = ts;
        let dt = (ts - last) / 1000;
        last = ts;
        if (dt > 0.05) dt = 0.05;
        update(dt);
        render();
        requestAnimationFrame(loop);
    }

    // ---- Welt aufbauen ----
    function buildWorld(map) {
        FEATURES = (map.features || []).slice();
        BUILDINGS = (map.buildings || []).slice();
        HUTS = (map.huts || []).slice();
        AREAS = (map.areas || []).slice();
        ROADS = (map.roads || []).slice();
        PONDS = (map.ponds || []).slice();
        TREES = (map.trees || []).slice();
        PARKINGS = (map.parkings || []).slice();

        BUILDINGS.forEach(b => { b._aabb = buildingAABB(b); });

        AREAS.forEach(a => {
            if (!a.points || !a.points.length) return;
            const b = bbox(areaWorldPts(a));
            if (a.kind === 'plaza') PLAZA_C = { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 };
        });

        const ds = map.dogStart || { x: 112, y: 70 };
        START = { x: ds.x, y: ds.y };
        dog.x = START.x; dog.y = START.y;

        TOTAL = new Set(FEATURES.map(f => f.n)).size;

        POINTS = FEATURES.map(f => ({
            id: f.id, n: f.n, name: f.name, d: f.d,
            px: f.x * CANVAS_W, py: f.y * CANVAS_H, r: 30
        }));

        for (let i = 0; i < POINTS.length; i++) {
            for (let j = i + 1; j < POINTS.length; j++) {
                if (Math.abs(POINTS[i].px - POINTS[j].px) < 3 && Math.abs(POINTS[i].py - POINTS[j].py) < 3) {
                    POINTS[j].px += 16; POINTS[j].py -= 11;
                }
            }
        }

        POINTS.forEach(p => {
            let margin = Infinity;
            BUILDINGS.forEach(b => {
                const bb = b._aabb;
                const inside = p.px > bb.x0 && p.px < bb.x1 && p.py > bb.y0 && p.py < bb.y1;
                if (inside) margin = Math.min(margin, Math.min(p.px - bb.x0, bb.x1 - p.px, p.py - bb.y0, bb.y1 - p.py));
            });
            p.r = isFinite(margin) ? margin + 30 : 30;
        });
    }

    function boot(map) {
        buildWorld(map);
        buildLegend();
        updateProgress();
        requestAnimationFrame(loop);
    }

    if (typeof fetch === 'function') {
        fetch('map.json', { cache: 'no-store' })
            .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
            .then(map => boot(map))
            .catch(() => boot(DEFAULT_MAP));
    } else {
        boot(DEFAULT_MAP);
    }
})();
