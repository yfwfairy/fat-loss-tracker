import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# We want to replace everything from <div class="modal-body"> to its closing </div>
# The modal boundary is from <div class="modal-body"> up to <footer class="modal-footer">
# We can just replace that section.

start_marker = '<div class="modal-body">'
end_marker = '<footer class="modal-footer">'

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_html = """<div class="modal-body" id="profile-modal-body">
                <!-- 左列：基础资料与设置 -->
                <div class="modal-left-panel">
                    <!-- 顶部：头像与昵称 -->
                    <div class="settings-top-section">
                        <div class="settings-avatar-edit">
                            <div class="settings-avatar" id="current-avatar">🌿</div>
                            <button class="edit-avatar-btn" id="btn-change-avatar">更换头像</button>
                        </div>
                        <div class="settings-name-edit">
                            <label>居民昵称</label>
                            <input type="text" class="styled-input" id="input-nickname" value="冒险者">
                        </div>
                    </div>

                    <!-- 底部：身体数据 -->
                    <div class="settings-data-section">
                        <h4>身体数据</h4>
                        <div class="data-grid">
                            <div class="data-item">
                                <label>年龄</label>
                                <div class="input-with-unit">
                                    <input type="number" class="styled-input" id="input-age" value="25" min="1" max="120">
                                    <span class="unit">岁</span>
                                </div>
                            </div>
                            <div class="data-item">
                                <label>身高</label>
                                <div class="input-with-unit">
                                    <input type="number" class="styled-input" id="input-height" value="170" step="0.1" min="50" max="250">
                                    <span class="unit">cm</span>
                                </div>
                            </div>
                            <div class="data-item">
                                <label>体重</label>
                                <div class="input-with-unit">
                                    <input type="number" class="styled-input" id="input-weight" value="65.0" step="0.1" min="20" max="300">
                                    <span class="unit">kg</span>
                                </div>
                            </div>
                        </div>

                        <!-- 动态 BMI 指示器 -->
                        <div class="bmi-indicator-wrapper">
                            <div class="bmi-header">
                                <span class="bmi-title">体质指数 (BMI)</span>
                                <span class="bmi-value" id="bmi-display-value">22.5</span>
                            </div>
                            <div class="bmi-bar">
                                <div class="bmi-segment underweight" title="过轻 (<18.5)"></div>
                                <div class="bmi-segment normal" title="正常 (18.5 ~ 23.9)"></div>
                                <div class="bmi-segment overweight" title="超重 (24.0 ~ 27.9)"></div>
                                <div class="bmi-segment obese" title="肥胖 (≥28)"></div>
                                <div class="bmi-thumb" id="bmi-thumb">
                                    <div class="bmi-thumb-label" id="bmi-thumb-label">正常</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 触发展开身材维度的按钮 -->
                    <button class="btn-expand-measurements" id="toggle-measurements">
                        <span>🌱 手工录入身体各围度参数</span>
                        <span class="expand-icon" id="measurements-expand-icon">▶</span>
                    </button>
                </div><!-- 左列结束 -->

                <!-- 右列：动态内容区域 (头像/身材) -->
                <div class="modal-right-panel hidden-panel" id="modal-right-panel">
                    
                    <!-- 头像选择库 -->
                    <div class="right-panel-content hidden" id="avatar-picker-panel">
                        <div class="panel-header-flex">
                            <h4>选择化身 🍄</h4>
                            <button class="close-right-panel-btn" id="close-avatar-picker">×</button>
                        </div>
                        <div class="avatar-picker-grid" id="avatar-picker-grid">
                            <div class="preset-avatar">🍄</div><div class="preset-avatar">🐢</div><div class="preset-avatar">🌟</div>
                            <div class="preset-avatar">👑</div><div class="preset-avatar">👻</div><div class="preset-avatar">🦖</div>
                            <div class="preset-avatar">🌰</div><div class="preset-avatar">🌸</div><div class="preset-avatar">☁️</div>
                            <div class="preset-avatar">🔥</div><div class="preset-avatar">🦊</div><div class="preset-avatar">🧚</div>
                            <div class="preset-avatar">🌞</div><div class="preset-avatar">🌙</div><div class="preset-avatar">⭐</div>
                            <div class="preset-avatar">🍎</div><div class="preset-avatar">🍉</div><div class="preset-avatar">🍇</div>
                            <div class="preset-avatar">🐶</div><div class="preset-avatar">🐱</div><div class="preset-avatar">🐭</div>
                            <div class="preset-avatar">🦄</div><div class="preset-avatar">🐧</div><div class="preset-avatar">🐸</div>
                        </div>
                    </div>

                    <!-- 身材维度记录 -->
                    <div class="right-panel-content hidden" id="measurements-body">
                        <div class="panel-header-flex">
                            <h4>身材围度记录 🌱</h4>
                            <button class="close-right-panel-btn" id="close-measurements-btn">×</button>
                        </div>
                        <div class="human-figure-container">
                            <div class="css-humanoid">
                                <div class="human-head"></div>
                                <div class="human-torso"></div>
                                <div class="human-arm left"></div>
                                <div class="human-arm right"></div>
                                <div class="human-leg left"></div>
                                <div class="human-leg right"></div>

                                <button class="measure-point point-chest" data-part="chest" data-name="胸围"></button>
                                <button class="measure-point point-waist" data-part="waist" data-name="腰围"></button>
                                <button class="measure-point point-hip" data-part="hip" data-name="臀围"></button>
                                <button class="measure-point point-arm left-arm" data-part="arm_left" data-name="左大臂"></button>
                                <button class="measure-point point-arm right-arm" data-part="arm_right" data-name="右大臂"></button>
                                <button class="measure-point point-thigh left-thigh" data-part="thigh_left" data-name="左大腿"></button>
                                <button class="measure-point point-thigh right-thigh" data-part="thigh_right" data-name="右大腿"></button>
                                <button class="measure-point point-calf left-calf" data-part="calf_left" data-name="左小腿"></button>
                                <button class="measure-point point-calf right-calf" data-part="calf_right" data-name="右小腿"></button>
                            </div>

                            <div class="measure-input-popover hidden" id="measure-popover">
                                <label id="measure-popover-title">胸围</label>
                                <div class="input-with-unit small">
                                    <input type="number" class="styled-input" id="active-measure-input" step="0.1">
                                    <span class="unit">cm</span>
                                </div>
                                <button class="popover-confirm-btn" id="btn-confirm-measure">✔</button>
                            </div>
                        </div>
                        
                        <div class="measurements-list" id="measurements-list"></div>
                    </div>
                </div>
            </div>

            """
    
    new_text = text[:start_idx] + new_html + text[end_idx:]
    with open('index.html', 'w', encoding='utf-8') as fw:
        fw.write(new_text)
    print("HTML updated successfully.")
else:
    print("Could not find markers.")
