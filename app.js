// =====================
// Mars Habitat Designer JS
// ИСПРАВЛЕННЫЙ И ОБНОВЛЕННЫЙ КОД (ВКЛЮЧАЯ КОНСТРУКТОР МЕБЕЛИ)
// =====================

// --- Перевод типов зон ---
// app.js (начало файла)

// --- Перевод типов зон ---
// Здесь мы тоже переводим стандартные названия мебели для ясности!
const ZONE_NAMES = {
    sleep: 'Crew Quarters',
    kitchen: 'Galley',
    lab: 'Lab',
    hygiene: 'Hygiene Module',
    exercise: 'Gym',
    medical: 'Medical module',
    storage: 'Storage',
    greenhouse: 'Greenhouse',
    multipurpose: 'Multipurpose',
    workshop: 'Workshop'
};

// --- State ---
const state = {
    planetIndex: 0,
    // 1. Array with English names - КОРРЕКЦИЯ
    planets: ['Mars','Moon','ISS', 'Transit Module'], 
    zones: [],
    selectedZoneId: null,
    module: {len:8, wid:4, hgt:2.5, crew:4, shape:'cylinder'}
};

const planetImages = {
    // 2. Keys must match the array names - КОРРЕКЦИЯ
    'Mars': 'assets/mars.jpeg',
    'Moon': 'assets/moon.jpg',
    'ISS': 'assets/mks.jpg',
    'Transit Module': 'assets/transit.png' 
};

// Расширенные данные о планетах
const planetData = {
    // 3. Keys must match the array names - КОРРЕКЦИЯ
    'Mars': { 
        gravity: 3.71, pressure: 0.006, atm: 'CO₂-rich', 
        color: '#8b45131a', 
        desc: 'Long-term stay, high radiation protection requirements.'
    },
    'Moon': { 
        gravity: 1.62, pressure: 0.000001, atm: 'none', 
        color: '#cccccc1a', 
        desc: 'Low gravity, high dust, extreme temperatures.'
    },
    'ISS': { 
        gravity: 0.0, pressure: 1.0, atm: 'O₂/N₂ mix', 
        color: '#00bfff1a', 
        desc: 'Microgravity, atmospheric pressure, closed life support system.'
    },
    'Transit Module': { 
        gravity: 0.0, pressure: 1.0, atm: 'O₂/N₂ mix', 
        color: '#ff69b41a', 
        desc: 'Prolonged weightlessness, high psychological requirements, minimal space.'
    }
};// --- Minima & Requirements ---
const minima = {
    floorPerCrew: 10, // м² на человека
    volumePerCrew: 20, // м³ на человека
    zones: {
        sleep: { minAreaPerPerson: 2.5, required: true },
        kitchen: { minArea: 5, required: true },
        lab: { minArea: 8, required: true },
        hygiene: { minArea: 4, required: true },
        exercise: { minArea: 6, required: true, lowGMultiplier: 1.5 }, // Увеличение площади при низкой гравитации
        medical: { minArea: 6, required: true },
        storage: { minArea: 8, required: false },
        greenhouse: { minArea: 10, required: false },
        multipurpose: { minArea: 10, required: false },
        workshop: { minArea: 8, required: false }
    }
};
// --- КОНЕЦ БЛОКА minima ---



// 4. Мебель (furnitureMap) - Если вы хотите английскую мебель, замените и этот блок:
const furnitureMap = {
    sleep:['Fixation bed', 'Personal locker'], 
    kitchen:['Galley unit', 'Dining table', 'Water filtration'], 
    lab:['Work station', 'Sample analyzer', 'Experiment containers'],
    hygiene:['Vacuum toilet', 'Washbasin', 'Shower cabin'], 
    exercise:['Treadmill (fixed)', 'Exercise bike'], 
    medical:['Health scanner', 'Isolation unit', 'First aid kit'],
    storage:['Supply shelving', 'Toolbox'],
    greenhouse:['Hydroponics unit', 'Lighting zone', 'Soil containers'],
    multipurpose:['Folding table', 'Fixed chairs', 'Relaxation zone'],
    workshop:['3D-Printer', 'Workbench', 'Spare parts storage']
};
// ... Остальной код app.js ...


