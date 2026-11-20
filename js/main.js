/* ========================================
   MALIKA & DARIO - HOCHZEITSWEBSITE
   JavaScript: Animationen, FAQ, Gäste-Code
   ======================================== */

// Google Sheets Web App URL (nach Deployment einfügen)
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzqkcHzcFQScpf2IXVl2hGh0WM8GsCXk88aCnRZuy9eSXhO05I9VItnobkBfi30OkkG-g/exec';

// ScrollTrigger Plugin registrieren (nur wenn Library geladen)
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

// ========================================
// COOKIE HILFSFUNKTIONEN
// ========================================
function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + expires + ';path=/;SameSite=Lax';
}

function getCookie(name) {
    return document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=')[1];
}

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
    const colors = ['sage', 'olive', 'taupe', 'haselnuss'];

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

function scrollToHashTarget() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const target = document.getElementById(id);
    if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'instant' });
}

function showWebsite() {
    envelopeOverlay.style.display = 'none';
    websiteContent.classList.remove('hidden');
    setCookie('envelope_opened', '1', 365);
    showGuestMessage(currentGuest);
    scrollToHashTarget();

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
    // 1. Mai 2027, 13:00 Uhr deutsche Zeit (MESZ = UTC+2)
    const targetDate = new Date('2027-05-01T13:00:00+02:00').getTime();

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
// RSVP FORMULAR
// ========================================
function initForm() {
    // Pill-Toggle für Radio-Buttons
    document.querySelectorAll('.radio-group').forEach(group => {
        // Initial active state from checked inputs
        group.querySelectorAll('input[type="radio"]:checked').forEach(input => {
            input.closest('.radio-label').classList.add('active');
        });

        group.addEventListener('click', (e) => {
            const label = e.target.closest('.radio-label');
            if (!label) return;

            const input = label.querySelector('input[type="radio"]');
            if (!input) return;

            // Deactivate siblings, activate clicked
            group.querySelectorAll('.radio-label').forEach(l => l.classList.remove('active'));
            label.classList.add('active');
            input.checked = true;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
    });

    // Erst die Frage "Kommt ihr?" beantworten, bei "Ja" öffnet sich der Rest
    if (rsvpForm) {
        const attendingRadios = rsvpForm.querySelectorAll('input[name="attending"]');
        const rsvpGroups = rsvpForm.querySelectorAll('[data-rsvp]');
        const updateRsvpSteps = () => {
            const answer = rsvpForm.querySelector('input[name="attending"]:checked');
            rsvpGroups.forEach(group => {
                const show = !!answer && (group.dataset.rsvp === 'basic' || answer.value === 'Ja');
                group.style.display = show ? '' : 'none';
                group.querySelectorAll('input, textarea').forEach(el => { el.disabled = !show; });
            });
        };
        attendingRadios.forEach(radio => radio.addEventListener('change', updateRsvpSteps));
        updateRsvpSteps();
    }

    // Overnight conditional toggle
    const overnightRadios = document.querySelectorAll('input[name="overnight"]');
    const overnightDetails = document.getElementById('overnight-details');

    if (overnightRadios.length && overnightDetails) {
        overnightRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'Ja') {
                    overnightDetails.classList.add('visible');
                } else {
                    overnightDetails.classList.remove('visible');
                }
            });
        });
    }

    // Guest Names conditional reveal
    const guestsInput = document.getElementById('guests');
    const guestNamesGroup = document.getElementById('guest-names-group');

    if (guestsInput && guestNamesGroup) {
        const syncGuestNames = () => {
            const count = parseInt(guestsInput.value, 10) || 1;
            if (count > 1) {
                guestNamesGroup.classList.add('visible');
            } else {
                guestNamesGroup.classList.remove('visible');
            }
        };
        guestsInput.addEventListener('input', syncGuestNames);
        guestsInput.addEventListener('change', syncGuestNames);
        syncGuestNames();
    }

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
            // An Google Sheets senden (wenn URL konfiguriert)
            if (GOOGLE_SHEETS_URL) {
                fetch(GOOGLE_SHEETS_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: data.name,
                        attending: data.attending,
                        guests: data.guests,
                        guest_names: data.guest_names || 'Keine',
                        overnight: data.overnight,
                        overnight_friday: data.overnight_friday,
                        overnight_saturday: data.overnight_saturday,
                        overnight_prefs: data.overnight_prefs || 'Keine',
                        breakfast: data.breakfast,
                        dietary: data.dietary || 'Keine',
                        message: data.message || 'Keine Nachricht'
                    })
                }).catch(err => console.warn('Google Sheets:', err));
            }

            // Button Text ändern
            const declined = data.attending === 'Nein';
            submitBtn.innerHTML = declined ? '<span>Schade!</span> ✿' : '<span>Hanitastisch!</span> ✿';
            submitBtn.disabled = false;

            // Erfolg anzeigen
            rsvpForm.classList.add('hidden');
            formSuccess.querySelector('p').textContent = declined
                ? 'Deine Antwort wurde abgeschickt. Schade, dass du nicht dabei sein kannst!'
                : 'Deine Antwort wurde erfolgreich gesendet. Wir freuen uns auf euch!';
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

    updatePosition(0);
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
        grad.addColorStop(0, '#bca897');
        grad.addColorStop(0.3, '#a89888');
        grad.addColorStop(0.6, '#9b755c');
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
        if (e.touches) e.preventDefault();
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
    canvas.addEventListener('touchstart', startScratch, { passive: false });
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('touchmove', scratch, { passive: false });
    canvas.addEventListener('mouseup', stopScratch);
    canvas.addEventListener('mouseleave', stopScratch);
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
                windowBorder: '#bca897',
                tabIcon: '#8B7355',
                menuIcons: '#8B7355',
                textDark: '#4A3F35',
                textLight: '#FFFDF9',
                link: '#9b755c',
                action: '#bca897',
                inactiveTabIcon: '#bca897',
                error: '#D45B5B',
                inProgress: '#bca897',
                complete: '#7CB97A'
            }
        }
    }, (error, result) => {
        if (error && error.status === 'presets_not_found') {
            alert('Upload-Preset "wedding_uploads" nicht gefunden.\n\nBitte in Cloudinary Dashboard unter Settings → Upload ein "Unsigned Upload Preset" mit dem Namen "wedding_uploads" erstellen.');
            return;
        }
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
            navbar.style.boxShadow = '0 4px 30px rgba(107, 67, 45, 0.12)';
        } else {
            navbar.style.boxShadow = '0 2px 20px rgba(107, 67, 45, 0.08)';
        }

        lastScroll = currentScroll;
    });
}

