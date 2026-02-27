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

    // 记录弹窗 DOM 引用
    const modalIntake = document.getElementById('modal-log-intake');
    const modalExercise = document.getElementById('modal-log-exercise');
    const btnCloseIntake = document.getElementById('close-log-intake');
    const btnCloseExercise = document.getElementById('close-log-exercise');

    // 弹窗底部操作按钮
    const btnCancelIntake = document.getElementById('cancel-log-intake');
    const btnConfirmIntake = document.getElementById('confirm-log-intake');
    const btnCancelExercise = document.getElementById('cancel-log-exercise');
    const btnConfirmExercise = document.getElementById('confirm-log-exercise');

    // 摄入弹窗交互元素
    const mealBtns = document.querySelectorAll('.meal-btn');
    const intakeTotalVal = document.getElementById('intake-total-val');
    const inputFoodName = document.getElementById('input-food-name');
    const inputFoodWeight = document.getElementById('input-food-weight');
    const unitOptions = document.querySelectorAll('.unit-option');
    const displayUnitLabel = document.getElementById('display-unit-label');
    const valCarbs = document.getElementById('val-carbs');
    const valFat = document.getElementById('val-fat');
    const valProtein = document.getElementById('val-protein');
    const barFillCarbs = document.getElementById('bar-fill-carbs');
    const barFillFat = document.getElementById('bar-fill-fat');
    const barFillProtein = document.getElementById('bar-fill-protein');

    // 消耗弹窗交互元素
    const exerciseCards = document.querySelectorAll('.exercise-card');
    const customExGroup = document.getElementById('custom-exercise-group');
    const inputExName = document.getElementById('input-exercise-name');
    const stepperMinus = document.getElementById('stepper-minus');
    const stepperPlus = document.getElementById('stepper-plus');
    const stepperVal = document.getElementById('stepper-val');
    const intensityBtns = document.querySelectorAll('.intensity-btn');
    const moodEmojis = document.querySelectorAll('.mood-emoji');
    const burnTotalVal = document.getElementById('burn-total-val');

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
                    <div class="timeline-icon-box">
                        ${entry.icon}
                    </div>
                    <div class="meal-info">
                        <div class="timeline-title-row">
                            <span class="timeline-title">${entry.title}</span>
                            <span class="timeline-cal">${entry.type === 'ingestion' ? '+' : '-'}${entry.amount} kcal</span>
                        </div>
                        <p class="timeline-desc">${entry.note}</p>
                    </div>
                </div>
            `;
            journalTimeline.prepend(item);
        });
    }

    /**
     * 添加手帐记录
     */
    function addJournalEntry(type, amount, title, note, icon) {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        journalEntries.push({
            type, // ingestion 或 exercise
            amount,
            title,
            note,
            icon,
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
    function handleIngestion(amount, foodName, icon) {
        if (status === 'gameover') return;
        caloriesConsumed += amount;
        createFloatText(`+${amount} kcal`, false); // 红色飘字代表摄入加重

        // 评价逻辑
        let evalText = "✅ 回复状态，健康生活每一天！";
        if (amount > 500) evalText = "🔥 丰盛的一餐，热量偏高记得适量加练哦~";
        else if (amount < 150) evalText = "🍃 算是比较轻薄的健康加餐~";

        addJournalEntry('ingestion', amount, foodName || '记录饮食', evalText, icon || '🍽️');
        updateView();
    }

    // 记录消耗 (运动) -> 增加总容量 (动态扩展进度条)
    function handleExercise(amount, exName, icon, unitStr) {
        bonusCapacity += amount;
        createFloatText(`+${amount} 容量`, true); // 绿色飘字

        const bowls = (amount / 200).toFixed(1);
        const evalText = `今日${unitStr || '锻炼了一会儿'}，相当于消耗了 🍚 ${bowls} 碗米饭`;

        addJournalEntry('exercise', amount, exName || '运动消耗', evalText, icon || '🏃');
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

    // --- 弹窗触发逻辑 ---
    if (btnEatBig) btnEatBig.addEventListener('click', () => {
        modalIntake.classList.remove('hidden');
    });

    if (btnExercise) btnExercise.addEventListener('click', () => {
        modalExercise.classList.remove('hidden');
    });

    // --- 弹窗关闭逻辑 ---
    const closeIntakeFunc = () => modalIntake.classList.add('hidden');
    const closeExerciseFunc = () => modalExercise.classList.add('hidden');

    if (btnCloseIntake) btnCloseIntake.addEventListener('click', closeIntakeFunc);
    if (btnCancelIntake) btnCancelIntake.addEventListener('click', closeIntakeFunc);

    if (btnCloseExercise) btnCloseExercise.addEventListener('click', closeExerciseFunc);
    if (btnCancelExercise) btnCancelExercise.addEventListener('click', closeExerciseFunc);

    // --- 弹窗点击外部关闭 ---
    [modalIntake, modalExercise].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
        }
    });

    // ==========================================
    // 摄入弹窗交互逻辑
    // ==========================================
    mealBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            mealBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // 摄入单位切换 (新版自定义下拉框)
    let currentIntakeUnit = 'g'; // 默认单位
    const intakeUnitSelect = document.getElementById('intake-unit-select');
    if (intakeUnitSelect) {
        intakeUnitSelect.addEventListener('change', (e) => {
            currentIntakeUnit = e.target.value;
            updateIntakeNutrition();
        });
    }

    // 食物 Emoji 切换逻辑 (Popover)
    const btnFoodEmoji = document.getElementById('btn-food-emoji');
    const emojiPopover = document.getElementById('emoji-popover');

    if (btnFoodEmoji && emojiPopover) {
        btnFoodEmoji.addEventListener('click', (e) => {
            e.stopPropagation();
            emojiPopover.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!btnFoodEmoji.contains(e.target) && !emojiPopover.contains(e.target)) {
                emojiPopover.classList.add('hidden');
            }
        });

        const emojiSpans = emojiPopover.querySelectorAll('.emoji-grid span');
        emojiSpans.forEach(span => {
            span.addEventListener('click', () => {
                const icon = span.textContent;
                const name = span.dataset.name;

                if (span.classList.contains('custom-emoji-btn')) {
                    btnFoodEmoji.textContent = '🍽️';
                    if (inputFoodName) {
                        inputFoodName.value = '';
                        inputFoodName.placeholder = '请输入自定义食物名称';
                        inputFoodName.classList.remove('input-error');
                        inputFoodName.focus();
                    }
                } else {
                    btnFoodEmoji.textContent = icon;
                    if (inputFoodName && name) {
                        inputFoodName.value = name;
                        inputFoodName.classList.remove('input-error');
                    }
                }
                emojiPopover.classList.add('hidden');
            });
        });
    }

    // 动态模拟计算营养摄入（基于单位和数值）
    function updateIntakeNutrition() {
        if (!inputFoodWeight || !intakeTotalVal) return;
        const val = parseFloat(inputFoodWeight.value) || 0;

        // 假设基础数据库中的某食物 (例如燕麦)： 每100g 包含 => 碳水 60g, 脂肪 8g, 蛋白 15g, 热量 380kcal
        // 如果是按份数/个算，假设1份/个 = 150g
        const multiplier = (currentIntakeUnit === 'g') ? (val / 100) : (val * 1.5);

        const carbs = Math.round(60 * multiplier);
        const fat = Math.round(8 * multiplier);
        const protein = Math.round(15 * multiplier);
        const totalCal = Math.round(380 * multiplier);

        intakeTotalVal.textContent = totalCal;
        if (valCarbs) valCarbs.textContent = `${carbs}g`;
        if (valFat) valFat.textContent = `${fat}g`;
        if (valProtein) valProtein.textContent = `${protein}g`;

        // 更新条带宽度 (最大100%)
        // 假设每日极限量: 碳水300g, 脂肪80g, 蛋白120g
        if (barFillCarbs) barFillCarbs.style.width = `${Math.min(100, (carbs / 300) * 100)}%`;
        if (barFillFat) barFillFat.style.width = `${Math.min(100, (fat / 80) * 100)}%`;
        if (barFillProtein) barFillProtein.style.width = `${Math.min(100, (protein / 120) * 100)}%`;
    }

    if (inputFoodWeight) {
        inputFoodWeight.addEventListener('input', updateIntakeNutrition);
        // 初始化计算一次
        updateIntakeNutrition();
    }

    if (btnConfirmIntake) {
        btnConfirmIntake.addEventListener('click', () => {
            // 防呆校验：静默红框提示
            const name = inputFoodName ? inputFoodName.value.trim() : '';
            const weightVal = parseFloat(inputFoodWeight ? inputFoodWeight.value : 0);

            let hasError = false;

            if (!name) {
                if (inputFoodName) {
                    inputFoodName.classList.add('input-error');
                    inputFoodName.addEventListener('input', () => inputFoodName.classList.remove('input-error'), { once: true });
                }
                hasError = true;
            }

            if (isNaN(weightVal) || weightVal <= 0) {
                if (inputFoodWeight) {
                    inputFoodWeight.classList.add('input-error');
                    inputFoodWeight.addEventListener('input', () => inputFoodWeight.classList.remove('input-error'), { once: true });
                }
                hasError = true;
            }

            if (hasError) return;

            const cal = parseInt(intakeTotalVal.textContent) || 0;
            const icon = btnFoodEmoji ? btnFoodEmoji.textContent : '🍽️';

            handleIngestion(cal, name, icon);
            closeIntakeFunc();
        });
    }

    // 重置按钮

    // ==========================================
    // 消耗弹窗交互逻辑 (重构版)
    // ==========================================
    const categoryBtns = document.querySelectorAll('.category-btn');
    const exerciseIconsGrid = document.getElementById('exercise-icons-grid');
    const inputExValue = document.getElementById('input-exercise-value');
    const exUnitSelect = document.getElementById('exercise-unit-select');
    const equivalentItem = document.querySelector('.equivalent-item');
    const customExPanel = document.getElementById('custom-exercise-panel');
    const customExName = document.getElementById('custom-ex-name');
    const customExCal = document.getElementById('custom-ex-cal');

    const exerciseDict = {
        cardio: [
            { id: '跑步', icon: '🏃', unit: '分钟', cal: 10 },      // 中速跑
            { id: '慢跑', icon: '🏃‍♂️', unit: '分钟', cal: 8 },     // 慢跑/ jogging
            { id: '快走', icon: '🚶‍♀️', unit: '分钟', cal: 5 },      // 原步行15过高，修正为5
            { id: '骑行', icon: '🚴', unit: '分钟', cal: 8 },       // 休闲骑行
            { id: '游泳', icon: '🏊', unit: '分钟', cal: 12 },      // 中等强度
            { id: '跳绳', icon: '🪢', unit: '分钟', cal: 12 },       // 快速跳绳
            { id: '椭圆机', icon: '🏃‍♀️', unit: '分钟', cal: 9 },    // 椭圆机
            { id: '划船机', icon: '🚣', unit: '分钟', cal: 10 },     // 划船机
            { id: '爬楼梯', icon: '🧗', unit: '分钟', cal: 9 },      // 上楼梯
            { id: 'HIIT', icon: '⚡', unit: '分钟', cal: 15 },     // 高强度间歇
            { id: '自定义', icon: '✏️', unit: '无', cal: 0, isCustom: true }
        ],
        strength: [
            { id: '力量训练', icon: '🏋️', unit: '分钟', cal: 6 },   // 一般力量训练
            { id: '俯卧撑', icon: '💪', unit: '次', cal: 0.5 },
            { id: '深蹲', icon: '🦵', unit: '次', cal: 0.6 },
            { id: '卷腹', icon: '🫃', unit: '次', cal: 0.4 },
            { id: '引体向上', icon: '🧗‍♂️', unit: '次', cal: 1.2 },  // 自重较大
            { id: '卧推', icon: '🏋️‍♂️', unit: '次', cal: 0.8 },      // 杠铃卧推（每次）
            { id: '硬拉', icon: '🏋️‍♀️', unit: '次', cal: 1.0 },      // 硬拉
            { id: '哑铃弯举', icon: '💪', unit: '次', cal: 0.3 },
            { id: '平板支撑', icon: '🧘', unit: '分钟', cal: 4 },    // 静态核心
            { id: '臀桥', icon: '🍑', unit: '次', cal: 0.5 },
            { id: '自定义', icon: '✏️', unit: '无', cal: 0, isCustom: true }
        ],
        stretch: [
            { id: '泡沫轴', icon: '🧻', unit: '分钟', cal: 3 },
            { id: '腿部拉伸', icon: '🦵', unit: '分钟', cal: 3 },
            { id: '臀部拉伸', icon: '🍑', unit: '分钟', cal: 3 },
            { id: '手臂拉伸', icon: '💪', unit: '分钟', cal: 3 },
            { id: '全身拉伸', icon: '😌', unit: '分钟', cal: 3 },
            { id: '自定义', icon: '✏️', unit: '无', cal: 0, isCustom: true }
        ]
    };

    let currentCategory = 'cardio';
    let currentSelectedEx = null;

    // 渲染运动项目网格
    function renderExerciseGrid() {
        if (!exerciseIconsGrid) return;
        exerciseIconsGrid.innerHTML = '';
        const list = exerciseDict[currentCategory] || [];
        list.forEach((ex, idx) => {
            const card = document.createElement('div');
            // 自动选中第一个，或者保持之前的选中（如果在同类里）
            const isSelected = (currentSelectedEx && currentSelectedEx.id === ex.id) || (!currentSelectedEx && idx === 0);
            if (isSelected) currentSelectedEx = ex;

            card.className = `exercise-card ${isSelected ? 'selected' : ''}`;
            card.innerHTML = `
                <span class="exercise-icon">${ex.icon}</span>
                <span class="exercise-name">${ex.id}</span>
            `;
            card.addEventListener('click', () => {
                document.querySelectorAll('.exercise-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                currentSelectedEx = ex;
                if (exUnitSelect) exUnitSelect.value = ex.unit;
                updateBurnCalculation();
            });
            exerciseIconsGrid.appendChild(card);
        });
        if (exUnitSelect && currentSelectedEx) exUnitSelect.value = currentSelectedEx.unit;
        updateBurnCalculation();
    }

    // 大类切换
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            currentSelectedEx = null; // 切换大类时重置具体项目选择
            renderExerciseGrid();
        });
    });

    // 计算热量并更新UI
    function updateBurnCalculation() {
        if (!burnTotalVal || !currentSelectedEx) return;

        // 如果是自定义运动
        if (currentSelectedEx.isCustom) {
            // 原生输入框置灰禁用
            if (inputExValue) inputExValue.disabled = true;
            if (exUnitSelect) exUnitSelect.disabled = true;
            // 显示自定义输入面板
            if (customExPanel) customExPanel.classList.remove('hidden');

            // 直接取自定义界面的总热量并舍入
            const val = parseFloat(customExCal ? customExCal.value : 0) || 0;
            burnTotalVal.textContent = Math.round(val);
        } else {
            // 恢复原生输入框
            if (inputExValue) inputExValue.disabled = false;
            if (exUnitSelect) exUnitSelect.disabled = false;
            // 隐藏自定义输入面板
            if (customExPanel) customExPanel.classList.add('hidden');

            // 根据运动类型的单价热量公式计算
            const val = parseFloat(inputExValue ? inputExValue.value : 0) || 0;
            burnTotalVal.textContent = Math.round(val * currentSelectedEx.cal);
        }

        // 根据热量计算食物等效（大概 1碗米饭 = 200kcal）
        const totalBurn = parseInt(burnTotalVal.textContent) || 0;
        if (equivalentItem) {
            const bowls = (totalBurn / 200).toFixed(1);
            equivalentItem.textContent = `🍚 ${bowls}碗米饭`;
        }
    }

    if (inputExValue) {
        inputExValue.addEventListener('input', updateBurnCalculation);
    }
    if (customExCal) {
        customExCal.addEventListener('input', updateBurnCalculation);
    }

    // 4. 心情打分
    if (moodEmojis) {
        moodEmojis.forEach(emoji => {
            emoji.addEventListener('click', () => {
                moodEmojis.forEach(e => e.classList.remove('selected'));
                emoji.classList.add('selected');
            });
        });
    }

    // 5. 确认记录运动
    if (btnConfirmExercise) {
        btnConfirmExercise.addEventListener('click', () => {
            let hasError = false;

            // 检查自定义运动与常规运动的空值
            if (currentSelectedEx && currentSelectedEx.isCustom) {
                const name = customExName ? customExName.value.trim() : '';
                const calVal = parseFloat(customExCal ? customExCal.value : 0);

                if (!name) {
                    if (customExName) {
                        customExName.classList.add('input-error');
                        customExName.addEventListener('input', () => customExName.classList.remove('input-error'), { once: true });
                    }
                    hasError = true;
                }
                if (isNaN(calVal) || calVal <= 0) {
                    if (customExCal) {
                        customExCal.classList.add('input-error');
                        customExCal.addEventListener('input', () => customExCal.classList.remove('input-error'), { once: true });
                    }
                    hasError = true;
                }
            } else {
                const val = parseFloat(inputExValue ? inputExValue.value : 0);
                if (isNaN(val) || val <= 0) {
                    if (inputExValue) {
                        inputExValue.classList.add('input-error');
                        inputExValue.addEventListener('input', () => inputExValue.classList.remove('input-error'), { once: true });
                    }
                    hasError = true;
                }
            }

            if (hasError) return;

            const cal = parseInt(burnTotalVal.textContent) || 0;
            if (cal > 0) {
                let exName = '运动';
                let icon = '🏃';
                let unitStr = '';

                if (currentSelectedEx) {
                    if (currentSelectedEx.isCustom) {
                        exName = customExName ? customExName.value.trim() : '自定义运动';
                        icon = '✏️';
                    } else {
                        exName = currentSelectedEx.id;
                        icon = currentSelectedEx.icon;
                    }
                }

                const val = parseFloat(inputExValue && (!currentSelectedEx || !currentSelectedEx.isCustom) ? inputExValue.value : 0);
                const unit = exUnitSelect ? exUnitSelect.value : '';
                if (val > 0) {
                    unitStr = `${exName} ${val} ${unit}`;
                }

                handleExercise(cal, exName, icon, unitStr);
                closeExerciseFunc();
            }
        });
    }

    if (btnReset) btnReset.addEventListener('click', () => { resetDay(); });

    // 自定义 Select 初始化逻辑
    function initCustomSelects() {
        const wrappers = document.querySelectorAll('.custom-select-wrapper');
        wrappers.forEach(wrapper => {
            const trigger = wrapper.querySelector('.custom-select-trigger');
            const triggerValue = wrapper.querySelector('.custom-select-value');
            const optionsPanel = wrapper.querySelector('.custom-select-options');
            const hiddenSelect = wrapper.querySelector('.hidden-select');

            if (!trigger || !optionsPanel || !hiddenSelect) return;

            trigger.addEventListener('click', (e) => {
                if (trigger.classList.contains('disabled')) return;
                e.stopPropagation();

                document.querySelectorAll('.custom-select-wrapper').forEach(w => {
                    if (w !== wrapper) {
                        w.classList.remove('open');
                        const p = w.querySelector('.custom-select-options');
                        if (p) p.classList.add('hidden');
                    }
                });

                wrapper.classList.toggle('open');
                optionsPanel.classList.toggle('hidden');
            });

            const options = optionsPanel.querySelectorAll('.custom-option');
            options.forEach(opt => {
                opt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const val = opt.dataset.value;
                    triggerValue.textContent = opt.textContent;
                    hiddenSelect.value = val;
                    hiddenSelect.dispatchEvent(new Event('change'));

                    wrapper.classList.remove('open');
                    optionsPanel.classList.add('hidden');
                });
            });
        });

        document.addEventListener('click', (e) => {
            document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
                if (!wrapper.contains(e.target)) {
                    wrapper.classList.remove('open');
                    const panel = wrapper.querySelector('.custom-select-options');
                    if (panel) panel.classList.add('hidden');
                }
            });
        });
    }

    // 初始化渲染消耗弹窗网格
    renderExerciseGrid();

    // 初始化全局事件与组件
    initCustomSelects();
    // 初始化
    updateView();
    renderJournal(); // 初始化渲染占位图
});