// --- DOM elements ---
const tabs = document.querySelectorAll('.nav a');
const tabSections = document.querySelectorAll('.tab');
const startBtn = document.getElementById('startBtn');
const planetImg = document.getElementById('planetImg');
const prevBody = document.getElementById('prevBody');
const nextBody = document.getElementById('nextBody');
const planetLabel = document.getElementById('planetLabel');

const floorCanvas = document.getElementById('floorCanvas');
const zonesList = document.getElementById('zonesList');
const addZoneBtn = document.getElementById('addZone');
const newZoneType = document.getElementById('newZoneType');
const applyDims = document.getElementById('applyDims');
const lenI = document.getElementById('len');
const widI = document.getElementById('wid');
const hgtI = document.getElementById('hgt');
const crewI = document.getElementById('crew');
const shapeSelect = document.getElementById('shapeSelect');

const roomEditor = document.getElementById('roomEditor');
const roomEditorTitle = document.getElementById('roomEditorTitle');
const furnitureList = document.getElementById('furnitureList');
const newFurnitureName = document.getElementById('newFurnitureName'); // Новый элемент
const addFurnitureBtn = document.getElementById('addFurnitureBtn'); // Новый элемент
const closeRoom = document.getElementById('closeRoom');
const saveRoom = document.getElementById('saveRoom');
const analyticsContent = document.getElementById('analyticsContent');
const exportJSON = document.getElementById('exportJSON');
const exportPNG = document.getElementById('exportPNG');

// --- Initialization ---
let zoneIdCounter = 1;
let dragging = null;
let resizing = null;
let dragOffset = {x:0, y:0};

function init() {
    // Tabs
    tabs.forEach(a => a.addEventListener('click', e=>{
        e.preventDefault(); openTab(a.dataset.tab);
    }));
    document.querySelectorAll('[data-tab="editor"], #startBtn')
        .forEach(el => el?.addEventListener('click', ()=>openTab('editor')));

    // Planet switcher
    prevBody.addEventListener('click',()=>switchPlanet(-1));
    nextBody.addEventListener('click',()=>switchPlanet(1));
    updatePlanetUI();
    populateZoneTypes(); 

    // Editor
    addZoneBtn.addEventListener('click', addZoneFromUI);
    applyDims.addEventListener('click', applyDimensions);

    // Добавление Drag&Resize
    floorCanvas.addEventListener('mousedown', canvasMouseDown);
    document.addEventListener('mousemove', documentMouseMove);
    document.addEventListener('mouseup', documentMouseUp);

    // Room Editor Handlers
    addFurnitureBtn.addEventListener('click', addFurniture);
    closeRoom.addEventListener('click', ()=>roomEditor.classList.add('hidden'));
    saveRoom.addEventListener('click', saveRoomEditor);

    exportJSON.addEventListener('click', exportProjectJSON);
    exportPNG.addEventListener('click', exportPNGFunc);

    loadState();
    render();
}

// Заполняет выпадающий список `newZoneType` на русском
function populateZoneTypes() {
    newZoneType.innerHTML = Object.keys(minima.zones).map(key => 
        `<option value="${key}">${ZONE_NAMES[key] || key}</option>`
    ).join('');
}

// --- Tabs ---
function openTab(name){
    tabs.forEach(a=>a.classList.toggle('active', a.dataset.tab===name));
    tabSections.forEach(s=>s.classList.toggle('visible', s.id===name));
    if(name==='editor') renderFloor();
    if(name==='analytics') renderAnalytics();
}

// --- Planet ---
function switchPlanet(dir){
    state.planetIndex = (state.planetIndex + dir + state.planets.length) % state.planets.length;
    updatePlanetUI();
    applyDimensions(); 
}

function updatePlanetUI(){
    const planet = state.planets[state.planetIndex];
    planetLabel.textContent = planet;
    planetImg.src = planetImages[planet] || `https://placehold.co/400x300/444444/FFFFFF?text=${planet}`; 
}

