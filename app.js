// Maths Quest - S1 Revision Game Engine

// --- Game Data & State ---
const topics = [
    { id: 'numbers', name: 'Whole Numbers', icon: '🔢', desc: 'Numeracy, estimation, and rounding', color: '#ef4444' },
    { id: 'algebra', name: 'Letters & Numbers', icon: '🔤', desc: 'Sequences, expressions, and number machines', color: '#f97316' },
    { id: 'decimals', name: 'Decimals', icon: '⏱️', desc: 'Ordering, operations, and x10/100', color: '#eab308' },
    { id: 'coordinates', name: 'Coordinates', icon: '🗺️', desc: 'Plotting, reading, and shapes', color: '#84cc16' },
    { id: 'fractions', name: 'Fractions', icon: '🍕', desc: 'Simplifying, finding amounts, and equivalent', color: '#22c55e' },
    { id: 'equations', name: 'Equations', icon: '⚖️', desc: 'Solving and forming equations', color: '#10b981' },
    { id: 'negative', name: 'Negative Numbers', icon: '🌡️', desc: 'Ordering, operations, and substitution', color: '#06b6d4' },
    { id: 'percentages', name: 'Percentages', icon: '💯', desc: 'Calculating amounts and converting', color: '#3b82f6' },
    { id: 'symmetry', name: 'Symmetry', icon: '🦋', desc: 'Lines of symmetry and identification', color: '#6366f1' },
    { id: 'graphs', name: 'Graphs & Stats', icon: '📊', desc: 'Bar charts, pie charts, and scatter graphs', color: '#d946ef' }
];

const difficulties = ['Foundation', 'Standard', 'Challenge'];
const xpPerDifficulty = [10, 20, 35];

let gameState = {
    currentScreen: 'welcome-screen',
    currentTopic: null,
    currentDifficulty: 0,
    questions: [],
    currentQuestionIndex: 0,
    score: parseInt(localStorage.getItem('mathsQuestScore')) || 0,
    level: parseInt(localStorage.getItem('mathsQuestLevel')) || 1,
    streak: 0,
    bestStreak: parseInt(localStorage.getItem('mathsQuestBestStreak')) || 0,
    correctCount: 0,
    sessionXp: 0,
    topicProgress: JSON.parse(localStorage.getItem('mathsQuestTopics')) || {},
    totalAnswered: parseInt(localStorage.getItem('mathsQuestAnswered')) || 0,
    totalCorrect: parseInt(localStorage.getItem('mathsQuestCorrect')) || 0
};

// Initialize Topic Progress if empty
if (Object.keys(gameState.topicProgress).length === 0) {
    topics.forEach(t => {
        gameState.topicProgress[t.id] = { answered: 0, correct: 0, xp: 0 };
    });
}

// --- Utility Functions ---
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Ensure unique answer options
function generateOptions(correctAnswer, offsetRange = 3, isString = false) {
    let options = [correctAnswer];
    let attempts = 0;
    while(options.length < 4 && attempts < 50) {
        attempts++;
        let wrong;
        if(isString) {
            // Very basic hardcoded variations for strings if needed (handled specifically per generator usually)
            wrong = correctAnswer + " (alt" + attempts + ")"; 
        } else {
             // Handle numbers
             let offset = getRndInteger(1, offsetRange) * (Math.random() > 0.5 ? 1 : -1);
             wrong = Number(correctAnswer) + offset;
             
             // specific logic to avoid negative answers in simple questions if right answer is positive
             if(correctAnswer >= 0 && wrong < 0) wrong = Math.abs(wrong);
             
             // if it's a decimal, fix float math issues
             if(correctAnswer % 1 !== 0) {
                 wrong = Number(wrong.toFixed(2));
             }
        }

        if(!options.includes(wrong)) {
            options.push(wrong);
        }
    }
    
    // Fallback if loop hit max attempts
    let pad = 1;
    while(options.length < 4) {
        let val = Number(correctAnswer) + pad * Math.max(1, offsetRange);
        if(!isNaN(val) && !options.includes(val)) options.push(val);
        pad++;
    }
    
    return shuffleArray(options);
}


