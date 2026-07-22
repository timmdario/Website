/* ========================================
   MALIKA & DARIO - HOCHZEITSWEBSITE
   JavaScript: Animationen, FAQ, EmailJS
   ======================================== */

// ========================================
// EMAILJS KONFIGURATION
// ========================================
const EMAILJS_PUBLIC_KEY = 'bsy7xvQ7fhd3udqmU';
const EMAILJS_SERVICE_ID = 'service_3k4jtrq';
const EMAILJS_TEMPLATE_ID = 'template_vcgt7mo';
const EMAILJS_CONFIRM_TEMPLATE_ID = 'template_bestaetigung';

// Google Sheets Web App URL (nach Deployment einfügen)
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycby3RfTSbQKhbHknWcXXNKOetq30jxkC_lPRUgXc__kjFyKqw3iu-pOT7NjHjZRf70zdhw/exec';

// EmailJS initialisieren
emailjs.init(EMAILJS_PUBLIC_KEY);

// ScrollTrigger Plugin registrieren
gsap.registerPlugin(ScrollTrigger);

// ========================================
// DOM ELEMENTE
// ========================================
const envelopeOverlay = document.getElementById('envelope-overlay');
const websiteContent = document.getElementById('website-content');
const envelopeHint = document.querySelector('.envelope-hint-new');
const waxSeal = document.getElementById('wax-seal');
const petalsContainer = document.getElementById('petals-container');
const rsvpForm = document.getElementById('rsvp-form');
const formSuccess = document.getElementById('form-success');
const faqItems = document.querySelectorAll('.faq-item');

// ========================================
// PETALS / BLÜTENBLÄTTER
// ========================================
function createPetals(count) {
    petalsContainer.innerHTML = '';
    const colors = ['pink', 'gold', 'cream', 'rose'];

    for (let i = 0; i < count; i++) {
        const petal = document.createElement('div');
        petal.className = `petal ${colors[i % colors.length]}`;

        const size = 8 + Math.random() * 12;
        petal.style.width = size + 'px';
        petal.style.height = size + 'px';

        petalsContainer.appendChild(petal);
    }
}

function animatePetals() {
    const petals = document.querySelectorAll('.petal');

    petals.forEach((petal, i) => {
        const angle = (Math.random() - 0.5) * 200;
        const distance = 100 + Math.random() * 250;
        const rotation = Math.random() * 720 - 360;
        const delay = Math.random() * 0.4;

        gsap.set(petal, {
            x: 0,
            y: 0,
            opacity: 0,
            scale: 0,
            rotation: 0
        });

        gsap.to(petal, {
            x: Math.cos(angle * Math.PI / 180) * distance,
            y: Math.sin(angle * Math.PI / 180) * distance - 50,
            opacity: 0.9,
            scale: 1,
            rotation: rotation,
            duration: 1.2 + Math.random() * 0.8,
            delay: delay,
            ease: 'power2.out'
        });

        gsap.to(petal, {
            y: `+=${200 + Math.random() * 200}`,
            opacity: 0,
            rotation: `+=${Math.random() * 180}`,
            duration: 1.5 + Math.random() * 1,
            delay: delay + 0.6,
            ease: 'power1.in'
        });
    });
}

// ========================================
// BRIEFUMSCHLAG ANIMATION (GSAP)
// ========================================
let isEnvelopeOpen = false;

