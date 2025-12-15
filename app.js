// Estado del juego
const gameState = {
    players: [],
    impostors: [],
    currentPlayerIndex: 0,
    currentRound: 1,
    totalRounds: 3,
    timeLeft: 300, // 5 minutos en segundos
    isTimerPaused: false,
    timerInterval: null,
    isGameActive: false,
    selectedCategories: [],
    currentWord: null,
    alivePlayers: [],
    votedPlayer: null
};

// Base de datos de palabras
let categoriesDB = {};

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    // Cargar categorías del archivo JSON
    await loadCategoriesFromFile();

    // Cargar categorías personalizadas del localStorage
    loadCustomCategories();
    
    // Inicializar categorías
    initCategories();
    
    // Actualizar botón de inicio
    updateStartButton();
});

async function loadCategoriesFromFile() {
    try {
        const response = await fetch('data/categories.json');
        if (response.ok) {
            const data = await response.json();
            Object.assign(categoriesDB, data);
        } else {
            console.error('Error al cargar categories.json');
            // Fallback si falla la carga
            addDefaultCategories();
        }
    } catch (error) {
        console.error('Error de red al cargar categories.json', error);
        addDefaultCategories();
    }
}

function addDefaultCategories() {
    // Categorías por defecto si falla la carga del JSON
    const defaults = {
        "Películas": [
            { word: "TITANIC", clue: "Navegación" },
            { word: "AVATAR", clue: "Planeta" }
        ],
        "Series": [
            { word: "STRANGER THINGS", clue: "Misterio" },
            { word: "BREAKING BAD", clue: "Química" }
        ]
    };
    Object.assign(categoriesDB, defaults);
}

// ========== PANTALLA DE CONFIGURACIÓN ==========

function initCategories() {
    const container = document.getElementById('categoriesList');
    container.innerHTML = '';
    
    Object.keys(categoriesDB).forEach(category => {
        const div = document.createElement('div');
        div.className = 'flex items-center p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer';
        div.innerHTML = `
            <input type="checkbox" id="cat_${category}" class="mr-3 h-5 w-5" 
                   onchange="toggleCategory('${category}')">
            <label for="cat_${category}" class="cursor-pointer">${category}</label>
        `;
        container.appendChild(div);
    });
}

function toggleCategory(category) {
    const checkbox = document.getElementById(`cat_${category}`);
    if (checkbox.checked) {
        if (!gameState.selectedCategories.includes(category)) {
            gameState.selectedCategories.push(category);
        }
    } else {
        gameState.selectedCategories = gameState.selectedCategories.filter(c => c !== category);
    }
    updateStartButton();
}

function addPlayer() {
    const input = document.getElementById('playerName');
    const name = input.value.trim();
    
    if (name && name.length > 0) {
        const player = {
            id: Date.now() + Math.random(),
            name: name,
            role: null,
            isAlive: true,
            votes: 0
        };
        
        gameState.players.push(player);
        input.value = '';
        renderPlayersList();
        updateStartButton();
    }
}

function removePlayer(playerId) {
    gameState.players = gameState.players.filter(p => p.id !== playerId);
    renderPlayersList();
    updateStartButton();
}