// --- Question Generators ---
const generators = {
    numbers: (diff) => {
        let qs = [];
        for(let i=0; i<10; i++) {
            let type = getRndInteger(0, diff === 0 ? 1 : diff === 1 ? 3 : 4);
            let qText, ans, options;
            
            if(type === 0 || type === 1) { // Add/Sub
                let max = diff === 0 ? 50 : diff === 1 ? 500 : 5000;
                let a = getRndInteger(max/10, max);
                let b = getRndInteger(max/10, max);
                if(type === 0) {
                    qText = `What is ${a} + ${b}?`;
                    ans = a + b;
                } else {
                    if(b > a) [a,b] = [b,a];
                    qText = `What is ${a} - ${b}?`;
                    ans = a - b;
                }
                options = generateOptions(ans, diff === 0 ? 5 : 20);
            } 
            else if(type === 2) { // Rounding
                let a = getRndInteger(100, 9999);
                let target = getRndInteger(0,1) === 0 ? 10 : 100;
                qText = `Round ${a} to the nearest ${target}.`;
                ans = Math.round(a / target) * target;
                options = [ans, Math.floor(a/target)*target, Math.ceil(a/target)*target, ans + target];
                options = [...new Set(options)];
                while(options.length < 4) options.push(ans - target * (4 - options.length));
                options = shuffleArray(options);
            }
            else { // Multiply/Divide
                let maxA = diff === 1 ? 12 : 50;
                let a = getRndInteger(2, maxA);
                let b = getRndInteger(2, 12);
                if(type === 3) { // Mult
                    qText = `What is ${a} × ${b}?`;
                    ans = a * b;
                    options = generateOptions(ans, b);
                } else { // Div
                    let prod = a * b;
                    qText = `What is ${prod} ÷ ${a}?`;
                    ans = b;
                    options = generateOptions(ans, 2);
                }
            }
            qs.push({ text: qText, correctAnswer: ans.toString(), options: options.map(String) });
        }
        return qs;
    },
    
    algebra: (diff) => {
        let qs = [];
        for(let i=0; i<10; i++) {
            let type = getRndInteger(0, diff === 0 ? 0 : 2);
            let qText, ans, options;
            if(type === 0) { // Sequences
                let start = getRndInteger(1, 10);
                let step = getRndInteger(2, diff === 0 ? 5 : 15);
                if(diff > 1 && Math.random() > 0.5) step *= -1;
                qText = `Find the next number: ${start}, ${start+step}, ${start+step*2}, ${start+step*3}, ...`;
                ans = start + step*4;
                options = generateOptions(ans, Math.abs(step));
            } else if (type === 1) { // Simplify
                let v = ['a','x','y','p'][getRndInteger(0,3)];
                let c1 = getRndInteger(2, 8);
                let c2 = getRndInteger(2, 8);
                qText = `Simplify: ${c1}${v} + ${c2}${v}`;
                ans = `${c1+c2}${v}`;
                options = [ans, `${c1*c2}${v}`, `${Math.abs(c1-c2)}${v}`, `${c1+c2}`];
                if(options[2] === `0${v}`) options[2] = `2${v}`;
                options = shuffleArray(options);
            } else { // Number machines
                let inVal = getRndInteger(2, 10);
                let addVal = getRndInteger(1, 10);
                let multVal = getRndInteger(2, 5);
                qText = `Number Machine: IN(${inVal}) → [×${multVal}] → [+${addVal}] → OUT(?)`;
                ans = inVal * multVal + addVal;
                options = generateOptions(ans, 5);
            }
            qs.push({ text: qText, correctAnswer: ans.toString(), options: options.map(String) });
        }
        return qs;
    },

    decimals: (diff) => {
        let qs = [];
        for(let i=0; i<10; i++) {
            let a = (getRndInteger(1, 99) / 10).toFixed(1);
            let type = getRndInteger(0, diff === 0 ? 1 : 2);
            let qText, ans, options;
            if(type === 0) {
                let b = (getRndInteger(1, 99) / 10).toFixed(1);
                qText = `What is ${a} + ${b}?`;
                ans = (Number(a) + Number(b)).toFixed(1);
                options = generateOptions(Number(ans), 5).map(n => Number(n).toFixed(1));
            } else if (type === 1) {
                let mult = [10, 100, 1000][getRndInteger(0, diff === 0 ? 1 : 2)];
                qText = `What is ${a} × ${mult}?`;
                ans = (Number(a) * mult).toString();
                options = [(Number(a)*10).toString(), (Number(a)*100).toString(), (Number(a)*1000).toString(), (Number(a)*10000).toString()];
            } else {
                let div = [10, 100][getRndInteger(0,1)];
                qText = `What is ${a} ÷ ${div}?`;
                ans = (Number(a) / div).toString();
                options = [(Number(a)/10).toString(), (Number(a)/100).toString(), (Number(a)/1000).toString(), Number(a).toString()];
            }
            qs.push({ text: qText, correctAnswer: ans, options: shuffleArray([...new Set(options)].slice(0,4)) });
        }
        return qs;
    },
    
    coordinates: (diff) => {
        let qs = [];
        for(let i=0; i<10; i++) {
            let type = getRndInteger(0, diff === 0 ? 0 : 1);
            let qText, ans, options;
            if(type === 0) { // Midpoint
                let max = diff === 0 ? 5 : 10;
                let x1 = getRndInteger(0, max) * (diff > 0 ? (Math.random() > 0.5 ? 1 : -1) : 1);
                let y1 = getRndInteger(0, max) * (diff > 0 ? (Math.random() > 0.5 ? 1 : -1) : 1);
                let x2 = getRndInteger(0, max) * (diff > 0 ? (Math.random() > 0.5 ? 1 : -1) : 1);
                let y2 = getRndInteger(0, max) * (diff > 0 ? (Math.random() > 0.5 ? 1 : -1) : 1);
                // Ensure even difference for whole number midpoints
                if(Math.abs(x1-x2) % 2 !== 0) x2++;
                if(Math.abs(y1-y2) % 2 !== 0) y2++;
                
                qText = `What is the midpoint of (${x1}, ${y1}) and (${x2}, ${y2})?`;
                let mx = (x1+x2)/2;
                let my = (y1+y2)/2;
                ans = `(${mx}, ${my})`;
                options = [ans, `(${mx+1}, ${my})`, `(${mx}, ${my-1})`, `(${my}, ${mx})`];
                if(options[0] === options[3]) options[3] = `(${mx-1}, ${my+1})`;
                options = shuffleArray(options);
            } else { // Translating / Geometry
                let x = getRndInteger(-5, 5); let y = getRndInteger(-5, 5);
                let dx = getRndInteger(1, 4) * (Math.random() > 0.5 ? 1 : -1);
                let dy = getRndInteger(1, 4) * (Math.random() > 0.5 ? 1 : -1);
                qText = `Start at (${x}, ${y}). Move ${Math.abs(dx)} ${dx > 0 ? 'right' : 'left'} and ${Math.abs(dy)} ${dy > 0 ? 'up' : 'down'}. Where are you?`;
                ans = `(${x+dx}, ${y+dy})`;
                options = [ans, `(${x-dx}, ${y+dy})`, `(${x+dx}, ${y-dy})`, `(${x+dy}, ${y+dx})`];
                options = shuffleArray([...new Set(options)]);
                while(options.length < 4) options.push(`(${x+dx+1}, ${y+dy-1})`);
            }
            qs.push({ text: qText, correctAnswer: ans, options: options });
        }
        return qs;
    },
    
    fractions: (diff) => {
        let qs = [];
        for(let i=0; i<10; i++) {
            let type = getRndInteger(0, diff === 0 ? 1 : 2);
            let qText, ans, options;
            if(type === 0) { // Fraction of amount
                let denoms = [2, 3, 4, 5, 10];
                let d = denoms[getRndInteger(0, denoms.length-1)];
                let n = getRndInteger(1, d-1);
                if(diff === 0) n = 1;
                let amount = d * getRndInteger(2, 10);
                qText = `Find ${n}/${d} of ${amount}`;
                ans = (amount / d) * n;
                options = generateOptions(ans, Math.max(2, Math.floor(ans/3))).map(String);
            } else if (type === 1) { // Simplify
                let denoms = [2, 3, 4, 5, 6, 8, 10];
                let cd = denoms[getRndInteger(0, denoms.length-1)];
                let n = getRndInteger(1, 4);
                let d = getRndInteger(n+1, 9);
                while(n===d || (d%n===0 && n>1)) { d++; } // avoid already simple
                qText = `Simplify: ${n*cd} / ${d*cd}`;
                ans = `${n}/${d}`;
                options = [ans, `${n+1}/${d}`, `${n}/${d+1}`, `${n*2}/${d}`];
                options = shuffleArray([...new Set(options)]);
                while(options.length < 4) options.push(`${n+2}/${d+1}`);
            } else { // Equivalent
                let n = getRndInteger(1, 5);
                let d = getRndInteger(n+1, 10);
                let mult = getRndInteger(2, 6);
                qText = `Find the missing number: ${n}/${d} = ?/${d*mult}`;
                ans = n * mult;
                options = generateOptions(ans, 2).map(String);
            }
            qs.push({ text: qText, correctAnswer: ans.toString(), options: options });
        }
        return qs;
    },
    
    equations: (diff) => {
        let qs = [];
        for(let i=0; i<10; i++) {
            let type = getRndInteger(0, diff === 0 ? 0 : 1);
            let qText, ans, options;
            if(type === 0) { // 1-step
                let op = getRndInteger(0, 1);
                let val = getRndInteger(2, diff === 0 ? 15 : 50);
                let ansNum = getRndInteger(1, 20);
                if(op === 0) {
                    qText = `Solve for x: x + ${val} = ${val + ansNum}`;
                } else {
                    qText = `Solve for x: x - ${val} = ${ansNum}`;
                    ansNum = ansNum + val;
                }
                ans = ansNum;
                options = generateOptions(ans, 5).map(String);
            } else { // 2-step
                let m = getRndInteger(2, 6);
                let ansNum = getRndInteger(1, 12);
                let add = getRndInteger(1, 20);
                if(Math.random() > 0.5) {
                    qText = `Solve for y: ${m}y + ${add} = ${m*ansNum + add}`;
                } else {
                    qText = `Solve for y: ${m}y - ${add} = ${m*ansNum - add}`;
                }
                ans = ansNum;
                options = generateOptions(ans, 3).map(String);
            }
            qs.push({ text: qText, correctAnswer: ans.toString(), options: options });
        }
        return qs;
    },
    
    negative: (diff) => {
        let qs = [];
        for(let i=0; i<10; i++) {
            let type = getRndInteger(0, diff === 0 ? 1 : 2);
            let qText, ans, options;
            if(type === 0) { // Add/sub
                let a = getRndInteger(-15, -1);
                let b = getRndInteger(-10, 15);
                if(Math.random() > 0.5) {
                    qText = `What is ${a} + ${b}?`;
                    ans = a + b;
                } else {
                    qText = `What is ${a} - ${b}?`;
                    ans = a - b;
                }
                options = generateOptions(ans, 4).map(String);
            } else if(type === 1) { // Temperatures
                let t = getRndInteger(-5, 8);
                let drop = getRndInteger(3, 15);
                qText = `The temperature is ${t}°C. It drops by ${drop}°C. What is the new temperature?`;
                ans = t - drop;
                options = generateOptions(ans, 3).map(String);
            } else { // substitution
                let a = getRndInteger(-5, -1);
                let b = getRndInteger(2, 8);
                qText = `If a = ${a} and b = ${b}, what is a + b?`;
                ans = a + b;
                options = generateOptions(ans, 3).map(String);
            }
            qs.push({ text: qText, correctAnswer: ans.toString(), options: options });
        }
        return qs;
    },
    
    percentages: (diff) => {
        let qs = [];
        for(let i=0; i<10; i++) {
            let type = getRndInteger(0, diff === 0 ? 0 : 1);
            let qText, ans, options;
            if(type === 0) { // % of amount
                let percs = diff === 0 ? [10, 25, 50] : [10, 20, 25, 50, 75];
                let p = percs[getRndInteger(0, percs.length-1)];
                let amount = getRndInteger(2, 20) * 10;
                qText = `Find ${p}% of £${amount}`;
                ans = (amount * p) / 100;
                options = generateOptions(ans, Math.max(2, Math.floor(ans/4))).map(n => `£${n}`);
                ans = `£${ans}`;
            } else { // Conversion
                let pairs = [
                    {f: '1/2', d: '0.5', p: '50%'},
                    {f: '1/4', d: '0.25', p: '25%'},
                    {f: '3/4', d: '0.75', p: '75%'},
                    {f: '1/10', d: '0.1', p: '10%'},
                    {f: '1/5', d: '0.2', p: '20%'},
                    {f: '3/10', d: '0.3', p: '30%'}
                ];
                let pair = pairs[getRndInteger(0, pairs.length-1)];
                let r = getRndInteger(0,2);
                if(r === 0) {
                    qText = `Write ${pair.f} as a percentage.`;
                    ans = pair.p;
                    options = [pair.p, pairs[(pairs.indexOf(pair)+1)%pairs.length].p, pairs[(pairs.indexOf(pair)+2)%pairs.length].p, '100%'];
                } else if(r === 1) {
                    qText = `Write ${pair.p} as a decimal.`;
                    ans = pair.d;
                    options = [pair.d, pairs[(pairs.indexOf(pair)+1)%pairs.length].d, pairs[(pairs.indexOf(pair)+2)%pairs.length].d, '1.0'];
                } else {
                    qText = `Write ${pair.p} as a fraction.`;
                    ans = pair.f;
                    options = [pair.f, pairs[(pairs.indexOf(pair)+1)%pairs.length].f, pairs[(pairs.indexOf(pair)+2)%pairs.length].f, '1/1'];
                }
                options = shuffleArray([...new Set(options)]);
                while(options.length < 4) options.push(`Alt Option ${options.length}`);
            }
            qs.push({ text: qText, correctAnswer: ans, options: options });
        }
        return qs;
    },
    
    symmetry: (diff) => {
        let qs = [];
        let shapes = [
            {n: 'Square', s: 4}, {n: 'Rectangle', s: 2}, {n: 'Equilateral Triangle', s: 3},
            {n: 'Isosceles Triangle', s: 1}, {n: 'Regular Pentagon', s: 5}, {n: 'Regular Hexagon', s: 6},
            {n: 'Circle', s: 'Infinite'}, {n: 'Parallelogram', s: 0}
        ];
        let letters = [
            {l: 'A', s: 1}, {l: 'B', s: 1}, {l: 'H', s: 2}, {l: 'S', s: 0}, 
            {l: 'X', s: 2}, {l: 'O', s: 2}, {l: 'E', s: 1}, {l: 'F', s: 0}
        ];
        for(let i=0; i<10; i++) {
            let type = getRndInteger(0, 1);
            let qText, ans, options;
            if(type === 0) {
                let shape = shapes[getRndInteger(0, shapes.length-1)];
                qText = `How many lines of symmetry does a ${shape.n} have?`;
                ans = shape.s.toString();
                if(ans === 'Infinite') {
                    options = ['Infinite', '0', '1', '4'];
                } else {
                    options = generateOptions(Number(ans), 2).map(String);
                }
            } else {
                let letter = letters[getRndInteger(0, letters.length-1)];
                qText = `How many lines of symmetry does the letter ${letter.l} have?`;
                ans = letter.s.toString();
                options = generateOptions(Number(ans), 1).map(String);
            }
            qs.push({ text: qText, correctAnswer: ans, options: options });
        }
        return qs;
    },
    
    graphs: (diff) => {
        let qs = [];
        for(let i=0; i<10; i++) {
            let type = getRndInteger(0, diff === 0 ? 0 : 2);
            let qText, ans, options;
            if(type === 0) { // Bar Charts (Word problems)
                let item = ['Apples', 'Oranges', 'Bananas'][getRndInteger(0,2)];
                let a = getRndInteger(5, 15);
                let b = getRndInteger(2, 8);
                qText = `On a bar chart, ${item} bar is at ${a} and Pears bar is at ${b}. How many more ${item} than Pears are there?`;
                ans = a - b;
                options = generateOptions(ans, 2).map(String);
            } else if(type === 1) { // Pie charts
                let total = getRndInteger(3, 10) * 10;
                let chunk = ['half', 'a quarter'][getRndInteger(0,1)];
                let mult = chunk === 'half' ? 0.5 : 0.25;
                qText = `In a pie chart of ${total} people, ${chunk} prefer cats. How many prefer cats?`;
                ans = total * mult;
                options = generateOptions(ans, 5).map(String);
            } else { // Scatter Graphs
                let scen = [
                    {t: 'Temperature outside vs Ice cream sales', a: 'Positive'},
                    {t: 'Age of a car vs its Value', a: 'Negative'},
                    {t: 'Shoe size vs Math score', a: 'No Correlation'},
                    {t: 'Hours studying vs Test Score', a: 'Positive'}
                ];
                let s = scen[getRndInteger(0, scen.length-1)];
                qText = `What kind of correlation would you expect on a scatter graph for: ${s.t}?`;
                ans = s.a;
                options = ['Positive', 'Negative', 'No Correlation', 'Impossible to Tell'];
                options = shuffleArray(options);
            }
            qs.push({ text: qText, correctAnswer: ans.toString(), options: options });
        }
        return qs;
    }
};

