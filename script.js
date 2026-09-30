// Estado do Jogo
const game = {
    turn: 'hunter', // 'hunter' ou 'monster'
    inCombat: false,
    boardSize: 5,
    hunter: { hp: 100, maxHp: 100, x: 2, y: 4, status: 'Nenhum', statusDuration: 0 },
    monster: { hp: 150, maxHp: 150, x: 2, y: 0, status: 'Nenhum', statusDuration: 0 },
    inventory: {
        'Erva': 3,
        'Mel': 2,
        'Planta Antídoto': 2,
        'Poção': 1,
        'Mega Poção': 0,
        'Antídoto': 0
    },
    selectedPiece: null
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    createBoard();
    updateUI();
    logMessage("⚔️ Bem-vindo ao acampamento! Você pode criar itens antes de se mover ou atacar o Rathalos.");
});

// Criação do Tabuleiro
function createBoard() {
    const boardEl = document.getElementById('chessboard');
    boardEl.innerHTML = '';
    
    for (let y = 0; y < game.boardSize; y++) {
        for (let x = 0; x < game.boardSize; x++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((x + y) % 2 === 0 ? 'light' : 'dark');
            square.dataset.x = x;
            square.dataset.y = y;
            
            square.addEventListener('click', () => handleSquareClick(x, y));
            boardEl.appendChild(square);
        }
    }
    drawPieces();
}

// Desenhar Peças estilo Xadrez
function drawPieces() {
    document.querySelectorAll('.square').forEach(sq => sq.innerHTML = '');

    if (game.hunter.hp > 0) {
        const hunterSq = getSquare(game.hunter.x, game.hunter.y);
        if (hunterSq) {
            const p = document.createElement('span');
            p.className = 'piece hunter-piece';
            p.innerText = '🧙‍♂️ C';
            hunterSq.appendChild(p);
        }
    }

    if (game.monster.hp > 0) {
        const monsterSq = getSquare(game.monster.x, game.monster.y);
        if (monsterSq) {
            const p = document.createElement('span');
            p.className = 'piece monster-piece';
            p.innerText = '🐉 M';
            monsterSq.appendChild(p);
        }
    }
}

function getSquare(x, y) {
    return document.querySelector(`.square[data-x="${x}"][data-y="${y}"]`);
}

// Lógica de Seleção e Movimentação
function handleSquareClick(x, y) {
    if (game.turn !== 'hunter') return;

    const clickedOnHunter = (x === game.hunter.x && y === game.hunter.y);

    if (clickedOnHunter) {
        if (game.selectedPiece === 'hunter') {
            game.selectedPiece = null;
            document.querySelectorAll('.square').forEach(sq => sq.classList.remove('selected'));
        } else {
            game.selectedPiece = 'hunter';
            const sq = getSquare(x, y);
            sq.classList.add('selected');
        }
        return;
    }

    if (game.selectedPiece === 'hunter') {
        const dx = Math.abs(x - game.hunter.x);
        const dy = Math.abs(y - game.hunter.y);

        // Movimento estilo Rei do Xadrez (1 casa para qualquer direção)
        if (dx <= 1 && dy <= 1 && (dx > 0 || dy > 0)) {
            
            if (x === game.monster.x && y === game.monster.y) {
                attackMonster();
            } else {
                game.hunter.x = x;
                game.hunter.y = y;
                logMessage(`🏃‍♂️ Caçador se moveu para a casa (${x}, ${y}).`);
                endHunterTurn();
            }
            
            game.selectedPiece = null;
            document.querySelectorAll('.square').forEach(sq => sq.classList.remove('selected'));
            drawPieces();
            checkCombatState(); // Atualiza se saímos ou entramos na zona de combate
            updateUI();
        } else {
            logMessage("⚠️ Movimento inválido! O caçador se move apenas 1 casa por vez (adjacente).");
        }
    }
}

// Ataque do Caçador
function attackMonster() {
    let damage = 20;
    logMessage(`⚔️ Caçador atacou o Rathalos causando ${damage} de dano!`);
    
    if (Math.random() > 0.5) {
        game.monster.status = 'Veneno';
        game.monster.statusDuration = 2;
        logMessage(`🧪 Espada Envenenada! Rathalos está envenenado por 2 turnos.`);
    }

    game.monster.hp = Math.max(0, game.monster.hp - damage);
    endHunterTurn();
}