function renderPlayersList() {
    const container = document.getElementById('playersList');
    container.innerHTML = '';
    
    gameState.players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-card bg-gray-700 p-3 rounded-lg flex justify-between items-center';
        div.innerHTML = `
            <span class="font-medium">${player.name}</span>
            <button onclick="removePlayer(${player.id})" 
                    class="text-red-400 hover:text-red-300">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(div);
    });
}

function pauseTimer() {
    clearInterval(gameState.timerInterval);
    gameState.isTimerPaused = true;
}

// Función para continuar el timer
function continueTimer() {
    if (gameState.isTimerPaused && gameState.timeLeft > 0 && gameState.isGameActive) {
        gameState.isTimerPaused = false;
        startTimer();
    }
}

function updateStartButton() {
    const btn = document.getElementById('startBtn');
    const isValid = gameState.players.length >= 3 && 
                   gameState.selectedCategories.length >= 1;
    
    btn.disabled = !isValid;
    if (isValid) {
        btn.innerHTML = `🚀 Iniciar Partida (${gameState.players.length} jugadores)`;
    } else {
        btn.innerHTML = '🚀 Iniciar Partida';
    }
}

// ========== ASIGNACIÓN DE ROLES ==========

function startRoleAssignment() {
    // Configurar juego
    gameState.totalRounds = parseInt(document.getElementById('roundsCount').value);
    gameState.currentRound = 1;
    
    // Resetear jugadores
    gameState.players.forEach(p => {
        p.role = null;
        p.isAlive = true;
        p.votes = 0;
    });
    
    // Asignar impostores
    const impostorCount = parseInt(document.getElementById('impostorCount').value);
    assignImpostors(impostorCount);
    
    // Asegurar que el primer jugador NO sea impostor
    while (gameState.players[0]?.role === 'IMPOSTOR' && gameState.players.length > impostorCount) {
        // Mezclar de nuevo
        assignImpostors(impostorCount);
    }

    // Seleccionar palabra para la ronda (UNA VEZ para todos)
    selectRandomWord();
    
    // Iniciar asignación
    gameState.currentPlayerIndex = 0;
    showScreen('roleScreen');
    showNextPlayer();
}

function assignImpostors(count) {
    // Resetear roles
    gameState.players.forEach(p => p.role = 'INOCENTE');
    gameState.impostors = [];
    
    // Seleccionar impostores aleatorios
    const playersCopy = [...gameState.players];
    for (let i = 0; i < count && i < playersCopy.length; i++) {
        const randomIndex = Math.floor(Math.random() * playersCopy.length);
        const impostor = playersCopy[randomIndex];
        impostor.role = 'IMPOSTOR';
        gameState.impostors.push(impostor);
        playersCopy.splice(randomIndex, 1);
    }
}

function showNextPlayer() {
    const player = gameState.players[gameState.currentPlayerIndex];
    document.getElementById('currentPlayerName').textContent = player.name;
    
    // Resetear animación de flip
    document.getElementById('roleContent').classList.remove('flipped');
}

function revealRole() {
    const player = gameState.players[gameState.currentPlayerIndex];
    
    // Mostrar información
    const roleInfo = document.getElementById('roleInfo');
    if (player.role === 'IMPOSTOR') {
        roleInfo.innerHTML = `
            <div class="mb-6 text-center">
                <div class="text-4xl font-bold text-red-500 mb-2">${player.role}</div>
                <div class="text-xl text-gray-300">Eres el impostor</div>
            </div>
            <div class="bg-gray-900 p-4 rounded-lg">
                <div class="text-sm text-gray-400 mb-2">Tu pista es:</div>
                <div class="text-2xl font-bold text-yellow-400">${gameState.currentWord.clue}</div>
            </div>
        `;
    } else {
        roleInfo.innerHTML = `
            <div class="mb-6 text-center">
                <div class="text-4xl font-bold text-green-500 mb-2">${player.role}</div>
                <div class="text-xl text-gray-300">Eres inocente</div>
            </div>
            <div class="bg-gray-900 p-4 rounded-lg">
                <div class="text-sm text-gray-400 mb-2">Tu palabra es:</div>
                <div class="text-3xl font-bold text-green-400">${gameState.currentWord.word}</div>
                <div class="text-sm text-gray-400 mt-2">(El impostor ve una pista relacionada)</div>
            </div>
        `;
    }
    
    // Animación flip - CORREGIDA
    document.getElementById('roleContent').classList.add('flipped');
}

function nextPlayer() {
    gameState.currentPlayerIndex++;
    
    if (gameState.currentPlayerIndex < gameState.players.length) {
        showNextPlayer();
    } else {
        // Todos han visto sus roles, empezar juego
        startGame();
    }
}

// ========== SISTEMA DE CATEGORÍAS PERSONALIZADAS ==========

// Cargar categorías personalizadas desde localStorage
function loadCustomCategories() {
    const saved = localStorage.getItem('impostor_custom_categories');
    if (saved) {
        const customCats = JSON.parse(saved);
        // Combinar con categorías predeterminadas
        Object.assign(categoriesDB, customCats);
    }
}

// Guardar categorías personalizadas en localStorage
function saveCustomCategories() {
    // Separar las personalizadas (las que empiezan con "custom_")
    const customCats = {};
    for (const key in categoriesDB) {
        if (key.startsWith('custom_')) {
            customCats[key] = categoriesDB[key];
        }
    }
    localStorage.setItem('impostor_custom_categories', JSON.stringify(customCats));
}

// Mostrar modal para agregar categoría
function showAddCategoryModal() {
    document.getElementById('addCategoryModal').classList.add('active');
    document.getElementById('newCategoryName').value = '';
    document.getElementById('newCategoryWords').value = '';
}

function hideAddCategoryModal() {
    document.getElementById('addCategoryModal').classList.remove('active');
}

// Guardar nueva categoría
function saveNewCategory() {
    const name = document.getElementById('newCategoryName').value.trim();
    const wordsText = document.getElementById('newCategoryWords').value.trim();
    
    if (!name) {
        alert('Por favor ingresa un nombre para la categoría');
        return;
    }
    
    if (!wordsText) {
        alert('Por favor ingresa al menos una palabra con su pista');
        return;
    }
    
    // Procesar las palabras
    const wordsArray = wordsText.split('\n').filter(line => line.trim());
    const words = [];
    
    for (const line of wordsArray) {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const word = parts[0].trim().toUpperCase();
            const clue = parts.slice(1).join(':').trim();
            if (word && clue) {
                words.push({ word, clue });
            }
        }
    }
    
    if (words.length === 0) {
        alert('Formato incorrecto. Usa: palabra:pista');
        return;
    }
    
    // Agregar a la base de datos (con prefijo para identificar como personalizada)
    const customKey = `custom_${name}`;
    categoriesDB[customKey] = words;
    
    // Guardar en localStorage
    saveCustomCategories();
    
    // Actualizar la lista de categorías en pantalla
    initCategories();
    
    // Cerrar modal y mostrar mensaje
    hideAddCategoryModal();
    alert(`¡Categoría "${name}" creada con ${words.length} palabras!`);
}

// Mostrar gestión de categorías
function showManageCategories() {
    renderCustomCategoriesList();
    document.getElementById('manageCategoriesModal').classList.add('active');
}

function hideManageCategories() {
    document.getElementById('manageCategoriesModal').classList.remove('active');
}

// Renderizar lista de categorías personalizadas
function renderCustomCategoriesList() {
    const container = document.getElementById('customCategoriesList');
    container.innerHTML = '';
    
    let hasCustomCategories = false;
    
    for (const key in categoriesDB) {
        if (key.startsWith('custom_')) {
            hasCustomCategories = true;
            const displayName = key.replace('custom_', '');
            const words = categoriesDB[key];
            
            const div = document.createElement('div');
            div.className = 'bg-gray-700 rounded-lg p-4 mb-4';
            div.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <h4 class="text-xl font-bold">${displayName}</h4>
                    <button onclick="deleteCategory('${key}')" 
                            class="text-red-400 hover:text-red-300 px-3 py-1 rounded">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
                <div class="text-sm text-gray-300 mb-2">
                    ${words.length} palabra${words.length !== 1 ? 's' : ''}
                </div>
                <div class="text-sm">
                    <strong>Palabras:</strong> ${words.map(w => w.word).join(', ')}
                </div>
            `;
            container.appendChild(div);
        }
    }
    
    if (!hasCustomCategories) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-inbox text-4xl mb-4"></i>
                <p>No hay categorías personalizadas aún.</p>
                <p>Crea tu primera categoría usando el botón "Crear Categoría Personalizada"</p>
            </div>
        `;
    }
}

// Eliminar categoría
function deleteCategory(key) {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
        delete categoriesDB[key];
        saveCustomCategories();
        initCategories(); // Actualizar checkboxes
        renderCustomCategoriesList(); // Actualizar lista de gestión
    }
}

// Modificar initCategories para incluir las personalizadas
function initCategories() {
    const container = document.getElementById('categoriesList');
    container.innerHTML = '';
    
    // Primero las categorías predeterminadas (sin prefijo custom_)
    const defaultCategories = Object.keys(categoriesDB).filter(key => !key.startsWith('custom_'));
    const customCategories = Object.keys(categoriesDB).filter(key => key.startsWith('custom_'));
    
    // Mostrar todas las categorías
    [...defaultCategories, ...customCategories].forEach(key => {
        const displayName = key.startsWith('custom_') ? 
            `⭐ ${key.replace('custom_', '')}` : key;
        
        const div = document.createElement('div');
        div.className = 'flex items-center p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer';
        div.innerHTML = `
            <input type="checkbox" id="cat_${key}" class="mr-3 h-5 w-5" 
                   onchange="toggleCategory('${key}')"
                   ${gameState.selectedCategories.includes(key) ? 'checked' : ''}>
            <label for="cat_${key}" class="cursor-pointer flex-grow">${displayName}</label>
            ${key.startsWith('custom_') ? 
                '<span class="text-xs bg-blue-700 px-2 py-1 rounded">Personalizada</span>' : ''}
        `;
        container.appendChild(div);
    });
    
    updateSelectedCategoriesInfo();
}

// Actualizar información de categorías seleccionadas
function updateSelectedCategoriesInfo() {
    const info = document.getElementById('selectedCategoriesInfo');
    const count = gameState.selectedCategories.length;
    
    if (count === 0) {
        info.innerHTML = '⚠️ No hay categorías seleccionadas';
    } else {
        const names = gameState.selectedCategories.map(key => 
            key.startsWith('custom_') ? 
            `⭐ ${key.replace('custom_', '')}` : key
        );
        info.innerHTML = `✅ ${count} categoría${count !== 1 ? 's' : ''} seleccionada${count !== 1 ? 's' : ''}: ${names.join(', ')}`;
    }
}

// Modificar toggleCategory para actualizar la info
function toggleCategory(category) {
    const checkbox = document.getElementById(`cat_${category}`);
    if (checkbox.checked) {
        if (!gameState.selectedCategories.includes(category)) {
            gameState.selectedCategories.push(category);
        }
    } else {
        gameState.selectedCategories = gameState.selectedCategories.filter(c => c !== category);
    }
    updateStartButton();
    updateSelectedCategoriesInfo(); // <-- Agregar esta línea
}

// ========== JUEGO EN CURSO ==========

function startGame() {
    // Configurar tiempo
    const minutes = parseInt(document.getElementById('gameTime').value);
    gameState.timeLeft = minutes * 60;
    
    // Resetear jugadores vivos
    gameState.alivePlayers = [...gameState.players];
    gameState.isGameActive = true;
    
    // Iniciar timer
    startTimer();
    updateGameScreen();
    showScreen('gameScreen');
}

function startTimer() {
    clearInterval(gameState.timerInterval);
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        updateTimerDisplay();
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            endGameTime();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timeLeft / 60);
    const seconds = gameState.timeLeft % 60;
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function selectRandomWord() {
    // Seleccionar categoría aleatoria de las seleccionadas
    if (gameState.selectedCategories.length === 0) return;
    
    const randomCategory = gameState.selectedCategories[
        Math.floor(Math.random() * gameState.selectedCategories.length)
    ];
    
    const words = categoriesDB[randomCategory];
    if (words && words.length > 0) {
        gameState.currentWord = words[Math.floor(Math.random() * words.length)];
        gameState.currentWord.category = randomCategory;
    }
}

function updateGameScreen() {
    // Actualizar palabra
    if (gameState.currentWord) {
        document.getElementById('currentWord').textContent = gameState.currentWord.word;
    }
    
    // Actualizar info de ronda
    document.getElementById('roundInfo').textContent = 
        `Ronda ${gameState.currentRound} de ${gameState.totalRounds} | ${gameState.selectedCategories.length} categorías`;
    
    // Actualizar jugadores vivos
    const container = document.getElementById('alivePlayers');
    container.innerHTML = '';
    
    gameState.alivePlayers.forEach(player => {
        if (player.isAlive) {
            const div = document.createElement('div');
            div.className = 'bg-gray-700 p-3 rounded-lg text-center';
            div.innerHTML = `
                <div class="font-bold">${player.name}</div>
                <div class="text-sm text-green-400">✅ VIVO</div>
            `;
            container.appendChild(div);
        }
    });
}

function startVoting() {
    pauseTimer;
    showScreen('votingScreen');
    renderVotingPlayers();
}

function renderVotingPlayers() {
    const container = document.getElementById('votingPlayers');
    container.innerHTML = '';
    gameState.votedPlayer = null;
    
    gameState.alivePlayers.forEach(player => {
        if (player.isAlive) {
            const div = document.createElement('div');
            div.className = 'player-card bg-gray-700 p-4 rounded-lg text-center cursor-pointer hover:bg-gray-600';
            div.innerHTML = `
                <div class="font-bold text-lg">${player.name}</div>
                <div class="text-sm text-gray-400">Haz click para votar</div>
            `;
            div.onclick = () => selectPlayerForVoting(player.id);
            container.appendChild(div);
        }
    });
    
    document.getElementById('finishVoteBtn').disabled = true;
}

function selectPlayerForVoting(playerId) {
    gameState.votedPlayer = gameState.alivePlayers.find(p => p.id === playerId);
    
    // Actualizar UI
    const allCards = document.querySelectorAll('#votingPlayers > div');
    allCards.forEach(card => {
        card.classList.remove('bg-purple-800');
        card.classList.add('bg-gray-700');
    });
    
    // Resaltar seleccionado
    const selectedIndex = gameState.alivePlayers.findIndex(p => p.id === playerId);
    if (selectedIndex >= 0) {
        allCards[selectedIndex].classList.remove('bg-gray-700');
        allCards[selectedIndex].classList.add('bg-purple-800');
    }
    
    document.getElementById('finishVoteBtn').disabled = false;
}

function finishVoting() {
    if (!gameState.votedPlayer) return;
    
    gameState.votedPlayer.isAlive = false;
    gameState.alivePlayers = gameState.alivePlayers.filter(p => p.isAlive);
    
    if (checkWinConditions()) {
        return;
    }
    
    gameState.currentRound++;
    
    if (gameState.currentRound > gameState.totalRounds) {
        endGame();
    } else {
        // Nueva ronda: seleccionar nueva palabra
        selectRandomWord();
        updateGameScreen();
        continueTimer();  // <-- Continúa el cronómetro
        showScreen('gameScreen');
    }
}

function cancelVoting() {
    continueTimer;
    showScreen('gameScreen');
}

function checkWinConditions() {
    const aliveImpostors = gameState.impostors.filter(i => i.isAlive).length;
    const aliveInnocents = gameState.alivePlayers.length - aliveImpostors;
    
    // Condición 1: Mismo número de impostores que inocentes
    if (aliveImpostors > 0 && aliveImpostors >= aliveInnocents) {
        endGameWithResult('IMPOSTORES', '¡Los impostores ganan! Superan en número a los inocentes.');
        return true;
    }
    
    // Condición 2: No quedan impostores
    if (aliveImpostors === 0) {
        endGameWithResult('INOCENTES', '¡Los inocentes ganan! Han eliminado a todos los impostores.');
        return true;
    }
    
    return false;
}

function endGameTime() {
    const aliveImpostors = gameState.impostors.filter(i => i.isAlive).length;
    
    if (aliveImpostors > 0) {
        endGameWithResult('IMPOSTORES', '¡Los impostores ganan! Se acabó el tiempo y siguen en juego.');
    } else {
        endGameWithResult('INOCENTES', '¡Los inocentes ganan! Eliminaron a todos los impostores a tiempo.');
    }
}

function endGame() {
    clearInterval(gameState.timerInterval);
    gameState.isGameActive = false;
    
    // Determinar ganador
    const aliveImpostors = gameState.impostors.filter(i => i.isAlive).length;
    
    if (aliveImpostors > 0) {
        endGameWithResult('IMPOSTORES', '¡Los impostores ganan! Sobrevivieron hasta el final.');
    } else {
        endGameWithResult('INOCENTES', '¡Los inocentes ganan! Descubrieron a todos los impostores.');
    }
}

function endGameWithResult(winner, message) {
    clearInterval(gameState.timerInterval);
    gameState.isGameActive = false;
    gameState.isTimerPaused = false;
    
    document.getElementById('resultTitle').textContent = 
        winner === 'IMPOSTORES' ? '🏆 IMPOSTORES GANAN' : '🏆 INOCENTES GANAN';
    
    document.getElementById('resultTitle').className = 
        winner === 'IMPOSTORES' ? 'text-4xl font-bold mb-6 text-red-500' : 'text-4xl font-bold mb-6 text-green-500';
    
    document.getElementById('resultMessage').textContent = message;
    
    // Mostrar resultados por jugador
    const container = document.getElementById('playersResults');
    container.innerHTML = '';
    
    gameState.players.forEach(player => {
        const div = document.createElement('div');
        div.className = `p-4 rounded-lg mb-3 ${player.role === 'IMPOSTOR' ? 'bg-red-900/30' : 'bg-green-900/30'}`;
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <span class="font-bold">${player.name}</span>
                    <span class="ml-3 px-2 py-1 rounded text-xs ${player.role === 'IMPOSTOR' ? 'bg-red-700' : 'bg-green-700'}">
                        ${player.role}
                    </span>
                </div>
                <div class="${player.isAlive ? 'text-green-400' : 'text-red-400'}">
                    ${player.isAlive ? '✅ VIVO' : '❌ ELIMINADO'}
                </div>
            </div>
        `;
        container.appendChild(div);
    });
    
    showScreen('resultsScreen');
}