// Map generators safely
const topicMap = {
    'numbers': generators.numbers,
    'algebra': generators.algebra,
    'decimals': generators.decimals,
    'coordinates': generators.coordinates,
    'fractions': generators.fractions,
    'equations': generators.equations,
    'negative': generators.negative,
    'percentages': generators.percentages,
    'symmetry': generators.symmetry,
    'graphs': generators.graphs
};

// --- Core Game Logic ---

function initApp() {
    updateUIStats();
    generateTopicGrid();
    generateProgressDashboard();
    
    // Create particles
    const container = document.getElementById('particles-container');
    if(container) {
        for(let i=0; i<30; i++) {
            let p = document.createElement('div');
            p.style.position = 'absolute';
            p.style.width = '4px';
            p.style.height = '4px';
            p.style.background = 'rgba(255,255,255,0.2)';
            p.style.borderRadius = '50%';
            p.style.left = Math.random() * 100 + 'vw';
            p.style.top = Math.random() * 100 + 'vh';
            p.style.animation = `float ${5 + Math.random()*5}s infinite linear`;
            container.appendChild(p);
        }
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    gameState.currentScreen = screenId;
    updateUIStats();
}

function updateUIStats() {
    // Nav bar
    document.getElementById('welcome-level').innerText = gameState.level;
    document.getElementById('welcome-xp').innerText = gameState.score;
    document.getElementById('header-level').innerText = `Lvl ${gameState.level}`;
    
    // header xp bar
    let xpForNextLevel = gameState.level * 100;
    let currentLevelXp = gameState.score % 100;
    document.getElementById('header-xp-bar').style.width = `${(currentLevelXp / xpForNextLevel) * 100}%`;
}

function generateTopicGrid() {
    const grid = document.getElementById('topic-grid');
    grid.innerHTML = '';
    
    topics.forEach(topic => {
        let stats = gameState.topicProgress[topic.id];
        let progressPercent = stats.answered === 0 ? 0 : Math.round((stats.correct / stats.answered) * 100);
        
        let card = document.createElement('div');
        card.className = 'topic-card';
        card.onclick = () => selectTopic(topic.id);
        card.innerHTML = `
            <div class="topic-icon" style="color: ${topic.color}">${topic.icon}</div>
            <h3 class="topic-name">${topic.name}</h3>
            <p class="topic-desc">${topic.desc}</p>
            <div class="topic-progress">
                <div class="topic-progress-fill" style="width: ${progressPercent}%; background-color: ${topic.color}"></div>
            </div>
            <div style="font-size:0.75rem; color: #94a3b8; margin-top:0.5rem; text-align:right;">
                ${stats.answered > 0 ? progressPercent + '% Accuracy' : 'Not started'}
            </div>
        `;
        grid.appendChild(card);
    });
}

function selectTopic(topicId) {
    gameState.currentTopic = topicId;
    let topic = topics.find(t => t.id === topicId);
    document.getElementById('difficulty-topic-name').innerText = topic.name;
    document.getElementById('difficulty-topic-name').style.color = topic.color;
    showScreen('difficulty-screen');
}

function startQuickFire() {
    gameState.currentTopic = 'mixed';
    gameState.currentDifficulty = 1; // Standard
    
    // Mix questions from top 3 topics
    let qs = [];
    qs = qs.concat(generators.numbers(1).slice(0,3));
    qs = qs.concat(generators.algebra(1).slice(0,3));
    qs = qs.concat(generators.decimals(1).slice(0,4));
    
    gameState.questions = shuffleArray(qs);
    setupQuiz();
}

function startQuiz(difficulty) {
    gameState.currentDifficulty = difficulty;
    
    let genFunc = topicMap[gameState.currentTopic] || generators.numbers;
    gameState.questions = genFunc(difficulty);
    
    setupQuiz();
}

function setupQuiz() {
    gameState.currentQuestionIndex = 0;
    gameState.correctCount = 0;
    gameState.streak = 0;
    gameState.sessionXp = 0;
    
    let topicName = gameState.currentTopic === 'mixed' ? 'Quick Fire Mix' : topics.find(t => t.id === gameState.currentTopic).name;
    document.getElementById('quiz-topic-badge').innerText = topicName;
    document.getElementById('quiz-score').innerText = '0 XP';
    updateStreak(0);
    
    showScreen('quiz-screen');
    loadQuestion();
}

function loadQuestion() {
    let q = gameState.questions[gameState.currentQuestionIndex];
    
    document.getElementById('quiz-progress-text').innerText = `${gameState.currentQuestionIndex + 1} / ${gameState.questions.length}`;
    document.getElementById('quiz-progress-fill').style.width = `${((gameState.currentQuestionIndex) / gameState.questions.length) * 100}%`;
    
    document.getElementById('question-diff-badge').innerText = gameState.currentTopic === 'mixed' ? 'MIXED' : difficulties[gameState.currentDifficulty];
    
    const card = document.getElementById('question-card');
    card.classList.remove('shake');
    // trigger reflow to allow popin animation again
    void card.offsetWidth;
    
    document.getElementById('question-text').innerText = q.text;
    document.getElementById('question-hint').style.display = 'none';
    
    let area = document.getElementById('answer-area');
    area.innerHTML = '';
    
    // Always use multiple choice for this prototype
    let grid = document.createElement('div');
    grid.className = 'answer-grid';
    
    q.options.forEach(opt => {
        let btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.innerText = opt;
        btn.onclick = () => submitAnswer(opt, btn);
        grid.appendChild(btn);
    });
    
    area.appendChild(grid);
}

function updateStreak(val) {
    gameState.streak = val;
    document.getElementById('streak-num').innerText = val;
    let counter = document.getElementById('streak-counter');
    if(val >= 3) {
        counter.classList.add('active');
        counter.style.color = '#ef4444'; 
    } else {
        counter.classList.remove('active');
        counter.style.color = 'inherit';
    }
}

function submitAnswer(selectedAns, btnElement) {
    let q = gameState.questions[gameState.currentQuestionIndex];
    let isCorrect = selectedAns === q.correctAnswer;
    
    // Disable all buttons
    document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);
    
    let xpEarned = 0;
    
    if(isCorrect) {
        btnElement.classList.add('correct');
        gameState.correctCount++;
        updateStreak(gameState.streak + 1);
        
        if(gameState.streak > gameState.bestStreak) {
            gameState.bestStreak = gameState.streak;
            localStorage.setItem('mathsQuestBestStreak', gameState.bestStreak);
        }
        
        // Calc XP
        let baseXP = xpPerDifficulty[gameState.currentDifficulty] || 20;
        let streakBonus = gameState.streak >= 3 ? Math.floor(baseXP * 0.5) : 0;
        xpEarned = baseXP + streakBonus;
        
        gameState.score += xpEarned;
        gameState.sessionXp += xpEarned;
        checkLevelUp();
        
        showFeedback(true, `+${xpEarned} XP`, selectedAns);
    } else {
        btnElement.classList.add('wrong');
        document.getElementById('question-card').classList.add('shake');
        
        // Highlight correct one
        document.querySelectorAll('.answer-btn').forEach(b => {
            if(b.innerText === q.correctAnswer) b.classList.add('correct');
        });
        
        updateStreak(0);
        showFeedback(false, '0 XP', q.correctAnswer);
    }
    
    // Update global stats
    gameState.totalAnswered++;
    if(isCorrect) gameState.totalCorrect++;
    
    if(gameState.currentTopic !== 'mixed') {
        let tStats = gameState.topicProgress[gameState.currentTopic];
        tStats.answered++;
        if(isCorrect) tStats.correct++;
        tStats.xp += xpEarned;
    }
    
    saveProgress();
    document.getElementById('quiz-score').innerText = `${gameState.sessionXp} XP`;
}

