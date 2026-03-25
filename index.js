// Ambient Effects - 统一特效管理器（内置特效也可删改）
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
        
        // 内置特效列表
        const builtInEffects = [
            { id: 'snow', name: '❄️ 柔光雪花', type: 'builtin', code: null, icon: '❄️' },
            { id: 'star', name: '✨ 闪烁星光', type: 'builtin', code: null, icon: '✨' },
            { id: 'leaf', name: '🍀 飘落树叶', type: 'builtin', code: null, icon: '🍀' },
            { id: 'flower', name: '🌸 飞舞花瓣', type: 'builtin', code: null, icon: '🌸' }
        ];
        
        // 配置
        let config = {
            enabled: false,
            activeEffectId: 'snow',
            speed: 2,
            size: 3,
            count: 100,
            color: '#ffffff'
        };

        // 用户特效库
        let userEffects = [];  // { id, name, type, code, imageData }

        // 读取存储
        try {
            const saved = localStorage.getItem('st_ambient_config');
            if (saved) config = { ...config, ...JSON.parse(saved) };
            const savedEffects = localStorage.getItem('st_ambient_effects');
            if (savedEffects) userEffects = JSON.parse(savedEffects);
        } catch (err) {}

        // 获取所有特效（内置 + 用户）
        function getAllEffects() {
            return [...builtInEffects, ...userEffects];
        }

        // 获取当前激活的特效
        function getActiveEffect() {
            return getAllEffects().find(e => e.id === config.activeEffectId);
        }

        function saveEffects() {
            localStorage.setItem('st_ambient_effects', JSON.stringify(userEffects));
        }
        function saveConfig() { localStorage.setItem('st_ambient_config', JSON.stringify(config)); }

        // --- CSS应用 ---
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

        // 应用当前特效
        function applyCurrentEffect() {
            if (!config.enabled) {
                applyCSS(null);
                resetParticles();
                return;
            }
            const effect = getActiveEffect();
            if (effect.type === 'css' && effect.code) {
                applyCSS(effect.code);
                resetParticles();
            } else {
                applyCSS(null);
                resetParticles();
            }
        }

        // --- 特效管理函数 ---
        function addEffect(name, type, data) {
            const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            if (type === 'css') {
                userEffects.push({ id, name, type, code: data });
            } else if (type === 'image') {
                userEffects.push({ id, name, type, imageData: data });
            }
            saveEffects();
            refreshEffectList();
            toastr.success(`特效 "${name}" 已添加`);
        }

        function updateEffect(id, newData) {
            const index = userEffects.findIndex(e => e.id === id);
            if (index !== -1 && userEffects[index].type === 'css') {
                userEffects[index].code = newData;
                saveEffects();
                if (config.activeEffectId === id) {
                    applyCurrentEffect();
                }
                refreshEffectList();
                toastr.success('已更新');
            }
        }

        function deleteEffect(effectId, isBuiltin = false) {
            if (isBuiltin) {
                // 内置特效：恢复默认（不能真正删除，但可以重置）
                toastr.info('内置特效无法删除，可以禁用或选择其他特效');
                return;
            }
            const effect = userEffects.find(e => e.id === effectId);
            if (effect && config.activeEffectId === effectId) {
                config.activeEffectId = 'snow';
                saveConfig();
                applyCurrentEffect();
            }
            userEffects = userEffects.filter(e => e.id !== effectId);
            saveEffects();
            refreshEffectList();
            toastr.success('已删除');
        }

        function setActiveEffect(effectId) {
            config.activeEffectId = effectId;
            saveConfig();
            applyCurrentEffect();
            refreshEffectList(); // 刷新高亮
            const effect = getAllEffects().find(e => e.id === effectId);
            toastr.info(`已切换到: ${effect?.name || effectId}`);
        }

        // --- 刷新特效列表 ---
        function refreshEffectList() {
            const container = document.getElementById('ambient-effect-list');
            if (!container) return;
            
            const allEffects = getAllEffects();
            if (allEffects.length === 0) {
                container.innerHTML = '<div class="ambient-desc">暂无特效，点击上方按钮添加</div>';
                return;
            }
            
            container.innerHTML = allEffects.map(effect => {
                const isActive = config.activeEffectId === effect.id;
                const isUser = effect.type !== 'builtin';
                const isCss = effect.type === 'css';
                const preview = isCss ? (effect.code?.substring(0, 100) + (effect.code?.length > 100 ? '...' : '')) : (isUser ? '🖼️ 图片特效' : '内置特效');
                
                return `
                    <div class="effect-item" data-id="${effect.id}" data-type="${effect.type}" style="border: 1px solid ${isActive ? '#ff8888' : 'var(--SmartThemeBorderColor)'}; border-radius: 8px; padding: 8px 12px; margin-bottom: 8px; background: ${isActive ? 'rgba(255,136,136,0.1)' : 'transparent'};">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                                <span style="font-size: 20px;">${effect.icon || (isCss ? '📜' : (isUser ? '🖼️' : '✨'))}</span>
                                <strong>${effect.name}</strong>
                                <span style="font-size: 11px; opacity: 0.6;">${isCss ? 'CSS' : (isUser ? '图片' : '内置')}</span>
                            </div>
                            <div style="display: flex; gap: 5px;">
                                <button class="menu_button use-effect" data-id="${effect.id}" style="padding: 2px 8px;">✨ 使用</button>
                                ${isUser ? `
                                    <button class="menu_button edit-effect" data-id="${effect.id}" data-type="${effect.type}" style="padding: 2px 8px;">✏️ 编辑</button>
                                    <button class="menu_button red_button delete-effect" data-id="${effect.id}" style="padding: 2px 8px;">🗑️</button>
                                ` : `
                                    <button class="menu_button" disabled style="opacity: 0.5; padding: 2px 8px;">📌 内置</button>
                                `}
                            </div>
                        </div>
                        ${isUser ? `
                            <div id="effect-edit-${effect.id}" style="display: none; margin-top: 10px;">
                                ${isCss ? `
                                    <textarea class="css-editor" data-id="${effect.id}" rows="6" style="width: 100%; font-family: monospace; font-size: 12px; background: var(--SmartThemeBlurTintColor); color: var(--SmartThemeBodyColor); border: 1px solid var(--SmartThemeBorderColor); border-radius: 4px; padding: 8px;">${escapeHtml(effect.code || '')}</textarea>
                                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                                        <button class="menu_button save-effect" data-id="${effect.id}">💾 保存</button>
                                        <button class="menu_button cancel-edit" data-id="${effect.id}">❌ 取消</button>
                                    </div>
                                ` : `
                                    <div class="ambient-desc" style="margin-top: 5px;">图片特效预览：</div>
                                    <div style="margin-top: 5px;"><img src="${effect.imageData}" style="max-width: 100px; max-height: 60px; border-radius: 4px;"></div>
                                    <div style="margin-top: 8px;">
                                        <button class="menu_button cancel-edit" data-id="${effect.id}">关闭</button>
                                    </div>
                                `}
                            </div>
                            <div class="effect-preview" id="effect-preview-${effect.id}" style="font-size: 11px; opacity: 0.7; margin-top: 4px;">${escapeHtml(preview)}</div>
                        ` : `
                            <div class="effect-preview" style="font-size: 11px; opacity: 0.5; margin-top: 4px;">内置粒子特效，可调节颜色/大小/速度/密度</div>
                        `}
                    </div>
                `;
            }).join('');
            
            // 绑定使用按钮
            container.querySelectorAll('.use-effect').forEach(btn => {
                btn.addEventListener('click', () => setActiveEffect(btn.dataset.id));
            });
            
            // 编辑按钮
            container.querySelectorAll('.edit-effect').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    const editDiv = document.getElementById(`effect-edit-${id}`);
                    const previewDiv = document.getElementById(`effect-preview-${id}`);
                    if (editDiv) editDiv.style.display = 'block';
                    if (previewDiv) previewDiv.style.display = 'none';
                });
            });
            
            // 保存按钮
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
                            previewDiv.textContent = textarea.value.substring(0, 100) + (textarea.value.length > 100 ? '...' : '');
                        }
                    }
                });
            });
            
            // 取消按钮
            container.querySelectorAll('.cancel-edit').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    const editDiv = document.getElementById(`effect-edit-${id}`);
                    const previewDiv = document.getElementById(`effect-preview-${id}`);
                    if (editDiv) editDiv.style.display = 'none';
                    if (previewDiv) previewDiv.style.display = 'block';
                });
            });
            
            // 删除按钮
            container.querySelectorAll('.delete-effect').forEach(btn => {
                btn.addEventListener('click', () => deleteEffect(btn.dataset.id, false));
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

        // --- 添加特效的弹窗 ---
        function showAddEffectDialog() {
            const modal = document.createElement('div');
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100000;';
            modal.innerHTML = `
                <div style="background: var(--SmartThemeBlurTintColor); border-radius: 12px; padding: 20px; width: 300px;">
                    <h3 style="margin: 0 0 15px 0;">添加特效</h3>
                    <button id="add-css-btn" class="menu_button" style="width: 100%; margin-bottom: 10px;">📜 添加CSS特效</button>
                    <button id="add-image-btn" class="menu_button" style="width: 100%;">🖼️ 添加图片特效</button>
                    <button id="cancel-add-btn" class="menu_button" style="width: 100%; margin-top: 10px;">取消</button>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.querySelector('#add-css-btn').onclick = () => {
                modal.remove();
                const name = prompt('给CSS特效起个名字:', '我的CSS特效');
                if (name) {
                    const defaultCode = `/* ===== ${name} ===== */\n/* 在这里粘贴你的CSS特效代码 */\nbody::before {\n    content: "";\n    position: fixed;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 100%;\n    pointer-events: none;\n    z-index: 9999;\n    background: radial-gradient(circle, rgba(255,255,255,0.2), transparent);\n    animation: glow 3s infinite;\n}\n@keyframes glow {\n    0% { opacity: 0.3; }\n    50% { opacity: 0.8; }\n    100% { opacity: 0.3; }\n}`;
                    addEffect(name, 'css', defaultCode);
                }
            };
            modal.querySelector('#add-image-btn').onclick = () => {
                modal.remove();
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
            };
            modal.querySelector('#cancel-add-btn').onclick = () => modal.remove();
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
                const effect = getActiveEffect();
                if (effect?.type === 'image' && effect.imageData) {
                    const img = new Image();
                    img.src = effect.imageData;
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
                const effect = getActiveEffect();
                const isParticle = config.enabled && effect && effect.type !== 'css';
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

        // 主开关
        function setEnabled(enabled) {
            config.enabled = enabled;
            saveConfig();
            applyCurrentEffect();
        }

        // --- 菜单注入 ---
        function injectMenu() {
            const container = jQuery('#extensions_settings');
            if (!container.length || jQuery(`#${MENU_ID}`).length) return;

            const html = `
                <div id="${MENU_ID}" class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>🎨 氛围特效</b>
                        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
                    </div>
                    <div class="inline-drawer-content ambient-settings-box" style="padding: 8px;">
                        <div class="ambient-control-row" style="background: rgba(0,0,0,0.1); border-radius: 8px; margin-bottom: 12px;">
                            <label style="font-weight: bold;">☠️ 全局开关</label>
                            <input type="checkbox" id="ambient_master_switch" ${config.enabled ? 'checked' : ''}>
                        </div>
                        
                        <div id="ambient-particle-controls" style="margin-bottom: 12px;">
                            <div class="ambient-control-row"><label>🎨 颜色</label><input type="color" id="ambient_color" value="${config.color}"></div>
                            <div class="ambient-control-row"><label>📏 大小</label><input type="range" id="ambient_size" min="1" max="10" step="0.5" value="${config.size}"></div>
                            <div class="ambient-control-row"><label>💨 速度</label><input type="range" id="ambient_speed" min="0.5" max="10" step="0.5" value="${config.speed}"></div>
                            <div class="ambient-control-row"><label>🔢 密度</label><input type="range" id="ambient_count" min="10" max="300" step="10" value="${config.count}"></div>
                        </div>
                        
                        <div style="border-top: 2px solid var(--SmartThemeBorderColor); margin: 8px 0;"></div>
                        
                        <div style="margin-bottom: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <strong>📦 特效库</strong>
                                <div>
                                    <button id="ambient-add-effect" class="menu_button">➕ 添加特效</button>
                                    <button id="ambient-import-css" class="menu_button">📥 导入CSS</button>
                                </div>
                            </div>
                            <div id="ambient-effect-list" style="max-height: 400px; overflow-y: auto;"></div>
                        </div>
                    </div>
                </div>
            `;
            container.append(html);

            jQuery('#ambient_master_switch').on('change', function() { setEnabled(jQuery(this).is(':checked')); });
            jQuery('#ambient_color').on('input', function() { config.color = jQuery(this).val(); saveConfig(); });
            jQuery('#ambient_size').on('input', function() { config.size = parseFloat(jQuery(this).val()); saveConfig(); resetParticles(); });
            jQuery('#ambient_speed').on('input', function() { config.speed = parseFloat(jQuery(this).val()); saveConfig(); resetParticles(); });
            jQuery('#ambient_count').on('input', function() { config.count = parseInt(jQuery(this).val()); saveConfig(); });
            jQuery('#ambient-add-effect').on('click', showAddEffectDialog);
            jQuery('#ambient-import-css').on('click', importCSSFile);
            
            refreshEffectList();
        }

        initCanvas();
        applyCurrentEffect();
        const interval = setInterval(() => {
            if (jQuery('#extensions_settings').length) {
                injectMenu();
                clearInterval(interval);
            }
        }, 1000);
    }
})();
