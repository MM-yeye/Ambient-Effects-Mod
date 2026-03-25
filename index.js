// Ambient Effects - 全能版（统一开关 + CSS特效库）
(function() {
    setTimeout(() => {
        try {
            initUnifiedPlugin();
        } catch (e) {
            console.warn("氛围特效插件启动失败:", e);
        }
    }, 500);

    function initUnifiedPlugin() {
        const CANVAS_ID = 'st-ambient-canvas';
        const MENU_ID = 'ambient-effects-menu';
        const STYLE_ID = 'ambient-custom-style';
        
        // --- 配置存储 ---
        let config = {
            enabled: false,           // 统一开关
            type: 'snow',            // 当前选中的特效
            speed: 2,
            size: 3,
            count: 100,
            color: '#ffffff',
            activeCSS: null          // 当前启用的CSS特效ID
        };

        // 特效库
        let userImages = [];          // 图片特效 { name, imageData }
        let userCSS = [];             // CSS特效 { id, name, code }
        
        // 运行时变量
        let ctx, particles = [], w, h, animationFrame;
        let customStyleElement = null;
        let currentCSSId = null;

        // 安全读取存储
        try {
            const saved = localStorage.getItem('st_ambient_config');
            if (saved) config = { ...config, ...JSON.parse(saved) };
            const savedImages = localStorage.getItem('st_ambient_images');
            if (savedImages) userImages = JSON.parse(savedImages);
            const savedCSS = localStorage.getItem('st_ambient_css');
            if (savedCSS) userCSS = JSON.parse(savedCSS);
        } catch (err) { console.log('读取配置失败'); }

        // --- CSS特效管理 ---
        function applyCSS(cssId) {
            if (!customStyleElement) {
                customStyleElement = document.getElementById(STYLE_ID);
                if (!customStyleElement) {
                    customStyleElement = document.createElement('style');
                    customStyleElement.id = STYLE_ID;
                    document.head.appendChild(customStyleElement);
                }
            }
            
            if (cssId && config.enabled) {
                const cssEffect = userCSS.find(c => c.id === cssId);
                if (cssEffect) {
                    customStyleElement.textContent = cssEffect.code;
                    currentCSSId = cssId;
                    return;
                }
            }
            customStyleElement.textContent = '';
            currentCSSId = null;
        }

        function addCSS(name, code) {
            const id = 'css_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            userCSS.push({ id, name, code });
            localStorage.setItem('st_ambient_css', JSON.stringify(userCSS));
            refreshCSSList();
            toastr.success(`CSS特效 "${name}" 已添加`);
        }

        function updateCSS(id, newCode) {
            const index = userCSS.findIndex(c => c.id === id);
            if (index !== -1) {
                userCSS[index].code = newCode;
                localStorage.setItem('st_ambient_css', JSON.stringify(userCSS));
                if (config.activeCSS === id && config.enabled) applyCSS(id);
                refreshCSSList();
                toastr.success('CSS已更新');
            }
        }

        function deleteCSS(id) {
            userCSS = userCSS.filter(c => c.id !== id);
            localStorage.setItem('st_ambient_css', JSON.stringify(userCSS));
            if (config.activeCSS === id) {
                config.activeCSS = null;
                saveConfig();
                applyCSS(null);
            }
            refreshCSSList();
            toastr.success('CSS特效已删除');
        }

        function refreshCSSList() {
            const container = document.getElementById('ambient-css-list');
            if (!container) return;
            
            if (userCSS.length === 0) {
                container.innerHTML = '<div class="ambient-desc">暂无CSS特效，点击"➕ 新建CSS特效"添加</div>';
                return;
            }
            
            container.innerHTML = userCSS.map(css => `
                <div class="ambient-control-row" style="flex-direction: column; align-items: stretch; margin-bottom: 10px; border: 1px solid var(--SmartThemeBorderColor); border-radius: 8px; padding: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong>📜 ${css.name}</strong>
                        <div>
                            <button class="menu_button use-css" data-id="${css.id}" style="margin-right: 5px;">✨ 使用</button>
                            <button class="menu_button edit-css" data-id="${css.id}" style="margin-right: 5px;">✏️ 编辑</button>
                            <button class="menu_button red_button delete-css" data-id="${css.id}">🗑️ 删除</button>
                        </div>
                    </div>
                    <textarea class="css-preview" data-id="${css.id}" rows="3" readonly style="width: 100%; font-family: monospace; font-size: 11px; background: rgba(0,0,0,0.05); border: none; border-radius: 4px; padding: 6px;">${css.code.substring(0, 150)}${css.code.length > 150 ? '...' : ''}</textarea>
                </div>
            `).join('');
            
            container.querySelectorAll('.use-css').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    config.activeCSS = id;
                    config.type = 'css';
                    saveConfig();
                    if (config.enabled) applyCSS(id);
                    refreshActiveHighlight();
                    toastr.info(`已切换到CSS特效: ${userCSS.find(c => c.id === id)?.name}`);
                });
            });
            
            container.querySelectorAll('.edit-css').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    const css = userCSS.find(c => c.id === id);
                    if (css) {
                        const newCode = prompt('编辑CSS代码:', css.code);
                        if (newCode !== null && newCode !== css.code) {
                            updateCSS(id, newCode);
                        }
                    }
                });
            });
            
            container.querySelectorAll('.delete-css').forEach(btn => {
                btn.addEventListener('click', () => deleteCSS(btn.dataset.id));
            });
        }

        function createNewCSS() {
            const name = prompt('给CSS特效起个名字:', '我的特效');
            if (!name) return;
            const defaultCode = `/* ===== ${name} ===== */
/* 示例：雪花飘落特效 - 可替换成你自己的CSS */
body::before {
    content: "";
    position: fixed;
    top: -100px;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3), transparent 70%);
    animation: pulse 3s infinite;
}

@keyframes pulse {
    0% { opacity: 0.3; }
    50% { opacity: 0.8; }
    100% { opacity: 0.3; }
}`;
            addCSS(name, defaultCode);
        }

        function importCSS() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.css';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const name = prompt('给导入的CSS起个名字:', file.name.split('.')[0]);
                    if (name) addCSS(name, event.target.result);
                };
                reader.readAsText(file);
            };
            input.click();
        }

        function exportCSS(cssId) {
            const css = userCSS.find(c => c.id === cssId);
            if (!css) return;
            const blob = new Blob([css.code], {type: 'text/css'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${css.name}.css`;
            a.click();
            URL.revokeObjectURL(url);
            toastr.success(`已导出 ${css.name}`);
        }

        // --- 图片特效管理（同之前）---
        function addImageEffect(name, imageData) {
            userImages.push({ name, imageData });
            localStorage.setItem('st_ambient_images', JSON.stringify(userImages));
            refreshImageList();
            refreshTypeSelect();
            toastr.success(`图片特效 "${name}" 添加成功！`);
        }

        function deleteImageEffect(name) {
            userImages = userImages.filter(e => e.name !== name);
            localStorage.setItem('st_ambient_images', JSON.stringify(userImages));
            if (config.type === name) {
                config.type = 'snow';
                saveConfig();
            }
            refreshImageList();
            refreshTypeSelect();
            toastr.success(`图片特效 "${name}" 已删除`);
        }

        function refreshImageList() {
            const container = document.getElementById('ambient-image-list');
            if (!container) return;
            
            if (userImages.length === 0) {
                container.innerHTML = '<div class="ambient-desc">暂无图片特效，点击"➕ 添加图片特效"导入</div>';
                return;
            }
            
            container.innerHTML = userImages.map(img => `
                <div class="ambient-control-row" style="justify-content: space-between;">
                    <span>🖼️ ${img.name}</span>
                    <div>
                        <button class="menu_button use-image" data-name="${img.name}" style="margin-right: 5px;">✨ 使用</button>
                        <button class="menu_button red_button delete-image" data-name="${img.name}">🗑️ 删除</button>
                    </div>
                </div>
            `).join('');
            
            container.querySelectorAll('.use-image').forEach(btn => {
                btn.addEventListener('click', () => {
                    config.type = btn.dataset.name;
                    config.activeCSS = null;
                    saveConfig();
                    if (config.enabled) {
                        applyCSS(null);
                        resetParticles();
                    }
                    refreshActiveHighlight();
                    toastr.info(`已切换到图片特效: ${btn.dataset.name}`);
                });
            });
            
            container.querySelectorAll('.delete-image').forEach(btn => {
                btn.addEventListener('click', () => deleteImageEffect(btn.dataset.name));
            });
        }

        function importImageEffect() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const name = prompt('给特效起个名字:', file.name.split('.')[0]);
                    if (name) addImageEffect(name, event.target.result);
                };
                reader.readAsDataURL(file);
            };
            input.click();
        }

        function refreshTypeSelect() {
            const select = document.getElementById('ambient_type');
            if (!select) return;
            const currentVal = select.value;
            const builtIn = `
                <option value="snow">❄️ 柔光雪花</option>
                <option value="star">✨ 闪烁星光</option>
                <option value="leaf">🍃 飘落树叶</option>
                <option value="flower">💐 飞舞花瓣</option>
            `;
            const imageOptions = userImages.map(e => `<option value="${e.name}">🖼️ ${e.name}</option>`).join('');
            select.innerHTML = builtIn + imageOptions;
            select.value = currentVal;
        }

        function refreshActiveHighlight() {
            // 高亮当前激活的特效（可选）
        }

        // --- 粒子系统（原版）---
        class Particle {
            constructor() { this.reset(true); }
            reset(initial = false) {
                this.x = Math.random() * w;
                this.y = initial ? Math.random() * h : -20;
                this.size = Math.random() * config.size + (config.size / 2);
                this.speedY = (Math.random() * 0.5 + 0.5) * config.speed;
                this.speedX = (Math.random() - 0.5) * (config.speed * 0.5);
                this.angle = Math.random() * 360;
                this.spin = (Math.random() - 0.5) * 2;
                this.opacity = Math.random() * 0.5 + 0.3;
            }
            update() {
                this.y += this.speedY;
                this.x += this.speedX + Math.sin(this.y * 0.01) * 0.5;
                this.angle += this.spin;
                if (this.y > h + 20 || this.x > w + 20 || this.x < -20) this.reset();
            }
            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle * Math.PI / 180);
                ctx.globalAlpha = this.opacity;
                const imgEffect = userImages.find(e => e.name === config.type);
                if (imgEffect && imgEffect.imageData) {
                    const img = new Image();
                    img.src = imgEffect.imageData;
                    ctx.drawImage(img, -this.size, -this.size, this.size * 2, this.size * 2);
                } else {
                    ctx.fillStyle = config.color;
                    switch (config.type) {
                        case 'star': this.drawStar(ctx, this.size); break;
                        case 'flower': this.drawFlower(ctx, this.size); break;
                        case 'leaf': this.drawLeaf(ctx, this.size); break;
                        default:
                            ctx.beginPath();
                            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                            ctx.shadowBlur = 5;
                            ctx.shadowColor = config.color;
                            ctx.fill();
                            break;
                    }
                }
                ctx.restore();
            }
            drawStar(c, r) { /* 省略 */ c.beginPath(); c.moveTo(0, -r); c.quadraticCurveTo(2, -2, r, 0); c.quadraticCurveTo(2, 2, 0, r); c.quadraticCurveTo(-2, 2, -r, 0); c.quadraticCurveTo(-2, -2, 0, -r); c.fill(); }
            drawLeaf(c, r) { c.beginPath(); c.ellipse(0, 0, r, r/2, 0, 0, Math.PI * 2); c.fill(); }
            drawFlower(c, r) { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(r, -r, r*2, 0, 0, r); c.bezierCurveTo(-r*2, 0, -r, -r, 0, 0); c.fill(); }
        }

        function initCanvas() {
            if (document.getElementById(CANVAS_ID)) return;
            let canvas = document.createElement('canvas');
            canvas.id = CANVAS_ID;
            if (document.body) {
                document.body.appendChild(canvas);
                ctx = canvas.getContext('2d');
                const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
                window.addEventListener('resize', resize);
                resize();
                loop();
            } else setTimeout(initCanvas, 500);
        }

        function loop() {
            if (!ctx) return;
            ctx.clearRect(0, 0, w, h);
            const isParticleActive = config.enabled && config.type !== 'css' && !config.activeCSS;
            if (isParticleActive) {
                if (particles.length < config.count) while(particles.length < config.count) particles.push(new Particle());
                else if (particles.length > config.count) particles.splice(config.count);
                particles.forEach(p => { p.update(); p.draw(); });
            } else particles = [];
            animationFrame = requestAnimationFrame(loop);
        }
        function resetParticles() { particles = []; }
        function saveConfig() { localStorage.setItem('st_ambient_config', JSON.stringify(config)); }

        // --- 主开关 ---
        function setEnabled(enabled) {
            config.enabled = enabled;
            saveConfig();
            if (enabled) {
                if (config.type === 'css' || config.activeCSS) {
                    applyCSS(config.activeCSS);
                } else {
                    applyCSS(null);
                    resetParticles();
                }
            } else {
                applyCSS(null);
                resetParticles();
            }
        }

        // --- 菜单注入 ---
        function injectSettingsMenu() {
            const container = jQuery('#extensions_settings');
            if (container.length === 0 || jQuery(`#${MENU_ID}`).length) return;

            const builtInOptions = `
                <option value="snow">❄️ 柔光雪花</option>
                <option value="star">✨ 闪烁星光</option>
                <option value="leaf">🍃 飘落树叶</option>
                <option value="flower">💐 飞舞花瓣</option>
                ${userImages.map(e => `<option value="${e.name}">🖼️ ${e.name}</option>`).join('')}
            `;

            const html = `
                <div id="${MENU_ID}" class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>🎨 氛围特效</b>
                        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
                    </div>
                    <div class="inline-drawer-content ambient-settings-box">
                        <!-- 统一开关 -->
                        <div class="ambient-control-row" style="background: var(--SmartThemeBlurTintColor); border-radius: 8px; margin-bottom: 10px;">
                            <label style="font-size: 16px; font-weight: bold;">🔘 全局特效开关</label>
                            <input type="checkbox" id="ambient_master_switch" ${config.enabled ? 'checked' : ''} style="width: 20px; height: 20px;">
                        </div>
                        
                        <div class="ambient-desc">选择一个特效，主开关控制开启/关闭</div>
                        
                        <div class="ambient-control-row">
                            <label>🎭 特效类型</label>
                            <select id="ambient_type">${builtInOptions}</select>
                        </div>
                        
                        <div class="ambient-control-row" id="css-control-row" style="${config.type === 'css' || config.activeCSS ? '' : 'display: none;'}">
                            <label>🎨 CSS特效库</label>
                            <div style="flex: 1; text-align: right;">
                                <button id="ambient-new-css" class="menu_button">➕ 新建CSS</button>
                                <button id="ambient-import-css" class="menu_button">📥 导入CSS</button>
                            </div>
                        </div>
                        
                        <div id="ambient-css-list" style="margin: 8px 0;"></div>
                        
                        <div id="ambient-particle-controls" style="${config.type === 'css' || config.activeCSS ? 'display: none;' : ''}">
                            <div class="ambient-control-row"><label>🎨 颜色</label><input type="color" id="ambient_color" value="${config.color}"></div>
                            <div class="ambient-control-row"><label>📏 粒子大小</label><input type="range" id="ambient_size" min="1" max="10" step="0.5" value="${config.size}"></div>
                            <div class="ambient-control-row"><label>💨 飘落速度</label><input type="range" id="ambient_speed" min="0.5" max="10" step="0.5" value="${config.speed}"></div>
                            <div class="ambient-control-row"><label>🔢 粒子密度</label><input type="range" id="ambient_count" min="10" max="300" step="10" value="${config.count}"></div>
                        </div>
                        
                        <div style="border-top: 2px solid var(--SmartThemeBorderColor); margin: 10px 0;"></div>
                        
                        <div class="ambient-control-row">
                            <label>🖼️ 图片特效库</label>
                            <button id="ambient-import-img" class="menu_button">➕ 添加图片</button>
                        </div>
                        <div id="ambient-image-list"></div>
                    </div>
                </div>
            `;
            container.append(html);
            
            // 绑定事件
            jQuery(`#${MENU_ID}`).find('.inline-drawer-toggle').on('click', function() {
                jQuery(this).closest('.inline-drawer').toggleClass('expanded');
            });
            
            // 主开关
            jQuery('#ambient_master_switch').on('change', function() { setEnabled(jQuery(this).is(':checked')); });
            
            // 特效类型切换
            jQuery('#ambient_type').on('change', function() {
                const val = jQuery(this).val();
                config.type = val;
                config.activeCSS = null;
                saveConfig();
                const isCSS = val === 'css';
                jQuery('#css-control-row').toggle(isCSS);
                jQuery('#ambient-particle-controls').toggle(!isCSS);
                if (!isCSS) {
                    applyCSS(null);
                    resetParticles();
                }
                refreshActiveHighlight();
            });
            
            // CSS管理按钮
            jQuery('#ambient-new-css').on('click', createNewCSS);
            jQuery('#ambient-import-css').on('click', importCSS);
            jQuery('#ambient-import-img').on('click', importImageEffect);
            
            // 粒子控制
            jQuery('#ambient_color').on('input', function() { config.color = jQuery(this).val(); saveConfig(); });
            jQuery('#ambient_size').on('input', function() { config.size = parseFloat(jQuery(this).val()); saveConfig(); resetParticles(); });
            jQuery('#ambient_speed').on('input', function() { config.speed = parseFloat(jQuery(this).val()); saveConfig(); resetParticles(); });
            jQuery('#ambient_count').on('input', function() { config.count = parseInt(jQuery(this).val()); saveConfig(); });
            
            refreshCSSList();
            refreshImageList();
            refreshTypeSelect();
        }

        // 启动
        initCanvas();
        if (config.enabled && (config.type === 'css' || config.activeCSS)) applyCSS(config.activeCSS);
        const checkInterval = setInterval(() => {
            if (jQuery('#extensions_settings').length > 0) {
                injectSettingsMenu();
                clearInterval(checkInterval);
            }
        }, 1000);
    }
})();
