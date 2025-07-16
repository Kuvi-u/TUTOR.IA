// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const voiceButton = document.getElementById('voice-button');
    const voiceStatus = document.getElementById('voice-status');
    const typingIndicator = document.getElementById('typing-indicator');
    const themeSwitch = document.getElementById('theme-switch');
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('nav ul');
    const subjectButtons = document.querySelectorAll('.subject-button');
    const controlPanel = document.getElementById('ai-control-panel');
    const controlPanelToggle = document.getElementById('control-panel-toggle');
    const speedRange = document.getElementById('voice-speed');
    const pitchRange = document.getElementById('voice-pitch');
    const vocabularySelect = document.getElementById('vocabulary-level');
    const saveSettingsBtn = document.getElementById('save-settings');

    // Variables para reconocimiento y síntesis de voz
    let recognition;
    let speechSynthesis = window.speechSynthesis;
    let isSpeaking = false;
    let isListening = false;

    // Configuración de la IA (con valores predeterminados)
    let aiSettings = {
        voiceSpeed: 1.3, // Velocidad más rápida por defecto (era 1.0)
        voicePitch: 1.0,
        vocabularyLevel: 'advanced' // básico, intermedio, avanzado
    };

    // Cargar configuración guardada
    const loadSettings = () => {
        const savedSettings = localStorage.getItem('aiSettings');
        if (savedSettings) {
            aiSettings = JSON.parse(savedSettings);
            
            // Actualizar controles del panel
            if (speedRange) speedRange.value = aiSettings.voiceSpeed;
            if (pitchRange) pitchRange.value = aiSettings.voicePitch;
            if (vocabularySelect) vocabularySelect.value = aiSettings.vocabularyLevel;
        }
    };

    // Guardar configuración
    const saveSettings = () => {
        aiSettings.voiceSpeed = parseFloat(speedRange.value);
        aiSettings.voicePitch = parseFloat(pitchRange.value);
        aiSettings.vocabularyLevel = vocabularySelect.value;
        
        localStorage.setItem('aiSettings', JSON.stringify(aiSettings));
        
        // Mostrar mensaje de confirmación
        const notification = document.createElement('div');
        notification.classList.add('settings-notification');
        notification.textContent = 'Configuración guardada';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 2000);
        }, 100);
        
        // Cerrar panel después de guardar
        toggleControlPanel();
    };

    // Verificar si el navegador soporta Web Speech API
    const checkSpeechSupport = () => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            // Inicializar reconocimiento de voz
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.lang = 'es-ES'; // Idioma español
            recognition.continuous = false;
            recognition.interimResults = false;

            // Evento cuando se detecta voz
            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                userInput.value = transcript;
                sendMessage();
            };

            // Evento cuando termina el reconocimiento
            recognition.onend = function() {
                voiceButton.classList.remove('listening');
                voiceStatus.classList.remove('active');
                isListening = false;
            };

            // Evento en caso de error
            recognition.onerror = function(event) {
                console.error('Error en reconocimiento de voz:', event.error);
                voiceButton.classList.remove('listening');
                voiceStatus.classList.remove('active');
                isListening = false;
            };

            return true;
        } else {
            console.warn('Este navegador no soporta reconocimiento de voz');
            voiceButton.style.display = 'none';
            return false;
        }
    };

    // Función para iniciar/detener reconocimiento de voz
    const toggleVoiceRecognition = () => {
        if (!recognition) return;

        if (isListening) {
            recognition.stop();
            isListening = false;
            voiceButton.classList.remove('listening');
            voiceStatus.classList.remove('active');
        } else {
            recognition.start();
            isListening = true;
            voiceButton.classList.add('listening');
            voiceStatus.classList.add('active');
        }
    };

    // Función para hablar texto (síntesis de voz)
    const speakText = (text) => {
        if (speechSynthesis) {
            // Detener cualquier síntesis en curso
            if (isSpeaking) {
                speechSynthesis.cancel();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES'; // Idioma español
            utterance.rate = aiSettings.voiceSpeed; // Velocidad configurada
            utterance.pitch = aiSettings.voicePitch; // Tono configurado

            // Evento cuando comienza a hablar
            utterance.onstart = function() {
                isSpeaking = true;
            };

            // Evento cuando termina de hablar
            utterance.onend = function() {
                isSpeaking = false;
            };

            // Evento en caso de error
            utterance.onerror = function(event) {
                console.error('Error en síntesis de voz:', event.error);
                isSpeaking = false;
            };

            speechSynthesis.speak(utterance);
        }
    };

    // Función para agregar un mensaje al chat
    const addMessage = (text, isUser = false) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'ai-message');

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');

        const messageParagraph = document.createElement('p');
        messageParagraph.textContent = text;

        messageContent.appendChild(messageParagraph);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);

        // Desplazar al último mensaje
        chatMessages.scrollTop = chatMessages.scrollHeight;

        return messageDiv;
    };

    // Función para mostrar indicador de escritura
    const showTypingIndicator = () => {
        typingIndicator.classList.add('active');
    };

    // Función para ocultar indicador de escritura
    const hideTypingIndicator = () => {
        typingIndicator.classList.remove('active');
    };

    // Vocabulario ampliado para diferentes niveles
    const vocabularyLevels = {
        basic: {
            'hola': '¡Hola! ¿En qué puedo ayudarte hoy?',
            'idiomas': 'Puedo ayudarte con inglés, francés, alemán, español y otros idiomas. ¿Qué te gustaría aprender?',
            'matemáticas': 'Las matemáticas son fascinantes. Puedo ayudarte con álgebra, cálculo, geometría o estadística. ¿Qué tema te interesa?',
            'física': 'La física explica cómo funciona nuestro universo. ¿Necesitas ayuda con mecánica, termodinámica o electromagnetismo?',
            'química': 'La química estudia la materia y sus transformaciones. ¿Quieres aprender sobre química orgánica, inorgánica o analítica?',
            'gracias': 'De nada. Estoy aquí para ayudarte cuando lo necesites.',
            'adios': 'Hasta pronto. ¡Vuelve cuando quieras seguir aprendiendo!'
        },
        intermediate: {
            'hola': '¡Saludos! Soy tu asistente educativo personal. ¿Cómo puedo orientarte en tu aprendizaje hoy?',
            'idiomas': 'Los idiomas son ventanas a nuevas culturas y formas de pensar. Puedo ayudarte con inglés, francés, alemán, español y muchos más. ¿Qué aspecto lingüístico te interesa explorar?',
            'matemáticas': 'Las matemáticas nos permiten modelar y entender el mundo. Puedo guiarte en álgebra, cálculo diferencial e integral, geometría euclidiana y no euclidiana, o estadística inferencial. ¿Qué área deseas profundizar?',
            'física': 'La física nos revela los principios fundamentales del universo. ¿Te gustaría explorar la mecánica newtoniana, la termodinámica, el electromagnetismo de Maxwell o quizás la física moderna?',
            'química': 'La química es la ciencia que estudia la composición, estructura y propiedades de la materia. Podemos abordar química orgánica, inorgánica, analítica, física o bioquímica. ¿Qué rama te interesa más?',
            'gracias': 'Ha sido un placer ayudarte. Recuerda que estoy aquí para apoyar tu proceso de aprendizaje cuando lo necesites.',
            'adios': 'Hasta pronto. Espero que nuestro intercambio haya sido enriquecedor. ¡Te espero en nuestra próxima sesión de aprendizaje!'
        },
        advanced: {
            'hola': '¡Un cordial saludo! Como tu asistente educativo personalizado, estoy aquí para facilitar tu proceso de aprendizaje mediante una experiencia interactiva y adaptada a tus necesidades específicas. ¿En qué ámbito del conocimiento puedo asistirte hoy?',
            'idiomas': 'El aprendizaje de idiomas es una puerta hacia la diversidad cognitiva y cultural que enriquece nuestra perspectiva del mundo. Puedo ofrecerte asistencia en múltiples aspectos lingüísticos, desde fonética y morfosintaxis hasta pragmática y análisis del discurso, en idiomas como inglés, francés, alemán, español y muchos más. ¿Qué dimensión lingüística te gustaría explorar con mayor profundidad?',
            'matemáticas': 'Las matemáticas constituyen un lenguaje universal que nos permite modelar la realidad y desarrollar el pensamiento abstracto y lógico-deductivo. Puedo guiarte a través de los intrincados caminos del álgebra lineal y abstracta, el cálculo infinitesimal, la geometría diferencial, la teoría de números, el análisis funcional o la estadística multivariante. ¿Qué rama matemática deseas desentrañar?',
            'física': 'La física nos proporciona un marco conceptual para comprender los fenómenos naturales desde lo subatómico hasta lo cosmológico. Podemos adentrarnos en la mecánica clásica y cuántica, la relatividad especial y general, la termodinámica y física estadística, el electromagnetismo, la física de partículas o la astrofísica. ¿Qué aspecto del universo físico te intriga particularmente?',
            'química': 'La química, como ciencia central, nos permite entender y manipular la materia a nivel molecular, conectando la física fundamental con las ciencias biológicas. Podemos explorar la química orgánica y sus mecanismos de reacción, la química inorgánica y la teoría de coordinación, la química analítica instrumental, la química física y sus principios termodinámicos, o la bioquímica estructural y metabólica. ¿Qué área de la química despierta tu curiosidad científica?',
            'gracias': 'Ha sido un verdadero privilegio poder contribuir a tu proceso de aprendizaje. El intercambio de conocimiento es una experiencia enriquecedora bidireccional, y estoy a tu disposición para continuar este viaje educativo cuando lo consideres oportuno.',
            'adios': 'Me despido temporalmente, esperando que nuestro diálogo haya estimulado tu curiosidad intelectual y proporcionado claridad conceptual. Quedo a tu disposición para futuras sesiones donde podamos seguir explorando los fascinantes territorios del conocimiento. ¡Hasta nuestra próxima interacción!'
        }
    };

    // Función para simular respuesta de la IA con vocabulario ampliado
    const getAIResponse = (userMessage) => {
        // Seleccionar nivel de vocabulario según configuración
        const vocabulary = vocabularyLevels[aiSettings.vocabularyLevel];
        
        // Buscar coincidencias en el mensaje del usuario
        const lowerMessage = userMessage.toLowerCase();
        for (const keyword in vocabulary) {
            if (lowerMessage.includes(keyword)) {
                return vocabulary[keyword];
            }
        }

        // Respuestas predeterminadas según nivel de vocabulario
        if (aiSettings.vocabularyLevel === 'basic') {
            return 'Entiendo tu pregunta. Para darte una respuesta más precisa, ¿podrías proporcionar más detalles o especificar la materia sobre la que quieres aprender?';
        } else if (aiSettings.vocabularyLevel === 'intermediate') {
            return 'He captado el sentido de tu consulta, pero para ofrecerte una respuesta más completa y precisa, ¿podrías elaborar un poco más o indicar específicamente qué área de conocimiento te interesa explorar?';
        } else {
            return 'He procesado tu consulta y comprendo su naturaleza, sin embargo, para proporcionarte una respuesta óptima que satisfaga tus necesidades educativas específicas, sería beneficioso si pudieras detallar con mayor precisión el ámbito académico o la dimensión conceptual particular sobre la que deseas profundizar tu conocimiento.';
        }
    };

    // Función para enviar mensaje
    const sendMessage = () => {
        const message = userInput.value.trim();
        if (message === '') return;

        // Agregar mensaje del usuario al chat
        addMessage(message, true);
        userInput.value = '';

        // Mostrar indicador de escritura
        showTypingIndicator();

        // Simular tiempo de respuesta de la IA (entre 0.5 y 1.5 segundos - más rápido)
        setTimeout(() => {
            // Ocultar indicador de escritura
            hideTypingIndicator();

            // Obtener y mostrar respuesta de la IA
            const aiResponse = getAIResponse(message);
            const aiMessageDiv = addMessage(aiResponse, false);

            // Leer respuesta en voz alta
            speakText(aiResponse);
        }, Math.random() * 1000 + 500); // Tiempo de respuesta más rápido
    };

    // Función para cambiar entre tema claro y oscuro
    const toggleTheme = () => {
        if (themeSwitch.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    };

    // Función para mostrar/ocultar panel de control
    const toggleControlPanel = () => {
        controlPanel.classList.toggle('active');
        controlPanelToggle.classList.toggle('active');
    };

    // Función para manejar el menú en dispositivos móviles
    const toggleMenu = () => {
        navMenu.classList.toggle('active');
    };

    // Función para manejar clic en botones de materias
    const handleSubjectClick = (event) => {
        const subject = event.target.closest('.subject-card').querySelector('h3').textContent;
        userInput.value = `Quiero aprender sobre ${subject}`;
        sendMessage();
        
        // Desplazar al área de chat
        document.querySelector('.chat-container').scrollIntoView({ behavior: 'smooth' });
    };

    // Inicializar tema desde localStorage
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            themeSwitch.checked = true;
            document.body.setAttribute('data-theme', 'dark');
        }
    };

    // Verificar soporte de voz
    const speechSupported = checkSpeechSupport();
    
    // Cargar configuración guardada
    loadSettings();

    // Event Listeners
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        sendMessage();
    });

    voiceButton.addEventListener('click', toggleVoiceRecognition);

    themeSwitch.addEventListener('change', toggleTheme);

    menuToggle.addEventListener('click', toggleMenu);
    
    // Event listener para el panel de control
    if (controlPanelToggle) {
        controlPanelToggle.addEventListener('click', toggleControlPanel);
    }
    
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }

    // Agregar event listeners a los botones de materias
    subjectButtons.forEach(button => {
        button.addEventListener('click', handleSubjectClick);
    });

    // Inicializar tema
    initTheme();

    // Mensaje de bienvenida con voz después de 1 segundo
    setTimeout(() => {
        const welcomeMessage = document.querySelector('.ai-message .message-content p').textContent;
        if (speechSupported) {
            speakText(welcomeMessage);
        }
    }, 1000);
});

// Añadir al final del archivo, justo antes del cierre de DOMContentLoaded
// Actualizar valores mostrados en los controles deslizantes
if (speedRange) {
    const speedValue = document.getElementById('speed-value');
    speedRange.addEventListener('input', function() {
        speedValue.textContent = this.value;
    });
}

if (pitchRange) {
    const pitchValue = document.getElementById('pitch-value');
    pitchRange.addEventListener('input', function() {
        pitchValue.textContent = this.value;
    });
}

// Cerrar panel con botón de cierre
const closePanel = document.getElementById('close-panel');
if (closePanel) {
    closePanel.addEventListener('click', toggleControlPanel);
}