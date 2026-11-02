/**
 * HACKPASS 2026 - EVENT PASS GENERATOR CORE LOGIC
 * Features:
 * 1. Instant Real-Time Form-to-Badge Data Binding
 * 2. Dynamic QR Code Generation (Offline & Online safe)
 * 3. Custom Photo Upload & Preset Emoji Avatars
 * 4. Dynamic Theme Changing based on Track Selection
 * 5. High-Resolution Badge Export (html2canvas)
 * 6. Gate Scanner Verification Simulator
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 3D Revolving Steps Carousel Transition (Front Page)
    // Continuous loop: Center card is prominent & glowing, others fade & shrink
    // ==========================================================================
    function initStepsCarousel() {
        const stage = document.getElementById('steps-stage');
        const cards = document.querySelectorAll('.steps-stage .step-card');
        const dots = document.querySelectorAll('.steps-nav-dots .step-dot');

        if (!stage || cards.length !== 3) return;

        let centerIndex = 0;
        let autoPlayTimer = null;

        function updateCarousel(newCenter) {
            centerIndex = (newCenter + 3) % 3;
            const leftIndex = (centerIndex + 2) % 3;
            const rightIndex = (centerIndex + 1) % 3;

            cards.forEach((card, i) => {
                card.classList.remove('pos-center', 'pos-left', 'pos-right');
                if (i === centerIndex) {
                    card.classList.add('pos-center');
                } else if (i === leftIndex) {
                    card.classList.add('pos-left');
                } else if (i === rightIndex) {
                    card.classList.add('pos-right');
                }
            });

            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === centerIndex);
            });
        }

        function startAutoPlay() {
            stopAutoPlay();
            autoPlayTimer = setInterval(() => {
                updateCarousel(centerIndex + 1);
            }, 3000); // Shifts every 3 seconds continuously
        }

        function stopAutoPlay() {
            if (autoPlayTimer) {
                clearInterval(autoPlayTimer);
                autoPlayTimer = null;
            }
        }

        // Clicking any card brings it directly to the center
        cards.forEach((card, index) => {
            card.addEventListener('click', () => {
                updateCarousel(index);
                startAutoPlay();
            });
        });

        // Clicking dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                updateCarousel(index);
                startAutoPlay();
            });
        });

        // Pause on mouse hover, resume on mouse leave
        const wrapper = document.querySelector('.steps-carousel-wrapper');
        if (wrapper) {
            wrapper.addEventListener('mouseenter', stopAutoPlay);
            wrapper.addEventListener('mouseleave', startAutoPlay);
        }

        // Initialize state & start continuous transition loop
        updateCarousel(0);
        startAutoPlay();
    }

    // Initialize 3D carousel on the front page
    initStepsCarousel();

    // --- DOM Elements (Pass Studio on pass.html) ---
    const inputName = document.getElementById('input-name');
    const inputRoll = document.getElementById('input-roll');
    const inputCollege = document.getElementById('input-college');
    const inputRole = document.getElementById('input-role');
    const inputPhoto = document.getElementById('input-photo');
    const trackChips = document.querySelectorAll('.track-chip');
    const selectedTrackInput = document.getElementById('selected-track');
    const avatarBtns = document.querySelectorAll('.avatar-btn');

    // Badge Elements
    const badgeElement = document.getElementById('event-badge');

    // Only run pass generator logic if we are on the Pass Studio page (pass.html)
    if (!inputName || !badgeElement) {
        return;
    }

    const badgeName = document.getElementById('badge-name-display');
    const badgeRoll = document.getElementById('badge-roll-display');
    const badgeCollege = document.getElementById('badge-college-display');
    const badgeRole = document.getElementById('badge-role-display');
    const badgeTrack = document.getElementById('badge-track-display');
    const badgePassId = document.getElementById('badge-pass-id');
    const badgeAvatarDisplay = document.getElementById('badge-avatar-display');
    const qrcodeContainer = document.getElementById('qrcode-box');
    const verifyDataPreview = document.getElementById('verify-data-preview');

    // Buttons
    const btnDownload = document.getElementById('btn-download');
    const btnPrintPass = document.getElementById('btn-print-pass');
    const btnGeneratePass = document.getElementById('btn-generate-pass');
    const btnQuickFill = document.getElementById('btn-quick-fill');
    const btnDemoFill = document.getElementById('btn-demo-fill');
    const btnReset = document.getElementById('btn-reset');
    const btnVerifyDemo = document.getElementById('btn-verify-demo');
    const btnTerminalTrigger = document.getElementById('btn-terminal-trigger');

    // State
    let currentPassId = generatePassId('Yashaswi', '104');
    let qrInstance = null;
    let customPhotoUrl = null;

    // --- Track Themes Configuration ---
    const TRACK_ICONS = {
        'AI & Machine Learning': '🤖',
        'Web3 & Blockchain': '⛓️',
        'Cloud & DevOps': '☁️',
        'Cybersecurity': '🛡️',
        'Open Innovation': '💡'
    };

    // --- Sample Random Attendees for Testing ---
    const SAMPLE_ATTENDEES = [
        {
            name: 'Yashaswi Verma',
            roll: '23BCSE104',
            college: 'Delhi Technological University',
            role: 'Hacker',
            track: 'AI & Machine Learning',
            avatar: '👨‍💻'
        },
        {
            name: 'Priya Sundaram',
            roll: '22BIT089',
            college: 'BITS Pilani',
            role: 'Team Lead',
            track: 'Web3 & Blockchain',
            avatar: '👩‍💻'
        },
        {
            name: 'Devansh Kulkarni',
            roll: '24BCE412',
            college: 'IIT Bombay',
            role: 'Hacker',
            track: 'Cloud & DevOps',
            avatar: '🚀'
        },
        {
            name: 'Ananya Roy',
            roll: '23CS1055',
            college: 'NIT Trichy',
            role: 'Mentor',
            track: 'Cybersecurity',
            avatar: '⚡'
        },
        {
            name: 'Rohan Mehta',
            roll: '21MECH301',
            college: 'IIIT Hyderabad',
            role: 'Organizer',
            track: 'Open Innovation',
            avatar: '🤖'
        }
    ];

    // ==========================================================================
    // Core Functions
    // ==========================================================================

    /**
     * Generates a realistic Hackathon Pass ID based on attendee data
     */
    function generatePassId(name, roll) {
        const cleanName = (name || 'USR').replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase();
        const cleanRoll = (roll || '000').slice(-3);
        const randomHex = Math.floor(1000 + Math.random() * 9000);
        return `HN26-${cleanName}${cleanRoll || randomHex}`;
    }

    /**
     * Updates all Badge fields based on current input values
     */
    function updateBadge() {
        const nameVal = inputName.value.trim() || 'Attendee Name';
        const rollVal = inputRoll.value.trim() || 'ROLL-PENDING';
        const collegeVal = inputCollege.value.trim() || 'College / University';
        const roleVal = inputRole.value || 'Hacker';
        const trackVal = selectedTrackInput.value || 'AI & Machine Learning';

        // Update DOM displays
        badgeName.textContent = nameVal;
        badgeRoll.textContent = rollVal;
        badgeCollege.textContent = collegeVal;
        badgeRole.textContent = roleVal.toUpperCase();

        const trackIcon = TRACK_ICONS[trackVal] || '🎯';
        badgeTrack.innerHTML = `<span>${trackIcon}</span> ${trackVal}`;

        // Format scannable text payload that displays cleanly when scanned by any phone camera
        const scannablePayload = 
`★ HACKFEST 2026 OFFICIAL PASS ★
ID: ${currentPassId}
Name: ${nameVal}
Roll: ${rollVal}
College: ${collegeVal}
Track: ${trackVal}
Role: ${roleVal}
Venue: Main Auditorium (Desk B)
Status: VERIFIED & CLEARED FOR ENTRY`;

        // Re-generate QR code
        renderQRCode(scannablePayload);

        // Update Scanner Preview text
        updateVerificationPreview(nameVal, rollVal, collegeVal, trackVal, roleVal);
    }

    /**
     * Synthesizes an authentic electronic gate scanner beep using Web Audio API
     */
    function playScanBeep() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(950, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1750, audioCtx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.14);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.14);
        } catch (e) {
            // AudioContext silent fallback
        }
    }

    /**
     * Renders QR Code safely into the badge container
     */
    function renderQRCode(textString) {
        qrcodeContainer.innerHTML = '';

        try {
            if (typeof QRCode !== 'undefined') {
                qrInstance = new QRCode(qrcodeContainer, {
                    text: textString,
                    width: 74,
                    height: 74,
                    colorDark: '#0a0e17',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                });
                // Hide duplicate canvas so the QR image fills the entire white box centered
                setTimeout(() => {
                    const canvas = qrcodeContainer.querySelector('canvas');
                    const img = qrcodeContainer.querySelector('img');
                    if (canvas && img && img.getAttribute('src')) {
                        canvas.style.display = 'none';
                    }
                }, 20);
            } else {
                const img = document.createElement('img');
                img.src = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(textString)}`;
                img.alt = 'QR Code';
                qrcodeContainer.appendChild(img);
            }
        } catch (err) {
            const img = document.createElement('img');
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(textString)}`;
            img.alt = 'QR Code';
            qrcodeContainer.appendChild(img);
        }
    }

    /**
     * Updates the organizer verification preview section
     */
    function updateVerificationPreview(name, roll, college, track, role) {
        if (!verifyDataPreview) return;
        const hash = Array.from(currentPassId + name).reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0);
        const hexHash = Math.abs(hash).toString(16).padStart(8, '0');

        verifyDataPreview.textContent = 
