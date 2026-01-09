// 1. 무기 데이터베이스
const weaponDB = {
    AR: [
        "M416", "AKM", "베릴 M762", "SCAR-L", "AUG", "그로자", 
        "G36C", "QBZ", "K2", "FAMAS", "Mk47 뮤턴트", "M16A4", "ACE32"
    ],
    DMR: [
        "미니14", "SLR", "SKS", "Mk12", "QBU", "VSS", "Mk14", "드라구노프"
    ],
    SR: [
        "Kar98k", "M24", "AWM", "모신 나강", "Win94", "링스 AMR"
    ],
    SMG: [
        "벡터", "마이크로 UZI", "UMP45", "토미 건", "PP-19 비존", 
        "MP5K", "P90", "MP9", "JS9"
    ],
    SG: [
        "S686", "S1897", "S12K", "DBS", "O12", "소드 오프"
    ],
    LMG: [
        "M249", "DP-28", "MG3"
    ],
    HG: [
        "P18C", "P92", "P1911", "R1895", "R45", "Deagle", "스콜피온"
    ],
    ETC: [
        "석궁", "판처파우스트"
    ]
};

// 보급함/특수 무기 목록
const crateWeapons = [
    "Groza", "FAMAS", "Mk14", "AWM", "링스 AMR", 
    "P90", "MG3", "판처파우스트"
];

// 2. 상태 변수
let currentWeaponCount = 1;
let currentPlayerCount = 2;

// [중복 방지용] 각 플레이어가 현재 들고 있는 무기를 기억
let playerLoadouts = {}; 

// 3. 초기화 및 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    renderPlayers();
    
    // 전체 롤 버튼 이벤트
    document.getElementById('roll-all-btn').addEventListener('click', () => {
        // 1. 먼저 전체 풀 크기를 체크하여 경고 메시지 띄우기
        const currentPool = getWeaponPool();
        
        if (currentPool.length === 0) {
            alert("최소 한 개의 카테고리를 선택해주세요!");
            return;
        }

        // 뽑아야 할 개수(currentWeaponCount)보다 가능한 무기(currentPool.length)가 적으면 경고
        if (currentPool.length < currentWeaponCount) {
            alert(`선택 가능한 무기(${currentPool.length}개)가 슬롯 개수(${currentWeaponCount})보다 적습니다.\n중복된 무기가 나옵니다.`);
        }

        // 2. 플레이어들의 무기 상태 초기화
        for(let id in playerLoadouts) {
            playerLoadouts[id] = new Array(currentWeaponCount).fill(null);
        }

        // 3. 무기 뽑기 실행 (여기서는 개별 경고창을 띄우지 않음 - suppressAlert: true)
        const slots = document.querySelectorAll('.weapon-slot');
        slots.forEach(slot => {
            const playerId = slot.dataset.player;
            const slotIndex = slot.dataset.index;
            rollWeapon(playerId, slotIndex, true); // true = 경고창 끄기
        });
    });
});

// 4. 설정 변경 함수들
function changeWeaponCount(delta) {
    const newVal = currentWeaponCount + delta;
    if (newVal >= 1 && newVal <= 5) {
        currentWeaponCount = newVal;
        document.getElementById('weapon-count-display').innerText = currentWeaponCount;
        renderPlayers();
    }
}

function changePlayerCount(delta) {
    const newVal = currentPlayerCount + delta;
    if (newVal >= 1 && newVal <= 4) {
        currentPlayerCount = newVal;
        document.getElementById('player-count-display').innerText = currentPlayerCount;
        renderPlayers();
    }
}

// 5. 현재 설정에 맞는 무기 풀(Pool)을 가져오는 도우미 함수
function getWeaponPool() {
    const checkedCategories = Array.from(document.querySelectorAll('.checkbox-group input:checked'))
        .map(input => input.value);

    let pool = [];
    checkedCategories.forEach(cat => {
        if (weaponDB[cat]) {
            pool = pool.concat(weaponDB[cat]);
        }
    });

    const excludeCrate = document.getElementById('exclude-crate').checked;
    if (excludeCrate) {
        pool = pool.filter(weapon => !crateWeapons.includes(weapon));
    }
    
    return pool;
}

// 6. 플레이어 UI 렌더링
function renderPlayers() {
    const container = document.getElementById('players-container');
    container.innerHTML = ''; 
    playerLoadouts = {}; 

    for (let i = 1; i <= currentPlayerCount; i++) {
        playerLoadouts[i] = new Array(currentWeaponCount).fill(null);

        const card = document.createElement('div');
        card.className = 'player-card';
        
        const title = document.createElement('h3');
        title.className = 'player-title';
        title.innerText = `Player ${i}`;
        card.appendChild(title);

        for (let j = 0; j < currentWeaponCount; j++) {
            const slot = document.createElement('div');
            slot.className = 'weapon-slot';
            slot.dataset.player = i;
            slot.dataset.index = j;
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'weapon-name';
            nameSpan.id = `p${i}-w${j}`;
            nameSpan.innerText = "대기 중";

            const btn = document.createElement('button');
            btn.className = 'reroll-btn';
            btn.innerText = 'Roll';
            // 개별 클릭 시에는 경고창을 띄움 (false)
            btn.onclick = () => rollWeapon(i, j, false);

            slot.appendChild(nameSpan);
            slot.appendChild(btn);
            card.appendChild(slot);
        }

        container.appendChild(card);
    }
}

// 7. 무기 뽑기 로직 (suppressAlert 파라미터 추가)
function rollWeapon(playerId, slotIndex, suppressAlert = false) {
    slotIndex = parseInt(slotIndex);

    // 1. 전체 무기 풀 가져오기
    const pool = getWeaponPool();

    if (pool.length === 0) {
        if (!suppressAlert) alert("최소 한 개의 카테고리를 선택해야 합니다.");
        return;
    }

    // 2. 부족 상황 체크 (개별 롤일 때만 경고)
    if (!suppressAlert && pool.length < currentWeaponCount) {
        // 이미 경고를 본 적이 없거나, 사용자가 인지해야 할 때 띄웁니다.
        // 너무 자주 뜨는 게 싫다면 이 부분을 주석 처리하거나 confirm으로 변경 가능합니다.
        alert(`주의: 가능한 무기가 ${pool.length}개 뿐이라 중복된 무기가 나옵니다.`);
    }

    // 3. 중복 방지 로직
    const currentLoadout = playerLoadouts[playerId];
    const usedWeapons = currentLoadout.filter((weapon, idx) => idx !== slotIndex && weapon !== null);
    
    let finalPool = pool.filter(weapon => !usedWeapons.includes(weapon));

    // 예외 처리: 뽑을 게 없으면 전체 풀 사용 (중복 허용)
    if (finalPool.length === 0) {
        finalPool = pool;
    }

    // 4. UI 업데이트
    const targetElement = document.getElementById(`p${playerId}-w${slotIndex}`);
    targetElement.innerText = "...";
    targetElement.style.color = '#ccc'; 
    
    let randomWeapon = "없음";
    if (finalPool.length > 0) {
        randomWeapon = finalPool[Math.floor(Math.random() * finalPool.length)];
    }

    playerLoadouts[playerId][slotIndex] = randomWeapon;

    setTimeout(() => {
        targetElement.innerText = randomWeapon;
        
        if (crateWeapons.includes(randomWeapon)) {
            targetElement.style.color = '#ff4444'; 
        } else {
            targetElement.style.color = '#fff';
        }
    }, 100);
}