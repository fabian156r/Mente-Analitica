// Base de datos de preguntas
const questions = [
    {
        q: "1. Tener una mente analítica es:",
        options: [
            "Hacer las cosas rápido sin pensar",
            "Pensar antes de actuar",
            "Saber muchas matemáticas"
        ],
        correct: 1
    },
    {
        q: "2. ¿Cuál es el primer paso para resolver un problema?",
        options: [
            "Decir cuál es el problema",
            "Cambiar todo de una vez",
            "Buscar a quién culpar"
        ],
        correct: 0
    },
    {
        q: "3. Si buscas una solución sin juntar datos, la solución es:",
        options: [
            "Siempre correcta",
            "Más rápida y segura",
            "Una adivinanza"
        ],
        correct: 2
    },
    {
        q: "4. ¿Qué pregunta le debes hacer a un número antes de creerle?",
        options: [
            "¿De qué color está escrito?",
            "¿Contra qué lo comparo?",
            "¿Quién lo escribió?"
        ],
        correct: 1
    },
    {
        q: "5. 10 milímetros (mm) son igual a:",
        options: [
            "1 metro",
            "10 centímetros",
            "1 centímetro"
        ],
        correct: 2
    },
    {
        q: "6. De cada 100 micas, 5 salen mal. ¿Qué porcentaje es?",
        options: [
            "5%",
            "50%",
            "95%"
        ],
        correct: 0
    },
    {
        q: "7. La meta del día era 1,000 piezas y se hicieron 700. ¿Cómo vamos?",
        options: [
            "Arriba de la meta por 300",
            "Abajo de la meta por 300",
            "Justo en la meta"
        ],
        correct: 1
    },
    {
        q: "8. En una gráfica de scrap por día, la barra más alta muestra:",
        options: [
            "El día con más scrap",
            "El día con menos scrap",
            "El día que no se trabajó"
        ],
        correct: 0
    },
    {
        q: "9. Si el scrap sube todos los lunes, eso es:",
        options: [
            "Una casualidad",
            "Un error de la gráfica",
            "Un patrón que hay que revisar"
        ],
        correct: 2
    },
    {
        q: "10. Si ves algo fuera de lo normal en tu turno, ¿qué haces?",
        options: [
            "Esperas a que alguien más lo vea",
            "Le avisas a tu jefe inmediato",
            "No dices nada"
        ],
        correct: 1
    }
];

// Variables
let currentQuestionIndex = 0;
let score = 0;
let mainTimerInterval;
let readTimerInterval;
let timeLeft = 40;
let readTimeLeft = 5;
let participantName = "";
let examDate = "";
let userResults = [];

// Referencias del DOM
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const timerDisplay = document.getElementById('timer-display');
const questionCounter = document.getElementById('question-counter');
const feedbackMessage = document.getElementById('feedback-message');
const readingMessage = document.getElementById('reading-message');
const downloadPdfBtn = document.getElementById('download-pdf-btn');
const restartBtn = document.getElementById('restart-btn');
const nameInput = document.getElementById('username');
const dateInput = document.getElementById('exam-date');
const progressFill = document.getElementById('progress-fill');
const timerText = document.getElementById('timer-text');
const scoreRing = document.getElementById('score-ring');
const scoreRingText = document.getElementById('score-ring-text');
const resultEmoji = document.getElementById('result-emoji');

// Por defecto la fecha es hoy, pero el participante puede cambiarla
dateInput.value = new Date().toISOString().slice(0, 10);