// --- Dimensions ---
function applyDimensions(){
    state.module.len = Math.max(1, parseFloat(lenI.value)||8);
    state.module.wid = Math.max(1, parseFloat(widI.value)||4);
    state.module.hgt = Math.max(1, parseFloat(hgtI.value)||2.5);
    state.module.crew = Math.max(1, parseInt(crewI.value)||4);
    state.module.shape = shapeSelect.value;

    saveState();
    renderFloor();
    renderAnalytics();
}

// --- Zones ---
function addZoneFromUI(){
    const type = newZoneType.value;
    let w = 100, h = 70; 

    // Корректировка размеров для тренировочной зоны при низкой гравитации
    const currentPlanet = state.planets[state.planetIndex];
    const gravity = planetData[currentPlanet].gravity;
    const lowGMultiplier = minima.zones[type]?.lowGMultiplier || 1;

    if (type === 'exercise' && gravity < 3.7 && lowGMultiplier > 1) {
        w = Math.round(w * lowGMultiplier);
        h = Math.round(h * lowGMultiplier);
    }

    const z = {id:'z'+(zoneIdCounter++), type, x:50, y:50, w, h, furniture:[]};
    
    // Добавляем стандартную мебель
    z.furniture = furnitureMap[type] ? [...furnitureMap[type]] : [];

    state.zones.push(z);
    saveState();
    render();
    openTab('editor');
}

// --- Render ---
function render(){
    renderZonesList();
    renderFloor();
    renderAnalytics();
}

function renderZonesList(){
    zonesList.innerHTML='';
    state.zones.forEach(z=>{
        const el = document.createElement('div');
        el.className='zone-item';
        // Используем ZONE_NAMES для отображения на русском
        const displayName = ZONE_NAMES[z.type] || z.type; 
        el.innerHTML=`<div><strong>${displayName}</strong> (${z.id})</div>
                      <div>
                        <button data-id="${z.id}" class="editZone">Edit</button>
                        <button data-id="${z.id}" class="delZone">×</button>
                      </div>`;
        zonesList.appendChild(el);
    });
    // Обработчики для кнопок редактирования/удаления
    zonesList.querySelectorAll('.editZone').forEach(b=>b.addEventListener('click', e=>openRoomEditor(e.target.dataset.id)));
    zonesList.querySelectorAll('.delZone').forEach(b=>b.addEventListener('click', e=>{ deleteZone(e.target.dataset.id); }));
}

function deleteZone(id){
    state.zones = state.zones.filter(z=>z.id!==id);
    saveState(); render();
}

function colorForType(type) {
    const colors = {
        sleep: '#1abc9c', kitchen: '#e74c3c', lab: '#3498db', hygiene: '#9b59b6',
        exercise: '#f39c12', medical: '#e67e22', storage: '#95a5a6', 
        greenhouse: '#2ecc71', multipurpose: '#f1c40f', workshop: '#7f8c8d' 
    };
    return colors[type] || '#bdc3c7';
}