// Turno da IA do Monstro (Consertado)
function monsterTurn() {
    if (game.monster.hp <= 0) return;

    logMessage("🐉 Turno do Rathalos...");

    // Aplica dano de Veneno no monstro se houver
    if (game.monster.status === 'Veneno') {
        game.monster.hp = Math.max(0, game.monster.hp - 15);
        game.monster.statusDuration--;
        logMessage(`🤢 O Veneno causou 15 de dano ao Rathalos!`);
        if (game.monster.statusDuration <= 0) game.monster.status = 'Nenhum';
    }

    if (game.monster.hp <= 0) {
        checkGameOver();
        return;
    }

    const dx = game.hunter.x - game.monster.x;
    const dy = game.hunter.y - game.monster.y;

    // Correção do loop: Se o monstro já inicia o turno colado ao Caçador, ele ataca e termina a ação.
    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
        monsterAttack();
        return; 
    } 
    
    // Se o monstro estiver longe, ele voa em linha reta/diagonal na direção do Caçador
    if (dx !== 0) game.monster.x += Math.sign(dx);
    if (dy !== 0) game.monster.y += Math.sign(dy);
    
    logMessage(`🐉 Rathalos voou para a casa (${game.monster.x}, ${game.monster.y}) perseguindo você!`);
    
    // Checa novamente se ficou perto após andar
    if (Math.abs(game.hunter.x - game.monster.x) <= 1 && Math.abs(game.hunter.y - game.monster.y) <= 1) {
         monsterAttack();
    } else {
         endMonsterTurn();
    }
    
    drawPieces();
    checkCombatState();
    updateUI();
}

function monsterAttack() {
    let damage = 25;
    logMessage(`🔥 Rathalos usou Garras de Fogo e causou ${damage} de dano!`);
    
    if (Math.random() > 0.4) {
        game.hunter.status = 'Fogo';
        game.hunter.statusDuration = 2;
        logMessage(`🔥 Você foi Incendiado! Sofrerá dano por turno.`);
    }

    game.hunter.hp = Math.max(0, game.hunter.hp - damage);
    endMonsterTurn();
}

function endHunterTurn() {
    if (checkGameOver()) return;
    game.turn = 'monster';
    document.getElementById('current-turn').innerText = 'Rathalos 🐉';
    setTimeout(monsterTurn, 1200);
}

function endMonsterTurn() {
    if (checkGameOver()) return;
    
    if (game.hunter.status === 'Fogo') {
        game.hunter.hp = Math.max(0, game.hunter.hp - 10);
        game.hunter.statusDuration--;
        logMessage(`🔥 Você perdeu 10 de vida devido às chamas!`);
        if (game.hunter.statusDuration <= 0) game.hunter.status = 'Nenhum';
    }

    if (checkGameOver()) return;

    game.turn = 'hunter';
    document.getElementById('current-turn').innerText = 'Caçador 🧙‍♂️';
    checkCombatState();
    updateUI();
}

// Correção do estado dinâmico: Se o caçador se distanciar do monstro, ele volta a estar fora de combate.
function checkCombatState() {
    const dx = Math.abs(game.hunter.x - game.monster.x);
    const dy = Math.abs(game.hunter.y - game.monster.y);
    // Se o monstro estiver a mais de 1 bloco de distância, o caçador está seguro ("fora de combate")
    if (dx > 1 || dy > 1) {
        game.inCombat = false;
    } else {
        game.inCombat = true;
    }
}

// Sistema de Crafting de Itens
function craftItem(itemName) {
    if (itemName === 'Potion') {
        if (game.inventory['Erva'] >= 1) {
            game.inventory['Erva']--;
            game.inventory['Poção']++;
            logMessage(`🛠️ Você forjou: Poção!`);
        } else {
            logMessage(`❌ Recursos insuficientes (Erva necessária).`);
        }
    } else if (itemName === 'Mega Potion') {
        if (game.inventory['Poção'] >= 1 && game.inventory['Mel'] >= 1) {
            game.inventory['Poção']--;
            game.inventory['Mel']--;
            game.inventory['Mega Poção']++;
            logMessage(`🛠️ Você forjou: Mega Poção!`);
        } else {
            logMessage(`❌ Recursos insuficientes (Poção + Mel necessários).`);
        }
    } else if (itemName === 'Antidote') {
        if (game.inventory['Planta Antídoto'] >= 1) {
            game.inventory['Planta Antídoto']--;
            game.inventory['Antídoto']++;
            logMessage(`🛠️ Você forjou: Antídoto!`);
        } else {
            logMessage(`❌ Recursos insuficientes (Planta Antídoto necessária).`);
        }
    }
    updateUI();
}