// ========== NAVEGACIÓN ==========

function showScreen(screenName) {
    // Ocultar todas las pantallas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar pantalla solicitada
    document.getElementById(screenName).classList.add('active');
}

function newGame() {
    // Mantener configuración pero resetear juego
    gameState.currentRound = 1;
    gameState.timeLeft = 300;
    gameState.isGameActive = false;
    gameState.alivePlayers = [];
    gameState.votedPlayer = null;
    
    showScreen('setupScreen');
    updateStartButton();
}

function backToSetup() {
    showScreen('setupScreen');
}

// ========== PWA (App Instalable) ==========

// Registrar Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(() => console.log('Service Worker registrado'))
            .catch(err => console.log('Error SW:', err));
    });
}

// Detectar si está instalado como PWA
window.addEventListener('appinstalled', () => {
    console.log('App instalada como PWA');
});

// Solicitar instalación como PWA
// Código de instalación eliminado por solicitud del usuario
/*
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir que Chrome muestre el prompt automáticamente
    e.preventDefault();
    // Guardar el evento para dispararlo después
    deferredPrompt = e;
    
    // Mostrar el botón de instalación
    if (installBtn) {
        installBtn.classList.remove('hidden');
        
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
                installBtn.classList.add('hidden');
            }
        });
    }
});
*/