function renderFloor(){
    floorCanvas.innerHTML='';
    const pad = 20, viewW = 800-40, viewH = 400-40;
    
    const currentPlanet = state.planets[state.planetIndex];
    const planetColor = planetData[currentPlanet].color || '#0b0b0c1a';
    
    // background rect (Module outline)
    const floorRect = document.createElementNS('http://www.w3.org/2000/svg','rect');
    floorRect.setAttribute('x',pad); floorRect.setAttribute('y',pad);
    floorRect.setAttribute('width',viewW); floorRect.setAttribute('height',viewH);
    floorRect.setAttribute('fill', planetColor);
    floorRect.setAttribute('stroke', colorForType(currentPlanet) || 'rgba(255,255,255,0.04)');
    floorRect.setAttribute('rx',12);
    floorCanvas.appendChild(floorRect);

    state.zones.forEach(z=>{
        const g = document.createElementNS('http://www.w3.org/2000/svg','g');
        g.setAttribute('data-id',z.id);
        
        // Zone rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
        rect.setAttribute('x', pad+z.x); rect.setAttribute('y', pad+z.y);
        rect.setAttribute('width', z.w); rect.setAttribute('height', z.h);
        rect.setAttribute('fill', colorForType(z.type));
        rect.setAttribute('fill-opacity',0.1);
        rect.setAttribute('stroke', colorForType(z.type));
        rect.setAttribute('rx',6);
        rect.addEventListener('mousedown', zoneMouseDown);
        // Открытие редактора мебели по ДВОЙНОМУ клику
        rect.addEventListener('dblclick', ()=>openRoomEditor(z.id)); 
        g.appendChild(rect);

        // label (используем русское название)
        const displayName = ZONE_NAMES[z.type] || z.type;
        const label = document.createElementNS('http://www.w3.org/2000/svg','text');
        label.setAttribute('x', pad+z.x+6);
        label.setAttribute('y', pad+z.y+16);
        label.setAttribute('fill','#fff'); label.setAttribute('font-size',12);
        label.textContent=`${displayName} (${(z.w/100 * state.module.len).toFixed(1)}x${(z.h/100 * state.module.wid).toFixed(1)} m)`;
        g.appendChild(label);

        // resize handle
        const handle = document.createElementNS('http://www.w3.org/2000/svg','rect');
        handle.setAttribute('class', 'resize-handle');
        handle.setAttribute('x', pad+z.x+z.w-10);
        handle.setAttribute('y', pad+z.y+z.h-10);
        handle.setAttribute('width',10); handle.setAttribute('height',10);
        handle.setAttribute('fill','rgba(255,255,255,0.2)');
        handle.setAttribute('cursor','nwse-resize');
        
        handle.addEventListener('mousedown', handleMouseDown);
        
        g.appendChild(handle);
        floorCanvas.appendChild(g);
    });
}

// --- Drag & Resize ---
function getZoneById(id) {
    return state.zones.find(z => z.id === id);
}

function zoneMouseDown(e) {
    e.stopPropagation();
    const zoneId = e.target.closest('g').dataset.id;
    const zone = getZoneById(zoneId);
    dragging = zone;
    dragOffset = {x: e.offsetX - zone.x, y: e.offsetY - zone.y};
    document.body.style.cursor = 'grabbing';
}

function handleMouseDown(e) {
    e.stopPropagation();
    const zoneId = e.target.closest('g').dataset.id;
    resizing = getZoneById(zoneId);
    document.body.style.cursor = 'nwse-resize';
}

function documentMouseMove(e) {
    const rect = floorCanvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const pad = 20;
    const viewW = 800 - 2 * pad;
    const viewH = 400 - 2 * pad;

    if (dragging) {
        let newX = canvasX - dragOffset.x - pad;
        let newY = canvasY - dragOffset.y - pad;
        
        dragging.x = Math.max(0, Math.min(newX, viewW - dragging.w));
        dragging.y = Math.max(0, Math.min(newY, viewH - dragging.h));
        
        renderFloor();
    } else if (resizing) {
        let newW = canvasX - pad - resizing.x;
        let newH = canvasY - pad - resizing.y;
        
        resizing.w = Math.max(20, newW); 
        resizing.h = Math.max(20, newH);
        
        resizing.w = Math.min(resizing.w, viewW - resizing.x);
        resizing.h = Math.min(resizing.h, viewH - resizing.y);

        renderFloor();
    }
}

function documentMouseUp() {
    if (dragging || resizing) {
        dragging = null;
        resizing = null;
        document.body.style.cursor = 'default';
        saveState();
        renderAnalytics();
    }
}

function canvasMouseDown(e) {
    //
}

// --- Room Editor (Мебель) ---