function initEnvelopeAnimation() {
    gsap.set('.envelope', { scale: 0.85, opacity: 0, rotateX: 5 });
    gsap.set('.envelope-flap-top', { rotationX: 0 });
    gsap.set('.envelope-letter', { y: 0, opacity: 0, scale: 1 });
    gsap.set('.wax-seal', { scale: 0, rotation: -180 });
    gsap.set('.envelope-hint-new', { opacity: 0, y: 10 });
    gsap.set('.envelope-flap-left', { rotationY: 0 });
    gsap.set('.envelope-flap-right', { rotationY: 0 });
    gsap.set('.overlay-logo', { opacity: 0, y: -10 });

    const introTl = gsap.timeline({ delay: 0.3 });

    // Logo appears
    introTl.to('.overlay-logo', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out'
    });

    // Envelope appears
    introTl.to('.envelope', {
        scale: 1,
        opacity: 1,
        duration: 1,
        ease: 'back.out(1.4)'
    }, '-=0.4');

    // Side flaps fold in
    introTl.to('.envelope-flap-left', {
        rotationY: -20,
        duration: 0.5,
        ease: 'power2.out'
    }, '-=0.3');

    introTl.to('.envelope-flap-right', {
        rotationY: 20,
        duration: 0.5,
        ease: 'power2.out'
    }, '-=0.4');

    // Seal appears with spin
    introTl.to('.wax-seal', {
        scale: 1,
        rotation: 0,
        duration: 0.7,
        ease: 'elastic.out(1, 0.5)'
    }, '-=0.1');

    // Hint text
    introTl.to('.envelope-hint-new', {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
    }, '-=0.2');

    createPetals(30);
}

function openEnvelope() {
    if (isEnvelopeOpen) return;
    isEnvelopeOpen = true;

    const tl = gsap.timeline({
        onComplete: () => {
            showWebsite();
        }
    });

    // Hide hint + logo
    tl.to(['.envelope-hint-new', '.overlay-logo'], {
        opacity: 0,
        duration: 0.3
    });

    // Seal "breaks" - pulse then vanish
    tl.to('.wax-seal', {
        scale: 1.3,
        duration: 0.15,
        ease: 'power2.in'
    });

    tl.to('.wax-seal', {
        scale: 0,
        rotation: 45,
        opacity: 0,
        duration: 0.3,
        ease: 'power3.in'
    });

    // Petal explosion
    tl.call(() => {
        animatePetals();
    }, null, '-=0.1');

    // Side flaps open
    tl.to('.envelope-flap-left', {
        rotationY: -60,
        duration: 0.5,
        ease: 'power2.inOut'
    }, '-=0.1');

    tl.to('.envelope-flap-right', {
        rotationY: 60,
        duration: 0.5,
        ease: 'power2.inOut'
    }, '-=0.4');

    // Top flap opens
    tl.to('.envelope-flap-top', {
        rotationX: -180,
        duration: 0.8,
        ease: 'power2.inOut'
    }, '-=0.2');

    // Short pause
    tl.to({}, { duration: 0.3 });

    // Letter rises out - bring to front
    tl.set('.envelope-letter', { opacity: 1, zIndex: 10 });

    tl.to('.envelope-letter', {
        y: -220,
        duration: 1,
        ease: 'power2.out'
    });

    // Letter gets slightly bigger and centers
    tl.to('.envelope-letter', {
        scale: 1.15,
        duration: 0.6,
        ease: 'power2.out'
    }, '-=0.5');

    // Pause for effect
    tl.to({}, { duration: 1 });

    // Everything fades out
    tl.to('.envelope', {
        scale: 0.8,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.in'
    });

    tl.to('#envelope-overlay', {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.inOut'
    }, '-=0.4');
}

function showWebsite() {
    envelopeOverlay.style.display = 'none';
    websiteContent.classList.remove('hidden');

    // Website Content einblenden
    gsap.fromTo(websiteContent,
        { opacity: 0 },
        {
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out'
        }
    );

    // Hero Section Animation
    initHeroAnimation();

    // Countdown starten
    initCountdown();

    // Scroll-Animationen initialisieren
    initScrollAnimations();

    // Interaktive Features
    initBASlider();
    initGallery();
    initScratch();
    initFotoGalerie();
}

