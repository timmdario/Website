// ========================================
// EASTER EGG - Hani's Rundgang
// 2D Pixel-Art Minispiel: Der Hund Hani zeigt Gäste über das FarmInn
// Kartendaten kommen aus easteregg/map.json (Fallback: js/easteregg-map.js).
// Optik angelehnt an den illustrierten Lageplan des FarmInn.
// Gestalten lässt sich die Karte über easteregg/editor.html.
// ========================================
(function () {
    'use strict';

    const CANVAS_W = 480;
    const CANVAS_H = 360;
    const SCALE = 2.5;
    const OUT_W = Math.round(CANVAS_W * SCALE);
    const OUT_H = Math.round(CANVAS_H * SCALE);

    const DEFAULT_MAP = window.FARMINN_DEFAULT_MAP || { features: [], buildings: [], huts: [], areas: [] };

    // Palette (an den Lageplan angelehnt)
    const C = {
        ground: '#bebe88',
        groundLight: '#cec99c',
        groundDark: '#a8a572',
        groundTuft: '#90905c',
        pasture: '#a6af3f',
        pastureDark: '#949e35',
        path: '#f7ecd0',
        pathEdge: '#e6c9a2',
        court: '#fbf0d6',
        courtLine: 'rgba(200,160,110,0.35)',
        slot: '#f6efdc',
        roof: '#d2600c',
        roofLight: '#e5721c',
        roofDark: '#9a4410',
        roofBrown: '#6f3c18',
        wall: '#f4ead2',
        wallShade: '#e3d3b2',
        timber: '#3a2a1c',
        frame: '#fbf7ec',
        window: '#cfe7ee',
        windowDark: '#9dbcc6',
        door: '#5b3a22',
        wood: '#6b432d',
        woodDark: '#4a2e1b',
        fenceWire: '#6f6b5a',
        fenceWood: '#8a6a44',
        hedge: '#6f8048',
        hedgeLight: '#849a55',
        tree: '#8fa04e',
        treeDark: '#6d8440',
        trunk: '#5a3a22',
        tentYellow: '#efe6bc',
        tentYellowD: '#d8cf9c',
        tentOrange: '#d98a3a',
        alpaca: '#f7f2e4',
        alpacaBrown: '#6b4a30',
        bus: '#f2855a',
        lounger: '#f6d6b0',
        hay: '#c9a24a',
        hayLight: '#e0c470',
        logoCream: '#f8eed9',
        logoPink: '#dca0a0',
        ink: '#3a3f4a',
        water: '#9dc0dd'
    };

    const ctx = document.getElementById('egg-canvas').getContext('2d');
    ctx.canvas.width = OUT_W;
    ctx.canvas.height = OUT_H;
    ctx.imageSmoothingEnabled = false;

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
    let TENT_B = null;

    const dog = { x: 112, y: 70, t: 0, frame: 0, moving: false, faceLeft: false };

    const input = { up: false, down: false, left: false, right: false };
    let target = null;
    let currentFeature = null;
    const discovered = new Set();

    const IDLE = 'Wuff! Folgt mir über den Hof – geht einfach in die Nähe eines Ortes, dann erzähle ich euch, was ihr seht!';

    function seededRandom(seed) {
        let s = seed;
        return function () {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
    }
    const rand = seededRandom(1337);

    const tufts = [];
    for (let i = 0; i < 200; i++) tufts.push({ x: Math.floor(rand() * CANVAS_W), y: Math.floor(rand() * CANVAS_H) });
    const patches = [];
    for (let i = 0; i < 96; i++) {
        patches.push({
            x: Math.floor(rand() * CANVAS_W),
            y: Math.floor(rand() * CANVAS_H),
            w: 6 + Math.floor(rand() * 13),
            h: 5 + Math.floor(rand() * 10),
            dark: rand() < 0.5
        });
    }
    const bushes = [];
    for (let i = 0; i < 24; i++) {
        bushes.push({ x: 16 + Math.floor(rand() * (CANVAS_W - 32)), y: 24 + Math.floor(rand() * (CANVAS_H - 40)) });
    }
    const hedges = [
        { x: 78, y: 88, w: 8, h: 62 },
        { x: 4, y: 348, w: 120, h: 7 },
        { x: 356, y: 340, w: 120, h: 7 },
        { x: 236, y: 132, w: 120, h: 7 },
        { x: 300, y: 108, w: 96, h: 7 }
    ];

    // ---- Helfer ----
    function rect(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }
    function px(x, y, color) { rect(x, y, 1, 1, color); }

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
        const xs = pts.map(p => p[0]);
        const ys = pts.map(p => p[1]);
        return { x0: Math.min.apply(null, xs), y0: Math.min.apply(null, ys), x1: Math.max.apply(null, xs), y1: Math.max.apply(null, ys) };
    }
    function label(text, x, y, size, color, halo) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "bold " + size + "px 'Press Start 2P', monospace";
        if (halo) {
            ctx.lineWidth = 3;
            ctx.strokeStyle = halo;
            ctx.lineJoin = 'round';
            ctx.strokeText(text, x, y);
        }
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
    }
    function buildingAABB(b) {
        const rot = (b.rot || 0) * Math.PI / 180;
        if (!rot) return { x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h };
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        const hw = b.w / 2;
        const hh = b.h / 2;
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);
        const pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(d => [cx + d[0] * cos - d[1] * sin, cy + d[0] * sin + d[1] * cos]);
        return { x0: Math.min.apply(null, pts.map(p => p[0])), y0: Math.min.apply(null, pts.map(p => p[1])), x1: Math.max.apply(null, pts.map(p => p[0])), y1: Math.max.apply(null, pts.map(p => p[1])) };
    }

    // ---- Boden ----
    function drawGrass() {
        rect(0, 0, CANVAS_W, CANVAS_H, C.ground);
        patches.forEach(p => rect(p.x, p.y, p.w, p.h, p.dark ? C.groundDark : C.groundLight));
        for (let y = 0; y < CANVAS_H; y += 16) {
            for (let x = 0; x < CANVAS_W; x += 16) {
                if (((x / 16) + (y / 16)) % 2 === 0) rect(x, y, 16, 16, 'rgba(0,0,0,0.02)');
            }
        }
        tufts.forEach(t => { rect(t.x, t.y, 2, 3, C.groundTuft); px(t.x + 2, t.y + 1, C.groundTuft); });
    }

    // ---- Straßen (cremefarbene Wege) ----
    function drawRoad(r) {
        if (r.points && r.points.length) {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            path(r.points);
            ctx.strokeStyle = C.pathEdge;
            ctx.lineWidth = (r.w || 14) + 3;
            ctx.stroke();
            path(r.points);
            ctx.strokeStyle = C.path;
            ctx.lineWidth = r.w || 14;
            ctx.stroke();
            ctx.restore();
        } else {
            rect(r.x, r.y, r.w, r.h, C.path);
            rect(r.x, r.y, r.w, 1, 'rgba(255,255,255,0.35)');
            rect(r.x, r.y + r.h - 2, r.w, 2, C.pathEdge);
        }
    }

    function drawPond(p) {
        ctx.fillStyle = C.water;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // ---- Parkplatz ----
    function drawParking(cx, cy, cols) {
        const w = cols * 8 + 4;
        const h = 14;
        const x = cx - w / 2;
        const y = cy - h / 2;
        rect(x, y, w, h, C.court);
        ctx.strokeStyle = C.pathEdge;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w, h);
        for (let i = 0; i <= cols; i++) rect(x + 2 + i * 8, y + 2, 1, h - 4, C.slot);
        for (let i = 0; i <= cols; i++) rect(x + 2 + i * 8, y + 2, 1, h - 4, 'rgba(200,160,110,0.4)');
    }

    function drawCar(x, y, color) {
        rect(x, y + 2, 6, 4, color);
        rect(x + 1, y + 1, 4, 2, C.window);
        rect(x, y + 2, 6, 1, 'rgba(0,0,0,0.15)');
        rect(x + 1, y + 6, 1, 1, '#3a3a3a');
        rect(x + 4, y + 6, 1, 1, '#3a3a3a');
    }
    function drawCarsInParking(cx, cy, cols) {
        const w = cols * 8 + 4;
        const x = cx - w / 2;
        const y = cy - 7;
        const colors = ['#d2600c', '#7d9ec0', '#e0b23c', '#8fa04e', '#e9e5db', '#9b755c'];
        for (let i = 0; i < cols; i++) {
            if (i % 3 === 1) continue;
            drawCar(x + 3 + i * 8, y + 2, colors[i % colors.length]);
        }
    }
    function drawBus(x, y) {
        rect(x - 12, y - 5, 24, 10, C.bus);
        rect(x - 12, y - 5, 24, 2, '#f7a884');
        for (let i = 0; i < 5; i++) rect(x - 9 + i * 5, y - 2, 4, 4, C.window);
        rect(x - 12, y + 4, 24, 1, 'rgba(0,0,0,0.18)');
        rect(x - 10, y + 5, 2, 2, '#3a3a3a');
        rect(x + 8, y + 5, 2, 2, '#3a3a3a');
    }
    function drawCamper(x, y) {
        rect(x, y + 4, 16, 8, '#f7f1e4');
        rect(x + 1, y + 5, 6, 4, C.window);
        rect(x, y, 16, 5, '#efe6d2');
        rect(x + 11, y + 1, 4, 3, '#d9cdb6');
        rect(x + 1, y + 11, 2, 2, '#3a3a3a');
        rect(x + 13, y + 11, 2, 2, '#3a3a3a');
    }

    // ---- Flächen ----
    function areaWorldPts(a) { return a.points.map(c => [c[0] * CANVAS_W, c[1] * CANVAS_H]); }

    function drawWireFence(pts) {
        ctx.strokeStyle = C.fenceWire;
        ctx.lineWidth = 1;
        path(pts);
        ctx.closePath();
        ctx.stroke();
        pts.forEach(p => rect(p[0] - 1, p[1] - 2, 2, 4, C.fenceWire));
    }

    function drawAlpaca(x, y, brown) {
        const body = brown ? C.alpacaBrown : C.alpaca;
        const head = brown ? '#7d5a3c' : '#ffffff';
        rect(x + 1, y + 8, 2, 4, '#8a8272');
        rect(x + 5, y + 8, 2, 4, '#8a8272');
        rect(x, y + 1, 7, 7, body);
        rect(x + 1, y + 2, 5, 2, 'rgba(255,255,255,0.35)');
        rect(x - 1, y - 5, 3, 7, body);
        rect(x - 2, y - 8, 5, 4, head);
        rect(x - 2, y - 9, 2, 2, head);
        rect(x + 5, y - 7, 2, 2, '#3a3a3a');
    }

    function drawSmallBarn(x, y) {
        rect(x, y + 5, 18, 11, C.wall);
        rect(x, y + 5, 18, 3, C.wallShade);
        ctx.fillStyle = C.roof;
        ctx.beginPath();
        ctx.moveTo(x - 2, y + 5);
        ctx.lineTo(x + 9, y - 3);
        ctx.lineTo(x + 20, y + 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = C.roofDark;
        ctx.lineWidth = 1;
        ctx.stroke();
        rect(x + 6, y + 10, 5, 6, C.door);
        rect(x + 1, y + 9, 3, 3, C.window);
        rect(x + 14, y + 9, 3, 3, C.window);
    }

    function drawTent(x, y, orange) {
        const c1 = orange ? C.tentOrange : C.tentYellow;
        const c2 = orange ? '#b8712c' : C.tentYellowD;
        ctx.fillStyle = c2;
        ctx.beginPath();
        ctx.moveTo(x, y + 10);
        ctx.lineTo(x + 8, y - 2);
        ctx.lineTo(x + 16, y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = c1;
        ctx.beginPath();
        ctx.moveTo(x, y + 10);
        ctx.lineTo(x + 8, y - 2);
        ctx.lineTo(x + 8, y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(90,60,30,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + 10);
        ctx.lineTo(x + 8, y - 2);
        ctx.lineTo(x + 16, y + 10);
        ctx.closePath();
        ctx.stroke();
        rect(x + 6, y + 6, 4, 4, 'rgba(90,60,30,0.55)');
    }

    function drawAreas() {
        AREAS.forEach(a => {
            if (!a.points || !a.points.length) return;
            const pts = areaWorldPts(a);
            const b = bbox(pts);
            if (a.kind === 'pasture') {
                poly(pts, C.pasture);
                // grasige Flecken
                for (let i = 0; i < 10; i++) {
                    const gx = b.x0 + 6 + (i * 37 % Math.max(1, b.x1 - b.x0 - 12));
                    const gy = b.y0 + 8 + (i * 53 % Math.max(1, b.y1 - b.y0 - 16));
                    rect(gx, gy, 8, 5, C.pastureDark);
                }
                drawSmallBarn(b.x0 + 8, b.y0 + 14);
                drawAlpaca(b.x0 + 40, b.y0 + 26, false);
                drawAlpaca(b.x0 + 62, b.y0 + 40, true);
                drawWireFence(pts);
            } else if (a.kind === 'plaza') {
                poly(pts, C.court);
                ctx.save();
                path(pts);
                ctx.closePath();
                ctx.clip();
                ctx.strokeStyle = C.courtLine;
                ctx.lineWidth = 7;
                const ccx = (b.x0 + b.x1) / 2;
                ctx.beginPath();
                ctx.moveTo(ccx - 40, b.y0);
                ctx.lineTo(ccx + 20, b.y1);
                ctx.moveTo(ccx + 40, b.y0);
                ctx.lineTo(ccx - 20, b.y1);
                ctx.stroke();
                ctx.restore();
                ctx.strokeStyle = C.pathEdge;
                ctx.lineWidth = 2;
                path(pts);
                ctx.closePath();
                ctx.stroke();
            } else if (a.kind === 'parking') {
                poly(pts, C.court);
                ctx.strokeStyle = C.pathEdge;
                ctx.lineWidth = 2;
                path(pts);
                ctx.closePath();
                ctx.stroke();
                const cy = (b.y0 + b.y1) / 2 - 8;
                for (let i = 0; i < 3; i++) rect(b.x0 + 8 + i * 24, b.y0 + 5, 1, b.y1 - b.y0 - 10, 'rgba(200,160,110,0.5)');
                drawCamper(b.x0 + 10, cy + 6);
                drawCamper(b.x0 + 34, cy + 6);
            } else if (a.kind === 'tents') {
                poly(pts, '#c9c07c');
                drawTent(b.x0 + 8, b.y0 + 14, true);
                drawTent(b.x0 + 30, b.y0 + 22, false);
            }
        });
    }

    // ---- Gebäude ----
    function drawBuilding(b) {
        const w = b.w;
        const h = b.h;
        const cx = b.x + w / 2;
        const cy = b.y + h / 2;
        const rot = (b.rot || 0) * Math.PI / 180;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        const X = -w / 2;
        const Y = -h / 2;

        // Schatten
        ctx.fillStyle = 'rgba(60,40,20,0.16)';
        ctx.fillRect(X + 3, Y + 5, w, h);

        const wallH = Math.max(8, h * 0.42);
        const roofH = h - wallH;
        const wallY = Y + roofH;

        // Wand
        rect(X, wallY, w, wallH, C.wall);
        if (b.timber) {
            rect(X, wallY, w, 2, C.timber);
            rect(X, wallY, 2, wallH, C.timber);
            rect(X + w - 2, wallY, 2, wallH, C.timber);
            rect(X, wallY + wallH - 2, w, 2, C.timber);
            rect(X + w / 2 - 1, wallY, 2, wallH, C.timber);
        } else {
            rect(X, wallY, w, 2, C.wallShade);
            for (let sy = wallY + 5; sy < wallY + wallH; sy += 4) rect(X, sy, w, 1, 'rgba(0,0,0,0.05)');
        }

        // Fenster
        const cols = Math.max(1, Math.floor((w - 6) / 12));
        const step = w / cols;
        for (let c = 0; c < cols; c++) {
            const wx = X + step * c + step / 2 - 3;
            const wy = wallY + 4;
            rect(wx - 1, wy - 1, 8, 8, C.frame);
            rect(wx, wy, 6, 6, C.window);
            rect(wx, wy, 6, 1, C.windowDark);
            rect(wx + 2, wy, 1, 6, C.windowDark);
        }

        // Tür
        const dx = X + w / 2 - 5;
        const dy = wallY + wallH - 11;
        rect(dx - 1, dy - 1, 12, 12, C.frame);
        rect(dx, dy, 10, 11, C.door);

        // Dach (Giebel mit Traufe)
        const eave = 3;
        ctx.fillStyle = C.roof;
        ctx.beginPath();
        ctx.moveTo(X - eave, wallY + 2);
        ctx.lineTo(X + 2, Y + 2);
        ctx.lineTo(X + w - 2, Y + 2);
        ctx.lineTo(X + w + eave, wallY + 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = C.roofDark;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // First + Schattierung
        rect(X + 3, Y + 3, w - 6, 2, C.roofLight);
        rect(X + w - 2, Y + 3, 3, roofH - 1, 'rgba(0,0,0,0.10)');
        ctx.strokeStyle = 'rgba(0,0,0,0.10)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(X + 3 + i * 3, Y + 4);
            ctx.lineTo(X - eave + 1 + i * 3, wallY);
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawHut(h) {
        const x = h.x;
        const y = h.y;
        rect(x + 1, y + 6, 12, 6, 'rgba(60,40,20,0.14)');
        rect(x, y + 5, 12, 7, C.wall);
        ctx.fillStyle = C.roof;
        ctx.beginPath();
        ctx.moveTo(x - 1, y + 5);
        ctx.lineTo(x + 6, y - 2);
        ctx.lineTo(x + 13, y + 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = C.roofDark;
        ctx.lineWidth = 1;
        ctx.stroke();
        rect(x + 4, y + 8, 4, 4, C.door);
        rect(x + 1, y + 7, 2, 2, C.window);
        rect(x + 9, y + 7, 2, 2, C.window);
    }

    // ---- Vegetation ----
    function drawTree(t) {
        const x = t.x;
        const y = t.y;
        if (t.v === 1) {
            rect(x - 1, y + 2, 3, 7, C.trunk);
            ctx.fillStyle = C.treeDark;
            ctx.beginPath();
            ctx.moveTo(x - 7, y + 2);
            ctx.lineTo(x, y - 12);
            ctx.lineTo(x + 7, y + 2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = C.tree;
            ctx.beginPath();
            ctx.moveTo(x - 6, y - 4);
            ctx.lineTo(x, y - 13);
            ctx.lineTo(x + 5, y - 4);
            ctx.closePath();
            ctx.fill();
        } else {
            rect(x - 1, y, 3, 9, C.trunk);
            ctx.fillStyle = C.treeDark;
            ctx.beginPath();
            ctx.ellipse(x, y - 4, 8, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = C.tree;
            ctx.beginPath();
            ctx.ellipse(x - 1, y - 6, 6, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    function drawBush(b) {
        ctx.fillStyle = C.hedge;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    function drawHedge(h) {
        rect(h.x, h.y, h.w, h.h, C.hedge);
        rect(h.x, h.y, h.w, 2, C.hedgeLight);
        for (let x = h.x + 2; x < h.x + h.w - 1; x += 4) rect(x, h.y + 2, 1, h.h - 2, 'rgba(0,0,0,0.12)');
    }

    // ---- Gadgets (an den Lageplan angelehnt) ----
    function drawLogo(x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.08);
        ctx.fillStyle = C.logoCream;
        ctx.strokeStyle = 'rgba(220,160,160,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const R = 46;
        for (let i = 0; i <= 36; i++) {
            const a = i / 36 * Math.PI * 2;
            const rr = R * (1 + 0.05 * Math.sin(a * 6));
            const px2 = Math.cos(a) * rr;
            const py2 = Math.sin(a) * rr * 0.82;
            i ? ctx.lineTo(px2, py2) : ctx.moveTo(px2, py2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Emblem
        ctx.strokeStyle = C.logoPink;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-10, -16);
        ctx.quadraticCurveTo(0, -26, 10, -16);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -22, 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#c9905a';
        ctx.font = "italic bold 17px 'Playfair Display', Georgia, serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Farm', 0, -4);
        ctx.fillText('Inn', 0, 14);
        ctx.restore();
    }

    function drawCompass(x, y) {
        ctx.fillStyle = C.logoCream;
        ctx.strokeStyle = 'rgba(210,180,140,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, 58, 50, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(200,150,95,0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(x, y, 40, 34, 0, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 16; i++) {
            const a = i / 16 * Math.PI * 2 - Math.PI / 2;
            const r0 = (i % 4 === 0) ? 26 : 34;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0 * 0.85);
            ctx.lineTo(x + Math.cos(a) * 40, y + Math.sin(a) * 34);
            ctx.stroke();
        }
        ctx.fillStyle = C.roof;
        ctx.beginPath();
        ctx.moveTo(x, y - 30);
        ctx.lineTo(x - 5, y);
        ctx.lineTo(x + 5, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#9a8f78';
        ctx.beginPath();
        ctx.moveTo(x, y + 30);
        ctx.lineTo(x - 5, y);
        ctx.lineTo(x + 5, y);
        ctx.closePath();
        ctx.fill();
        label('N', x, y - 42, 6, C.roof, 'rgba(255,255,255,0.7)');
        label('S', x, y + 42, 5, '#8a8272');
        label('O', x + 47, y, 5, '#8a8272');
        label('W', x - 47, y, 5, '#8a8272');
    }

    function drawGate(x, y, w) {
        // Steinpfeiler
        rect(x - w / 2 - 3, y - 8, 4, 12, C.wall);
        rect(x + w / 2 - 1, y - 8, 4, 12, C.wall);
        // Gitter
        ctx.strokeStyle = C.fenceWire;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - w / 2, y - 8);
        ctx.lineTo(x - w / 2, y + 4);
        ctx.moveTo(x + w / 2, y - 8);
        ctx.lineTo(x + w / 2, y + 4);
        ctx.stroke();
        for (let gx = x - w / 2 + 3; gx < x + w / 2; gx += 4) {
            ctx.beginPath();
            ctx.moveTo(gx, y + 4);
            ctx.lineTo(gx, y - 8);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(x - w / 2, y - 6);
        ctx.lineTo(x + w / 2, y - 6);
        ctx.stroke();
    }

    function drawMaypole(x, y) {
        rect(x, y - 14, 2, 18, C.wood);
        ctx.fillStyle = C.roof;
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 14);
        ctx.lineTo(x + 1, y - 22);
        ctx.lineTo(x + 8, y - 14);
        ctx.closePath();
        ctx.fill();
    }

    function drawHay(x, y) {
        rect(x - 6, y - 4, 13, 8, C.hay);
        rect(x - 6, y - 4, 13, 3, C.hayLight);
        rect(x - 6, y, 13, 1, 'rgba(0,0,0,0.12)');
    }

    function drawLoungers(x, y) {
        for (let i = 0; i < 4; i++) {
            rect(x + i * 6, y, 4, 9, C.lounger);
            rect(x + i * 6, y, 1, 9, 'rgba(120,80,40,0.15)');
            rect(x + i * 6, y - 4, 4, 4, '#e0c49a');
        }
    }

    function drawParkingSign(x, y) {
        rect(x, y + 6, 1, 6, C.fenceWood);
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.arc(x + 0.5, y + 3, 5, 0, Math.PI * 2);
        ctx.fill();
        label('P', x + 0.5, y + 3, 6, '#fff');
    }

    function drawDirections() {
        label('K 18', 150, 22, 6, C.ink, 'rgba(255,255,255,0.7)');
        label('K 18', 430, 150, 6, C.ink, 'rgba(255,255,255,0.7)');
        label('Hagen ←', 300, 26, 5, C.ink, 'rgba(255,255,255,0.7)');
        label('Eutzen ↑', 420, 14, 5, C.ink, 'rgba(255,255,255,0.7)');
        label('Wittlingen ↓', 434, 306, 5, C.ink, 'rgba(255,255,255,0.7)');
    }

    function drawGadgets() {
        drawLogo(56, 44);
        drawCompass(96, 288);
        drawDirections();
        drawMaypole(PLAZA_C ? PLAZA_C.x : 360, PLAZA_C ? PLAZA_C.y - 6 : 210);
        drawGate(PLAZA_C ? PLAZA_C.x : 360, PLAZA_C ? PLAZA_C.y + 44 : 300, 34);
        drawHay(368, 214);
        drawLoungers(150, 336);

        PARKINGS.forEach(p => {
            const w = p.cols * 8 + 4;
            drawParkingSign(p.x - w / 2 - 7, p.y - 7);
            if (p.cols === 1) drawBus(p.x, p.y);
            else drawCarsInParking(p.x, p.y, p.cols);
        });
    }

    // ---- Marker ----
    function drawBadges() {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "bold 8px 'Press Start 2P', monospace";
        POINTS.forEach(p => {
            const found = discovered.has(p.n);
            const bx = Math.round(p.px) - 8;
            const by = Math.round(p.py) - 8;
            if (currentFeature === p) {
                ctx.strokeStyle = 'rgba(214,96,12,0.95)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.px, p.py, 13 + Math.sin(dog.t * 6) * 2, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.fillStyle = found ? '#6f8048' : C.roof;
            ctx.beginPath();
            ctx.arc(p.px, p.py, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.85)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillText(String(p.n), p.px, p.py + 1);
        });
    }

    // ---- Hund ----
    function drawDog() {
        const cx = Math.round(dog.x);
        const cy = Math.round(dog.y);
        const bob = dog.moving ? (Math.floor(dog.frame) % 2) : 0;
        const by = cy - 16 - bob;

        const pulse = 0.5 + 0.5 * Math.sin(dog.t * 4);
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.4 + 0.35 * pulse).toFixed(2) + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy - 2, 13, 6.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 1, 11, 4, 0, 0, Math.PI * 2);
        ctx.fill();

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
        ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        drawGrass();
        ROADS.forEach(drawRoad);
        drawAreas();
        PARKINGS.forEach(p => drawParking(p.x, p.y, p.cols));
        hedges.forEach(drawHedge);

        BUILDINGS.forEach(drawBuilding);
        HUTS.forEach(drawHut);

        TREES.forEach(drawTree);
        bushes.forEach(drawBush);
        PONDS.forEach(drawPond);

        drawGadgets();
        drawBadges();
        drawDog();
    }

    // ---- Kollision ----
    function collides(x, y) {
        const bx = x - 7;
        const by = y - 12;
        const bw = 14;
        const bh = 12;
        for (let i = 0; i < BUILDINGS.length; i++) {
            const b = BUILDINGS[i]._aabb || BUILDINGS[i];
            if (bx < b.x1 && bx + bw > b.x0 && by < b.y1 && by + bh > b.y0) return true;
        }
        return false;
    }

    // ---- Update ----
    const SPEED = 82;

    function update(dt) {
        let dx = 0;
        let dy = 0;
        if (input.up) dy -= 1;
        if (input.down) dy += 1;
        if (input.left) dx -= 1;
        if (input.right) dx += 1;

        if (dx || dy) {
            target = null;
            const len = Math.hypot(dx, dy);
            dx /= len; dy /= len;
        } else if (target) {
            const tdx = target.x - dog.x;
            const tdy = target.y - dog.y;
            const d = Math.hypot(tdx, tdy);
            if (d < 4) target = null;
            else { dx = tdx / d; dy = tdy / d; }
        }

        const moving = !!(dx || dy);
        const nx = dog.x + dx * SPEED * dt;
        const ny = dog.y + dy * SPEED * dt;

        if (!collides(nx, dog.y)) dog.x = nx;
        else if (target) target = null;
        if (!collides(dog.x, ny)) dog.y = ny;
        else if (target) target = null;

        dog.x = Math.max(8, Math.min(CANVAS_W - 8, dog.x));
        dog.y = Math.max(14, Math.min(CANVAS_H - 6, dog.y));

        if (moving) {
            dog.frame += dt * 9;
            if (dx < 0) dog.faceLeft = true;
            else if (dx > 0) dog.faceLeft = false;
        }
        dog.moving = moving;
        dog.t += dt;
        checkProximity();
    }

    function checkProximity() {
        let best = null;
        let bestDist = Infinity;
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
            } else {
                setDialog(null, IDLE);
            }
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

    const KEYMAP = {
        arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
        arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right'
    };

    document.addEventListener('keydown', (e) => {
        const dir = KEYMAP[e.key.toLowerCase()];
        if (dir) { e.preventDefault(); setKey(dir, true); }
    });
    document.addEventListener('keyup', (e) => {
        const dir = KEYMAP[e.key.toLowerCase()];
        if (dir) { e.preventDefault(); setKey(dir, false); }
    });
    window.addEventListener('blur', () => {
        setKey('up', false); setKey('down', false); setKey('left', false); setKey('right', false);
    });

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
        return { x: (clientX - r.left) / r.width * CANVAS_W, y: (clientY - r.top) / r.height * CANVAS_H };
    }
    ctx.canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        target = canvasToWorld(e.clientX, e.clientY);
    });
    ctx.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });

    // ---- Legende ----
    function buildLegend() {
        const seen = new Set();
        const items = [];
        FEATURES.forEach(f => {
            if (!seen.has(f.n)) { seen.add(f.n); items.push({ n: f.n, name: f.name }); }
        });
        items.sort((a, b) => a.n - b.n);
        legendList.innerHTML = items.map(it =>
            '<li data-n="' + it.n + '"><span class="num">' + it.n + '</span><span class="name">' + it.name + '</span></li>'
        ).join('');
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
            else if (a.kind === 'tents') TENT_B = b;
        });

        const ds = map.dogStart || { x: 112, y: 70 };
        START = { x: ds.x, y: ds.y };
        dog.x = START.x; dog.y = START.y;

        TOTAL = new Set(FEATURES.map(f => f.n)).size;

        POINTS = FEATURES.map(f => ({
            id: f.id, n: f.n, name: f.name, d: f.d,
            px: f.x * CANVAS_W, py: f.y * CANVAS_H, r: 30, dupe: false
        }));

        for (let i = 0; i < POINTS.length; i++) {
            for (let j = i + 1; j < POINTS.length; j++) {
                if (Math.abs(POINTS[i].px - POINTS[j].px) < 3 && Math.abs(POINTS[i].py - POINTS[j].py) < 3) {
                    POINTS[j].px += 16; POINTS[j].py -= 11; POINTS[j].dupe = true;
                }
            }
        }

        POINTS.forEach(p => {
            let margin = Infinity;
            BUILDINGS.forEach(b => {
                const bb = b._aabb;
                const inside = p.px > bb.x0 && p.px < bb.x1 && p.py > bb.y0 && p.py < bb.y1;
                if (inside) {
                    const m = Math.min(p.px - bb.x0, bb.x1 - p.px, p.py - bb.y0, bb.y1 - p.py);
                    margin = Math.min(margin, m);
                }
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
