// Ambient Effects - 统一开关版（CSS库 + 图片库）
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
            color: '#ffffff',
            activeCSSId: null
        };

        // 特效库
        let userImages = [];     // 图片特效 { name, imageData }
        let userCSS = [];        // CSS特效 { id, name, code }

        // 读取存储
        try {
            const saved = localStorage.getItem('st_ambient_config');
            if (saved) config = { ...config, ...JSON.parse(saved) };
            const savedImages = localStorage.getItem('st_ambient_images');
            if (savedImages) userImages = JSON.parse(savedImages);
            const savedCSS = localStorage.getItem('st_ambient_css');
            if (savedCSS) userCSS = JSON.parse(savedCSS);
        } catch (err) {}

        // --- CSS特效管理 ---
        let styleElement = null;
        function applyCSS(cssId) {
            if (!styleElement) {
                styleElement = document.getElementById(STYLE_ID);
                if (!styleElement) {
                    styleElement = document.createElement('style');
                    styleElement.id = STYLE_ID;
                    document.head.appendChild(styleElement);
                }
            }
            if (cssId && config.enabled) {
                const css = userCSS.find(c => c.id === cssId);
                if (css) { styleElement.textContent = css.code; return; }
            }
            styleElement.textContent = '';
        }

        function addCSS(name, code) {
            const id = 'css_' + Date.now();
            userCSS.push({ id, name, code });
            localStorage.setItem('st_ambient_css', JSON.stringify(userCSS));
            refreshCSSList();
            toastr.success(`CSS特效 "${name}" 已添加`);
        }

        function deleteCSS(id) {
            userCSS = userCSS.filter(c => c.id !== id);
            localStorage.setItem('st_ambient_css', JSON.stringify(userCSS));
            if (config.activeCSSId === id) {
                config.activeCSSId = null;
                saveConfig();
                applyCSS(null);
            }
            refreshCSSList();
            toastr.success('已删除');
        }

        function refreshCSSList() {
            const container = document.getElementById('ambient-css-list');
            if (!container) return;
            if (userCSS.length === 0) {
                container.innerHTML = '<div class="ambient-desc">暂无CSS特效，点击"➕ 新建CSS特效"添加</div>';
                return;
            }
            container.innerHTML = userCSS.map(css => `
                <div class="ambient-control-row" style="justify-content: space-between;">
                    <span>👾 ${css.name}</span>
                    <div>
                        <button class="menu_button use-css" data-id="${css.id}" style="margin-right: 5px;">✨ 使用</button>
                        <button class="menu_button red_button delete-css" data-id="${css.id}">🗑️ 删除</button>
                    </div>
                </div>
            `).join('');
            container.querySelectorAll('.use-css').forEach(btn => {
                btn.addEventListener('click', () => {
                    config.type = 'css';
                    config.activeCSSId = btn.dataset.id;
                    saveConfig();
                    if (config.enabled) applyCSS(btn.dataset.id);
                    toastr.info(`已切换到CSS特效: ${userCSS.find(c => c.id === btn.dataset.id)?.name}`);
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
            addCSS(name, defaultCode);
        }

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
                    if (name) addCSS(name, ev.target.result);
                };
                reader.readAsText(file);
            };
            input.click();
        }

        // --- 图片特效管理 ---
        function addImage(name, imageData) {
            userImages.push({ name, imageData });
            localStorage.setItem('st_ambient_images', JSON.stringify(userImages));
            refreshImageList();
            refreshTypeSelect();
            toastr.success(`图片特效 "${name}" 已添加`);
        }

        function deleteImage(name) {
            userImages = userImages.filter(i => i.name !== name);
            localStorage.setItem('st_ambient_images', JSON.stringify(userImages));
            if (config.type === name) {
                config.type = 'snow';
                saveConfig();
            }
            refreshImageList();
            refreshTypeSelect();
            toastr.success('已删除');
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
                    config.activeCSSId = null;
                    saveConfig();
                    if (config.enabled) applyCSS(null);
                    toastr.info(`已切换到图片特效: ${btn.dataset.name}`);
                });
            });
            container.querySelectorAll('.delete-image').forEach(btn => {
                btn.addEventListener('click', () => deleteImage(btn.dataset.name));
            });
        }

        function importImageFile() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const name = prompt('给特效起个名字:', file.name.split('.')[0]);
                    if (name) addImage(name, ev.target.result);
                };
                reader.readAsDataURL(file);
            };
            input.click();
        }

        function refreshTypeSelect() {
            const select = document.getElementById('ambient_type');
            if (!select) return;
            const val = select.value;
            const builtIn = `<option value="snow">❄️ 柔光雪花</option>
                             <option value="star">✨ 闪烁星光</option>
                             <option value="leaf">🍀 飘落树叶</option>
                             <option value="flower">🌸 飞舞花瓣</option>`;
            const imageOpts = userImages.map(i => `<option value="${i.name}">🖼️ ${i.name}</option>`).join('');
            select.innerHTML = builtIn + imageOpts;
            select.value = val;
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
                const imgEffect = userImages.find(i => i.name === config.type);
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
                const isParticle = config.enabled && config.type !== 'css' && !config.activeCSSId;
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

        // --- 主开关 ---
        function setEnabled(enabled) {
            config.enabled = enabled;
            saveConfig();
            if (enabled) {
                if (config.type === 'css' || config.activeCSSId) applyCSS(config.activeCSSId);
                else resetParticles();
            } else {
                applyCSS(null);
                resetParticles();
            }
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
                                ${userImages.map(i => `<option value="${i.name}">🖼️ ${i.name}</option>`).join('')}
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
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <strong>🍏 CSS特效库</strong>
                                <div>
                                    <button id="ambient-new-css" class="menu_button">➕ 新建CSS</button>
                                    <button id="ambient-import-css" class="menu_button">📥 导入CSS</button>
                                </div>
                            </div>
                            <div id="ambient-css-list" style="margin-top: 5px;"></div>
                        </div>
                        
                        <div style="border-top: 2px solid var(--SmartThemeBorderColor); margin: 10px 0;"></div>
                        
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <strong>🖼️ 图片特效库</strong>
                                <button id="ambient-import-img" class="menu_button">➕ 添加图片</button>
                            </div>
                            <div id="ambient-image-list" style="margin-top: 5px;"></div>
                        </div>
                    </div>
                </div>
            `;
            container.append(html);

            // 绑定事件
            jQuery('#ambient_master_switch').on('change', function() { setEnabled(jQuery(this).is(':checked')); });
            jQuery('#ambient_type').on('change', function() {
                const val = jQuery(this).val();
                config.type = val;
                config.activeCSSId = null;
                saveConfig();
                if (config.enabled) {
                    applyCSS(null);
                    resetParticles();
                }
                jQuery('#ambient-particle-controls').toggle(val !== 'css');
            });
            jQuery('#ambient_color').on('input', function() { config.color = jQuery(this).val(); saveConfig(); });
            jQuery('#ambient_size').on('input', function() { config.size = parseFloat(jQuery(this).val()); saveConfig(); resetParticles(); });
            jQuery('#ambient_speed').on('input', function() { config.speed = parseFloat(jQuery(this).val()); saveConfig(); resetParticles(); });
            jQuery('#ambient_count').on('input', function() { config.count = parseInt(jQuery(this).val()); saveConfig(); });
            jQuery('#ambient-new-css').on('click', createNewCSS);
            jQuery('#ambient-import-css').on('click', importCSSFile);
            jQuery('#ambient-import-img').on('click', importImageFile);
            
            refreshCSSList();
            refreshImageList();
            refreshTypeSelect();
        }

        initCanvas();
        if (config.enabled && (config.type === 'css' || config.activeCSSId)) applyCSS(config.activeCSSId);
        const interval = setInterval(() => {
            if (jQuery('#extensions_settings').length) {
                injectMenu();
                clearInterval(interval);
            }
        }, 1000);
    }
})();