// ========================================
// HAMBURGER MENU
// ========================================
function initHamburgerMenu() {
    const hamburger = document.querySelector('.nav-hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (!hamburger || !navLinks) return;

    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    // Dropdown-Toggle auf Mobile (Pfeil neben "Details", der Link selbst navigiert)
    document.querySelectorAll('.nav-dropdown-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (window.innerWidth > 768) return;
            e.preventDefault();
            e.stopPropagation();
            btn.parentElement.classList.toggle('open');
        });
    });

    // Menü schließen bei Link-Klick
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth > 768) return;
            hamburger.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });

    // Menü schließen bei Klick außerhalb
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('open');
        }
    });
}

// ========================================
// GÄSTE-CODE (Briefumschlag)
// ========================================
const GUEST_COOKIE = 'guest_code';

const GUEST_CACHE_MS = 30 * 60 * 1000;
const guestLookups = {};

// Gefundene Gäste werden kurz zwischengespeichert, damit jede Seite nicht erneut beim Sheet anfragt
function lookupGuest(code) {
    if (guestLookups[code]) return guestLookups[code];
    const key = 'guest:' + code;
    try {
        const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
        if (cached && Date.now() - cached.ts < GUEST_CACHE_MS) {
            guestLookups[code] = Promise.resolve(cached.data);
            return guestLookups[code];
        }
    } catch (e) { /* kein Cache verfügbar */ }
    const url = GOOGLE_SHEETS_URL + '?action=lookup&code=' + encodeURIComponent(code);
    const request = fetch(url).then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
    }).then(data => {
        if (data.found) {
            try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch (e) { /* ignorieren */ }
        }
        return data;
    });
    guestLookups[code] = request;
    request.catch(() => { delete guestLookups[code]; });
    return request;
}

let currentGuest = null;

function escHtml(s) {
    return String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
}

