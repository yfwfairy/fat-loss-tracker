document.addEventListener('DOMContentLoaded', () => {
    // === 弹窗日历逻辑 ===
    const tabDay = document.getElementById('tab-day-view');
    const tabMonth = document.getElementById('tab-month-view');
    const labelDay = tabDay ? tabDay.querySelector('.tab-label') : null;
    const labelMonth = tabMonth ? tabMonth.querySelector('.tab-label') : null;
    const btnPrevDay = document.getElementById('nav-prev-day');
    const btnNextDay = document.getElementById('nav-next-day');
    const viewDay = document.getElementById('journal-day-view');
    const viewMonth = document.getElementById('journal-month-view');

    const popoverDate = document.getElementById('popover-date-picker');
    const popoverMonth = document.getElementById('popover-month-picker');
    const journalDateText = document.getElementById('journal-date-text');

    // 当前真实选中的日期
    let currentDate = new Date();
    // 日历面板正在显示的年月
    let displayMonth = currentDate.getMonth();
    let displayYear = currentDate.getFullYear();
    let isMonthView = false;

    // 初始化显示
    updateHeaderDateDisplay();

    // === 底层视图切换封装 ===
    function switchToDayView() {
        isMonthView = false;
        if (tabDay) tabDay.classList.add('active');
        if (tabMonth) tabMonth.classList.remove('active');
        if (viewDay) {
            viewDay.classList.remove('hidden-view');
            viewDay.classList.add('active-view');
        }
        if (viewMonth) {
            viewMonth.classList.remove('active-view');
            viewMonth.classList.add('hidden-view');
        }
    }

    function switchToMonthView() {
        isMonthView = true;
        if (tabMonth) tabMonth.classList.add('active');
        if (tabDay) tabDay.classList.remove('active');
        if (viewMonth) {
            viewMonth.classList.remove('hidden-view');
            viewMonth.classList.add('active-view');
        }
        if (viewDay) {
            viewDay.classList.remove('active-view');
            viewDay.classList.add('hidden-view');
        }
    }

    // === Tabs 弹窗触发与箭头逻辑 ===
    if (tabDay && tabMonth) {
        // 点击 Tab 1 (今天)：只负责呼出 Day Picker 面板
        tabDay.addEventListener('click', (e) => {
            e.stopPropagation();

            // 同步展示当前选定的年月并弹窗 Day Picker
            displayYear = currentDate.getFullYear();
            displayMonth = currentDate.getMonth();
            renderDateGrid();

            // 定位在 TabDay 下方
            const rect = tabDay.getBoundingClientRect();
            // 加上平滑动画效果
            popoverDate.style.top = `${rect.bottom + window.scrollY + 10}px`;
            popoverDate.style.left = `${rect.left + window.scrollX}px`;

            popoverDate.classList.remove('hidden');
            popoverMonth.classList.add('hidden');
        });

        // 点击 Tab 2 (月历)：只负责呼出 Month Picker 面板
        tabMonth.addEventListener('click', (e) => {
            e.stopPropagation();

            // 同步展示当前选定的年份并弹窗 Month Picker
            displayYear = currentDate.getFullYear();
            renderMonthGrid();

            // 定位在 TabMonth 下方
            const rect = tabMonth.getBoundingClientRect();
            popoverMonth.style.top = `${rect.bottom + window.scrollY + 10}px`;
            popoverMonth.style.left = `${rect.left + window.scrollX}px`;

            popoverMonth.classList.remove('hidden');
            popoverDate.classList.add('hidden');
        });
    }

    // 独立绑定左右操作按钮
    if (btnPrevDay) {
        btnPrevDay.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDate.setDate(currentDate.getDate() - 1);
            switchToDayView();
            updateHeaderDateDisplay();
            popoverDate.classList.add('hidden');
            popoverMonth.classList.add('hidden');
        });
    }

    if (btnNextDay) {
        btnNextDay.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDate.setDate(currentDate.getDate() + 1);
            switchToDayView();
            updateHeaderDateDisplay();
            popoverDate.classList.add('hidden');
            popoverMonth.classList.add('hidden');
        });
    }

    // 点击空白处关闭弹窗
    document.addEventListener('click', (e) => {
        if (popoverDate && !popoverDate.contains(e.target) && tabDay && !tabDay.contains(e.target)) {
            popoverDate.classList.add('hidden');
        }
        if (popoverMonth && !popoverMonth.contains(e.target) && tabMonth && !tabMonth.contains(e.target)) {
            popoverMonth.classList.add('hidden');
        }
    });

    // === Day Picker 渲染与交互 ===
    const dateGrid = document.getElementById('picker-date-grid');
    const dateTitle = document.getElementById('picker-date-title');

    document.getElementById('picker-date-prev-year')?.addEventListener('click', (e) => { e.stopPropagation(); displayYear--; renderDateGrid(); });
    document.getElementById('picker-date-next-year')?.addEventListener('click', (e) => { e.stopPropagation(); displayYear++; renderDateGrid(); });
    document.getElementById('picker-date-prev-month')?.addEventListener('click', (e) => {
        e.stopPropagation();
        displayMonth--;
        if (displayMonth < 0) { displayMonth = 11; displayYear--; }
        renderDateGrid();
    });
    document.getElementById('picker-date-next-month')?.addEventListener('click', (e) => {
        e.stopPropagation();
        displayMonth++;
        if (displayMonth > 11) { displayMonth = 0; displayYear++; }
        renderDateGrid();
    });

    // Day Picker 顶部点击标题快速回到“今天”
    if (dateTitle) {
        dateTitle.addEventListener('click', (e) => {
            e.stopPropagation();
            const today = new Date();
            currentDate = new Date(today); // 重置选定日期为今天
            displayYear = today.getFullYear();
            displayMonth = today.getMonth();
            renderDateGrid();
            updateHeaderDateDisplay(); // 同步更新大标题和 Tab 文本
            // 不关闭弹窗，不切换面板
        });
    }

    function renderDateGrid() {
        if (!dateGrid) return;
        dateTitle.innerText = `${displayYear} 年 ${displayMonth + 1} 月`;
        dateGrid.innerHTML = '';

        const firstDay = new Date(displayYear, displayMonth, 1).getDay();
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

        const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(displayYear, displayMonth, 0).getDate();

        // 灰色的上个月日期
        for (let i = adjustedFirstDay - 1; i >= 0; i--) {
            const cell = document.createElement('div');
            cell.className = 'picker-cell not-current-month';
            cell.innerText = daysInPrevMonth - i;
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                displayMonth--;
                if (displayMonth < 0) { displayMonth = 11; displayYear--; }
                renderDateGrid();
            });
            dateGrid.appendChild(cell);
        }

        // 真实日期
        for (let i = 1; i <= daysInMonth; i++) {
            const cell = document.createElement('div');
            cell.className = 'picker-cell';
            cell.innerText = i;


            const today = new Date();
            const isToday = i === today.getDate() && displayMonth === today.getMonth() && displayYear === today.getFullYear();
            if (isToday) {
                cell.classList.add('is-today');
            }

            if (i === currentDate.getDate() && displayMonth === currentDate.getMonth() && displayYear === currentDate.getFullYear()) {
                cell.classList.add('selected');
            }

            // 真正选中某一天
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                currentDate = new Date(displayYear, displayMonth, i);

                // 【核心变化】：此处才执行实际的视图切换
                switchToDayView();
                updateHeaderDateDisplay();
                popoverDate.classList.add('hidden'); // 收起面板
            });

            dateGrid.appendChild(cell);
        }

        // 下月占位
        const totalCellsStr = dateGrid.children.length;
        const remaining = 42 - totalCellsStr;
        for (let i = 1; i <= remaining; i++) {
            const cell = document.createElement('div');
            cell.className = 'picker-cell not-current-month';
            cell.innerText = i;
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                displayMonth++;
                if (displayMonth > 11) { displayMonth = 0; displayYear++; }
                renderDateGrid();
            });
            dateGrid.appendChild(cell);
        }
    }


    // === Month Picker 渲染与交互 ===
    const monthGrid = document.getElementById('picker-month-grid');
    const monthTitle = document.getElementById('picker-month-title');

    document.getElementById('picker-month-prev-year')?.addEventListener('click', (e) => { e.stopPropagation(); displayYear--; renderMonthGrid(); });
    document.getElementById('picker-month-next-year')?.addEventListener('click', (e) => { e.stopPropagation(); displayYear++; renderMonthGrid(); });

    // Month Picker 顶部点击标题快速回到“今天”
    if (monthTitle) {
        monthTitle.addEventListener('click', (e) => {
            e.stopPropagation();
            const today = new Date();
            currentDate = new Date(today); // 重置选定日期为今天
            displayYear = today.getFullYear();
            displayMonth = today.getMonth();
            renderMonthGrid();
            updateHeaderDateDisplay();
            // 不关闭弹窗
        });
    }

    function renderMonthGrid() {
        if (!monthGrid) return;
        monthTitle.innerText = `${displayYear} 年`;
        monthGrid.innerHTML = '';

        const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

        for (let i = 0; i < 12; i++) {
            const cell = document.createElement('div');
            cell.className = 'picker-month-cell';
            cell.innerText = monthNames[i];


            const today = new Date();
            const isCurrentMonth = i === today.getMonth() && displayYear === today.getFullYear();
            if (isCurrentMonth) {
                cell.classList.add('is-today');
            }

            if (i === currentDate.getMonth() && displayYear === currentDate.getFullYear()) {
                cell.classList.add('selected');
            }

            // 真正选中某个月份
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                currentDate = new Date(displayYear, i, 1);

                // 【核心变化】：此处才执行实际的视图切换
                switchToMonthView();
                updateHeaderDateDisplay();
                popoverMonth.classList.add('hidden'); // 收起面板
            });

            monthGrid.appendChild(cell);
        }
    }

    // 核心：刷新展示的文字
    function updateHeaderDateDisplay() {
        const m = currentDate.getMonth() + 1;
        const d = currentDate.getDate();

        // 更新大标题
        if (journalDateText) {
            journalDateText.innerText = `${currentDate.getFullYear()}年${m}月${d}日`;
        }

        // 检查是不是今天
        const today = new Date();
        const isToday = currentDate.getDate() === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();

        // 更新 Tab1 (今天/日视图) 的文案
        if (labelDay) {
            labelDay.innerText = isToday ? "今天" : `${m}月${d}日`;
        }

        // 更新 Tab2 (月视图) 的文案 
        // 既然右边主要是月历大盘，可以将它命名为 M月，或者固定“月历”即可。用户没说必须改 Tab2，一般固定为“月历”比较合理，这里让它显示月份
        if (labelMonth) {
            labelMonth.innerText = `${m}月`;
        }
    }
});