function showFeedback(isCorrect, xpStr, correctAnsStr) {
    const overlay = document.getElementById('feedback-overlay');
    const icon = document.getElementById('feedback-icon');
    const text = document.getElementById('feedback-text');
    const detail = document.getElementById('feedback-detail');
    const xp = document.getElementById('feedback-xp');
    
    if(isCorrect) {
        icon.innerText = '✓';
        icon.className = 'feedback-icon correct';
        text.innerText = ['Awesome!', 'Correct!', 'Nailed it!', 'Great job!'][getRndInteger(0,3)];
        text.className = 'feedback-text correct';
        detail.innerText = gameState.streak >= 3 ? `${gameState.streak} IN A ROW 🔥` : '';
        xp.innerText = xpStr;
    } else {
        icon.innerText = '✕';
        icon.className = 'feedback-icon wrong';
        text.innerText = 'Not quite!';
        text.className = 'feedback-text wrong';
        detail.innerText = `The correct answer was: ${correctAnsStr}`;
        xp.innerText = '';
    }
    
    overlay.classList.add('active');
}

function nextQuestion() {
    document.getElementById('feedback-overlay').classList.remove('active');
    
    gameState.currentQuestionIndex++;
    if(gameState.currentQuestionIndex < gameState.questions.length) {
        loadQuestion();
    } else {
        finishQuiz();
    }
}