// Trauzeugen-Nummern kommen nur mit gültigem Gäste-Code aus dem Sheet
function loadTrauzeugen() {
    const list = document.getElementById('trauzeugen-list');
    const code = getCookie(GUEST_COOKIE);
    if (!list || !code || !GOOGLE_SHEETS_URL) return;
    fetch(GOOGLE_SHEETS_URL + '?action=contacts&code=' + encodeURIComponent(code), { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
        .then(data => {
            const contacts = data.contacts || [];
            if (!contacts.length) return;
            const groups = {};
            contacts.forEach(c => { (groups[c.brautpaar] = groups[c.brautpaar] || []).push(c); });
            list.innerHTML = Object.keys(groups).map(bp =>
                '<div class="trauzeugen-group"><strong>' + escHtml(bp) + '</strong><ul>' +
                groups[bp].map(c => '<li>' + escHtml(c.name) + ' · <a href="tel:' + escHtml(c.phone.replace(/\s/g, '')) + '">' + escHtml(c.phone) + '</a></li>').join('') +
                '</ul></div>'
            ).join('');
        })
        .catch(err => console.warn('Trauzeugen:', err));
}

function initVenueToggle() {
    document.querySelectorAll('.venue-toggle').forEach(card => {
        const extra = card.querySelector('.venue-extra');
        if (!extra) return;
        const toggle = () => {
            const open = extra.hidden;
            extra.hidden = !open;
            card.setAttribute('aria-expanded', String(open));
        };
        card.addEventListener('click', toggle);
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });
    });
}

// Anrede aus Sheet-Spalte "Anrede": 0 = Mann, 1 = Frau, 2 = Mehrere
function anredeType(guest) {
    const raw = guest && guest.anrede;
    if (raw === '' || raw === null || raw === undefined) return 0;
    const a = parseInt(raw, 10);
    return a === 0 || a === 1 || a === 2 ? a : 0;
}

function anredeWord(guest) {
    return anredeType(guest) === 0 ? 'Lieber' : 'Liebe';
}

function renderGuestIntro(guest) {
    const el = document.getElementById('guest-intro');
    if (!el) return;
    const multi = anredeType(guest) === 2;
    const you = multi ? 'ihr' : 'du';
    const have = multi ? 'habt' : 'hast';
    el.innerHTML =
        '<p><strong>' + String(guest.firstName).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';') + '</strong>, schön, dass ' + you + ' den Weg auf unsere Hochzeitswebsite gefunden ' + have + '!</p>' +
        '<p>Nachdem wir uns bereits standesamtlich das Ja-Wort gegeben haben, möchten wir unsere Hochzeit am Samstag, den 01.05.2027, im Rahmen einer freien Trauung gemeinsam mit euch feiern, mit allem was dazu gehört.</p>' +
        '<p>Hier findet ihr alle wichtigen Informationen rund um unsere Hochzeit. Sollten darüber hinaus noch Fragen offenbleiben, meldet euch jederzeit gerne bei uns!</p>';
    el.hidden = false;
}

function showGuestMessage(guest) {
    if (!guest || !guest.message || document.getElementById('guest-dog-wrap')) return;
    const wrap = document.createElement('div');
    wrap.id = 'guest-dog-wrap';
    wrap.className = 'guest-dog-wrap';
    wrap.innerHTML = '<div class="guest-bubble">Wuff! Du hast eine persönliche Nachricht von uns bekommen. Klick mich!</div>' +
        '<button type="button" class="guest-dog" aria-label="Persönliche Nachricht öffnen"></button>';
    document.body.appendChild(wrap);

    const panel = document.createElement('div');
    panel.className = 'guest-note-overlay';
    panel.hidden = true;
    panel.innerHTML = '<div class="guest-note" role="dialog" aria-modal="true"><h3></h3><p></p><p class="guest-note-sign">Malika &amp; Dario</p><button type="button" class="guest-note-close">Schließen</button></div>';
    panel.querySelector('h3').textContent = anredeWord(guest) + ' ' + guest.firstName + ',';
    panel.querySelector('p').textContent = guest.message;
    document.body.appendChild(panel);

    const open = () => {
        panel.hidden = false;
        wrap.classList.add('is-read');
    };
    const close = () => { panel.hidden = true; };
    wrap.querySelector('.guest-dog').addEventListener('click', open);
    wrap.querySelector('.guest-bubble').addEventListener('click', open);
    panel.querySelector('.guest-note-close').addEventListener('click', close);
    panel.addEventListener('click', (e) => { if (e.target === panel) close(); });
}