function formatoFechaLegible(iso) {
    if (!iso) return '—';
    const partes = iso.split('-');
    if (partes.length !== 3) return iso;
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${partes[2]} ${meses[parseInt(partes[1], 10) - 1]} ${partes[0]}`;
}

// DOCUMENTACIÓN: Configuración de Contexto de Audio para generar sonidos sin archivos externos
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
}

// Función para reproducir sonidos
function playSound(type) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'correct') {
        // Sonido de Acierto (Campanilla alta)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // Nota C5
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // Sube a E5
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
    } else {
        // Sonido de Error (Zumbido bajo)
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime); // Nota baja
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.4);
    }
}

// Iniciar Examen
startBtn.addEventListener('click', () => {
    participantName = nameInput.value.trim();
    if (!participantName) {
        alert("Por favor, ingresa tu nombre para comenzar.");
        return;
    }
    examDate = dateInput.value || new Date().toISOString().slice(0, 10);
    initAudio(); // Inicializamos el audio con la interacción del usuario
    startScreen.classList.remove('active');
    quizScreen.classList.add('active');
    startQuestionCycle();
});

// DOCUMENTACIÓN: Esta función maneja el ciclo de la pregunta: primero 5 segundos de lectura, luego muestra opciones.
function startQuestionCycle() {
    const currentQ = questions[currentQuestionIndex];
    questionText.textContent = currentQ.q;
    questionCounter.textContent = `Pregunta ${currentQuestionIndex + 1} de ${questions.length}`;
    progressFill.style.width = `${(currentQuestionIndex / questions.length) * 100}%`;

    // Ocultar opciones y feedback al inicio
    optionsContainer.innerHTML = '';
    optionsContainer.classList.add('hidden');
    feedbackMessage.classList.add('hidden');
    readingMessage.classList.remove('hidden');

    // Configurar temporizador de lectura (anillo circular)
    readTimeLeft = 5;
    timerDisplay.className = 'timer-ring reading-mode';
    timerDisplay.style.setProperty('--progress', 100);
    timerText.textContent = readTimeLeft;

    clearInterval(mainTimerInterval);
    clearInterval(readTimerInterval);

    // Iniciar cuenta regresiva de lectura
    readTimerInterval = setInterval(() => {
        readTimeLeft--;
        timerText.textContent = readTimeLeft;
        timerDisplay.style.setProperty('--progress', (readTimeLeft / 5) * 100);

        if (readTimeLeft <= 0) {
            clearInterval(readTimerInterval);
            showOptionsAndStartTimer(currentQ);
        }
    }, 1000);
}

// Muestra las opciones y arranca el temporizador de 40s
function showOptionsAndStartTimer(currentQ) {
    readingMessage.classList.add('hidden');
    optionsContainer.classList.remove('hidden');
    
    // Crear botones
    const letters = ['A', 'B', 'C', 'D'];
    currentQ.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.innerHTML = `<span class="option-letter">${letters[index]}</span><span class="option-text">${option}</span>`;
        button.classList.add('option-btn');
        button.addEventListener('click', () => handleAnswer(index, button));
        optionsContainer.appendChild(button);
    });

    // Iniciar temporizador principal de 40s (anillo circular)
    timeLeft = 40;
    timerDisplay.className = 'timer-ring answering-mode';
    timerDisplay.style.setProperty('--progress', 100);
    timerText.textContent = timeLeft;

    mainTimerInterval = setInterval(() => {
        timeLeft--;
        timerText.textContent = timeLeft;
        timerDisplay.style.setProperty('--progress', (timeLeft / 40) * 100);
        timerDisplay.classList.toggle('urgent', timeLeft <= 10 && timeLeft > 0);

        if (timeLeft <= 0) {
            clearInterval(mainTimerInterval);
            handleAnswer(-1, null); // Tiempo agotado
        }
    }, 1000);
}

// Manejar la respuesta
function handleAnswer(selectedIndex, selectedButton) {
    clearInterval(mainTimerInterval); // Detener reloj
    const currentQ = questions[currentQuestionIndex];
    const isCorrect = selectedIndex === currentQ.correct;
    
    // Bloquear botones
    const allButtons = optionsContainer.querySelectorAll('.option-btn');
    allButtons.forEach(btn => btn.disabled = true);

    userResults.push({
        pregunta: currentQ.q,
        respuestaUsuario: selectedIndex >= 0 ? currentQ.options[selectedIndex] : "Tiempo Agotado",
        respuestaCorrecta: currentQ.options[currentQ.correct],
        esCorrecto: isCorrect
    });

    feedbackMessage.classList.remove('hidden');
    feedbackMessage.className = 'feedback'; // Resetear clases

    if (isCorrect) {
        playSound('correct'); // Reproducir sonido acierto
        if(selectedButton) selectedButton.classList.add('correct-answer'); // Dispara "wobble"
        
        feedbackMessage.textContent = "¡Correcto!";
        feedbackMessage.classList.add('success');
        score++;
        
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#2ecc71', '#3498db', '#f1c40f', '#e74c3c']
        });

    } else {
        playSound('incorrect'); // Reproducir sonido error
        if(selectedButton) selectedButton.classList.add('wrong-answer'); // Dispara "shake"
        
        // Resaltar la correcta
        allButtons[currentQ.correct].classList.add('correct-answer');
        
        feedbackMessage.textContent = "Incorrecto. La respuesta correcta era: " + currentQ.options[currentQ.correct];
        feedbackMessage.classList.add('error');
    }

    // Pasar a la siguiente pregunta después de 4 segundos
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            startQuestionCycle(); // Volver al ciclo de lectura
        } else {
            showResults();
        }
    }, 4000);
}

// Mostrar Resultados
function showResults() {
    progressFill.style.width = '100%';
    quizScreen.classList.remove('active');
    resultScreen.classList.add('active');
    document.getElementById('final-score-text').textContent =
        `${participantName}, tu puntuación final es: ${score} de ${questions.length}`;

    const percentage = (score / questions.length) * 100;
    scoreRingText.textContent = `${score}/${questions.length}`;
    // Pequeño delay para que la transición del anillo se aprecie al entrar a la pantalla
    setTimeout(() => scoreRing.style.setProperty('--progress', percentage), 100);

    if (percentage >= 80) {
        resultEmoji.textContent = '🏆';
    } else if (percentage >= 50) {
        resultEmoji.textContent = '👍';
    } else {
        resultEmoji.textContent = '💪';
    }
}

// DOCUMENTACIÓN: Genera un PDF con formato tipo "reporte profesional" (logo de la empresa
// como membrete, tarjeta de resumen con insignia de puntuación y tarjetas de color por pregunta).
// El logo se usa desde LOGO_DATA_URL (definido en logo-data.js) en vez de descargarlo con
// fetch(), ya que los navegadores bloquean esas peticiones cuando la página se abre
// directamente con file:// (doble clic en el archivo, sin servidor).
downloadPdfBtn.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    const headerHeight = 34;

    const palette = {
        primaryDark: [67, 56, 202],
        dark: [30, 27, 75],
        muted: [107, 114, 128],
        success: [22, 163, 74],
        successBg: [220, 252, 231],
        warning: [180, 83, 9],
        warningBg: [254, 243, 199],
        danger: [220, 38, 38],
        dangerText: [153, 27, 27],
        dangerBg: [254, 226, 226],
        lightGray: [243, 244, 246],
        white: [255, 255, 255]
    };

    const percentage = Math.round((score / questions.length) * 100);
    const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    const logo = (typeof LOGO_DATA_URL !== 'undefined')
        ? { dataUrl: LOGO_DATA_URL, width: LOGO_WIDTH, height: LOGO_HEIGHT }
        : null; // Si logo-data.js no cargó, el reporte sigue sin membrete

    doc.setProperties({
        title: `Resultados - ${participantName}`,
        subject: 'Examen de Mente Analítica',
        author: participantName
    });

    function drawHeader() {
        doc.setFillColor(...palette.primaryDark);
        doc.rect(0, 0, pageWidth, headerHeight, 'F');
        doc.setTextColor(...palette.white);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('Reporte de Resultados', margin, 15);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.text('Examen de Mente Analítica', margin, 23);

        if (logo) {
            const boxW = 34, boxH = 15, pad = 2;
            const boxX = pageWidth - margin - boxW, boxY = 5;
            doc.setFillColor(...palette.white);
            doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'F');

            const availW = boxW - pad * 2, availH = boxH - pad * 2;
            const ratio = logo.width / logo.height;
            let imgW = availW, imgH = imgW / ratio;
            if (imgH > availH) { imgH = availH; imgW = imgH * ratio; }
            const imgX = boxX + (boxW - imgW) / 2;
            const imgY = boxY + (boxH - imgH) / 2;
            doc.addImage(logo.dataUrl, 'JPEG', imgX, imgY, imgW, imgH);

            doc.setFontSize(8);
            doc.setTextColor(...palette.white);
            doc.text(today, boxX + boxW, boxY + boxH + 5, { align: 'right' });
        } else {
            doc.setFontSize(9);
            doc.text(today, pageWidth - margin, 16, { align: 'right' });
        }
    }

    function drawFooter(pageIndex, totalPages) {
        doc.setDrawColor(...palette.lightGray);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...palette.muted);
        doc.text('Examen de Mente Analítica', margin, pageHeight - 9);
        doc.text(`Página ${pageIndex} de ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
    }

    // --- Página 1: encabezado + tarjeta de resumen ---
    drawHeader();
    let yPos = headerHeight + 12;

    doc.setFillColor(...palette.lightGray);
    doc.roundedRect(margin, yPos, contentWidth, 26, 3, 3, 'F');

    doc.setTextColor(...palette.dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.text(participantName, margin + 6, yPos + 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...palette.muted);
    doc.text(`Participante · Fecha del examen: ${formatoFechaLegible(examDate)}`, margin + 6, yPos + 18);

    const tone = percentage >= 70 ? 'success' : (percentage >= 50 ? 'warning' : 'danger');
    const badgeColor = palette[tone];
    const badgeBg = palette[`${tone}Bg`];
    const badgeW = 48;
    const badgeX = margin + contentWidth - 6 - badgeW;

    doc.setFillColor(...badgeBg);
    doc.roundedRect(badgeX, yPos + 4, badgeW, 18, 3, 3, 'F');
    doc.setTextColor(...badgeColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${score} / ${questions.length}`, badgeX + badgeW / 2, yPos + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`${percentage}% de aciertos`, badgeX + badgeW / 2, yPos + 18, { align: 'center' });

    yPos += 36;

    doc.setTextColor(...palette.dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Detalle de Respuestas', margin, yPos);
    yPos += 3;
    doc.setDrawColor(...palette.primaryDark);
    doc.setLineWidth(0.6);
    doc.line(margin, yPos, margin + 34, yPos);
    yPos += 9;

    // --- Tarjetas por pregunta ---
    const textPadding = 7;
    const qWrapWidth = contentWidth - 14 - 32; // deja espacio para la insignia de estado
    const answerWrapWidth = contentWidth - 14;

    userResults.forEach((result) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        const qLines = doc.splitTextToSize(result.pregunta, qWrapWidth);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        const ansLines = doc.splitTextToSize(`Tu respuesta: ${result.respuestaUsuario}`, answerWrapWidth);
        const corrLines = result.esCorrecto
            ? []
            : doc.splitTextToSize(`Respuesta correcta: ${result.respuestaCorrecta}`, answerWrapWidth);

        const boxHeight = 8 + qLines.length * 5.2 + ansLines.length * 5 + corrLines.length * 5 + 5;

        if (yPos + boxHeight > pageHeight - 20) {
            doc.addPage();
            drawHeader();
            yPos = headerHeight + 12;
        }

        const boxBg = result.esCorrecto ? palette.successBg : palette.dangerBg;
        const accent = result.esCorrecto ? palette.success : palette.danger;

        doc.setFillColor(...boxBg);
        doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2.5, 2.5, 'F');
        doc.setFillColor(...accent);
        doc.rect(margin, yPos + 1.2, 2.2, boxHeight - 2.4, 'F');

        const statusText = result.esCorrecto ? 'CORRECTO' : 'INCORRECTO';
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        const pillW = doc.getTextWidth(statusText) + 6;
        const pillX = margin + contentWidth - pillW - 4;
        doc.setFillColor(...accent);
        doc.roundedRect(pillX, yPos + 4, pillW, 6, 2, 2, 'F');
        doc.setTextColor(...palette.white);
        doc.text(statusText, pillX + pillW / 2, yPos + 8, { align: 'center' });

        let innerY = yPos + 8;
        doc.setTextColor(...palette.dark);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text(qLines, margin + textPadding, innerY);
        innerY += qLines.length * 5.2 + 1.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(...palette.dark);
        doc.text(ansLines, margin + textPadding, innerY);
        innerY += ansLines.length * 5;

        if (corrLines.length) {
            doc.setTextColor(...palette.dangerText);
            doc.text(corrLines, margin + textPadding, innerY);
        }

        yPos += boxHeight + 6;
    });

    // --- Pie de página en todas las páginas, con numeración total ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(i, totalPages);
    }

    doc.save(`Resultados_MenteAnalitica_${participantName.replace(/\s+/g, '_')}.pdf`);
});

// Reiniciar
restartBtn.addEventListener('click', () => {
    currentQuestionIndex = 0;
    score = 0;
    userResults = [];
    nameInput.value = '';
    dateInput.value = new Date().toISOString().slice(0, 10);
    progressFill.style.width = '0%';
    scoreRing.style.setProperty('--progress', 0);
    resultScreen.classList.remove('active');
    startScreen.classList.add('active');
});