function useItemOutside(itemName) {
    if (game.inCombat) {
        logMessage("⚠️ Você está cara a cara com o monstro! Use os botões de ação do painel de batalha à direita.");
        return;
    }
    executeItemEffect(itemName);
}

function useItemInCombat(itemName) {
    if (game.turn !== 'hunter') return;
    if (!game.inCombat) {
        logMessage("💥 Você está longe do monstro. Use as ações fora de combate (Acampamento) à esquerda.");
        return;
    }

    if (executeItemEffect(itemName)) {
        endHunterTurn(); // Usar item perto do inimigo gasta a vez do caçador
    }
}

function executeItemEffect(itemName) {
    if (game.inventory[itemName] <= 0) {
        logMessage(`❌ Você não tem ${itemName} no inventário.`);
        return false;
    }

    if (itemName === 'Potion') {
        game.hunter.hp = Math.min(game.hunter.maxHp, game.hunter.hp + 30);
        logMessage(`🧪 Você usou Poção e recuperou 30 de HP.`);
    } else if (itemName === 'Mega Potion') {
        game.hunter.hp = Math.min(game.hunter.maxHp, game.hunter.hp + 60);
        logMessage(`🧪 Você usou Mega Poção e recuperou 60 de HP.`);
    } else if (itemName === 'Antidote') {
        if (game.hunter.status === 'Fogo' || game.hunter.status === 'Veneno') {
            logMessage(`🧪 Você usou Antídoto e curou o efeito de ${game.hunter.status}!`);
            game.hunter.status = 'Nenhum';
            game.hunter.statusDuration = 0;
        } else {
// Base de dados de Monstros por Ranking (HR)
const monsterDatabase = [
    {
        name: "Great Jagras",
        hrRequired: 1,
        rankName: "Low Rank",
        maxHp: 80,
        baseDamage: 12,
        element: "Nenhum",
        icon: "🦎 M",
        intro: "Unid. de Reconhecimento: Great Jagras à vista! Cuidado com suas investidas físicas."
    },
    {
        name: "Pukei-Pukei",
        hrRequired: 2,
        rankName: "Low Rank",
        maxHp: 120,
        baseDamage: 18,
        element: "Veneno",
        icon: "🦅 M",
        intro: "Alerta de Praga: Pukei-Pukei detectado! Ele expele toxinas venenosas."
    },
    {
        name: "Rathalos",
        hrRequired: 3,
        rankName: "High Rank",
        maxHp: 180,
        baseDamage: 26,
        element: "Fogo",
        icon: "🐉 M",
        intro: "O Rei dos Céus: Rathalos desceu ao tabuleiro! Prepare seus antídotos contra as chamas."
    },
    {
        name: "Anjanath",
        hrRequired: 4,
        rankName: "High Rank",
        maxHp: 240,
        baseDamage: 32,
        element: "Fogo",
        icon: "🦖 M",
        intro: "Ameaça Brutal: Anjanath ruge ferozmente! Seus ataques físicos quebram posturas."
    },
    {
        name: "Jyuratodus",
        hrRequired: 5,
        rankName: "High Rank",
        maxHp: 300,
        baseDamage: 36,
        element: "Água",
        icon: "🐟 M",
        intro: "Terror do Pântano: Jyuratodus emerge da lama! Seus ataques reduzem sua agilidade."
    }
];

// Estado Global do Jogo
const game = {
    currentMonsterIndex: 0,
    turn: 'hunter',
    inCombat: false,
    boardSize: 5,
    hunter: { hp: 100, maxHp: 100, x: 2, y: 4, status: 'Nenhum', statusDuration: 0 },
    monster: { name: "", hp: 0, maxHp: 0, x: 2, y: 0, status: 'Nenhum', statusDuration: 0, baseDamage: 0, element: "", icon: "" },
    inventory: {
        'Erva': 5,
        'Mel': 3,
        'Planta Antídoto': 4,
        'Poção': 2,
        'Mega Poção': 0,
        'Antídoto': 0
    },
    selectedPiece: null
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadMonster(game.currentMonsterIndex);
    createBoard();
    updateUI();
});

// Carrega dados do monstro com correções de limpeza de status
function loadMonster(index) {
    const data = monsterDatabase[index];
    game.monster.name = data.name;
    game.monster.maxHp = data.maxHp;
    game.monster.hp = data.maxHp;
    game.monster.baseDamage = data.baseDamage;
    game.monster.element = data.element;
    game.monster.icon = data.icon;
    game.monster.x = 2;
    game.monster.y = 0;
    
    // CORREÇÃO: Reseta completamente qualquer status residual da batalha anterior
    game.monster.status = 'Nenhum';
    game.monster.statusDuration = 0;
    game.hunter.status = 'Nenhum';
    game.hunter.statusDuration = 0;
    
    game.hunter.x = 2;
    game.hunter.y = 4;
    game.inCombat = false;
    game.turn = 'hunter';

    logMessage(`🎯 Nova Caçada Iniciada! HR ${data.hrRequired} - [${data.rankName}]`);
    logMessage(`📜 ${data.intro}`);
}

function createBoard() {
    const boardEl = document.getElementById('chessboard');
    boardEl.innerHTML = '';
    
    for (let y = 0; y < game.boardSize; y++) {
        for (let x = 0; x < game.boardSize; x++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((x + y) % 2 === 0 ? 'light' : 'dark');
            square.dataset.x = x;
            square.dataset.y = y;
            
            square.addEventListener('click', () => handleSquareClick(x, y));
            boardEl.appendChild(square);
        }
    }
    drawPieces();
}

function drawPieces() {
    document.querySelectorAll('.square').forEach(sq => sq.innerHTML = '');

    if (game.hunter.hp > 0) {
        const hunterSq = getSquare(game.hunter.x, game.hunter.y);
        if (hunterSq) {
            const p = document.createElement('span');
            p.className = 'piece hunter-piece';
            p.innerText = '🧙‍♂️ C';
            hunterSq.appendChild(p);
        }
    }

    if (game.monster.hp > 0) {
        const monsterSq = getSquare(game.monster.x, game.monster.y);
        if (monsterSq) {
            const p = document.createElement('span');
            p.className = 'piece monster-piece';
            p.innerText = game.monster.icon;
            monsterSq.appendChild(p);
        }
    }
}

function getSquare(x, y) {
    return document.querySelector(`.square[data-x="${x}"][data-y="${y}"]`);
}

function handleSquareClick(x, y) {
    if (game.turn !== 'hunter') return;

    const clickedOnHunter = (x === game.hunter.x && y === game.hunter.y);

    if (clickedOnHunter) {
        if (game.selectedPiece === 'hunter') {
            game.selectedPiece = null;
            document.querySelectorAll('.square').forEach(sq => sq.classList.remove('selected'));
        } else {
            game.selectedPiece = 'hunter';
            getSquare(x, y).classList.add('selected');
        }
        return;
    }

    if (game.selectedPiece === 'hunter') {
        const dx = Math.abs(x - game.hunter.x);
        const dy = Math.abs(y - game.hunter.y);

        if (dx <= 1 && dy <= 1 && (dx > 0 || dy > 0)) {
            if (x === game.monster.x && y === game.monster.y) {
                attackMonster();
            } else {
                game.hunter.x = x;
                game.hunter.y = y;
                logMessage(`🏃‍♂️ Caçador se moveu para (${x}, ${y}).`);
                endHunterTurn();
            }
            
            game.selectedPiece = null;
            document.querySelectorAll('.square').forEach(sq => sq.classList.remove('selected'));
            drawPieces();
            checkCombatState();
            updateUI();
        } else {
            logMessage("⚠️ Movimento inválido! Mova-se apenas 1 casa adjacente.");
        }
    }
}

function attackMonster() {
    let damage = 22; 
    logMessage(`⚔️ Você desferiu um golpe no ${game.monster.name} causando ${damage} de dano!`);
    
    if (Math.random() > 0.5) {
        game.monster.status = 'Veneno';
        game.monster.statusDuration = 2;
        logMessage(`🧪 Sua arma aplicou Veneno no monstro por 2 turnos!`);
    }

    game.monster.hp = Math.max(0, game.monster.hp - damage);
    endHunterTurn();
}

function monsterTurn() {
    if (game.monster.hp <= 0) return;

    logMessage(`🐙 Turno do ${game.monster.name}...`);

    if (game.monster.status === 'Veneno') {
        game.monster.hp = Math.max(0, game.monster.hp - 15);
        game.monster.statusDuration--;
        logMessage(`🤢 O Veneno causou 15 de dano ao ${game.monster.name}!`);
        if (game.monster.statusDuration <= 0) game.monster.status = 'Nenhum';
    }

    if (game.monster.hp <= 0) {
        checkGameOver();
        return;
    }

    const dx = game.hunter.x - game.monster.x;
    const dy = game.hunter.y - game.monster.y;

    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
        monsterAttack();
        return;
    } 

    if (dx !== 0) game.monster.x += Math.sign(dx);
    if (dy !== 0) game.monster.y += Math.sign(dy);
    
    logMessage(`🐉 O monstro avançou para a posição (${game.monster.x}, ${game.monster.y}).`);
    
    if (Math.abs(game.hunter.x - game.monster.x) <= 1 && Math.abs(game.hunter.y - game.monster.y) <= 1) {
         monsterAttack();
    } else {
         endMonsterTurn();
    }
    
    drawPieces();
    checkCombatState();
    updateUI();
}

function monsterAttack() {
    let damage = game.monster.baseDamage;
    logMessage(`💥 O ${game.monster.name} atacou violentamente e causai ${damage} de dano!`);
    
    if (game.monster.element !== "Nenhum" && Math.random() > 0.4) {
        game.hunter.status = game.monster.element;
        game.hunter.statusDuration = 2;
        logMessage(`⚠️ Efeito Adverso! Você foi afligido com: ${game.monster.element}!`);
    }

    game.hunter.hp = Math.max(0, game.hunter.hp - damage);
    endMonsterTurn();
}

function endHunterTurn() {
    if (checkGameOver()) return;
    game.turn = 'monster';
    document.getElementById('current-turn').innerText = game.monster.name;
    setTimeout(monsterTurn, 1000);
}

function endMonsterTurn() {
    if (checkGameOver()) return;
    
    if (game.hunter.status !== 'Nenhum') {
        let tickDamage = game.hunter.status === 'Fogo' ? 12 : game.hunter.status === 'Veneno' ? 10 : 8;
        game.hunter.hp = Math.max(0, game.hunter.hp - tickDamage);
        game.hunter.statusDuration--;
        logMessage(`🚨 Status [${game.hunter.status}] causou ${tickDamage} de dano a você.`);
        if (game.hunter.statusDuration <= 0) game.hunter.status = 'Nenhum';
    }

    if (checkGameOver()) return;

    game.turn = 'hunter';
    document.getElementById('current-turn').innerText = 'Caçador 🧙‍♂️';
    checkCombatState();
    updateUI();
}

function checkCombatState() {
    const dx = Math.abs(game.hunter.x - game.monster.x);
    const dy = Math.abs(game.hunter.y - game.monster.y);
    game.inCombat = !(dx > 1 || dy > 1);
}

// Crafting
function craftItem(itemName) {
    if (itemName === 'Potion' && game.inventory['Erva'] >= 1) {
        game.inventory['Erva']--; game.inventory['Poção']++;
        logMessage(`🛠️ Poção fabricada!`);
    } else if (itemName === 'Mega Potion' && game.inventory['Poção'] >= 1 && game.inventory['Mel'] >= 1) {
        game.inventory['Poção']--; game.inventory['Mel']--; game.inventory['Mega Poção']++;
        logMessage(`🛠️ Mega Poção fabricada!`);
    } else if (itemName === 'Antidote' && game.inventory['Planta Antídoto'] >= 1) {
        game.inventory['Planta Antídoto']--; game.inventory['Antídoto']++;
        logMessage(`🛠️ Antídoto fabricado!`);
    } else {
        logMessage(`❌ Recursos insuficientes para forjar este item.`);
    }
    updateUI();
}

function useItemOutside(itemName) {
    if (game.inCombat) {