function prefillRsvpName(guest) {
    currentGuest = guest;
    renderGuestIntro(guest);
    loadTrauzeugen();
    const greeting = document.getElementById('nav-greeting');
    if (greeting) greeting.textContent = 'Hallo ' + guest.firstName;
    const nameInput = document.getElementById('name');
    if (nameInput && !nameInput.value) {
        nameInput.value = guest.firstName + ' ' + guest.lastName;
    }
}

function fillGuestLetter(guest) {
    const paper = document.querySelector('.letter-paper');
    document.getElementById('letter-greeting').textContent = 'Hallo ' + guest.firstName + ',';
    document.querySelector('.letter-invite-text').textContent = anredeType(guest) === 2
        ? 'Ihr seid herzlich zu unserer Hochzeit eingeladen.'
        : 'Du bist herzlich zu unserer Hochzeit eingeladen.';
    paper.classList.add('has-guest');
    document.getElementById('envelope-letter').classList.add('has-guest');
}

function initGuestCode() {
    const form = document.getElementById('guest-code-form');
    const input = document.getElementById('guest-code');
    const errorEl = document.getElementById('guest-code-error');
    const loadingEl = document.getElementById('guest-loading');
    if (!form) return;

    ['click', 'mousedown', 'touchstart'].forEach(evt => {
        form.addEventListener(evt, e => e.stopPropagation(), { passive: true });
    });

    let busy = false;
    async function openWithCode() {
        if (busy || isEnvelopeOpen) return;
        const code = input.value.trim();
        if (!code) {
            errorEl.textContent = 'Bitte gib zuerst den Code aus deinem Brief ein.';
            input.focus();
            return;
        }
        if (!/^\d{6}$/.test(code)) {
            errorEl.textContent = 'Der Code besteht aus 6 Ziffern.';
            return;
        }
        errorEl.textContent = '';
        busy = true;
        if (loadingEl) loadingEl.hidden = false;
        try {
            const guest = await lookupGuest(code);
            if (!guest.found) {
                errorEl.textContent = 'Diesen Code kennen wir nicht. Bitte prüfe ihn noch einmal.';
                return;
            }
            setCookie(GUEST_COOKIE, code, 365);
            prefillRsvpName(guest);
            fillGuestLetter(guest);
            openEnvelope();
        } catch (err) {
            console.warn('Gäste-Code:', err);
            errorEl.textContent = 'Gerade klappt die Prüfung nicht. Versuch es später nochmal.';
        } finally {
            busy = false;
            if (loadingEl) loadingEl.hidden = true;
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        openWithCode();
    });

    envelopeOverlay.addEventListener('click', openWithCode);
    envelopeOverlay.addEventListener('touchstart', (e) => {
        e.preventDefault();
        openWithCode();
    }, { passive: false });
}

function requireGuestOnSubpage() {
    const toStart = () => {
        window.location.replace(location.pathname.includes('/easteregg/') ? '../index.html' : 'index.html');
    };
    const code = getCookie(GUEST_COOKIE);
    if (!code) return toStart();
    lookupGuest(code)
        .then(guest => { if (guest && guest.found === false) toStart(); })
        .catch(err => console.warn('Gäste-Prüfung:', err));
}

