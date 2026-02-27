// 简单的路由控制：切换 Dashboard 和 Journal
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const viewDashboard = document.getElementById('view-dashboard');
    const viewJournal = document.getElementById('view-journal');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // 1. 移除所有 active 类
            navItems.forEach(nav => nav.classList.remove('active'));

            // 2. 为当前点击的项添加 active 类
            item.classList.add('active');

            // 3. 拿到目标的 view name
            const targetView = item.getAttribute('data-target');

            // 4. 隐藏/显示对应的 DOM
            if (targetView === 'dashboard') {
                viewDashboard.classList.remove('hidden');
                viewJournal.classList.add('hidden');
            } else if (targetView === 'journal') {
                viewJournal.classList.remove('hidden');
                viewDashboard.classList.add('hidden');
            }
        });
    });

    // 为每日任务添加一个简单的点击动效演示
    const questCards = document.querySelectorAll('.quest-card');
    questCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('completed');

            // 切换右侧的 Icon
            const checkIcon = card.querySelector('.quest-check');
            if (card.classList.contains('completed')) {
                checkIcon.classList.remove('circle');
                checkIcon.innerHTML = '✔️';
                checkIcon.style.backgroundColor = 'var(--color-primary)';
                checkIcon.style.border = 'none';
                checkIcon.style.color = 'white';
            } else {
                checkIcon.classList.add('circle');
                checkIcon.innerHTML = '';
                checkIcon.style.backgroundColor = 'transparent';
                checkIcon.style.border = '3px solid #E2E8F0';
            }
        });
    });

    // 点击占位图跳转到“我的旅程”tab
    const journalPlaceholder = document.getElementById('journalPlaceholder');
    if (journalPlaceholder) {
        journalPlaceholder.addEventListener('click', () => {
            const dashboardTab = document.querySelector('.nav-item[data-target="dashboard"]');
            if (dashboardTab) dashboardTab.click();
        });
    }

    // 手账导航与弹窗统筹在 picker.js 中处理
});
