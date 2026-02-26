/**
 * Dashboard & Survival Game Logic
 * 处理体力条的百分比更新、吃东西/运动的加减逻辑及表现状态（UI、动画）
 */

document.addEventListener('DOMContentLoaded', () => {
    // ---------- 游戏配置 ----------
    const CONFIG = {
        dailyAllowance: 1500,           // 每日额度 (kcal)
        warningThreshold: 300,          // 警告阈值 (剩余300卡路里时)
        allowOverdraft: true,           // 允许透支
        overdraftLimit: 500             // 透支上限 (kcal)，超过此值GameOver
    };

    const MAX_REMAINING = CONFIG.dailyAllowance;
    const MIN_REMAINING = CONFIG.allowOverdraft ? -CONFIG.overdraftLimit : 0;

    let currentRemaining = MAX_REMAINING;
    let status = 'normal'; // normal, warning, depleted, gameover

    // DOM 元素引用
    const kcalDisplay = document.getElementById('kcalDisplay');
    const survivalFill = document.getElementById('survivalFill');
    const survivalAvatar = document.getElementById('survivalAvatar');
    const svSweat = document.getElementById('svSweat');
    const floatContainer = document.getElementById('floatContainer');

    // 操作按钮
    const btnEat = document.getElementById('action-eat');
    const btnEatBig = document.getElementById('action-eat-big');
    const btnExercise = document.getElementById('action-exercise');
    const btnReset = document.getElementById('action-reset');

    // 更新视图状态
    function updateView() {
        // 计算百分比 (0 到 100 之间)
        let fillRatio = currentRemaining / MAX_REMAINING;
        if (fillRatio < 0) fillRatio = 0; // 透支时，视觉进度条就是 0
        if (fillRatio > 1) fillRatio = 1;

        const fillPct = (fillRatio * 100).toFixed(1) + '%';

        // 更新 CSS 动画属性：宽度缩减，以及头像向右平移对齐左边界的作用
        if (survivalFill) survivalFill.style.width = fillPct;

        // 当 width 是 x% 时，相当于缩小了 (100-x)%。我们需要让头像位于缩减后的最左边缘
        // 因为 fill right:0，所以它的最左端其实是距右边界 x% 的位置。
        if (survivalAvatar) {
            survivalAvatar.style.right = fillPct;
        }

        if (kcalDisplay) {
            kcalDisplay.innerText = `${Math.round(currentRemaining)} / ${MAX_REMAINING}`;
        }

        // 更新状态类
        updateStatus();
    }

    function updateStatus() {
        let newStatus = 'normal';

        if (currentRemaining <= -CONFIG.overdraftLimit && CONFIG.allowOverdraft) {
            newStatus = 'gameover';
        } else if (!CONFIG.allowOverdraft && currentRemaining < 0) {
            newStatus = 'gameover';
        } else if (currentRemaining <= 0) {
            newStatus = 'depleted';
        } else if (currentRemaining <= CONFIG.warningThreshold) {
            newStatus = 'warning';
        }

        status = newStatus;

        // 重置 classes
        survivalFill.className = 'survival-fill';
        survivalAvatar.className = 'survival-avatar';
        svSweat.style.display = 'none';

        switch (status) {
            case 'normal':
                survivalFill.classList.add('normal');
                break;
            case 'warning':
                survivalFill.classList.add('warning');
                svSweat.style.display = 'block'; // 小人冒汗
                break;
            case 'depleted':
                survivalFill.classList.add('depleted');
                survivalAvatar.classList.add('depleted'); // 小人变灰并失去衣服颜色
                break;
            case 'gameover':
                survivalFill.classList.add('gameover');
                survivalAvatar.classList.add('gameover');
                break;
        }
    }

    // 飘字动画效果
    function createFloatText(text, isPositive) {
        if (!floatContainer) return;

        const floatDiv = document.createElement('div');
        floatDiv.className = 'float-text';
        floatDiv.innerText = text;
        floatDiv.style.color = isPositive ? '#8FCE7F' : '#FFA07A';

        // 随机一个偏移位置
        const randomX = Math.floor(Math.random() * 40) + 40;
        floatDiv.style.right = (currentRemaining / MAX_REMAINING * 100) + '%';
        floatDiv.style.transform = `translateX(${randomX}px)`; // 基于右对齐再偏移

        floatContainer.appendChild(floatDiv);

        setTimeout(() => {
            floatDiv.remove();
        }, 1200);
    }

    // 核心修改数值方法
    function modifyRemaining(delta) {
        if (status === 'gameover' && delta <= 0) {
            // 已GameOver且还在进食，直接抖动警告
            survivalAvatar.style.transform = "translateX(-50%) translate(5px, 0)";
            setTimeout(() => survivalAvatar.style.transform = "translateX(-50%)", 100);
            return;
        }

        let newTarget = currentRemaining + delta;
        newTarget = Math.min(MAX_REMAINING, Math.max(MIN_REMAINING, newTarget));

        const actualDelta = newTarget - currentRemaining;
        if (actualDelta === 0) return;

        currentRemaining = newTarget;

        const sign = actualDelta > 0 ? '+' : '';
        createFloatText(`${sign}${Math.round(actualDelta)} kcal`, actualDelta > 0);

        updateView();
    }

    function resetDay() {
        currentRemaining = MAX_REMAINING;
        updateView();
        createFloatText('🌞 新的一天', true);
    }

    // 绑定按钮事件
    if (btnEat) btnEat.addEventListener('click', () => modifyRemaining(-200));
    if (btnEatBig) btnEatBig.addEventListener('click', () => modifyRemaining(-500));
    if (btnExercise) btnExercise.addEventListener('click', () => modifyRemaining(180));
    if (btnReset) btnReset.addEventListener('click', resetDay);

    // 初始化检查与渲染
    updateView();
});
