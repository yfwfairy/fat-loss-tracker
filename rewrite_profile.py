import re

with open('js/profile.js', 'r', encoding='utf-8') as f:
    text = f.read()

new_js = """document.addEventListener('DOMContentLoaded', () => {
    // === 弹窗主逻辑 ===
    const openProfileBtn = document.getElementById('open-profile-btn');
    const closeProfileBtn = document.getElementById('close-profile-btn');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const profileModalOverlay = document.getElementById('profile-modal-overlay');

    const rightPanel = document.getElementById('modal-right-panel');
    const avatarPanel = document.getElementById('avatar-picker-panel');
    const measurePanel = document.getElementById('measurements-body');
    const measurePopover = document.getElementById('measure-popover');

    function openRightPanel(type) {
        if (!rightPanel || !avatarPanel || !measurePanel) return;
        rightPanel.classList.add('expanded');
        if (type === 'avatar') {
            avatarPanel.classList.remove('hidden');
            measurePanel.classList.add('hidden');
        } else if (type === 'measure') {
            measurePanel.classList.remove('hidden');
            avatarPanel.classList.add('hidden');
        }
    }

    function closeRightPanel() {
        if (!rightPanel) return;
        rightPanel.classList.remove('expanded');
        if (measurePopover) measurePopover.classList.add('hidden');
    }

    if (!openProfileBtn || !profileModalOverlay) return;

    openProfileBtn.addEventListener('click', () => {
        profileModalOverlay.classList.remove('hidden');
    });

    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', () => {
            profileModalOverlay.classList.add('hidden');
            closeRightPanel();
        });
    }

    profileModalOverlay.addEventListener('click', (e) => {
        if (e.target === profileModalOverlay) {
            profileModalOverlay.classList.add('hidden');
            closeRightPanel();
        }
    });

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {
            const nickname = document.getElementById('input-nickname').value;
            const titleEl = openProfileBtn.querySelector('.brand-info h1');
            if (titleEl && nickname) {
                titleEl.innerText = nickname;
            }
            profileModalOverlay.classList.add('hidden');
            closeRightPanel();
        });
    }

    // === 头像选择器逻辑 ===
    const btnChangeAvatar = document.getElementById('btn-change-avatar');
    const presetAvatars = document.querySelectorAll('.preset-avatar');
    const currentAvatarDisplay = document.getElementById('current-avatar');
    const brandAvatar = openProfileBtn.querySelector('.brand-avatar .emoji');

    if (btnChangeAvatar) {
        btnChangeAvatar.addEventListener('click', () => openRightPanel('avatar'));
        
        presetAvatars.forEach(av => {
            av.addEventListener('click', () => {
                presetAvatars.forEach(a => a.classList.remove('selected'));
                av.classList.add('selected');
                
                const emoji = av.innerText;
                if (currentAvatarDisplay) currentAvatarDisplay.innerText = emoji;
                if (brandAvatar) brandAvatar.innerText = emoji;
                
                setTimeout(() => closeRightPanel(), 150);
            });
        });
    }

    // === 身材维度交互逻辑 ===
    const toggleMeasurementsBtn = document.getElementById('toggle-measurements');
    const measurePoints = document.querySelectorAll('.measure-point');
    const popoverTitle = document.getElementById('measure-popover-title');
    const measureInput = document.getElementById('active-measure-input');
    const btnConfirmMeasure = document.getElementById('btn-confirm-measure');
    const measurementsList = document.getElementById('measurements-list');

    let currentMeasurePartName = '';
    let currentMeasurePartId = '';

    if (toggleMeasurementsBtn) {
        toggleMeasurementsBtn.addEventListener('click', () => openRightPanel('measure'));
    }

    measurePoints.forEach(point => {
        point.addEventListener('click', (e) => {
            e.stopPropagation();
            measurePoints.forEach(p => p.classList.remove('active'));
            point.classList.add('active');

            const partId = point.getAttribute('data-part');
            const partName = point.getAttribute('data-name');
            currentMeasurePartName = partName;
            currentMeasurePartId = partId;

            popoverTitle.innerText = partName;
            measureInput.value = ''; 
            
            const pointRect = point.getBoundingClientRect();
            const containerRect = document.querySelector('.human-figure-container').getBoundingClientRect();
            const top = pointRect.top - containerRect.top;
            const left = pointRect.left - containerRect.left;

            measurePopover.style.top = `${Math.max(0, top - 30)}px`;
            measurePopover.style.left = `${left + 30}px`;

            measurePopover.classList.remove('hidden');
            measureInput.focus();
        });
    });

    if (btnConfirmMeasure) {
        btnConfirmMeasure.addEventListener('click', (e) => {
            e.stopPropagation();
            const val = measureInput.value;
            if (val && currentMeasurePartName) {
                let existingTag = document.querySelector(`.m-tag[data-part="${currentMeasurePartId}"]`);
                if (existingTag) {
                    existingTag.innerText = `${currentMeasurePartName}: ${val}cm`;
                } else {
                    const tag = document.createElement('div');
                    tag.className = 'm-tag';
                    tag.setAttribute('data-part', currentMeasurePartId);
                    tag.innerText = `${currentMeasurePartName}: ${val}cm`;
                    measurementsList.appendChild(tag);
                }
                measurePopover.classList.add('hidden');
                measurePoints.forEach(p => p.classList.remove('active'));
            }
        });
    }

    document.querySelector('.human-figure-container')?.addEventListener('click', (e) => {
        if (measurePopover && !measurePopover.contains(e.target) && !e.target.classList.contains('measure-point')) {
            measurePopover.classList.add('hidden');
            measurePoints.forEach(p => p.classList.remove('active'));
        }
    });

    // 为右侧面板内部的所有 x 按钮绑定关闭事件
    document.querySelectorAll('.close-right-panel-btn').forEach(btn => {
        btn.addEventListener('click', closeRightPanel);
    });

    // === BMI 动态计算逻辑 ===
    const inputHeight = document.getElementById('input-height');
    const inputWeight = document.getElementById('input-weight');
    const bmiValueText = document.getElementById('bmi-display-value');
    const bmiThumb = document.getElementById('bmi-thumb');
    const bmiThumbLabel = document.getElementById('bmi-thumb-label');

    function calculateAndRenderBMI() {
        if (!inputHeight || !inputWeight || !bmiValueText || !bmiThumb) return;

        const h = parseFloat(inputHeight.value) / 100; 
        const w = parseFloat(inputWeight.value);

        if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
            bmiValueText.innerText = '--';
            bmiThumb.style.left = '0%';
            bmiThumbLabel.innerText = '未知';
            return;
        }

        const bmi = w / (h * h);
        bmiValueText.innerText = bmi.toFixed(1);

        let category = '正常';
        let color = '#4A4E69'; 

        if (bmi < 18.5) {
            category = '过轻';
            color = '#8BA3E8'; 
        } else if (bmi >= 18.5 && bmi < 24) {
            category = '正常';
            color = '#4CAF50'; 
        } else if (bmi >= 24 && bmi < 28) {
            category = '超重';
            color = '#FF9800'; 
        } else if (bmi >= 28) {
            category = '肥胖';
            color = '#F44336'; 
        }

        bmiThumbLabel.innerText = category;
        bmiThumbLabel.style.background = color;

        let percent = ((bmi - 15) / 20) * 100;
        if (percent < 0) percent = 0;
        if (percent > 100) percent = 100;

        bmiThumb.style.left = `${percent}%`;
    }

    calculateAndRenderBMI();
    if (inputHeight) inputHeight.addEventListener('input', calculateAndRenderBMI);
    if (inputWeight) inputWeight.addEventListener('input', calculateAndRenderBMI);

});
"""

with open('js/profile.js', 'w', encoding='utf-8') as fw:
    fw.write(new_js)
print("js/profile.js updated successfully.")