function initSongWish() {
    const form = document.getElementById('song-form');
    if (!form) return;
    const greeting = document.getElementById('song-greeting');
    const errorEl = document.getElementById('song-error');
    const success = document.getElementById('song-success');
    const submitBtn = form.querySelector('.submit-btn');
    const loadingEl = document.getElementById('song-loading');
    const code = getCookie(GUEST_COOKIE);

    if (code) {
        lookupGuest(code)
            .then(guest => {
                if (guest.found && greeting) greeting.textContent = 'Hallo ' + guest.firstName + '!';
            })
            .catch(err => console.warn('Musikwunsch-Gruß:', err));
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        errorEl.textContent = '';
        const title = document.getElementById('song-title').value.trim();
        if (!title) {
            errorEl.textContent = 'Bitte gib mindestens einen Songtitel an.';
            return;
        }
        if (!code) {
            errorEl.textContent = 'Bitte gib zuerst deinen Code auf der Startseite ein.';
            return;
        }
        submitBtn.disabled = true;
        loadingEl.hidden = false;
        fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'song',
                code: code,
                title: title,
                artist: document.getElementById('song-artist').value.trim(),
                note: document.getElementById('song-note').value.trim()
            })
        })
            .then(() => {
                loadingEl.hidden = true;
                form.style.display = 'none';
                success.classList.remove('hidden');
            })
            .catch(err => {
                console.warn('Musikwunsch:', err);
                loadingEl.hidden = true;
                errorEl.textContent = 'Gerade klappt das Senden nicht. Versuch es später nochmal.';
                submitBtn.disabled = false;
            });
    });

    const again = document.getElementById('song-again');
    if (again) {
        again.addEventListener('click', () => {
            form.reset();
            submitBtn.disabled = false;
            errorEl.textContent = '';
            success.classList.add('hidden');
            form.style.display = '';
            document.getElementById('song-title').focus();
        });
    }
}

function initStoryClosing() {
    const el = document.getElementById('story-closing');
    const code = getCookie(GUEST_COOKIE);
    if (!el || !code) return;
    lookupGuest(code)
        .then(guest => {
            if (!guest.found) return;
            const multi = anredeType(guest) === 2;
            el.textContent = guest.firstName + ', wir hoffen ' + (multi ? 'ihr seid' : 'du bist') + ' auch dabei.';
            el.hidden = false;
        })
        .catch(err => console.warn('Geschichte-Abschluss:', err));
}

function initLogout() {
    document.querySelectorAll('.nav-logout').forEach(btn => {
        btn.addEventListener('click', () => {
            setCookie(GUEST_COOKIE, '', -1);
            Object.keys(sessionStorage).filter(k => k.startsWith('guest:')).forEach(k => sessionStorage.removeItem(k));
            window.location.href = location.pathname.includes('/easteregg/') ? '../index.html' : 'index.html';
        });
    });
}

// ========================================
// PARALLAX-HINTERGRUND
// ========================================
function initParallax() {
    const layer = document.createElement('div');
    layer.className = 'parallax-bg';
    layer.setAttribute('aria-hidden', 'true');
    document.body.prepend(layer);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    const update = () => {
        layer.style.backgroundPositionY = (-window.scrollY * 0.3).toFixed(1) + 'px';
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });
    update();
}

