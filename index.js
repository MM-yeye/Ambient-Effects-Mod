// Ambient Effects - 增强版（支持自定义特效导入/删除）
(function() {
    setTimeout(() => {
        try {
            initEnhancedPlugin();
        } catch (e) {
            console.warn("氛围特效插件启动失败:", e);
        }
    }, 500);

    function initEnhancedPlugin() {
        const CANVAS_ID = 'st-ambient-canvas';
        const MENU_ID = 'ambient-effects-menu';
        
        // --- 默认配置 ---
        let config = {
            enabled: false,
            type: 'snow',
            speed: 2,
            size: 3,
            count: 100,
            color: '#ffffff'
        };

        // 自定义特效存储
        let userEffects = [];

        // 安全读取配置
        try {
            const saved = localStorage.getItem('st_ambient_config');
            if (saved) config = { ...config, ...JSON.parse(saved) };
            const savedEffects = localStorage.getItem('st_ambient_user_effects');
            if (savedEffects) userEffects = JSON.parse(savedEffects);
        } catch (err) {
            console.log('读取配置失败，使用默认配置');
        }

        // --- 粒子系统 ---
        let ctx, particles = [], w, h, animationFrame;

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
                ctx.fillStyle = config.color;

                // 检查是否是自定义特效
                const customEffect = userEffects.find(e => e.name === config.type);
                if (customEffect && customEffect.imageData) {
                    this.drawImage(customEffect.imageData);
                } else {
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

            drawImage(imgData) {
                const img = new Image();
                img.src = imgData;
                ctx.drawImage(img, -this.size, -this.size, this.size * 2, this.size * 2);
            }

            drawStar(c, r) {
                c.beginPath();
                c.moveTo(0, -r);
                c.quadraticCurveTo(2, -2, r, 0);
                c.quadraticCurveTo(2, 2, 0, r);
                c.quadraticCurveTo(-2, 2, -r, 0);
                c.quadraticCurveTo(-2, -2, 0, -r);
                c.fill();
            }

            drawLeaf(c, r) {
                c.beginPath();
                c.ellipse(0, 0, r, r/2, 0, 0, Math.PI * 2);
                c.fill();
                c.beginPath();
                c.strokeStyle = "rgba(0,0,0,0.2)";
                c.moveTo(-r, 0);
                c.lineTo(r, 0);
                c.stroke();
            }
            
            drawFlower(c, r) {
                c.beginPath();
                c.moveTo(0, 0);
                c.bezierCurveTo(r, -r, r*2, 0, 0, r);
                c.bezierCurveTo(-r*2, 0, -r, -r, 0, 0);
                c.fill();
            }
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
            } else {
                setTimeout(initCanvas, 500);
            }
        }

        function loop() {
            if (!ctx) return;
            ctx.clearRect(0, 0, w, h);
            if (config.enabled) {
                if (particles.length < config.count) {
                    while(particles.length < config.count) particles.push(new Particle());
                } else if (particles.length > config.count) {
                    particles.splice(config.count);
                }
                particles.forEach(p => { p.update(); p.draw(); });
            } else {
                particles = [];
            }
            animationFrame = requestAnimationFrame(loop);
        }

        // --- 自定义特效管理 ---
        function addCustomEffect(name, imageData) {
            userEffects.push({ name, imageData });
            localStorage.setItem('st_ambient_user_effects', JSON.stringify(userEffects));
            refreshEffectList();
            toastr.success(`特效 "${name}" 添加成功！`);
        }

        function deleteCustomEffect(name) {
            userEffects = userEffects.filter(e => e.name !== name);
            localStorage.setItem('st_ambient_user_effects', JSON.stringify(userEffects));
            if (config.type === name) {
                config.type = 'snow';
                saveConfig();
                document.getElementById('ambient_type').value = 'snow';
            }
            refreshEffectList();
            toastr.success(`特效 "${name}" 已删除`);
        }

        function refreshEffectList() {
            const listContainer = document.getElementById('ambient-effect-list');
            if (!listContainer) return;
            
            if (userEffects.length === 0) {
                listContainer.innerHTML = '<div class="ambient-desc" style="padding: 5px;">暂无自定义特效，点击"➕ 添加特效"导入图片</div>';
                return;
            }
            
            listContainer.innerHTML = userEffects.map(effect => `
                <div class="ambient-control-row" style="justify-content: space-between;">
                    <span>🎨 ${effect.name}</span>
                    <div>
                        <button class="menu_button use-effect" data-name="${effect.name}" style="margin-right: 5px;">✨ 使用</button>
                        <button class="menu_button red_button delete-effect" data-name="${effect.name}">🗑️ 删除</button>
                    </div>
                </div>
            `).join('');
            
            listContainer.querySelectorAll('.use-effect').forEach(btn => {
                btn.addEventListener('click', () => {
                    config.type = btn.dataset.name;
                    saveConfig();
                    document.getElementById('ambient_type').value = config.type;
                    resetParticles();
                    toastr.info(`已切换到特效: ${btn.dataset.name}`);
                });
            });
            
            listContainer.querySelectorAll('.delete-effect').forEach(btn => {
                btn.addEventListener('click', () => deleteCustomEffect(btn.dataset.name));
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
                    if (name) {
                        addCustomEffect(name, event.target.result);
                    }
                };
                reader.readAsDataURL(file);
            };
            input.click();
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
                ${userEffects.map(e => `<option value="${e.name}">🎨 ${e.name}</option>`).join('')}
            `;

            const html = `
                <div id="${MENU_ID}" class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>氛围特效✨</b>
                        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
                    </div>
                    <div class="inline-drawer-content ambient-settings-box">
                        <div class="ambient-desc">自定义你的背景氛围效果</div>
                        
                        <div class="ambient-control-row">
                            <label>启用特效</label>
                            <input type="checkbox" id="ambient_enabled" ${config.enabled ? 'checked' : ''}>
                        </div>

                        <div class="ambient-control-row">
                            <label>特效类型</label>
                            <select id="ambient_type">
                                ${builtInOptions}
                            </select>
                        </div>

                        <div class="ambient-control-row">
                            <label>颜色</label>
                            <input type="color" id="ambient_color" value="${config.color}">
                        </div>

                        <div class="ambient-control-row">
                            <label>粒子大小</label>
                            <input type="range" id="ambient_size" min="1" max="10" step="0.5" value="${config.size}">
                        </div>

                        <div class="ambient-control-row">
                            <label>飘落速度</label>
                            <input type="range" id="ambient_speed" min="0.5" max="10" step="0.5" value="${config.speed}">
                        </div>

                        <div class="ambient-control-row">
                            <label>粒子密度</label>
                            <input type="range" id="ambient_count" min="10" max="300" step="10" value="${config.count}">
                        </div>

                        <div style="border-top: 2px solid var(--SmartThemeBorderColor); margin: 10px 0;"></div>
                        
                        <div class="ambient-control-row">
                            <label>📦 自定义特效管理</label>
                            <button id="ambient-import-btn" class="menu_button">➕ 添加特效</button>
                        </div>
                        
                        <div id="ambient-effect-list" style="margin-top: 5px;">
                            ${userEffects.map(e => `
                                <div class="ambient-control-row" style="justify-content: space-between;">
                                    <span>🎨 ${e.name}</span>
                                    <div>
                                        <button class="menu_button use-effect" data-name="${e.name}" style="margin-right: 5px;">✨ 使用</button>
                                        <button class="menu_button red_button delete-effect" data-name="${e.name}">🗑️ 删除</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        ${userEffects.length === 0 ? '<div class="ambient-desc">暂无自定义特效，点击"➕ 添加特效"导入图片</div>' : ''}
                    </div>
                </div>
            `;

            container.append(html);

            // 绑定事件
            jQuery(`#${MENU_ID}`).find('.inline-drawer-toggle').on('click', function() {
                jQuery(this).closest('.inline-drawer').toggleClass('expanded');
            });

            jQuery('#ambient_enabled').on('change', function() { config.enabled = jQuery(this).is(':checked'); saveConfig(); });
            jQuery('#ambient_type').on('change', function() { 
                config.type = jQuery(this).val();
                const custom = userEffects.find(e => e.name === config.type);
                if (custom) {
                    // 自定义特效，颜色使用图片原色
                    jQuery('#ambient_color').prop('disabled', true);
                } else {
                    jQuery('#ambient_color').prop('disabled', false);
                    if(config.type === 'leaf') config.color = '#88cc88';
                    else if(config.type === 'flower') config.color = '#ffb7b2';
                    else if(config.type === 'snow') config.color = '#ffffff';
                    else if(config.type === 'star') config.color = '#fff6cc';
                    jQuery('#ambient_color').val(config.color);
                }
                saveConfig(); 
                resetParticles(); 
            });
            jQuery('#ambient_color').on('input', function() { config.color = jQuery(this).val(); saveConfig(); });
            jQuery('#ambient_size').on('input', function() { config.size = parseFloat(jQuery(this).val()); saveConfig(); resetParticles(); });
            jQuery('#ambient_speed').on('input', function() { config.speed = parseFloat(jQuery(this).val()); saveConfig(); resetParticles(); });
            jQuery('#ambient_count').on('input', function() { config.count = parseInt(jQuery(this).val()); saveConfig(); });
            
            jQuery('#ambient-import-btn').on('click', importImageEffect);
            
            // 重新绑定列表中的按钮
            jQuery(`#${MENU_ID}`).find('.use-effect').each(function() {
                jQuery(this).off('click').on('click', function() {
                    config.type = jQuery(this).data('name');
                    saveConfig();
                    jQuery('#ambient_type').val(config.type);
                    resetParticles();
                    toastr.info(`已切换到特效: ${config.type}`);
                });
            });
            
            jQuery(`#${MENU_ID}`).find('.delete-effect').each(function() {
                jQuery(this).off('click').on('click', function() {
                    const name = jQuery(this).data('name');
                    deleteCustomEffect(name);
                });
            });
        }

        function saveConfig() { localStorage.setItem('st_ambient_config', JSON.stringify(config)); }
        function resetParticles() { particles = []; }

        // --- 启动 ---
        initCanvas();
        
        const checkInterval = setInterval(() => {
            if (jQuery('#extensions_settings').length > 0) {
                injectSettingsMenu();
                clearInterval(checkInterval);
            }
        }, 1000);
    }
})();