function skipQuestion() {
    updateStreak(0);
    gameState.totalAnswered++;
    if(gameState.currentTopic !== 'mixed') {
        gameState.topicProgress[gameState.currentTopic].answered++;
    }
    saveProgress();
    nextQuestion();
}

function showHint() {
    let hintEl = document.getElementById('question-hint');
    let q = gameState.questions[gameState.currentQuestionIndex];
    if(gameState.currentTopic === 'algebra' && q.text.includes('Number Machine')) {
        hintEl.innerText = "Work backwards. Do the opposite operations in reverse order, or test each answer option through the machine.";
    } else {
        hintEl.innerText = "Try to eliminate obvious wrong answers first. Write down your working on a piece of paper if needed!";
    }
    hintEl.style.display = 'block';
    
    // Penalize streak/xp slightly for using hint
    updateStreak(0);
}

function quitQuiz() {
    // Confirm dialog in real app
    showScreen('topic-screen');
}

function finishQuiz() {
    document.getElementById('quiz-progress-fill').style.width = '100%';
    
    let total = gameState.questions.length;
    let correct = gameState.correctCount;
    let acc = Math.round((correct / total) * 100);
    
    document.getElementById('result-correct').innerText = correct;
    document.getElementById('result-total').innerText = total;
    document.getElementById('result-accuracy').innerText = `${acc}%`;
    document.getElementById('result-xp').innerText = gameState.sessionXp;
    
    let title = document.getElementById('results-title');
    let icon = document.getElementById('results-icon');
    
    if(acc === 100) { title.innerText = "Perfect Score!"; icon.innerText = "👑"; document.getElementById('result-accuracy').style.color = 'var(--warning)'; }
    else if(acc >= 70) { title.innerText = "Quest Complete!"; icon.innerText = "🏆"; document.getElementById('result-accuracy').style.color = 'var(--success)'; }
    else if(acc >= 40) { title.innerText = "Good Effort"; icon.innerText = "👍"; document.getElementById('result-accuracy').style.color = 'var(--text-main)'; }
    else { title.innerText = "Keep Trying"; icon.innerText = "💡"; document.getElementById('result-accuracy').style.color = 'var(--danger)'; }
    
    showScreen('results-screen');
    generateTopicGrid(); // refresh grid stats
}

