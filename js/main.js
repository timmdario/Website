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

// EmailJS initialisieren
emailjs.init(EMAILJS_PUBLIC_KEY);

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
    // Initial States
    gsap.set('.envelope-3d', { scale: 0.85, opacity: 0 });
    gsap.set('.envelope-top-flap', { rotationX: 0 });
    gsap.set('.envelope-letter-new', { y: 0 });
    gsap.set('.wax-seal', { scale: 0, rotation: -180 });
    gsap.set('.envelope-hint-new', { opacity: 0, y: 10 });
    gsap.set('.envelope-left-flap', { rotationY: 0 });
    gsap.set('.envelope-right-flap', { rotationY: 0 });

    const introTl = gsap.timeline({ delay: 0.3 });

    // Envelope erscheint
    introTl.to('.envelope-3d', {
        scale: 1,
        opacity: 1,
        duration: 1,
        ease: 'back.out(1.4)'
    });

    // Side flaps klappen ein (von außen nach innen)
    introTl.to('.envelope-left-flap', {
        rotationY: -20,
        duration: 0.5,
        ease: 'power2.out'
    }, '-=0.3');

    introTl.to('.envelope-right-flap', {
        rotationY: 20,
        duration: 0.5,
        ease: 'power2.out'
    }, '-=0.4');

    // Siegel erscheint mit Drehung
    introTl.to('.wax-seal', {
        scale: 1,
        rotation: 0,
        duration: 0.7,
        ease: 'elastic.out(1, 0.5)'
    }, '-=0.1');

    // Hint Text
    introTl.to('.envelope-hint-new', {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
    }, '-=0.2');

    // Create petals
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

    // Hint ausblenden
    tl.to('.envelope-hint-new', {
        opacity: 0,
        duration: 0.3
    });

    // Siegel "bricht" - puls und dann verschwinden
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

    // Blütenblätterexpllosion beim Öffnen des Siegels
    tl.call(() => {
        animatePetals();
    }, null, '-=0.1');

    // Side flaps öffnen sich
    tl.to('.envelope-left-flap', {
        rotationY: -60,
        duration: 0.5,
        ease: 'power2.inOut'
    }, '-=0.1');

    tl.to('.envelope-right-flap', {
        rotationY: 60,
        duration: 0.5,
        ease: 'power2.inOut'
    }, '-=0.4');

    // Top flap öffnet sich nach oben (3D Rotation)
    tl.to('.envelope-top-flap', {
        rotationX: -180,
        duration: 0.8,
        ease: 'power2.inOut'
    }, '-=0.2');

    // Kurze Pause
    tl.to({}, { duration: 0.3 });

    // Brief steigt aus dem Umschlag - z-index auf 10 setzen (vor allen Umschlag-Teilen)
    tl.set('.envelope-letter-new', { zIndex: 10 });

    tl.to('.envelope-letter-new', {
        y: -220,
        duration: 1,
        ease: 'power2.out'
    });

    // Letter wird leicht größer und centriert
    tl.to('.envelope-letter-new', {
        scale: 1.15,
        duration: 0.6,
        ease: 'power2.out'
    }, '-=0.5');

    // Pause für Wirkung
    tl.to({}, { duration: 1 });

    // Alles verschwindet - Overlay fade out
    tl.to('.envelope-3d', {
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

    // Scroll-Animationen initialisieren
    initScrollAnimations();
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
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                name: data.name,
                guests: data.guests,
                overnight_friday: data.overnight_friday,
                overnight_saturday: data.overnight_saturday,
                on_site: data.on_site,
                breakfast: data.breakfast,
                dietary: data.dietary || 'Keine',
                message: data.message || 'Keine Nachricht'
            });

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
// SMOOTH SCROLL FÜR NAVIGATION
// ========================================
function initSmoothScroll() {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const target = document.querySelector(targetId);

            if (target) {
                gsap.to(window, {
                    scrollTo: { y: target, offsetY: 80 },
                    duration: 1,
                    ease: 'power2.inOut'
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