// KARUSSELL & SCROLL-GESCHICHTE
// ========================================
function initKarussel() {
    const track = document.getElementById('karussel');
    const prev = document.getElementById('karussel-prev');
    const next = document.getElementById('karussel-next');
    if (!track || !prev || !next) return;
    const step = () => {
        const item = track.querySelector('.karussel-item');
        return item ? item.getBoundingClientRect().width + 20 : 280;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
}

function initStoryReveal() {
    const source = document.querySelectorAll('.story-source .story-chapter');
    const timeline = document.querySelector('.story-timeline');
    const stage = document.querySelector('.story-stage');
    const beatsWrap = document.querySelector('.story-beats');
    const progressWrap = document.querySelector('.story-progress');
    const nextBtn = document.querySelector('.story-next');
    if (!source.length || !timeline || !stage || !beatsWrap) return;

    // Jeder Schritt zeigt ein Bild; gibt es mehr Bilder als Textabschnitte, laufen Bilder ohne neuen Text durch
    const steps = [];
    const chapters = [];
    const scenes = new Map();
    const sceneList = [];
    const texts = [];

    source.forEach(section => {
        const imgs = Array.from(section.querySelectorAll('.story-images img'));
        const paragraphs = Array.from(section.querySelectorAll('.story-text'));
        const headingEl = section.querySelector('.story-heading');
        if (!imgs.length) return;

        const start = steps.length;
        const count = Math.max(imgs.length, paragraphs.length);
        for (let i = 0; i < count; i++) {
            const img = imgs[Math.min(i, imgs.length - 1)];
            const step = { img, index: steps.length, text: i < paragraphs.length ? paragraphs[i] : null };
            steps.push(step);
            if (step.text) texts.push(step);
        }
        const chapter = {
            start,
            end: steps.length,
            title: headingEl ? headingEl.textContent.trim() : '',
            dir: section.dataset.from || 'left'
        };
        chapters.push(chapter);
    });

    // Eine Szene pro Bild, die während aller Schritte mit diesem Bild sichtbar ist
    steps.forEach(step => {
        if (!scenes.has(step.img)) {
            const chapter = chapters.find(c => step.index >= c.start && step.index < c.end);
            const scene = document.createElement('div');
            scene.className = 'story-scene';
            scene.dataset.dir = chapter ? chapter.dir : 'left';
            const inner = document.createElement('div');
            inner.className = 'story-scene-inner';
            inner.appendChild(step.img);
            scene.appendChild(inner);
            stage.appendChild(scene);

            const applyRatio = () => {
                const ratio = step.img.naturalWidth && step.img.naturalHeight ? step.img.naturalWidth / step.img.naturalHeight : 0.75;
                scene.style.setProperty('--ratio', ratio.toFixed(4));
                sizeStoryScenes();
            };
            step.img.addEventListener('load', applyRatio);
            applyRatio();

            const entry = { el: scene, img: step.img, start: step.index, end: step.index + 1, loaded: false };
            scenes.set(step.img, entry);
            sceneList.push(entry);
        } else {
            scenes.get(step.img).end = step.index + 1;
        }
    });

    // Überschriften liegen über dem Bild des Kapitels
    chapters.forEach(chapter => {
        const title = document.createElement('div');
        title.className = 'story-chapter-title';
        title.textContent = chapter.title;
        stage.appendChild(title);
        chapter.titleEl = title;
    });

    // Fließtext: jeder Abschnitt bekommt einen eigenen Textblock am Schritt, an dem er erscheint
    texts.forEach((step, i) => {
        const beat = document.createElement('div');
        beat.className = 'story-beat';
        const box = document.createElement('div');
        box.className = 'story-beat-inner';
        box.appendChild(step.text);
        beat.appendChild(box);
        beatsWrap.appendChild(beat);
        step.beat = beat;
        step.nextText = i + 1 < texts.length ? texts[i + 1].index : Infinity;
    });

    const dots = [];
    if (progressWrap) {
        chapters.forEach((chapter, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.setAttribute('aria-label', 'Kapitel ' + (i + 1) + ': ' + chapter.title);
            dot.addEventListener('click', () => scrollToStoryStep(chapter.start));
            progressWrap.appendChild(dot);
            dots.push(dot);
        });
    }

    timeline.style.height = (steps.length * 50 + 100) + 'vh';

    function scrollToStoryStep(index) {
        const total = timeline.offsetHeight - window.innerHeight;
        const y = timeline.offsetTop + (Math.min(index, steps.length) / steps.length) * total;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }

    // Bildhöhe ist für alle Bilder gleich; das Seitenverhältnis bestimmt die Breite
    function sizeStoryScenes() {
        const maxH = window.innerHeight * 0.72;
        const maxW = window.innerWidth * 0.92;
        stage.style.setProperty('--story-img-h', Math.round(maxH) + 'px');
        sceneList.forEach(({ el }) => {
            const ratio = parseFloat(el.style.getPropertyValue('--ratio')) || 0.75;
            let w = maxH * ratio;
            let h = maxH;
            if (w > maxW) { w = maxW; h = w / ratio; }
            el.style.width = Math.round(w) + 'px';
            el.style.height = Math.round(h) + 'px';
        });
    }
    sizeStoryScenes();
    window.addEventListener('resize', sizeStoryScenes);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        sceneList.forEach(loadStoryImage);
        return;
    }

    const clamp01 = x => Math.min(1, Math.max(0, x));
    const ease = t => t * t * (3 - 2 * t);
    const fadeIn = (x, a, b) => ease(clamp01((x - a) / (b - a)));
    const fadeOut = (x, a, b) => 1 - ease(clamp01((x - a) / (b - a)));

    const loadStoryImage = (entry) => {
        if (entry.loaded) return;
        entry.loaded = true;
        entry.img.src = entry.img.dataset.src;
    };

    const update = () => {
        const total = Math.max(1, timeline.offsetHeight - window.innerHeight);
        const scrolled = Math.min(total, Math.max(0, -timeline.getBoundingClientRect().top));
        const pos = (scrolled / total) * steps.length;

        sceneList.forEach(entry => { if (pos >= entry.start - 2) loadStoryImage(entry); });

        sceneList.forEach(({ el, start, end }) => {
            const o = fadeIn(pos, start - 0.12, start) * fadeOut(pos, end - 0.12, end + 0.1);
            const travel = clamp01((pos - start + 0.12) / 0.3);
            const distance = (1 - travel) * 8;
            const dir = el.dataset.dir;
            let tx = 0;
            let ty = 0;
            let rot = 0;
            if (dir === 'left') tx = -distance;
            else if (dir === 'right') tx = distance;
            else if (dir === 'top') ty = -distance * 0.7;
            else if (dir === 'bottom') ty = distance * 0.7;
            else rot = (1 - travel) * -4;
            el.style.setProperty('--o', o.toFixed(3));
            el.style.setProperty('--tx', tx.toFixed(2) + 'vw');
            el.style.setProperty('--ty', ty.toFixed(2) + 'vw');
            el.style.setProperty('--rot', rot.toFixed(2) + 'deg');
            el.style.setProperty('--sc', (1.04 - travel * 0.04).toFixed(3));
        });

        chapters.forEach(chapter => {
            const o = fadeIn(pos, chapter.start - 0.05, chapter.start + 0.2) * fadeOut(pos, chapter.start + 0.6, chapter.start + 0.9);
            chapter.titleEl.style.setProperty('--o', o.toFixed(3));
        });

        texts.forEach(step => {
            const d = pos - step.index;
            const o = fadeIn(pos, step.index - 0.05, step.index + 0.22) *
                (isFinite(step.nextText) ? fadeOut(pos, step.nextText - 0.3, step.nextText - 0.05) : 1);
            const rise = ease(clamp01((d + 0.05) / 0.35));
            step.beat.style.setProperty('--o', Math.max(0, o).toFixed(3));
            step.beat.style.setProperty('--ty', ((1 - rise) * 24).toFixed(1) + 'px');
        });

        const activeChapter = chapters.findIndex(c => pos >= c.start && pos < c.end);
        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === activeChapter));
        if (nextBtn) {
            nextBtn.hidden = pos > steps.length - 1.4;
            nextBtn.textContent = 'Weiter ↓';
        }
    };

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const current = Math.floor(clamp01(-timeline.getBoundingClientRect().top / Math.max(1, timeline.offsetHeight - window.innerHeight)) * steps.length);
            scrollToStoryStep(current + 1);
        });
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
}

