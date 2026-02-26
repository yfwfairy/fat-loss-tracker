document.addEventListener('DOMContentLoaded', () => {
    // ---------- 核心状态 ----------
    const CONFIG = {
        baseAllowance: 1500,            // 基础每日额度 (kcal)
        warningThreshold: 300,          // 预警阈值 (剩余卡路里低于此值)
        overdraftLimit: 500             // 透支上限
    };

    let caloriesConsumed = 0;           // 已摄入卡路里 (由饮食按钮增加)
    let bonusCapacity = 0;              // 额外容量 (由运动按钮增加)
    let status = 'normal';              // normal, warning, depleted, gameover
    let journalEntries = [];            // 手帐条目数组

    // DOM 元素引用
    const kcalDisplay = document.getElementById('kcalDisplay');
    const survivalFill = document.getElementById('survivalFill');
    const survivalAvatar = document.getElementById('survivalAvatar');
    const svSweat = document.getElementById('svSweat');
    const floatContainer = document.getElementById('floatContainer');
    const trackMarks = document.querySelector('.track-marks');

    // 操作按钮
    const btnEat = document.getElementById('action-eat');
    const btnEatBig = document.getElementById('action-eat-big');
    const btnExercise = document.getElementById('action-exercise');
    const btnReset = document.getElementById('action-reset');

    // 数据卡片 DOM 引用
    const dietValue = document.getElementById('dietValue');
    const dietBar = document.getElementById('dietBar');
    const burnValue = document.getElementById('burnValue');
    const burnSub = document.getElementById('burnSub');
    const deficitValue = document.getElementById('deficitValue');
    const deficitQuote = document.getElementById('deficitQuote');

    // 手帐 DOM 引用
    const journalTimeline = document.getElementById('journalTimeline');
    const journalPlaceholder = document.getElementById('journalPlaceholder');
    const journalRingNum = document.getElementById('journalRingNum');

    const QUOTES = [
        { min: 1000, text: "哇哦！这种缺口简直是燃脂大师！" },
        { min: 500, text: "干得漂亮！又打败了一大波脂肪怪！" },
        { min: 200, text: "稳步前进中，身体正在变轻盈哦~" },
        { min: 0, text: "继续保持，离目标又近了一步！" },
        { min: -9999, text: "没关系，明天又是新的一天，加油！" }
    ];

    /**
     * 计算当前总容量和百分比
     */
    function getGameState() {
        const totalCapacity = CONFIG.baseAllowance + bonusCapacity;
        const remaining = totalCapacity - caloriesConsumed;
        const fillRatio = Math.max(0, Math.min(1, remaining / totalCapacity));
        const deficit = totalCapacity - caloriesConsumed; // 缺口 = 总消耗(基准+运动) - 摄入
        return { totalCapacity, remaining, fillRatio, deficit };
    }

    /**
     * 渲染手帐时间轴
     */
    function renderJournal() {
        if (!journalTimeline) return;

        // 如果没有记录，显示占位图
        if (journalEntries.length === 0) {
            if (journalPlaceholder) journalPlaceholder.style.display = 'flex';
            journalTimeline.classList.remove('has-entries'); // 移除样式类
            // 清除除了占位图之外的所有条目
            const entries = journalTimeline.querySelectorAll('.timeline-item');
            entries.forEach(e => e.remove());
            return;
        }

        if (journalPlaceholder) journalPlaceholder.style.display = 'none';
        journalTimeline.classList.add('has-entries'); // 添加样式类

        // 全量渲染新条目
        const existingEntries = journalTimeline.querySelectorAll('.timeline-item');
        existingEntries.forEach(e => e.remove());

        journalEntries.forEach(entry => {
            const item = document.createElement('div');
            item.className = `timeline-item entry-${entry.type}`;
            item.innerHTML = `
                <div class="time-marker">
                    <span class="time">${entry.time}</span>
                    <span class="dot"></span>
                </div>
                <div class="timeline-content">
                    <div class="meal-info">
                        <h4>${entry.title} <span class="meal-cal">(${entry.amount} kcal)</span></h4>
                        <p>${entry.note}</p>
                    </div>
                </div>
            `;
            journalTimeline.appendChild(item);
        });
    }

    /**
     * 添加手帐记录
     */
    function addJournalEntry(type, amount, title, note) {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        journalEntries.push({
            type, // ingestion 或 exercise
            amount,
            title,
            note,
            time: timeStr
        });

        renderJournal();
    }

    /**
     * 动态生成并渲染 200kcal 间隔的刻度
     */
    function renderMarks() {
        if (!trackMarks) return;
        trackMarks.innerHTML = '';
        const { totalCapacity } = getGameState();

        // 每 200kcal 渲染一个刻度，从 0（起点）开始
        const markInterval = 200;
        const markCount = Math.floor(totalCapacity / markInterval);

        for (let i = 0; i <= markCount; i++) {
            const mark = document.createElement('div');
            const kcalConsumedAtMark = i * markInterval;

            // 0 消耗点在左端 (right: 100%)，totalCapacity 消耗点在右端 (right: 0%)
            const positionPct = 100 - (kcalConsumedAtMark / totalCapacity * 100);

            mark.style.right = `${positionPct}%`;
            trackMarks.appendChild(mark);
        }
    }

    /**
     * 更新视图
     */
    function updateView() {
        const { totalCapacity, remaining, fillRatio, deficit } = getGameState();
        const fillPct = (fillRatio * 100).toFixed(1) + '%';

        // 1. 更新关卡进度条与小人
        if (survivalFill) survivalFill.style.width = fillPct;
        if (survivalAvatar) {
            // 当 fillPct 是 100% 时（剩余满），小人应该在左侧（right: 100%）
            survivalAvatar.style.right = fillPct;
        }

        // 2. 更新顶部仪表盘文字
        if (kcalDisplay) {
            kcalDisplay.innerText = `${Math.round(remaining)} / ${Math.round(totalCapacity)}`;
        }

        // 3. 更新下方数据仪表盘联动
        if (dietValue) dietValue.innerText = Math.round(caloriesConsumed);
        if (dietBar) {
            const dietPct = Math.min(100, (caloriesConsumed / totalCapacity) * 100);
            dietBar.style.width = dietPct + '%';
        }
        if (burnValue) burnValue.innerText = Math.round(totalCapacity);
        if (burnSub) burnSub.innerText = `基础 ${CONFIG.baseAllowance} + 活动 ${Math.round(bonusCapacity)}`;

        if (deficitValue) {
            deficitValue.innerText = Math.round(deficit);
            // 缺口为正则高亮
            const parent = deficitValue.parentElement;
            if (parent) parent.className = deficit >= 0 ? 'stat-value highlight-deficit' : 'stat-value';
        }
        if (deficitQuote) {
            const foundQuote = QUOTES.find(q => deficit >= q.min);
            deficitQuote.innerText = foundQuote ? `"${foundQuote.text}"` : "";
        }

        // 4. 更新手帐联动
        if (journalRingNum) {
            journalRingNum.innerText = Math.round(totalCapacity); // 环内数字为总消耗
        }

        // 更新记录页的大环背景逻辑 (扇形代表摄入进度)
        const journalRing = document.getElementById('journalRing'); // 注意：之前用了 querySelector，这里建议确保 ID 准确或保持一致
        const ringToUpdate = journalRing || document.querySelector('.daily-calorie-ring');
        if (ringToUpdate) {
            const intakeRatio = Math.min(1, caloriesConsumed / totalCapacity);
            const intakePct = (intakeRatio * 100).toFixed(1);
            // 响应“统一主题色”，摄入使用粉色 (--color-accent)，底色改为浅粉 (#FFEDEA)
            ringToUpdate.style.background = `conic-gradient(var(--color-accent) ${intakePct}%, #FFEDEA 0)`;
        }

        // 5. 更新刻度
        renderMarks();

        // 6. 检查状态
        updateStatus(remaining);
    }

    function updateStatus(remaining) {
        let newStatus = 'normal';

        if (remaining <= -CONFIG.overdraftLimit) {
            newStatus = 'gameover';
        } else if (remaining <= 0) {
            newStatus = 'depleted';
        } else if (remaining <= CONFIG.warningThreshold) {
            newStatus = 'warning';
        }

        status = newStatus;

        survivalFill.className = 'survival-fill ' + status;
        survivalAvatar.className = 'survival-avatar ' + (status === 'depleted' || status === 'gameover' ? status : '');
        svSweat.style.display = (status === 'warning') ? 'block' : 'none';
    }

    /**
     * 飘字动画效果 (重定向至仪表盘)
     */
    function createFloatText(text, isPositive) {
        if (!floatContainer) return;

        const floatDiv = document.createElement('div');
        floatDiv.className = 'float-text';
        floatDiv.innerText = text;
        floatDiv.style.color = isPositive ? '#B1A678' : '#D6697A';

        floatContainer.appendChild(floatDiv);

        // 触发仪表盘的小动画
        if (kcalDisplay) {
            kcalDisplay.style.transform = 'scale(1.1)';
            setTimeout(() => kcalDisplay.style.transform = 'scale(1)', 200);
        }

        setTimeout(() => floatDiv.remove(), 1200);
    }

    // ---------- 按钮逻辑 ----------

    // 记录摄入 (饮食) -> 减少剩余量 (通过增加 caloriesConsumed 实现)
    function handleIngestion(amount) {
        if (status === 'gameover') return;
        caloriesConsumed += amount;
        createFloatText(`+${amount} kcal`, false); // 红色飘字代表摄入加重

        // 联动手帐
        addJournalEntry('ingestion', amount, '记录饮食', '今日补充了能量，继续前进！');

        updateView();
    }

    // 记录消耗 (运动) -> 增加总容量 (动态扩展进度条)
    function handleExercise(amount) {
        bonusCapacity += amount;
        createFloatText(`+${amount} 容量`, true); // 绿色飘字

        // 联动手帐
        addJournalEntry('exercise', amount, '运动消耗', '开启了旅程中的运动挑战，增加了生命上限！');

        updateView();
    }

    function resetDay() {
        caloriesConsumed = 0;
        bonusCapacity = 0;
        journalEntries = []; // 清空手帐
        renderJournal();
        updateView();
        createFloatText('🌞 新的一天', true);
    }

    if (btnEat) btnEat.addEventListener('click', () => { console.log('Eat clicked'); handleIngestion(200); });
    if (btnEatBig) btnEatBig.addEventListener('click', () => { console.log('EatBig clicked'); handleIngestion(500); });
    if (btnExercise) btnExercise.addEventListener('click', () => { console.log('Exercise clicked'); handleExercise(180); });
    if (btnReset) btnReset.addEventListener('click', () => { console.log('Reset clicked'); resetDay(); });

    // 初始化
    updateView();
    renderJournal(); // 初始化渲染占位图
});
