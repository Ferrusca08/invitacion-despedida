/**
 * Invitación Virtual Claudia & Miguel
 * Lógica Javascript para Cuenta Regresiva, Personalización de Invitación y RSVP
 */

// CONFIGURACIÓN
// Pega aquí la URL de tu Google Apps Script Web App una vez desplegado.
// Si está vacío, el formulario simulará el envío localmente con fines de prueba.
const GOOGLE_SHEET_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw40qfxg8_xrGnsm27j9HqM7xuDkd1PPYEN68XQ-YnrJzFdJbAviTtJVs-Yuj5BIRQc/exec";

document.addEventListener("DOMContentLoaded", () => {
    // Inicializar funciones
    initCountdown();
    initPersonalization();
    initAudioPlayer();
    initRSVPForm();
    initScrollAnimations();
});

/* ==========================================================================
   1. CUENTA REGRESIVA (COUNTDOWN)
   ========================================================================== */
function initCountdown() {
    // Fecha del evento: 11 de Julio de 2026, 16:00:00 (4:00 PM)
    const eventDate = new Date("July 11, 2026 16:00:00").getTime();

    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");
    const countdownEl = document.getElementById("countdown");

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    const updateCountdown = () => {
        const now = new Date().getTime();
        const difference = eventDate - now;

        // Si la fecha ya pasó
        if (difference < 0) {
            clearInterval(timerInterval);
            if (countdownEl) {
                countdownEl.innerHTML = "<div class='countdown-finished'>¡El gran día ha llegado!</div>";
            }
            return;
        }

        // Cálculos de tiempo
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        // Renderizado con ceros a la izquierda
        daysEl.textContent = String(days).padStart(2, "0");
        hoursEl.textContent = String(hours).padStart(2, "0");
        minutesEl.textContent = String(minutes).padStart(2, "0");
        secondsEl.textContent = String(seconds).padStart(2, "0");
    };

    // Ejecutar una vez al inicio y luego cada segundo
    updateCountdown();
    const timerInterval = setInterval(updateCountdown, 1000);
}

/* ==========================================================================
   2. PERSONALIZACIÓN POR PARÁMETROS DE URL
   ========================================================================== */
function initPersonalization() {
    const inputGuestId = document.getElementById("inputGuestId");

    // Generar un ID de confirmación único para cada sesión para evitar que confirmaciones de personas
    // distintas se sobrescriban entre sí en Google Sheets.
    if (inputGuestId) {
        inputGuestId.value = "RSVP_" + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
}

/* ==========================================================================
   3. REPRODUCTOR DE MÚSICA CON INTERACCIÓN
   ========================================================================== */
function initAudioPlayer() {
    const audio = document.getElementById("bgMusic");
    const toggleButton = document.getElementById("musicToggleButton");
    const iconMusicOn = document.getElementById("iconMusicOn");
    const iconMusicOff = document.getElementById("iconMusicOff");

    if (!audio || !toggleButton) return;

    let isPlaying = false;

    const playAudio = async () => {
        try {
            await audio.play();
            isPlaying = true;
            iconMusicOn.classList.remove("hidden");
            iconMusicOff.classList.add("hidden");
            toggleButton.classList.add("pulse-animation");
        } catch (error) {
            console.log("La reproducción automática fue bloqueada por el navegador. Requiere interacción del usuario.");
        }
    };

    const pauseAudio = () => {
        audio.pause();
        isPlaying = false;
        iconMusicOn.classList.add("hidden");
        iconMusicOff.classList.remove("hidden");
        toggleButton.classList.remove("pulse-animation");
    };

    // Toggle al hacer click en el botón flotante
    toggleButton.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    });

    // Intentar reproducir música en la primera interacción real del usuario con la página
    const playOnFirstInteraction = () => {
        if (!isPlaying) {
            playAudio();
        }
        // Quitar los listeners una vez activado
        document.removeEventListener("click", playOnFirstInteraction);
        document.removeEventListener("touchstart", playOnFirstInteraction);
    };

    document.addEventListener("click", playOnFirstInteraction);
    document.addEventListener("touchstart", playOnFirstInteraction);
}

/* ==========================================================================
   4. FORMULARIO RSVP CON CONEXIÓN A GOOGLE SHEETS
   ========================================================================== */