`[GATE TELEMETRY: SENSOR 04-A // MAIN AUDITORIUM]
────────────────────────────────────────────────────────
PASS ID      : ${currentPassId}
NAME         : ${name}
ROLL NO      : ${roll}
INSTITUTION  : ${college}
TRACK        : ${track}
ROLE TIER    : ${role}
VENUE / DESK : Main Auditorium (Hall B - Desk 14)
TIMESTAMP    : ${new Date().toLocaleString()}
SHA-256 HASH : 8f2c_${hexHash}_90e4
STATUS       : ✅ CLEARED FOR ACCESS • IDENTITY AUTHENTICATED`;
    }

    /**
     * Triggers the full gate security scan simulation with laser and audio
     */
    function triggerGateScan() {
        playScanBeep();

        // Laser scan animation across the QR code on badge
        const laser = document.getElementById('qr-laser-scanner');
        if (laser) {
            laser.classList.add('scanning');
            setTimeout(() => laser.classList.remove('scanning'), 1600);
        }

        // Pulse clearance banner
        const banner = document.getElementById('terminal-clearance-banner');
        if (banner) {
            banner.classList.add('pulse-active');
            setTimeout(() => banner.classList.remove('pulse-active'), 1200);
        }

        const name = inputName.value.trim() || 'Attendee';
        showToast(`Gate Scan: ACCESS GRANTED for ${name}! 📡`, '✅');
    }

    /**
     * Toast notification display
     */
    function showToast(message, icon = '🎉') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 350);
        }, 3200);
    }

    /**
     * Trigger confetti celebratory animation
     */
    function triggerConfetti() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.65 },
                colors: ['#6366f1', '#06b6d4', '#10b981', '#f43f5e', '#a855f7']
            });
        }
    }

    // ==========================================================================
    // Event Listeners: Live Inputs
    // ==========================================================================

    [inputName, inputRoll, inputCollege].forEach(input => {
        input.addEventListener('input', () => {
            // Update Pass ID when name or roll changes
            currentPassId = generatePassId(inputName.value, inputRoll.value);
            badgePassId.textContent = currentPassId;
            updateBadge();
        });
    });

    inputRole.addEventListener('change', updateBadge);

    // Track Selector Chips
    trackChips.forEach(chip => {
        chip.addEventListener('click', () => {
            trackChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            const trackName = chip.dataset.track;
            const trackColor = chip.dataset.color || 'purple';

            selectedTrackInput.value = trackName;
            badgeElement.setAttribute('data-theme', trackColor);

            updateBadge();
        });
    });

    // Preset Avatar Buttons
    avatarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            avatarBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const emoji = btn.dataset.avatar;
            customPhotoUrl = null;
            badgeAvatarDisplay.innerHTML = emoji;
        });
    });

    // Custom Photo Upload
    inputPhoto.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                customPhotoUrl = event.target.result;
                avatarBtns.forEach(b => b.classList.remove('active'));
                badgeAvatarDisplay.innerHTML = `<img src="${customPhotoUrl}" alt="Attendee Photo">`;
                showToast('Profile photo applied to badge!', '📸');
            };
            reader.readAsDataURL(file);
        }
    });

    // ==========================================================================
    // Download Ticket / Badge Export
    // ==========================================================================

    btnDownload.addEventListener('click', async () => {
        const attendeeName = (inputName.value.trim() || 'Attendee').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `HackPass_${attendeeName}_${currentPassId}.png`;

        // Visual feedback
        const originalText = btnDownload.innerHTML;
        btnDownload.innerHTML = `
            <svg class="spin-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
            <span>Rendering High-Res PNG...</span>
        `;
        btnDownload.style.pointerEvents = 'none';

        try {
            if (typeof html2canvas === 'undefined') {
                throw new Error('html2canvas library is loading or blocked.');
            }

            // High-resolution capture
            const canvas = await html2canvas(badgeElement, {
                scale: 2.5, // Crisp 2.5x retina quality
                useCORS: true,
                backgroundColor: null,
                logging: false
            });

            // Trigger file download
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();

            triggerConfetti();
            showToast(`Pass saved as ${filename}!`, '🎟️');

        } catch (error) {
            console.error('Download error:', error);
            // Fallback: Canvas snapshot or print
            showToast('Opening print dialog for badge...', '🖨️');
            window.print();
        } finally {
            btnDownload.innerHTML = originalText;
            btnDownload.style.pointerEvents = 'auto';
        }
    });

    // ==========================================================================
    // Sample / Quick Fill Buttons
    // ==========================================================================

    function loadSample(attendee) {
        inputName.value = attendee.name;
        inputRoll.value = attendee.roll;
        inputCollege.value = attendee.college;
        inputRole.value = attendee.role;

        // Set track
        trackChips.forEach(c => {
            if (c.dataset.track === attendee.track) {
                c.classList.add('active');
                badgeElement.setAttribute('data-theme', c.dataset.color || 'purple');
                selectedTrackInput.value = attendee.track;
            } else {
                c.classList.remove('active');
            }
        });

        // Set avatar
        avatarBtns.forEach(b => {
            if (b.dataset.avatar === attendee.avatar) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        badgeAvatarDisplay.innerHTML = attendee.avatar;

        currentPassId = generatePassId(attendee.name, attendee.roll);
        badgePassId.textContent = currentPassId;

        updateBadge();
        showToast(`Loaded ${attendee.name}'s profile!`, '🎲');
    }

    // Confirm & Update Pass Button Handler
    if (btnGeneratePass) {
        btnGeneratePass.addEventListener('click', () => {
            const name = inputName.value.trim();
            if (!name) {
                showToast('Please type your Full Name first!', '⚠️');
                inputName.focus();
                return;
            }
            updateBadge();
            triggerConfetti();
            showToast(`Official Pass updated for ${name}! 🎉`);

            // If on smaller screen, smoothly scroll over to badge preview
            const previewPanel = document.querySelector('.preview-panel');
            if (previewPanel && window.innerWidth < 992) {
                previewPanel.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    btnQuickFill.addEventListener('click', () => {
        const typedName = inputName.value.trim();
        // If user already entered their own name, warn them before replacing!
        if (typedName && !confirm(`⚠️ Warning: You have entered "${typedName}". Clicking this will replace it with a fake dummy profile. Do you want to continue?`)) {
            return;
        }
        const randomIndex = Math.floor(Math.random() * SAMPLE_ATTENDEES.length);
        loadSample(SAMPLE_ATTENDEES[randomIndex]);
    });

    if (btnDemoFill) {
        btnDemoFill.addEventListener('click', () => {
            loadSample(SAMPLE_ATTENDEES[1]); // Priya Sundaram sample
        });
    }

    btnReset.addEventListener('click', () => {
        inputName.value = '';
        inputRoll.value = '';
        inputCollege.value = '';
        inputRole.value = 'Hacker';
        badgeAvatarDisplay.innerHTML = '👨‍💻';
        currentPassId = 'HN26-DEMO';
        badgePassId.textContent = currentPassId;
        updateBadge();
        showToast('Form cleared. Start typing your details!', '✨');
    });

    // Print / Save PDF Handler
    if (btnPrintPass) {
        btnPrintPass.addEventListener('click', () => {
            showToast('Preparing clean print layout for badge...', '🖨️');
            setTimeout(() => window.print(), 300);
        });
    }

    // Gate Scan Simulation Triggers (with electronic beep sound & laser)
    if (btnVerifyDemo) {
        btnVerifyDemo.addEventListener('click', () => {
            const verifySection = document.getElementById('verify');
            if (verifySection) {
                verifySection.scrollIntoView({ behavior: 'smooth' });
            }
            triggerGateScan();
        });
    }

    if (btnTerminalTrigger) {
        btnTerminalTrigger.addEventListener('click', () => {
            triggerGateScan();
        });
    }

    // ==========================================================================
    // Holographic Card 3D Tilt Effect on Mouse Move
    // ==========================================================================

    const badgeContainer = document.querySelector('.lanyard-container');
    if (badgeContainer) {
        badgeContainer.addEventListener('mousemove', (e) => {
            const rect = badgeElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -7;
            const rotateY = ((x - centerX) / centerX) * 7;

            badgeElement.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        badgeContainer.addEventListener('mouseleave', () => {
            badgeElement.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
        });
    }

    // --- Check URL Params (e.g. ?track=Cybersecurity) ---
    const urlParams = new URLSearchParams(window.location.search);
    const trackParam = urlParams.get('track');
    if (trackParam) {
        trackChips.forEach(chip => {
            if (chip.dataset.track.toLowerCase() === trackParam.toLowerCase()) {
                trackChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                selectedTrackInput.value = chip.dataset.track;
                badgeElement.setAttribute('data-theme', chip.dataset.color || 'purple');
            }
        });
    }

    // --- Initial Render ---
    badgePassId.textContent = currentPassId;
    updateBadge();
});