// ========================================
// COUNTDOWN
// ========================================
function initCountdown() {
    // 1. Mai 2027, 14:00 Uhr deutsche Zeit (MESZ = UTC+2)
    const targetDate = new Date('2027-05-01T14:00:00+02:00').getTime();

    function update() {
        const now = Date.now();
        const diff = targetDate - now;

        if (diff <= 0) {
            document.getElementById('countdown-days').textContent = '0';
            document.getElementById('countdown-hours').textContent = '0';
            document.getElementById('countdown-minutes').textContent = '0';
            document.getElementById('countdown-seconds').textContent = '0';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('countdown-days').textContent = days;
        document.getElementById('countdown-hours').textContent = hours;
        document.getElementById('countdown-minutes').textContent = minutes;
        document.getElementById('countdown-seconds').textContent = seconds;
    }

    update();
    setInterval(update, 1000);
}

// ========================================
// HERO SECTION ANIMATION
// ========================================
function initHeroAnimation() {
    const heroTl = gsap.timeline({ delay: 0.2 });

    heroTl.fromTo('.hero-subtitle',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 }
    );

    heroTl.fromTo('.hero-names',
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power2.out' },
        '-=0.3'
    );

    heroTl.fromTo('.hero-divider',
        { opacity: 0, scaleX: 0 },
        { opacity: 1, scaleX: 1, duration: 0.6 },
        '-=0.4'
    );

    heroTl.fromTo('.hero-date',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5 },
        '-=0.3'
    );

    heroTl.fromTo('.hero-tagline',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5 },
        '-=0.2'
    );

    // Countdown
    heroTl.fromTo('.countdown',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.1'
    );

    // Hero Flowers
    heroTl.fromTo('.hero-flower',
        { opacity: 0, scale: 0 },
        { opacity: 0.15, scale: 1, duration: 0.8, stagger: 0.2, ease: 'back.out(1.7)' },
        '-=0.4'
    );
}

// ========================================
// SCROLL-ANIMATIONEN (GSAP ScrollTrigger)
// ========================================
function initScrollAnimations() {
    // Section Headers
    gsap.utils.toArray('.section-header').forEach(header => {
        gsap.fromTo(header,
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: header,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });

    // Detail Cards
    gsap.utils.toArray('.detail-card').forEach((card, i) => {
        gsap.fromTo(card,
            { opacity: 0, y: 40 },
            {
                opacity: 1,
                y: 0,
                duration: 0.6,
                delay: i * 0.15,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });

    // FAQ Items
    gsap.utils.toArray('.faq-item').forEach((item, i) => {
        gsap.fromTo(item,
            { opacity: 0, x: -30 },
            {
                opacity: 1,
                x: 0,
                duration: 0.5,
                delay: i * 0.1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: item,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });

    // RSVP Form
    gsap.fromTo('.rsvp-form',
        { opacity: 0, y: 40, scale: 0.98 },
        {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.rsvp-form',
                start: 'top 80%',
                toggleActions: 'play none none none'
            }
        }
    );

    // Foto Galerie
    gsap.fromTo('.foto-galerie-section',
        { opacity: 0, y: 30 },
        {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.foto-galerie-section',
                start: 'top 80%',
                toggleActions: 'play none none none'
            }
        }
    );
}

// ========================================
// FAQ ACCORDION
// ========================================
function initFAQ() {
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Alle anderen schließen
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });

            // Aktuelles Item togglen
            item.classList.toggle('active');

            // Smooth Scroll wenn nötig
            if (!isActive) {
                setTimeout(() => {
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            }
        });
    });
}