function initRSVPForm() {
    const rsvpForm = document.getElementById("rsvpForm");
    const rsvpFeedbackMessage = document.getElementById("rsvpFeedbackMessage");
    const feedbackTitle = document.getElementById("feedbackTitle");
    const feedbackText = document.getElementById("feedbackText");
    const feedbackIconContainer = document.getElementById("feedbackIconContainer");
    const btnSubmit = document.getElementById("btnSubmitRSVP");
    const btnSubmitText = document.getElementById("btnSubmitText");
    const btnSubmitSpinner = document.getElementById("btnSubmitSpinner");
    const btnBackToForm = document.getElementById("btnBackToForm");

    // Elementos condicionales
    const attendanceInputs = document.querySelectorAll('input[name="attendance"]');
    const companionsCountGroup = document.getElementById("companionsCountGroup");
    const selectCompanionsCount = document.getElementById("selectCompanionsCount");
    const companionsNamesGroup = document.getElementById("companionsNamesGroup");
    const inputCompanionsNames = document.getElementById("inputCompanionsNames");

    if (!rsvpForm) return;

    // Función para actualizar visibilidad de los campos de acompañantes
    const updateCompanionsVisibility = () => {
        const selectedAttendance = document.querySelector('input[name="attendance"]:checked');
        const attendance = selectedAttendance ? selectedAttendance.value : "";

        if (attendance === "Confirmado") {
            companionsCountGroup.style.display = "flex";

            // Verificar cuántos acompañantes seleccionó
            const count = parseInt(selectCompanionsCount.value || 0, 10);
            if (count > 0) {
                companionsNamesGroup.style.display = "flex";
                inputCompanionsNames.required = true;
            } else {
                companionsNamesGroup.style.display = "none";
                inputCompanionsNames.required = false;
            }
        } else {
            companionsCountGroup.style.display = "none";
            companionsNamesGroup.style.display = "none";
            inputCompanionsNames.required = false;
        }
    };

    // Escuchar cambios en la asistencia ("Sí" / "No")
    attendanceInputs.forEach(input => {
        input.addEventListener("change", updateCompanionsVisibility);
    });

    // Escuchar cambios en la cantidad de acompañantes
    if (selectCompanionsCount) {
        selectCompanionsCount.addEventListener("change", updateCompanionsVisibility);
    }

    // Envío del Formulario
    rsvpForm.addEventListener("submit", (e) => {
        e.preventDefault();

        // Bloquear UI y mostrar spinner
        btnSubmit.disabled = true;
        btnSubmitText.classList.add("hidden");
        btnSubmitSpinner.classList.remove("hidden");

        // Construir datos del formulario
        const formData = new FormData(rsvpForm);
        const attendance = formData.get("attendance");
        const guestId = formData.get("guestId");
        const guestName = formData.get("guestNameRaw");
        const message = formData.get("message") || "";

        const companionsCount = attendance === "Declinado" ? 0 : parseInt(formData.get("companionsCount") || 0, 10);
        const companionsNames = companionsCount > 0 ? (formData.get("companionsNames") || "") : "";

        // Pases confirmados totales (invitado principal + acompañantes)
        const confirmPasses = attendance === "Declinado" ? 0 : (1 + companionsCount);

        // Integrar información de acompañantes al mensaje para máxima compatibilidad con hojas de cálculo existentes
        let finalMessage = message;
        if (companionsCount > 0) {
            const compText = `[Acompañantes (${companionsCount}): ${companionsNames}]`;
            finalMessage = finalMessage ? `${finalMessage}\n${compText}` : compText;
        }

        const dataToSend = {
            id: guestId,
            nombre: guestName,
            asistencia: attendance,
            pasesConfirmados: confirmPasses,
            acompanantesCount: companionsCount,
            acompanantesNombres: companionsNames,
            mensaje: finalMessage,
            timestamp: new Date().toISOString()
        };

        // Si la URL de Google Sheets no está configurada, simular envío local
        if (!GOOGLE_SHEET_SCRIPT_URL) {
            console.log("Simulando envío a Google Sheets (URL vacía):", dataToSend);
            setTimeout(() => {
                showSuccessFeedback(attendance, confirmPasses, companionsCount, companionsNames);
            }, 1500);
            return;
        }

        // Envío real a Google Sheets (mediante Google Apps Script API)
        fetch(GOOGLE_SHEET_SCRIPT_URL, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(dataToSend)
        })
            .then(response => {
                if (response.ok || response.status === 0) { // status 0 es para no-cors
                    showSuccessFeedback(attendance, confirmPasses, companionsCount, companionsNames);
                } else {
                    throw new Error("Respuesta de red no válida");
                }
            })
            .catch(error => {
                console.error("Error al enviar RSVP:", error);
                showErrorFeedback();
            });
    });

    // Mostrar feedback de éxito
    const showSuccessFeedback = (attendance, pases, companionsCount, companionsNames) => {
        // Restaurar estado de botón de envío
        btnSubmit.disabled = false;
        btnSubmitText.classList.remove("hidden");
        btnSubmitSpinner.classList.add("hidden");

        // Ocultar formulario y mostrar panel de respuesta
        rsvpForm.classList.add("hidden");
        rsvpFeedbackMessage.classList.remove("hidden");

        // Adaptar textos según confirmación
        if (attendance === "Confirmado") {
            feedbackIconContainer.innerHTML = `
                <svg class="feedback-icon-success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            `;
            feedbackIconContainer.style.color = "var(--color-success)";
            feedbackIconContainer.style.backgroundColor = "rgba(110, 140, 117, 0.1)";
            feedbackTitle.textContent = "¡Muchas Gracias!";

            let msg = "Hemos registrado tu asistencia.";
            if (companionsCount > 0) {
                msg = `Hemos registrado tu asistencia y la de tus ${companionsCount} acompañante(s) (${companionsNames}).`;
            }
            feedbackText.textContent = msg + " Nos dará un gusto enorme compartir este día contigo.";
        } else {
            feedbackIconContainer.innerHTML = `
                <svg class="feedback-icon-decline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
            `;
            feedbackIconContainer.style.color = "var(--color-muted)";
            feedbackIconContainer.style.backgroundColor = "rgba(125, 114, 110, 0.1)";
            feedbackTitle.textContent = "Te extrañaremos";
            feedbackText.textContent = "Lamentamos que no puedas acompañarnos en esta comida, pero agradecemos mucho que nos lo hayas confirmado.";
        }
    };

    // Mostrar feedback de error
    const showErrorFeedback = () => {
        btnSubmit.disabled = false;
        btnSubmitText.classList.remove("hidden");
        btnSubmitSpinner.classList.add("hidden");

        rsvpForm.classList.add("hidden");
        rsvpFeedbackMessage.classList.remove("hidden");

        feedbackIconContainer.innerHTML = `
            <svg class="feedback-icon-error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        `;
        feedbackIconContainer.style.color = "var(--color-danger)";
        feedbackIconContainer.style.backgroundColor = "rgba(179, 89, 89, 0.1)";
        feedbackTitle.textContent = "Algo salió mal";
        feedbackText.textContent = "No pudimos registrar tu confirmación en este momento. Por favor, inténtalo de nuevo o contáctanos directamente.";
    };

    // Volver a mostrar el formulario (para corregir o actualizar la respuesta)
    if (btnBackToForm) {
        btnBackToForm.addEventListener("click", () => {
            rsvpFeedbackMessage.classList.add("hidden");
            rsvpForm.classList.remove("hidden");
        });
    }
}