// ========================================
// INITIALISIERUNG
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Browser-Scroll-Position zurücksetzen
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // Hamburger Menu (auf allen Seiten)
    initHamburgerMenu();
    initParallax();
    initKarussel();
    initStoryReveal();
    initVenueToggle();
    initLogout();

    const isSubpage = !document.getElementById('envelope-overlay');

    if (isSubpage) {
        // Unterseite: nur mit gültigem Gäste-Code sichtbar
        requireGuestOnSubpage();
        // Unterseite: nur Foto-Galerie initialisieren (falls vorhanden)
        if (document.getElementById('upload-btn')) {
            initFotoGalerie();
        }
        initSongWish();
        initStoryClosing();
        return;
    }

    // Hauptseite: Brief bleibt bis zu einem gültigen Gäste-Code sichtbar
    initEnvelopeAnimation();
    initGuestCode();

    const storedCode = getCookie(GUEST_COOKIE);
    if (storedCode) {
        const loadingEl = document.getElementById('guest-loading');
        envelopeOverlay.classList.add('is-checking');
        if (loadingEl) loadingEl.hidden = false;
        lookupGuest(storedCode)
            .then(guest => {
                if (guest.found) {
                    prefillRsvpName(guest);
                    showWebsite();
                } else {
                    setCookie(GUEST_COOKIE, '', -1);
                    envelopeOverlay.classList.remove('is-checking');
                }
            })
            .catch(err => {
                console.warn('Gäste-Code:', err);
                envelopeOverlay.classList.remove('is-checking');
            })
            .finally(() => {
                if (loadingEl) loadingEl.hidden = true;
            });
    }

    // FAQ initialisieren
    initFAQ();

    // Formular initialisieren
    initForm();

    // Smooth Scroll initialisieren
    initSmoothScroll();

    // Navbar Scroll-Effekt
    initNavbarScroll();
});