function renderFurnitureList(zone) {
    furnitureList.innerHTML = '';
    zone.furniture.forEach((f, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${f}</span>
                        <button class="remove-furniture-btn" data-index="${index}">×</button>`;
        furnitureList.appendChild(li);
    });

    // Добавляем обработчики для удаления
    furnitureList.querySelectorAll('.remove-furniture-btn').forEach(btn => {
        btn.addEventListener('click', removeFurniture);
    });
}

function openRoomEditor(id) {
    state.selectedZoneId = id;
    const zone = getZoneById(id);
    const displayName = ZONE_NAMES[zone.type] || zone.type;
    roomEditorTitle.textContent = `Editing: ${displayName} (${zone.id})`;
    
    // Отрисовка списка текущей мебели
    renderFurnitureList(zone);

    roomEditor.classList.remove('hidden');
    newFurnitureName.value = ''; // Очистка поля ввода
}

function addFurniture() {
    const furnitureName = newFurnitureName.value.trim();
    if (furnitureName && state.selectedZoneId) {
        const zone = getZoneById(state.selectedZoneId);
        if (zone && !zone.furniture.includes(furnitureName)) {
            zone.furniture.push(furnitureName);
            newFurnitureName.value = '';
            renderFurnitureList(zone);
        }
    }
}

function removeFurniture(e) {
    const index = parseInt(e.target.dataset.index);
    if (state.selectedZoneId && !isNaN(index)) {
        const zone = getZoneById(state.selectedZoneId);
        if (zone) {
            zone.furniture.splice(index, 1); // Удаляем элемент по индексу
            renderFurnitureList(zone); // Перерисовываем список
        }
    }
}

function saveRoomEditor() {
    // Мебель уже сохранена в state.zones через функции addFurniture/removeFurniture
    roomEditor.classList.add('hidden');
    saveState();
}

// --- Persistence ---
function saveState() {
    try {
        localStorage.setItem('marsHabitatState', JSON.stringify(state));
    } catch(e) {
        console.error("Could not save state:", e);
    }
}

function loadState() {
    try {
        const savedState = localStorage.getItem('marsHabitatState');
        if (savedState) {
            const loaded = JSON.parse(savedState);
            Object.assign(state, loaded);
            if (state.zones.length > 0) {
                const lastId = state.zones[state.zones.length - 1]?.id;
                if (lastId) {
                    zoneIdCounter = parseInt(lastId.replace('z', '')) + 1;
                }
            }
        }
    } catch(e) {
        console.error("Could not load state:", e);
    }
}

// --- Analytics & Export ---
function calculateMetrics() {
    const viewW = 800 - 40; // Ширина модуля в пикселях (760)
    const viewH = 400 - 40; // Высота модуля в пикселях (360)

    // Коэффициенты перевода пикселей в метры
    const scaleX = state.module.len / viewW;
    const scaleY = state.module.wid / viewH;
    
    let totalArea = 0;
    const zoneAnalysis = {};
    
    state.zones.forEach(z => {
        const areaSqM = (z.w * scaleX) * (z.h * scaleY);
        totalArea += areaSqM;
        
        const reqs = minima.zones[z.type];
        let requiredArea = 0;

        if (reqs.minArea) {
            requiredArea = reqs.minArea;
        } else if (reqs.minAreaPerPerson) {
            requiredArea = reqs.minAreaPerPerson * state.module.crew;
        }
        
        zoneAnalysis[z.id] = {
            type: z.type,
            area: areaSqM,
            required: requiredArea,
            isSufficient: areaSqM >= requiredArea
        };
    });

    const totalVolume = totalArea * state.module.hgt;
    const crew = state.module.crew;

    return {
        totalArea,
        totalVolume,
        areaPerCrew: totalArea / crew,
        volumePerCrew: totalVolume / crew,
        crew,
        zoneAnalysis
    };
}

function renderAnalytics() {
    const metrics = calculateMetrics();
    const currentPlanet = state.planets[state.planetIndex];
    const planetInfo = planetData[currentPlanet];
    
    let isHabitable = true;

    let html = `
        <h2>General metrics (${currentPlanet})</h2>
        <p class="small">Description: ${planetInfo.desc}</p>
        <p><strong>Gravity:</strong> ${planetInfo.gravity} m/s² | <strong>Pressure:</strong> ${planetInfo.pressure} atm | <strong>Atmosphere:</strong> ${planetInfo.atm}</p>
        <hr/>
        
        <h3>Module</h3>
        <p>Crew: <strong>${metrics.crew}</strong> ppl.</p>
        <p>Total area (floor): <strong>${metrics.totalArea.toFixed(2)} m²</strong> (Module ${state.module.len}x${state.module.wid} m)</p>
        <p>Height: <strong>${state.module.hgt} m</strong></p>
        
        <h3>Life Support</h3>
        ${renderMetricLine("Area per person", metrics.areaPerCrew, minima.floorPerCrew, ' m²', 'floorPerCrew')}
        ${renderMetricLine("Volume per person", metrics.volumePerCrew, minima.volumePerCrew, ' m³', 'volumePerCrew')}
        
        <h3>Zone status</h3>
        <ul style="padding-left: 20px;">
            ${Object.values(minima.zones).filter(z => z.required).map(req => {
                const type = Object.keys(minima.zones).find(key => minima.zones[key] === req);
                const zonesOfType = state.zones.filter(z => z.type === type);
                const hasZone = zonesOfType.length > 0;
                let status = '';
                const displayName = ZONE_NAMES[type] || type;
                
                if (!hasZone) {
                    isHabitable = false;
                    status = `<span style="color:#e74c3c; font-weight: bold;">[ERROR]</span> Mandatory Zone Missing: ${displayName}.`;
                } else {
                    const combinedArea = zonesOfType.reduce((sum, z) => sum + metrics.zoneAnalysis[z.id].area, 0);
                    const requiredArea = req.minArea ? req.minArea : (req.minAreaPerPerson * metrics.crew);
                    
                    if (combinedArea < requiredArea) {
                        isHabitable = false;
                        status = `<span style="color:red; font-weight: bold;">[FEW]</span> ${displayName}: ${combinedArea.toFixed(2)} m² / ${requiredArea.toFixed(2)} m² <span style="color:#f39c12;">(Additional area is required).</span>   `;
                    } else {
                         status = `<span style="color:#2ecc71;">[OK]</span> ${displayName}: ${combinedArea.toFixed(2)} m² <span style="color:green;">(Sufficient).</span>`;
                    }
                }
                return `<li>${status}</li>`;
            }).join('')}
        </ul>
        <hr/>
        <div style="font-size: 1.1em; font-weight: bold; padding: 10px; border-radius: 5px; text-align: center; background: ${isHabitable ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)'}; color: ${isHabitable ? '#2ecc71' : '#e74c3c'};">
            Suitability status: ${isHabitable ? 'SUITABLE' : 'NOT SUITABLE'}
        </div>
    `;

    analyticsContent.innerHTML = html;
}

function renderMetricLine(label, value, minimum, unit, key) {
    const isSufficient = value >= minimum;
    const color = isSufficient ? '#2ecc71' : '#e74c3c';
    return `<p>${label}: <strong style="color:${color}">${value.toFixed(2)}${unit}</strong> (min. ${minimum}${unit})</p>`;
}

// export
function exportProjectJSON(){
    const out = JSON.stringify(state, null, 2);
    const blob = new Blob([out], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'mhd_project.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    // Не используем alert() - заменяем на console.log или кастомное сообщение
    console.log('Project exportet to JSON!');
}

// export PNG (rasterize SVG)
// export PNG (rasterize SVG)
function exportPNGFunc(){
    // 1. Сериализуем SVG в строку для получения полного и чистого XML
    const svgString = new XMLSerializer().serializeToString(floorCanvas);
    
    // 2. Кодируем строку в Base64 Data URL, чтобы избежать проблем с безопасностью
    const svgBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

    const img = new Image();
    
    // Эта функция сработает, когда кодированное изображение будет готово
    img.onload = ()=>{
        // Создаем Canvas для отрисовки
        const canvas = document.createElement('canvas'); 
        canvas.width = 1600; // Двойное разрешение для качества
        canvas.height = 800;
        const ctx = canvas.getContext('2d');
        
        // Рисуем фон (черный)
        ctx.fillStyle = '#070809'; 
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        // Рисуем SVG на Canvas
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        
        // Экспорт
        const link = document.createElement('a');
        link.download = 'habitat_floorplan.png';
        
        // Преобразуем Canvas в PNG и запускаем скачивание
        link.href = canvas.toDataURL('image/png');
        link.click();
        link.remove();
        
        console.log('Floor plan exported to PNG!');
    };
    
    // Устанавливаем Data URL в качестве источника (это надежно обходит блокировку)
    img.src = svgBase64;
}

// --- Run App ---
document.addEventListener('DOMContentLoaded', init);