/* ==========================================================================
   5. EFECTO ANIMACIÓN SCROLL SUAVE Y ENTRADAS (REVELACIÓN)
   ========================================================================== */
function initScrollAnimations() {
    // Añadimos clases de revelado a los elementos mediante IntersectionObserver
    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.15
    };

    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("revealed");
                // Una vez revelado, ya no es necesario observarlo
                observer.unobserve(entry.target);
            }
        });
    };

    const observer = new IntersectionObserver(revealCallback, observerOptions);

    // Seleccionamos elementos a animar al hacer scroll
    const itemsToAnimate = document.querySelectorAll(".welcome-card, .gallery-item, .details-card, .rsvp-card");

    // Preparar CSS dinámico para transiciones de revelado
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
        .welcome-card, .gallery-item, .details-card, .rsvp-card {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .welcome-card.revealed, .gallery-item.revealed, .details-card.revealed, .rsvp-card.revealed {
            opacity: 1;
            transform: translateY(0);
        }
        /* Retardos para la cuadrícula y las tarjetas */
        .gallery-item:nth-child(1) { transition-delay: 0.1s; }
        .gallery-item:nth-child(2) { transition-delay: 0.2s; }
        .gallery-item:nth-child(3) { transition-delay: 0.3s; }
        .gallery-item:nth-child(4) { transition-delay: 0.4s; }
        .details-card:nth-child(1) { transition-delay: 0.1s; }
        .details-card:nth-child(2) { transition-delay: 0.3s; }
        
        /* Animación de pulso para el botón flotante de música */
        .pulse-animation {
            animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-ring {
            0%, 100% {
                box-shadow: 0 0 0 0 rgba(184, 124, 103, 0.4);
            }
            50% {
                box-shadow: 0 0 0 10px rgba(184, 124, 103, 0);
            }
        }
    `;
    document.head.appendChild(styleEl);

    itemsToAnimate.forEach(item => {
        observer.observe(item);
    });
}
