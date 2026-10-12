// ========================================
// EASTER EGG - Hani's Rundgang
// 2D Pixel-Art Minispiel: Der Hund Hani zeigt Gäste über das FarmInn
// Basierend auf farminn_minigame_map_v2.json (§ hidden page /easteregg.html)
// ========================================
(function () {
    'use strict';

    const CANVAS_W = 480;
    const CANVAS_H = 360;

    // Legendennummer -> Orte (Koordinaten normalisiert, aus lageplan.json)
    const FEATURES = [
        { n: 1, id: 'marker-1-1', name: 'Einfahrt', x: 0.21667, y: 0.17778, d: 'Hier beginnt alles – die Einfahrt von der K18 führt direkt auf den Hof. Los, folgt mir!' },
        { n: 2, id: 'marker-2-2', name: 'Parkplatz PKW (75)', x: 0.4375, y: 0.17889, d: 'Bis zu 75 Autos finden hier ein Plätzchen. Parken ist auf dem ganzen Hof kostenlos.' },
        { n: 2, id: 'marker-2-3', name: 'Parkplatz PKW (75)', x: 0.3375, y: 0.29, d: 'Noch mehr Stellplätze für Autos, hier westlich an der Tierweide.' },
        { n: 2, id: 'marker-2-4', name: 'Parkplatz PKW (75)', x: 0.52167, y: 0.27889, d: 'Ein weiterer Parkbereich gleich hinter dem Eingang.' },
        { n: 3, id: 'marker-3-5', name: 'Parkplatz Wohnmobil (5)', x: 0.65667, y: 0.24778, d: 'Fünf eigene Plätze für Camper und Wohnmobile – direkt auf dem Gelände.' },
        { n: 4, id: 'marker-4-6', name: 'Parkplatz Reisebus (1)', x: 0.1925, y: 0.34111, d: 'Platz für einen Reisebus am westlichen Rand des Hauptgebäudes.' },
        { n: 5, id: 'marker-5-7', name: 'Zeltplatz', x: 0.19167, y: 0.39889, d: 'Wer mag, schlägt hier sein Zelt auf. Abenteuer-Feeling inklusive!' },
        { n: 6, id: 'marker-6-8', name: 'Eingang FarmInn', x: 0.45083, y: 0.46667, d: 'Herzlich willkommen im FarmInn! Hier geht es auf den Innenhof.' },
        { n: 7, id: 'marker-7-9', name: 'WeddingArea (EG)', x: 0.35083, y: 0.41778, d: 'Die WeddingArea im alten, restaurierten Bullenstall – hier geben Malika und Dario sich das Ja-Wort. Kirchlich oder frei, ganz wie es das Paar träumt.' },
        { n: 8, id: 'marker-8-10', name: 'Genusshütten', x: 0.27167, y: 0.48111, d: 'In den Genusshütten gibt es Leckereien. Da schnüffel ich besonders gern!' },
        { n: 8, id: 'marker-8-11', name: 'Genusshütten', x: 0.55917, y: 0.68778, d: 'Noch eine Genusshütte – hier duftet es köstlich.' },
        { n: 8, id: 'marker-8-12', name: 'Genusshütten', x: 0.46583, y: 0.74222, d: 'Und noch eine kleine Genusshütte im unteren Hofbereich.' },
        { n: 9, id: 'marker-9-13', name: 'Terrasse Farmos (EG)', x: 0.4575, y: 0.57111, d: 'Die Terrasse vom Café Farmos – perfekt für Kaffee und Kuchen zwischendurch.' },
        { n: 10, id: 'marker-10-14', name: 'Café Farmos (EG)', x: 0.48667, y: 0.59556, d: 'Das Café Farmos – das gemütliche Herz des Hofes.' },
        { n: 11, id: 'marker-11-15', name: 'Taverne (EG)', x: 0.55917, y: 0.68778, d: 'Die Taverne – hier trifft man sich abends in geselliger Runde.' },
        { n: 12, id: 'marker-12-16', name: 'ScheunenHostel (Zi. 13–18)', x: 0.59917, y: 0.59, d: 'Im ScheunenHostel im 1. OG (Zimmer 13–18) könnt ihr wunderbar übernachten.' },
        { n: 13, id: 'marker-13-17', name: 'Appartments (Zi. 11–12)', x: 0.5675, y: 0.53222, d: 'Die Appartments (Zimmer 11–12) – gemütlich und ebenerdig.' },
        { n: 14, id: 'marker-14-18', name: 'GruppenGästehaus', x: 0.70167, y: 0.50222, d: 'Im GruppenGästehaus (Zi. 1–10), den Appartements und dem ScheunenHostel übernachten insgesamt 71 Gäste – ganz exklusiv nur für die Hochzeitsgesellschaft.' },
        { n: 15, id: 'marker-15-19', name: 'HoneymoonSuite (EG)', x: 0.77417, y: 0.53778, d: 'Die exklusive HoneymoonSuite mit historischen Wandmalereien und romantischem Bad – für Malika und Dario reserviert. Psst, nur schauen!' },
        { n: 16, id: 'marker-16-20', name: 'FeierScheune (EG)', x: 0.80833, y: 0.70889, d: 'Die FeierScheune – hier steigt die große Hochzeitsparty bis tief in die Nacht!' },
        { n: 17, id: 'marker-17-21', name: 'TanzLounge (EG)', x: 0.80917, y: 0.61, d: 'Die TanzLounge mit riesiger Bühne – hier wackeln alle Pfoten!' },
        { n: 18, id: 'marker-18-22', name: 'ClubLounge (1. OG)', x: 0.84417, y: 0.60667, d: 'Die ClubLounge oben drüber: Billard, Tischtennis und Chillen.' },
        { n: 19, id: 'marker-19-23', name: 'RaucherLounge (EG)', x: 0.84, y: 0.54333, d: 'Die wettergeschützte RaucherLounge mit Bar und Holzofen.' },
        { n: 20, id: 'marker-20-24', name: 'Wellnessbereich (EG)', x: 0.65833, y: 0.67, d: 'Der Wellnessbereich mit Sauna zum Entspannen nach dem Fest. Herrlich – und die Alpakas stehen sogar kostenlos für Hochzeitsfotos bereit!' }
    ];

    const TOTAL = 20;

    // Gebäude (Weltkoordinaten) – stilisiert, abgeleitet aus den Markern
    const BUILDINGS = [
        { x: 136, y: 140, w: 68, h: 20, roof: '#8a4b3a' }, // WeddingArea / Bullenstall
        { x: 207, y: 162, w: 18, h: 13, roof: '#a5573f' }, // Eingang
        { x: 222, y: 205, w: 32, h: 20, roof: '#a5573f' }, // Café Farmos
        { x: 248, y: 238, w: 44, h: 20, roof: '#8a4b3a' }, // Taverne
        { x: 300, y: 232, w: 34, h: 20, roof: '#a5573f' }, // Wellness
        { x: 250, y: 184, w: 64, h: 30, roof: '#a5573f' }, // Appartments / ScheunenHostel
        { x: 310, y: 164, w: 58, h: 32, roof: '#8a4b3a' }, // GruppenGästehaus
        { x: 362, y: 178, w: 40, h: 28, roof: '#a5573f' }, // HoneymoonSuite
        { x: 362, y: 204, w: 82, h: 70, roof: '#7d4636' }  // FeierScheune / Lounges
    ];

    const HUTS = [
        { x: 120, y: 166 },
        { x: 212, y: 262 },
        { x: 286, y: 268 }
    ];

    // Spielwelt-Flächen (normalisiert, aus game_scene_features der Karte) -> Weltkoordinaten
    const SCENE_RAW = {
        tierweide: [[0.44583, 0.33667], [0.5625, 0.33667], [0.58333, 0.43], [0.46667, 0.44667]],
        zeltbereich: [[0.17333, 0.36778], [0.22833, 0.36778], [0.22833, 0.45667], [0.17333, 0.45667]],
        camper: [[0.64167, 0.20889], [0.715, 0.20889], [0.715, 0.31778], [0.64167, 0.31778]],
        hofplatz: [[0.60833, 0.57222], [0.86167, 0.57222], [0.86167, 0.80778], [0.60833, 0.80778]]
    };
    const SCENE = {};
    Object.keys(SCENE_RAW).forEach(k => {
        SCENE[k] = SCENE_RAW[k].map(c => [c[0] * CANVAS_W, c[1] * CANVAS_H]);
    });

    // Palette
    const C = {
        grass: '#84a15a',
        grassDark: '#7a9852',
        grassTuft: '#6f8a48',
        road: '#cdb083',
        roadDark: '#bd9f72',
        asph: '#b3ada0',
        line: '#e9e5db',
        wall: '#ecdcbb',
        wallShade: '#d8c49a',
        window: '#5b7fa6',
        door: '#6b432d',
        wood: '#6b432d',
        water: '#7c9ec2',
        waterHi: '#9dc0dd',
        fence: '#9b755c',
        tent: '#c96a4e',
        alpaca: '#f3ede1'
    };

    const ctx = document.getElementById('egg-canvas').getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const dialogText = document.getElementById('egg-dialog-text');
    const progressEl = document.getElementById('egg-progress');
    const legendList = document.getElementById('egg-legend-list');
    const resetBtn = document.getElementById('egg-reset');

    // Punkt-Koordinaten in Weltkoordinaten
    const POINTS = FEATURES.map(f => ({
        id: f.id,
        n: f.n,
        name: f.name,
        d: f.d,
        px: f.x * CANVAS_W,
        py: f.y * CANVAS_H,
        r: 30,
        dupe: false
    }));

    // Marker 8 & 11 liegen exakt übereinander -> leicht versetzen, damit sichtbar
    for (let i = 0; i < POINTS.length; i++) {
        for (let j = i + 1; j < POINTS.length; j++) {
            if (Math.abs(POINTS[i].px - POINTS[j].px) < 3 && Math.abs(POINTS[i].py - POINTS[j].py) < 3) {
                POINTS[j].px += 14;
                POINTS[j].py -= 10;
                POINTS[j].dupe = true;
            }
        }
    }

    // Radius je Ort: Ansagen auslösen, auch wenn der Ort in einem Gebäude liegt.
    // -> Abstand zur nächsten Gebäudekante + Puffer
    POINTS.forEach(p => {
        let margin = Infinity;
        BUILDINGS.forEach(b => {
            const inside = p.px > b.x && p.px < b.x + b.w && p.py > b.y && p.py < b.y + b.h;
            if (inside) {
                const m = Math.min(p.px - b.x, b.x + b.w - p.px, p.py - b.y, b.y + b.h - p.py);
                margin = Math.min(margin, m);
            }
        });
        p.r = isFinite(margin) ? margin + 30 : 30;
    });

    const dog = {
        x: 122,
        y: 80,
        t: 0,
        frame: 0,
        moving: false,
        faceLeft: false
    };

    const START = { x: 122, y: 80 };

    const input = { up: false, down: false, left: false, right: false };
    let target = null;
    let currentFeature = null;
    const discovered = new Set();

    const IDLE = 'Wuff! Folgt mir über den Hof – geht einfach in die Nähe eines Ortes, dann erzähle ich euch, was ihr seht!';

    // ---- Zeichen-Helfer ----
    function rect(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }

    function seededRandom(seed) {
        let s = seed;
        return function () {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
    }

    const rand = seededRandom(1337);

    // Deko vorberechnen (Bäume, Grasbüschel)
    const tufts = [];
    for (let i = 0; i < 140; i++) {
        tufts.push({ x: Math.floor(rand() * CANVAS_W), y: Math.floor(rand() * CANVAS_H) });
    }
    const trees = [];
    const treeSpots = [[20, 30], [58, 220], [440, 60], [455, 150], [30, 250], [360, 45], [430, 330], [60, 330], [455, 285], [90, 30]];
    treeSpots.forEach(p => trees.push({ x: p[0], y: p[1] }));

    // ---- Zeichnen ----
    function drawGrass() {
        rect(0, 0, CANVAS_W, CANVAS_H, C.grass);
        // Schachbrett-Textur
        for (let y = 0; y < CANVAS_H; y += 16) {
            for (let x = 0; x < CANVAS_W; x += 16) {
                if (((x / 16) + (y / 16)) % 2 === 0) {
                    rect(x, y, 16, 16, C.grassDark);
                }
            }
        }
        tufts.forEach(t => rect(t.x, t.y, 2, 3, C.grassTuft));
    }

    function drawRoads() {
        // obere Zufahrt
        rect(52, 48, 168, 14, C.road);
        rect(52, 60, 168, 2, C.roadDark);
        // Verbindung nach unten zum Hof
        rect(210, 48, 14, 138, C.road);
        rect(222, 48, 2, 138, C.roadDark);
        // Innenhof
        rect(146, 182, 214, 90, C.road);
        rect(146, 182, 214, 3, C.roadDark);
        rect(146, 269, 214, 3, C.roadDark);
        // Weg zum rechten Gebäudekomplex
        rect(300, 210, 66, 12, C.road);
    }

    function drawPond() {
        ctx.fillStyle = C.water;
        ctx.beginPath();
        ctx.ellipse(436, 320, 22, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        rect(430, 313, 10, 3, C.waterHi);
    }

    function drawParking(cx, cy, cols) {
        const w = cols * 8 + 4;
        const h = 14;
        const x = cx - w / 2;
        const y = cy - h / 2;
        rect(x, y, w, h, C.asph);
        for (let i = 0; i <= cols; i++) {
            rect(x + 2 + i * 8, y + 2, 1, h - 4, C.line);
        }
    }

    function drawTent(x, y) {
        rect(x, y + 6, 10, 4, C.tent);
        rect(x + 1, y + 4, 8, 2, C.tent);
        rect(x + 3, y + 2, 4, 2, '#e08a72');
        rect(x + 4, y + 6, 3, 4, '#7d4636');
    }

    function drawTree(x, y) {
        rect(x - 1, y, 3, 7, C.wood);
        rect(x - 6, y - 8, 13, 9, '#5f7a3f');
        rect(x - 4, y - 11, 9, 4, '#6f8a4a');
    }

    function drawAlpaca(x, y) {
        rect(x + 1, y + 8, 2, 4, '#8a8272');
        rect(x + 5, y + 8, 2, 4, '#8a8272');
        rect(x, y + 1, 7, 7, C.alpaca);
        rect(x - 1, y - 5, 3, 7, C.alpaca);
        rect(x - 2, y - 8, 5, 4, '#f7f2e8');
        rect(x + 5, y - 7, 2, 2, '#3a3a3a');
    }

    function poly(pts, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.closePath();
        ctx.fill();
    }

    function drawFencedPoly(pts, fill, edge) {
        poly(pts, fill);
        ctx.strokeStyle = edge;
        ctx.lineWidth = 2;
        ctx.beginPath();
        pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.closePath();
        ctx.stroke();
    }

    function drawPasture() {
        const pts = SCENE.tierweide;
        drawFencedPoly(pts, '#7f9b54', C.fence);
        drawAlpaca(pts[0][0] + 24, pts[0][1] + 18);
        drawAlpaca(pts[0][0] + 46, pts[0][1] + 30);
    }

    function drawHofplatz() {
        poly(SCENE.hofplatz, C.road);
    }

    function drawBuilding(b) {
        const { x, y, w, h } = b;
        // Schatten
        rect(x + 3, y + 7, w, h - 6, 'rgba(0,0,0,0.12)');
        // Wände
        rect(x, y + 8, w, h - 8, C.wall);
        rect(x, y + 8, w, 3, C.wallShade);
        rect(x, y + h - 3, w, 3, '#c9b489');
        // Giebeldach (Treppenform)
        for (let i = 0; i < 8; i++) {
            const inset = 7 - i;
            const col = i < 2 ? '#c96a4e' : b.roof;
            rect(x + inset, y + i, w - inset * 2, 1, col);
        }
        // Fenster
        const cols = Math.max(2, Math.floor(w / 16));
        const step = w / cols;
        for (let c = 0; c < cols; c++) {
            const wx = x + step * c + step / 2 - 3;
            rect(wx, y + 13, 6, 6, C.window);
            rect(wx, y + 12, 6, 1, C.door);
            rect(wx + 2, y + 13, 1, 6, '#4a6a8c');
        }
        // Tür
        rect(x + w / 2 - 4, y + h - 9, 8, 9, C.door);
        rect(x + w / 2 + 2, y + h - 5, 2, 2, '#d4a574');
    }

    function drawHut(hut) {
        const { x, y } = hut;
        rect(x + 1, y + 6, 12, 6, 'rgba(0,0,0,0.12)');
        rect(x, y + 4, 12, 8, C.wall);
        for (let i = 0; i < 5; i++) {
            const inset = 4 - i;
            rect(x + inset, y + i, 12 - inset * 2, 1, i < 1 ? '#c96a4e' : '#8a4b3a');
        }
        rect(x + 4, y + 8, 4, 4, C.door);
    }

    function drawBadges() {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "bold 8px 'Press Start 2P', monospace";
        POINTS.forEach(p => {
            const found = discovered.has(p.n);
            const bx = Math.round(p.px) - 7;
            const by = Math.round(p.py) - 7;
            // Impuls-Ring am aktuellen Ort
            if (currentFeature === p) {
                ctx.strokeStyle = 'rgba(255,253,249,0.85)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.px, p.py, 12 + Math.sin(dog.t * 6) * 2, 0, Math.PI * 2);
                ctx.stroke();
            }
            rect(bx, by, 14, 14, found ? '#6a7455' : '#6b432d');
            rect(bx + 1, by + 1, 12, 12, found ? '#8a9475' : '#FFFDF9');
            ctx.fillStyle = found ? '#FFFDF9' : '#6b432d';
            ctx.fillText(String(p.n), p.px, p.py + 1);
        });
    }

    function drawDog() {
        const cx = Math.round(dog.x);
        const cy = Math.round(dog.y);
        const bob = dog.moving ? (Math.floor(dog.frame) % 2) : 0;
        const by = cy - 16 - bob;

        // Schatten
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 1, 11, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        if (dog.faceLeft) {
            ctx.translate(cx * 2, 0);
            ctx.scale(-1, 1);
        }

        const walkBack = dog.moving && Math.floor(dog.frame) % 2 === 0;
        const walkFront = dog.moving && Math.floor(dog.frame) % 2 === 1;
        const wag = Math.sin(dog.t * 8) * 3;

        // Schwanz
        rect(cx - 17, by - 4 + wag, 5, 4, '#5f3b26');
        rect(cx - 16, by - 8 + wag, 4, 5, '#5f3b26');

        // Hinterbeine
        rect(cx - 10, cy - 5, 3, 5, '#6b432d');
        rect(cx - 4, cy - 5, 3, 5, '#6b432d');
        // Vorderbeine (animiert)
        rect(cx + 5, cy - 5 - (walkFront ? 1 : 0), 3, 5, '#8a5a3b');
        rect(cx + 9, cy - 5 + (walkBack ? 1 : 0), 3, 5, '#8a5a3b');

        // Körper
        rect(cx - 13, by + 2, 21, 9, '#8a5a3b');
        // Rücken-Fleck
        rect(cx - 11, by + 2, 13, 4, '#6b432d');
        // Bauch heller
        rect(cx - 10, by + 9, 16, 2, '#a5754f');

        // Kopf
        rect(cx + 5, by - 3, 11, 10, '#8a5a3b');
        // Ohr (Schlappohr)
        rect(cx + 5, by - 7, 5, 6, '#5f3b26');
        // Schnauze
        rect(cx + 13, by + 2, 6, 5, '#d9b98f');
        // Nase
        rect(cx + 18, by + 3, 2, 2, '#2b2b2b');
        // Auge
        rect(cx + 10, by + 0, 2, 2, '#2b2b2b');
        // Halsband
        rect(cx + 5, by + 5, 11, 2, '#c96a4e');

        ctx.restore();
    }

    function render() {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        drawGrass();
        drawRoads();
        drawHofplatz();
        drawPasture();
        drawPond();

        // Parkplätze (an den Marker-Positionen)
        drawParking(210, 66, 4);
        drawParking(162, 104, 4);
        drawParking(250, 100, 4);
        drawParking(325, 95, 2); // Wohnmobile (SCENE.camper)
        drawParking(92, 123, 1); // Bus

        // Zeltplatz (SCENE.zeltbereich)
        drawTent(86, 138);
        drawTent(100, 146);
        drawTent(90, 156);

        // Gebäude + Hütten
        BUILDINGS.forEach(drawBuilding);
        HUTS.forEach(drawHut);

        // Bäume
        trees.forEach(t => drawTree(t.x, t.y));

        // Marker/Badges
        drawBadges();

        // Hund
        drawDog();
    }

    // ---- Kollision ----
    function collides(x, y) {
        const bx = x - 7;
        const by = y - 12;
        const bw = 14;
        const bh = 12;
        for (let i = 0; i < BUILDINGS.length; i++) {
            const b = BUILDINGS[i];
            if (bx < b.x + b.w && bx + bw > b.x && by < b.y + b.h && by + bh > b.y) {
                return true;
            }
        }
        return false;
    }

    // ---- Update ----
    const SPEED = 108;

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
            dx /= len;
            dy /= len;
        } else if (target) {
            const tdx = target.x - dog.x;
            const tdy = target.y - dog.y;
            const d = Math.hypot(tdx, tdy);
            if (d < 4) {
                target = null;
            } else {
                dx = tdx / d;
                dy = tdy / d;
            }
        }

        const moving = !!(dx || dy);
        const nx = dog.x + dx * SPEED * dt;
        const ny = dog.y + dy * SPEED * dt;

        if (!collides(nx, dog.y)) {
            dog.x = nx;
        } else if (target) {
            target = null;
        }

        if (!collides(dog.x, ny)) {
            dog.y = ny;
        } else if (target) {
            target = null;
        }

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
            if (d < p.r && d < bestDist) {
                best = p;
                bestDist = d;
            }
        }

        // Hysterese: aktuellen Ort halten, solange er noch in der Nähe ist
        if (currentFeature) {
            const cd = Math.hypot(dog.x - currentFeature.px, dog.y - currentFeature.py);
            if (cd <= currentFeature.r + 6 && (!best || bestDist > cd * 0.6)) {
                return;
            }
        }

        if (best !== currentFeature) {
            currentFeature = best;
            if (best) {
                setDialog(best.name, best.d);
                if (!discovered.has(best.n)) {
                    discovered.add(best.n);
                    updateProgress();
                }
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
        // Legenden aktualisieren
        legendList.querySelectorAll('li').forEach(li => {
            if (discovered.has(parseInt(li.dataset.n, 10))) {
                li.classList.add('found');
            } else {
                li.classList.remove('found');
            }
        });
    }

    // ---- Eingabe ----
    function setKey(dir, value) {
        if (input[dir] !== value) input[dir] = value;
    }

    const KEYMAP = {
        arrowup: 'up', w: 'up',
        arrowdown: 'down', s: 'down',
        arrowleft: 'left', a: 'left',
        arrowright: 'right', d: 'right'
    };

    document.addEventListener('keydown', (e) => {
        const dir = KEYMAP[e.key.toLowerCase()];
        if (dir) {
            e.preventDefault();
            setKey(dir, true);
        }
    });

    document.addEventListener('keyup', (e) => {
        const dir = KEYMAP[e.key.toLowerCase()];
        if (dir) {
            e.preventDefault();
            setKey(dir, false);
        }
    });

    window.addEventListener('blur', () => {
        setKey('up', false);
        setKey('down', false);
        setKey('left', false);
        setKey('right', false);
    });

    // D-Pad (Pointer = Maus & Touch)
    document.querySelectorAll('.dpad-btn').forEach(btn => {
        const dir = btn.dataset.dir;
        const press = (e) => {
            e.preventDefault();
            setKey(dir, true);
            btn.classList.add('active');
        };
        const release = (e) => {
            if (e) e.preventDefault();
            setKey(dir, false);
            btn.classList.remove('active');
        };
        btn.addEventListener('pointerdown', press);
        btn.addEventListener('pointerup', release);
        btn.addEventListener('pointerleave', release);
        btn.addEventListener('pointercancel', release);
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });

    // Tippen/Klicken auf die Karte -> Hani läuft dorthin
    function canvasToWorld(clientX, clientY) {
        const r = ctx.canvas.getBoundingClientRect();
        return {
            x: (clientX - r.left) / r.width * CANVAS_W,
            y: (clientY - r.top) / r.height * CANVAS_H
        };
    }

    ctx.canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const p = canvasToWorld(e.clientX, e.clientY);
        target = { x: p.x, y: p.y };
    });

    // Doppel-Tap-Zoom auf iOS verhindern
    ctx.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });

    // ---- Legende ----
    function buildLegend() {
        const seen = new Set();
        const items = [];
        FEATURES.forEach(f => {
            if (!seen.has(f.n)) {
                seen.add(f.n);
                items.push({ n: f.n, name: f.name });
            }
        });
        items.sort((a, b) => a.n - b.n);
        legendList.innerHTML = items.map(it =>
            '<li data-n="' + it.n + '"><span class="num">' + it.n + '</span><span class="name">' + it.name + '</span></li>'
        ).join('');
    }

    // ---- Reset ----
    function reset() {
        dog.x = START.x;
        dog.y = START.y;
        dog.faceLeft = false;
        dog.frame = 0;
        target = null;
        currentFeature = null;
        discovered.clear();
        Object.keys(input).forEach(k => input[k] = false);
        document.querySelectorAll('.dpad-btn.active').forEach(b => b.classList.remove('active'));
        setDialog(null, IDLE);
        updateProgress();
    }

    resetBtn.addEventListener('click', reset);

    // ---- Loop ----
    let last = 0;
    function loop(ts) {
        if (!last) last = ts;
        let dt = (ts - last) / 1000;
        last = ts;
        if (dt > 0.05) dt = 0.05; // Sprünge begrenzen
        update(dt);
        render();
        requestAnimationFrame(loop);
    }

    buildLegend();
    updateProgress();
    requestAnimationFrame(loop);
})();