// ========================================
// RSVP FORMULAR (EmailJS)
// ========================================
function initForm() {
    rsvpForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Formular-Daten sammeln
        const formData = new FormData(rsvpForm);
        const data = Object.fromEntries(formData.entries());

        // Button deaktivieren
        const submitBtn = rsvpForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Wird gesendet...</span>';
        submitBtn.disabled = true;

        try {
            // E-Mail an Brautpaar senden
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                name: data.name,
                email: data.email,
                guests: data.guests,
                overnight_friday: data.overnight_friday,
                overnight_saturday: data.overnight_saturday,
                on_site: data.on_site,
                breakfast: data.breakfast,
                dietary: data.dietary || 'Keine',
                message: data.message || 'Keine Nachricht'
            });

            // Bestätigungs-E-Mail an Gast senden
            if (data.email) {
                emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CONFIRM_TEMPLATE_ID, {
                    name: data.name,
                    email: data.email,
                    guests: data.guests,
                    overnight_friday: data.overnight_friday,
                    overnight_saturday: data.overnight_saturday,
                    on_site: data.on_site,
                    breakfast: data.breakfast,
                    dietary: data.dietary || 'Keine',
                    message: data.message || 'Keine Nachricht'
                }).catch(err => console.warn('Bestätigungs-E-Mail:', err));
            }

            // An Google Sheets senden (wenn URL konfiguriert)
            if (GOOGLE_SHEETS_URL) {
                fetch(GOOGLE_SHEETS_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: data.name,
                        email: data.email,
                        guests: data.guests,
                        overnight_friday: data.overnight_friday,
                        overnight_saturday: data.overnight_saturday,
                        on_site: data.on_site,
                        breakfast: data.breakfast,
                        dietary: data.dietary || 'Keine',
                        message: data.message || 'Keine Nachricht'
                    })
                }).catch(err => console.warn('Google Sheets:', err));
            }

            // Button Text ändern
            submitBtn.innerHTML = '<span>Hanitastisch!</span> ✿';
            submitBtn.disabled = false;

            // Erfolg anzeigen
            rsvpForm.classList.add('hidden');
            formSuccess.classList.remove('hidden');

            // Erfolgs-Animation
            gsap.fromTo(formSuccess,
                { opacity: 0, y: 20, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.7)' }
            );

            gsap.fromTo('.success-icon',
                { scale: 0, rotation: -180 },
                { scale: 1, rotation: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)', delay: 0.2 }
            );

        } catch (error) {
            console.error('Fehler beim Senden:', error);
            alert('Es ist ein Fehler aufgetreten. Bitte versucht es erneut oder kontaktiert uns direkt.');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ========================================
// BEFORE / AFTER SLIDER
// ========================================
function initBASlider() {
    const slider = document.getElementById('ba-slider');
    const handle = document.getElementById('ba-handle');
    if (!slider || !handle) return;

    let isDragging = false;

    function getPosition(e) {
        const rect = slider.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        return Math.max(0, Math.min(x / rect.width, 1));
    }

    function updatePosition(pos) {
        const pct = pos * 100;
        slider.querySelector('.ba-before').style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
        handle.style.left = pct + '%';
    }

    function startDrag(e) {
        isDragging = true;
        updatePosition(getPosition(e));
    }

    function onDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        updatePosition(getPosition(e));
    }

    function endDrag() {
        isDragging = false;
    }

    slider.addEventListener('mousedown', startDrag);
    slider.addEventListener('touchstart', startDrag, { passive: true });
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
}

// ========================================
// GALLERY LIGHTBOX
// ========================================
function initGallery() {
    const items = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    if (!lightbox) return;

    let currentIndex = 0;
    const images = Array.from(items).map(item => item.querySelector('img').src);

    function showImage(index) {
        currentIndex = index;
        lightboxImg.src = images[currentIndex];
    }

    items.forEach((item, i) => {
        item.addEventListener('click', () => {
            showImage(i);
            lightbox.classList.add('active');
        });
    });

    closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.classList.remove('active');
    });

    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showImage((currentIndex - 1 + images.length) % images.length);
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showImage((currentIndex + 1) % images.length);
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') lightbox.classList.remove('active');
        if (e.key === 'ArrowLeft') showImage((currentIndex - 1 + images.length) % images.length);
        if (e.key === 'ArrowRight') showImage((currentIndex + 1) % images.length);
    });
}

// ========================================
// SCRATCH-TO-REVEAL
// ========================================
function initScratch() {
    const canvas = document.getElementById('scratch-canvas');
    const card = document.getElementById('scratch-card');
    const resetBtn = document.getElementById('scratch-reset');
    if (!canvas || !card) return;

    const ctx = canvas.getContext('2d');
    let isScratching = false;

    function resizeCanvas() {
        canvas.width = card.offsetWidth;
        canvas.height = card.offsetHeight;
        drawOverlay();
    }

    function drawOverlay() {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#D4A574');
        grad.addColorStop(0.3, '#C4A484');
        grad.addColorStop(0.6, '#A8845F');
        grad.addColorStop(1, '#8B7355');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dotted pattern
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        for (let x = 0; x < canvas.width; x += 12) {
            for (let y = 0; y < canvas.height; y += 12) {
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Text
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = 'italic 1.1rem Lora, serif';
        ctx.textAlign = 'center';
        ctx.fillText('✦ Hier rubbeln ✦', canvas.width / 2, canvas.height / 2 + 6);
    }

    function scratch(e) {
        if (!isScratching) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fill();
    }

    function startScratch(e) {
        isScratching = true;
        scratch(e);
    }

    function stopScratch() {
        isScratching = false;
        checkReveal();
    }

    function checkReveal() {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparent = 0;
        for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] === 0) transparent++;
        }
        const pct = transparent / (imageData.data.length / 4);
        if (pct > 0.45) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            resetBtn.style.display = 'inline-block';
        }
    }

    canvas.addEventListener('mousedown', startScratch);
    canvas.addEventListener('touchstart', startScratch, { passive: true });
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('touchmove', scratch, { passive: true });
    canvas.addEventListener('mouseup', stopScratch);
    canvas.addEventListener('touchend', stopScratch);

    resetBtn.addEventListener('click', () => {
        resizeCanvas();
        resetBtn.style.display = 'none';
    });

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

