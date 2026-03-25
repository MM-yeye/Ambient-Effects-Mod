// Ambient Effects - 全能版（统一管理所有特效）
(function() {
    setTimeout(() => {
        try {
            initPlugin();
        } catch (e) {
            console.warn("氛围特效插件启动失败:", e);
        }
    }, 500);

    function initPlugin() {
        const CANVAS_ID = 'st-ambient-canvas';
        const MENU_ID = 'ambient-effects-menu';
        const STYLE_ID = 'ambient-custom-style';
        
        // 配置
        let config = {
            enabled: false,
            type: 'snow',
            speed: 2,
            size: 3,
            count: 100,
            color: '#ffffff'
        };

        // 特效库：统一存储所有用户特效
        let userEffects = [];  // { id, name, type, code, imageData }

        // 读取存储
        try {
            const saved = localStorage.getItem('st_ambient_config');
            if (saved) config = { ...config, ...JSON.parse(saved) };
            const savedEffects = localStorage.getItem('st_ambient_effects');
            if (savedEffects) userEffects = JSON.parse(savedEffects);
        } catch (err) {}

        // 保存特效库
        function saveEffects() {
            localStorage.setItem('st_ambient_effects', JSON.stringify(userEffects));
        }

        // --- CSS特效管理 ---
        let styleElement = null;
        function applyCSS(cssCode) {
            if (!styleElement) {
                styleElement = document.getElementById(STYLE_ID);
                if (!styleElement) {
                    styleElement = document.createElement('style');
                    styleElement.id = STYLE_ID;
                    document.head.appendChild(styleElement);
                }
            }
            if (cssCode && config.enabled) {
                styleElement.textContent = cssCode;
            } else {
                styleElement.textContent = '';
            }
        }

        // 添加特效
        function addEffect(name, type, codeOrImage) {
            const id = 'eff_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            if (type === 'css') {
                userEffects.push({ id, name, type, code: codeOrImage });
            } else if (type === 'image') {
                userEffects.push({ id, name, type, imageData: codeOrImage });
            }
            saveEffects();
            refreshEffectList();
            refreshTypeSelect();
            toastr.success(`特效 "${name}" 已添加`);
        }

        // 更新特效
        function updateEffect(id, newCode) {
            const index = userEffects.findIndex(e => e.id === id);
            if (index !== -1 && userEffects[index].type === 'css') {
                userEffects[index].code = newCode;
                saveEffects();
                if (config.type === userEffects[index].name && config.enabled) {
                    applyCSS(newCode);
                }
                refreshEffectList();
                toastr.success('已更新');
            }
        }

        // 删除特效
        function deleteEffect(id) {
            const effect = userEffects.find(e => e.id === id);
            if (effect && config.type === effect.name) {
                config.type = 'snow';
                saveConfig();
                if (config.enabled) applyCSS(null);
            }
            userEffects = userEffects.filter(e => e.id !== id);
            saveEffects();
            refreshEffectList();
            refreshTypeSelect();
            toastr.success('已删除');
        }

        // 刷新特效列表
        function refreshEffectList() {
            const container = document.getElementById('ambient-effect-list');
            if (!container) return;
            
            if (userEffects.length === 0) {
                container.innerHTML = '<div class="ambient-desc">暂无自定义特效，点击下方按钮添加</div>';
                return;
            }
            
            container.innerHTML = userEffects.map(effect => {
                const isCss = effect.type === 'css';
                const preview = isCss ? (effect.code.substring(0, 150) + (effect.code.length > 150 ? '...' : '')) : '🖼️ 图片特效';
                return `
                    <div class="effect-item" data-id="${effect.id}" style="border: 1px solid var(--SmartThemeBorderColor); border-radius: 8px; padding: 10px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <strong>${isCss ? '📜' : '🖼️'} ${effect.name}</strong>
                            <div>
                                <button class="menu_button use-effect" data-name="${effect.name}" style="margin-right: 5px;">✨ 使用</button>
                                <button class="menu_button edit-effect" data-id="${effect.id}" data-type="${effect.type}" style="margin-right: 5px;">✏️ 编辑</button>
                                <button class="menu_button red_button delete-effect" data-id="${effect.id}">🗑️ 删除</button>
                            </div>
                        </div>
                        <div id="effect-edit-${effect.id}" style="display: none;">
                            ${isCss ? `
                                <textarea class="css-editor" data-id="${effect.id}" rows="8" style="width: 100%; font-family: monospace; font-size: 12px; background: var(--SmartThemeBlurTintColor); color: var(--SmartThemeBodyColor); border: 1px solid var(--SmartThemeBorderColor); border-radius: 4px; padding: 8px;">${escapeHtml(effect.code)}</textarea>
                                <div style="display: flex; gap: 8px; margin-top: 8px;">
                                    <button class="menu_button save-effect" data-id="${effect.id}">💾 保存</button>
                                    <button class="menu_button cancel-edit" data-id="${effect.id}">❌ 取消</button>
                                </div>
                            ` : `
                                <div class="ambient-desc">图片特效无法编辑，如需更换请删除后重新添加</div>
                                <div style="margin-top: 8px;">
                                    <button class="menu_button cancel-edit" data-id="${effect.id}">关闭</button>
                                </div>
                            `}
                        </div>
                        <div class="effect-preview" id="effect-preview-${effect.id}" style="font-family: monospace; font-size: 11px; background: rgba(0,0,0,0.05); border-radius: 4px; padding: 6px; margin-top: 5px;">${escapeHtml(preview)}</div>
                    </div>
                `;
            }).join('');
            
            // 使用特效
            container.querySelectorAll('.use-effect').forEach(btn => {
                btn.addEventListener('click', () => {
                    const name = btn.dataset.name;
                    const effect = userEffects.find(e => e.name === name);
                    if (effect) {
                        config.type = name;
                        saveConfig();
                        if (config.enabled) {
                            if (effect.type === 'css') applyCSS(effect.code);
                            else applyCSS(null);
                        }
                        toastr.info(`已切换到特效: ${name}`);
                    }
                });
            });
            
            // 编辑特效
            container.querySelectorAll('.edit-effect').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    const editDiv = document.getElementById(`effect-edit-${id}`);
                    const previewDiv = document.getElementById(`effect-preview-${id}`);
                    if (editDiv) editDiv.style.display = 'block';
                    if (previewDiv) previewDiv.style.display = 'none';
                });
            });
            
            // 保存特效
            container.querySelectorAll('.save-effect').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    const textarea = document.querySelector(`.css-editor[data-id="${id}"]`);
                    if (textarea) {
                        updateEffect(id, textarea.value);
                        const editDiv = document.getElementById(`effect-edit-${id}`);
                        const previewDiv = document.getElementById(`effect-preview-${id}`);
                        if (editDiv) editDiv.style.display = 'none';
                        if (previewDiv) {
                            previewDiv.style.display = 'block';
                            previewDiv.textContent = textarea.value.substring(0, 150) + (textarea.value.length > 150 ? '...' : '');
                        }
                    }
                });
            });
            
            // 取消/关闭编辑
            container.querySelectorAll('.cancel-edit').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    const editDiv = document.getElementById(`effect-edit-${id}`);
                    const previewDiv = document.getElementById(`effect-preview-${id}`);
                    if (editDiv) editDiv.style.display = 'none';
                    if (previewDiv) previewDiv.style.display = 'block';
                });
            });
            
            // 删除特效
            container.querySelectorAll('.delete-effect').forEach(btn => {
                btn.addEventListener('click', () => deleteEffect(btn.dataset.id));
            });
        }

        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/[&<>]/g, function(m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
            });
        }

        // 新建CSS特效
        function createNewCSS() {
            const name = prompt('给CSS特效起个名字:', '我的CSS特效');
            if (!name) return;
            const defaultCode = `/* ===== ${name} ===== */
/* 在这里粘贴你的CSS特效代码，例如下雪效果 */
body::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    background: radial-gradient(circle, rgba(255,255,255,0.2), transparent);
    animation: glow 3s infinite;
}
@keyframes glow {
    0% { opacity: 0.3; }
    50% { opacity: 0.8; }
    100% { opacity: 0.3; }
}`;
            addEffect(name, 'css', defaultCode);
        }

        // 导入CSS文件
        function importCSSFile() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.css';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const name = prompt('给导入的CSS起个名字:', file.name.split('.')[0]);
                    if (name) addEffect(name, 'css', ev.target.result);
                };
                reader.readAsText(file);
            };
            input.click();
        }

        // 添加图片特效
        function importImageFile() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const name = prompt('给图片特效起个名字:', file.name.split('.')[0]);
                    if (name) addEffect(name, 'image', ev.target.result);
                };
                reader.readAsDataURL(file);
            };
            input.click();
        }

        // 刷新特效类型下拉框
        function refreshTypeSelect() {
            const select = document.getElementById('ambient_type');
            if (!select) return;
            const current = select.value;
            const builtIn = `
                <option value="snow">❄️ 柔光雪花</option>
                <option value="star">✨ 闪烁星光</option>
                <option value="leaf">🍀 飘落树叶</option>
                <option value="flower">🌸 飞舞花瓣</option>
            `;
            const userOpts = userEffects.map(e => `<option value="${e.name}">${e.type === 'css' ? '📜' : '🖼️'} ${e.name}</option>`).join('');
            select.innerHTML = builtIn + userOpts;
            select.value = current;
        }

        // --- 粒子系统 ---
        let ctx, particles = [], w, h, animFrame;
        class Particle {
            constructor() { this.reset(true); }
            reset(init) {
                this.x = Math.random() * w;
                this.y = init ? Math.random() * h : -20;
                this.size = Math.random() * config.size + (config.size/2);
                this.speedY = (Math.random()*0.5+0.5) * config.speed;
                this.speedX = (Math.random()-0.5) * (config.speed*0.5);
                this.angle = Math.random()*360;
                this.spin = (Math.random()-0.5)*2;
                this.opacity = Math.random()*0.5+0.3;
            }
            update() {
                this.y += this.speedY;
                this.x += this.speedX + Math.sin(this.y*0.01)*0.5;
                this.angle += this.spin;
                if (this.y > h+20 || this.x > w+20 || this.x < -20) this.reset();
            }
            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle*Math.PI/180);
                ctx.globalAlpha = this.opacity;
                const imgEffect = userEffects.find(e => e.name === config.type && e.type === 'image');
                if (imgEffect && imgEffect.imageData) {
                    const img = new Image();
                    img.src = imgEffect.imageData;
                    ctx.drawImage(img, -this.size, -this.size, this.size*2, this.size*2);
                } else {
                    ctx.fillStyle = config.color;
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size, 0, Math.PI*2);
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = config.color;
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        function initCanvas() {
            if (document.getElementById(CANVAS_ID)) return;
            let canvas = document.createElement('canvas');
            canvas.id = CANVAS_ID;
            document.body.appendChild(canvas);
            ctx = canvas.getContext('2d');
            const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
            window.addEventListener('resize', resize);
            resize();
            function loop() {
                if (!ctx) return;
                ctx.clearRect(0, 0, w, h);
                const isParticle = config.enabled && !userEffects.find(e => e.name === config.type && e.type === 'css');
                if (isParticle) {
                    if (particles.length < config.count) while(particles.length < config.count) particles.push(new Particle());
                    else if (particles.length > config.count) particles.splice(config.count);
                    particles.forEach(p => { p.update(); p.draw(); });
                } else particles = [];
                animFrame = requestAnimationFrame(loop);
            }
            loop();
        }
        function resetParticles() { particles = []; }
        function saveConfig() { localStorage.setItem('st_ambient_config', JSON.stringify(config)); }

        // 主开关
        function setEnabled(enabled) {
            config.enabled = enabled;
            saveConfig();
            if (enabled) {
                const cssEffect = userEffects.find(e => e.name === config.type && e.type === 'css');
                if (cssEffect) applyCSS(cssEffect.code);
                else applyCSS(null);
                resetParticles();
            } else {
                applyCSS(null);
                resetParticles();
            }
        }

        // 菜单注入
        function injectMenu() {
            const container = jQuery('#extensions_settings');
            if (!container.length || jQuery(`#${MENU_ID}`).length) return;

            const html = `
                <div id="${MENU_ID}" class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>🎨 氛围特效</b>
                        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
                    </div>
                    <div class="inline-drawer-content ambient-settings-box">
                        <div class="ambient-control-row" style="background: rgba(0,0,0,0.1); border-radius: 8px;">
                            <label style="font-weight: bold;">☠️ 全局开关</label>
                            <input type="checkbox" id="ambient_master_switch" ${config.enabled ? 'checked' : ''}>
                        </div>
                        
                        <div class="ambient-control-row">
                            <label>👾 特效类型</label>
                            <select id="ambient_type">
                                <option value="snow">❄️ 柔光雪花</option>
                                <option value="star">✨ 闪烁星光</option>
                                <option value="leaf">🍀 飘落树叶</option>
                                <option value="flower">🌸 飞舞花瓣</option>
                                ${userEffects.map(e => `<option value="${e.name}">${e.type === 'css' ? '📜' : '🖼️'} ${e.name}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div id="ambient-particle-controls">
                            <div class="ambient-control-row"><label>🎨 颜色</label><input type="color" id="ambient_color" value="${config.color}"></div>
                            <div class="ambient-control-row"><label>📏 大小</label><input type="range" id="ambient_size" min="1" max="10" step="0.5" value="${config.size}"></div>
                            <div class="ambient-control-row"><label>💨 速度</label><input type="range" id="ambient_speed" min="0.5" max="10" step="0.5" value="${config.speed}"></div>
                            <div class="ambient-control-row"><label>🔢 密度</label><input type="range" id="ambient_count" min="10" max="300" step="10" value="${config.count}"></div>
                        </div>
                        
                        <div style="border-top: 2px solid var(--SmartThemeBorderColor); margin: 10px 0;"></div>
                        
                        <div style="margin-bottom: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <strong>📦 我的特效库</strong>
                                <div>
                                    <button id="ambient-new-css" class="menu_button">➕ 新建CSS</button>
                                    <button id="ambient-import-css" class="menu_button">📥 导入CSS</button>
                                    <button id="ambient-import-img" class="menu_button">🖼️ 添加图片</button>
                                </div>
                            </div>
                            <div id="ambient-effect-list"></div>
                        </div>
                    </div>
                </div>
            `;
            container.append(html);

            jQuery('#ambient_master_switch').on('change', function() { setEnabled(jQuery(this).is(':checked')); });
            jQuery('#ambient_type').on('change', function() {
                const val = jQuery(this).val();
                config.type = val;
                saveConfig();
                const cssEffect = userEffects.find(e => e.name === val && e.type === 'css');
                if (cssEffect) applyCSS(cssEffect.code);
                else applyCSS(null);
                resetParticles();
                jQuery('#ambient-particle-controls').toggle(!cssEffect);
            });
            jQuery('#ambient_color').on('input', function() { config.color = jQuery(this).val(); saveConfig(); });
            jQuery('#ambient_size').on('input', function() { config.size = parseFloat(jQuery(this).val()); saveConfig(); resetParticles(); });
            jQuery('#ambient_speed').on('input', function() { config.speed = parseFloat(jQuery(this).val()); saveConfig(); resetParticles(); });
            jQuery('#ambient_count').on('input', function() { config.count = parseInt(jQuery(this).val()); saveConfig(); });
            jQuery('#ambient-new-css').on('click', createNewCSS);
            jQuery('#ambient-import-css').on('click', importCSSFile);
            jQuery('#ambient-import-img').on('click', importImageFile);
            
            refreshEffectList();
            refreshTypeSelect();
        }

        initCanvas();
        const cssEffect = userEffects.find(e => e.name === config.type && e.type === 'css');
        if (config.enabled && cssEffect) applyCSS(cssEffect.code);
        const interval = setInterval(() => {
            if (jQuery('#extensions_settings').length) {
                injectMenu();
                clearInterval(interval);
            }
        }, 1000);
    }
})();