function retryQuiz() {
    startQuiz(gameState.currentDifficulty);
}

function checkLevelUp() {
    let xpForNextLevel = gameState.level * 100;
    while(gameState.score >= xpForNextLevel) {
        gameState.level++;
        xpForNextLevel = gameState.level * 100;
        // Could show a level up animation/modal here
    }
}

function saveProgress() {
    localStorage.setItem('mathsQuestScore', gameState.score.toString());
    localStorage.setItem('mathsQuestLevel', gameState.level.toString());
    localStorage.setItem('mathsQuestBestStreak', gameState.bestStreak.toString());
    localStorage.setItem('mathsQuestAnswered', gameState.totalAnswered.toString());
    localStorage.setItem('mathsQuestCorrect', gameState.totalCorrect.toString());
    localStorage.setItem('mathsQuestTopics', JSON.stringify(gameState.topicProgress));
}

function resetProgress() {
    if(confirm("Are you sure you want to reset ALL progress? This cannot be undone.")) {
        localStorage.clear();
        location.reload();
    }
}

function generateProgressDashboard() {
    document.getElementById('progress-level').innerText = gameState.level;
    let xpForNextLevel = gameState.level * 100;
    let currentLevelXp = gameState.score % Math.max(100, xpForNextLevel);
    document.getElementById('progress-xp-text').innerText = `${currentLevelXp} / ${xpForNextLevel} XP`;
    document.getElementById('progress-xp-fill').style.width = `${(currentLevelXp / xpForNextLevel) * 100}%`;
    
    document.getElementById('p-total-answered').innerText = gameState.totalAnswered;
    document.getElementById('p-total-correct').innerText = gameState.totalCorrect;
    document.getElementById('p-best-streak').innerText = gameState.bestStreak + ' 🔥';
    
    const topicsContainer = document.getElementById('progress-topics');
    topicsContainer.innerHTML = '';
    
    topics.forEach(t => {
        let stats = gameState.topicProgress[t.id];
        let acc = stats.answered === 0 ? 0 : Math.round((stats.correct / stats.answered) * 100);
        
        let row = document.createElement('div');
        row.className = 'p-topic-row';
        row.style.borderLeftColor = t.color;
        row.innerHTML = `
            <div class="p-topic-header">
                <span>${t.icon} ${t.name}</span>
                <span class="${acc >= 70 ? 'text-success' : acc >= 40 ? 'text-warning' : 'text-danger'}">${acc}%</span>
            </div>
            <div class="topic-progress" style="margin-bottom:0.5rem; height:6px;">
                 <div class="topic-progress-fill" style="width: ${acc}%; background-color: ${t.color}"></div>
            </div>
            <div class="p-topic-stats">
                ${stats.correct} / ${stats.answered} Correct • ${stats.xp} XP Earned
            </div>
        `;
        topicsContainer.appendChild(row);
    });
}

// Ensure progress dashboard is re-rendered when opened
const _showScreen = showScreen;
window.showScreen = function(id) {
    if(id === 'progress-screen') generateProgressDashboard();
    _showScreen(id);
}

// Init
window.addEventListener('DOMContentLoaded', initApp);