// ========================================
// FOTO-GALERIE (Cloudinary)
// ========================================
const CLOUDINARY_CLOUD_NAME = 'dx7sghhbu';
const CLOUDINARY_UPLOAD_PRESET = 'wedding_uploads';
const CLOUDINARY_FOLDER = 'wedding-photos';

let cloudinaryWidget = null;
let fotoGalleryImages = [];

function initFotoGalerie() {
    initCloudinaryWidget();
    loadGalleryPhotos();
    initFotoLightbox();
}

function initCloudinaryWidget() {
    const uploadBtn = document.getElementById('upload-btn');
    if (!uploadBtn || typeof cloudinary === 'undefined') return;

    cloudinaryWidget = cloudinary.createUploadWidget({
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        folder: CLOUDINARY_FOLDER,
        maxFiles: 10,
        sources: ['local', 'camera'],
        cropping: false,
        multiple: true,
        styles: {
            palette: {
                window: '#FFFDF9',
                windowBorder: '#C4A484',
                tabIcon: '#8B7355',
                menuIcons: '#8B7355',
                textDark: '#4A3F35',
                textLight: '#FFFDF9',
                link: '#A8845F',
                action: '#C4A484',
                inactiveTabIcon: '#D4A574',
                error: '#D45B5B',
                inProgress: '#D4A574',
                complete: '#7CB97A'
            }
        }
    }, (error, result) => {
        if (!error && result && result.event === 'success') {
            addPhotoToGallery(result.info);
        }
        if (!error && result && result.event === 'close') {
            loadGalleryPhotos();
        }
    });

    uploadBtn.addEventListener('click', () => {
        cloudinaryWidget.open();
    });
}

function addPhotoToGallery(info) {
    const emptyMsg = document.getElementById('foto-galerie-empty');
    if (emptyMsg) emptyMsg.style.display = 'none';

    const grid = document.getElementById('foto-galerie-grid');
    const item = document.createElement('div');
    item.className = 'foto-galerie-item';

    const imgUrl = info.secure_url
        .replace('/upload/', '/upload/w_600,h_600,c_fill,q_auto,f_auto/')
        + (info.format === 'webp' ? '' : '.jpg');

    item.innerHTML = `
        <img src="${imgUrl}" alt="Hochzeitsfoto" loading="lazy">
        <div class="foto-galerie-overlay"><span>${info.original_filename || 'Foto'}</span></div>
    `;

    item.addEventListener('click', () => {
        openFotoLightbox(imgUrl);
    });

    grid.appendChild(item);
    fotoGalleryImages.push(imgUrl);
}

function loadGalleryPhotos() {
    const grid = document.getElementById('foto-galerie-grid');
    const emptyMsg = document.getElementById('foto-galerie-empty');
    if (!grid) return;

    const items = grid.querySelectorAll('.foto-galerie-item');
    items.forEach(item => item.remove());

    const listUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/list/${CLOUDINARY_FOLDER}.json`;

    fetch(listUrl)
        .then(res => {
            if (!res.ok) throw new Error('No photos yet');
            return res.json();
        })
        .then(data => {
            if (!data.resources || data.resources.length === 0) {
                if (emptyMsg) emptyMsg.style.display = 'block';
                return;
            }

            if (emptyMsg) emptyMsg.style.display = 'none';
            fotoGalleryImages = [];

            const sorted = data.resources.sort((a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
            );

            sorted.forEach(resource => {
                const imgUrl = resource.secure_url
                    .replace('/upload/', '/upload/w_600,h_600,c_fill,q_auto,f_auto/');

                const item = document.createElement('div');
                item.className = 'foto-galerie-item';
                item.innerHTML = `
                    <img src="${imgUrl}" alt="Hochzeitsfoto" loading="lazy">
                    <div class="foto-galerie-overlay"><span>${resource.public_id.split('/').pop()}</span></div>
                `;

                item.addEventListener('click', () => {
                    openFotoLightbox(imgUrl);
                });

                grid.appendChild(item);
                fotoGalleryImages.push(imgUrl);
            });
        })
        .catch(() => {
            if (emptyMsg) emptyMsg.style.display = 'block';
        });
}

// ========================================
// FOTO-GALERIE LIGHTBOX
// ========================================
let fotoLightboxIndex = 0;

function initFotoLightbox() {
    const lightbox = document.getElementById('foto-lightbox');
    const closeBtn = document.getElementById('foto-lightbox-close');
    const prevBtn = document.getElementById('foto-lightbox-prev');
    const nextBtn = document.getElementById('foto-lightbox-next');
    if (!lightbox) return;

    closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.classList.remove('active');
    });

    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fotoLightboxIndex = (fotoLightboxIndex - 1 + fotoGalleryImages.length) % fotoGalleryImages.length;
        document.getElementById('foto-lightbox-img').src = fotoGalleryImages[fotoLightboxIndex];
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fotoLightboxIndex = (fotoLightboxIndex + 1) % fotoGalleryImages.length;
        document.getElementById('foto-lightbox-img').src = fotoGalleryImages[fotoLightboxIndex];
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') lightbox.classList.remove('active');
        if (e.key === 'ArrowLeft') {
            fotoLightboxIndex = (fotoLightboxIndex - 1 + fotoGalleryImages.length) % fotoGalleryImages.length;
            document.getElementById('foto-lightbox-img').src = fotoGalleryImages[fotoLightboxIndex];
        }
        if (e.key === 'ArrowRight') {
            fotoLightboxIndex = (fotoLightboxIndex + 1) % fotoGalleryImages.length;
            document.getElementById('foto-lightbox-img').src = fotoGalleryImages[fotoLightboxIndex];
        }
    });
}

function openFotoLightbox(imgUrl) {
    const lightbox = document.getElementById('foto-lightbox');
    const lightboxImg = document.getElementById('foto-lightbox-img');
    fotoLightboxIndex = fotoGalleryImages.indexOf(imgUrl);
    lightboxImg.src = imgUrl;
    lightbox.classList.add('active');
}

// ========================================
// SMOOTH SCROLL FÜR NAVIGATION
// ========================================
function initSmoothScroll() {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');

            if (!targetId.startsWith('#')) return;

            e.preventDefault();
            const target = document.querySelector(targetId);

            if (target) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ========================================
// NAVBAR SCROLL-EFFEKT
// ========================================
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 30px rgba(139, 115, 85, 0.15)';
        } else {
            navbar.style.boxShadow = '0 2px 20px rgba(139, 115, 85, 0.1)';
        }

        lastScroll = currentScroll;
    });
}

// ========================================
// INITIALISIERUNG
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Briefumschlag Animation starten
    initEnvelopeAnimation();

    // Klick auf Umschlag oder Siegel
    envelopeOverlay.addEventListener('click', openEnvelope);

    // Touch-Unterstützung für Mobile
    envelopeOverlay.addEventListener('touchstart', (e) => {
        e.preventDefault();
        openEnvelope();
    }, { passive: false });

    // FAQ initialisieren
    initFAQ();

    // Formular initialisieren
    initForm();

    // Smooth Scroll initialisieren
    initSmoothScroll();

    // Navbar Scroll-Effekt
    initNavbarScroll();
});

// ========================================
// TASTATUR-UNTERSTÜTZUNG
// ========================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        if (!isEnvelopeOpen) {
            openEnvelope();
        }
    }
});
