//=============================================================================
// RPG Maker MZ - Sprite_BattlerPopBar
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 血条展示
 * @author irastra（喵一巫猫）
 *
 * @help 显示战斗单位的血条。
 * 
 * @param enemey_blood_width
 * @text 敌人血条宽度
 * @desc 敌人血条宽度
 * @type number
 * @default 120
 * 
 * @param enemey_blood_height
 * @text 敌人血条高度
 * @desc 敌人血条高度
 * @type number
 * @default 10
 * 
 * @param enemey_blood_bar_pos_type
 * @text 敌人血条位置
 * @desc 敌人血条位置（true头顶，false脚下）
 * @type boolean
 * @default true
 * 
 * @param actor_blood_width
 * @text 玩家血条宽度
 * @desc 玩家血条宽度
 * @type number
 * @default 120
 * 
 * @param actor_blood_height
 * @text 玩家血条高度
 * @desc 玩家血条高度
 * @type number
 * @default 10
 * 
 * @param actor_blood_bar_pos_type
 * @text 玩家血条位置
 * @desc 玩家血条位置(true头顶，false脚下）
 * @type boolean
 * @default true
 * 
 * @param actor_blood_bar_space
 * @text 高度间隔
 * @desc 高度间隔
 * @type number
 * @default 5
 * 
 * @param enable_boss_hp
 * @text 是否启用boss大血条
 * @desc 单独为boss展示hp,要在敌人的备注里面表明boss
 * @type boolean
 * @default false
 * 
 * @param boss_hp_x
 * @text boss_hp_x
 * @desc boss血条x坐标
 * @type number
 * @default 50
 * 
 * @param boss_hp_y
 * @text boss_hp_y
 * @desc boss血条y坐标
 * @type number
 * @default 40
 * 
 * @param boss_hp_width
 * @text boss_hp_width
 * @desc boss血条宽度
 * @type number
 * @default 90
 * 
 * @param boss_hp_height
 * @text boss_hp_height
 * @desc boss血条高度
 * @type number
 * @default 5
 * 
 * @param hp_base_color
 * @text hp_base_color
 * @desc 血条基础颜色
 * @default #ff0000
 * 
 * @param hp_inc_color
 * @text hp_inc_color
 * @desc 血量增加颜色
 * @default #2e0000
 * 
 * @param hp_dec_color
 * @text hp_dec_color
 * @desc 血量减少颜色
 * @default #1f0000
 * 
 * @param change_ratio
 * @text change_ratio
 * @desc 血量变化率
 * @default 0.01
 * 
 * @param use_relative
 * @text use_relative
 * @desc 血量变化率
 * @default true;
 * @type boolean
 */

(() => {

    const pluginName = 'IRA_BattlerBloodBar';
    const parameters = PluginManager.parameters(pluginName);
    const enemey_blood_width = Number(parameters['enemey_blood_width']);
    const enemey_blood_height = Number(parameters['enemey_blood_height']);
    const enemey_blood_bar_pos_type = Boolean(parameters['enemey_blood_bar_pos_type']);
    const actor_blood_width = Number(parameters['actor_blood_width']);
    const actor_blood_height = Number(parameters['actor_blood_height']);
    const actor_blood_bar_pos_type = Boolean(parameters['actor_blood_bar_pos_type']);
    const actor_blood_bar_space = Number(parameters['actor_blood_bar_space']);

    const enable_boss_hp = Boolean(parameters['enable_boss_hp']);
    const use_relative = Boolean(parameters['use_relative']);
    const boss_hp_x = Number(parameters['boss_hp_x']);
    const boss_hp_y = Number(parameters['boss_hp_y']);
    const boss_hp_width = Number(parameters['boss_hp_width']);
    const boss_hp_height = Number(parameters['boss_hp_height']);

    const hp_base_color = String(parameters['hp_base_color']);
    const hp_inc_color = String(parameters['hp_inc_color']);
    const hp_dec_color = String(parameters['hp_dec_color']);
    let change_ratio = Number(parameters['change_ratio']);
    change_ratio = Math.max(0.00001, Math.min(1.0, change_ratio));


    //-----------------------------------------------------------------------------
    // Sprite_BattlerPopBar
    //
    // The sprite for displaying a character pop bar.

    function Sprite_BattlerPopBar() {
        this.initialize(...arguments);
    }

    Sprite_BattlerPopBar.prototype = Object.create(Sprite.prototype);
    Sprite_BattlerPopBar.prototype.constructor = Sprite_BattlerPopBar;

    Sprite_BattlerPopBar.prototype.initialize = function(battle_sprite) {
        Sprite.prototype.initialize.call(this);
        this.duration = 0;
        this._target_value = null;
        this._init = false;
        this._battler_sprite = battle_sprite;
        this.setUp();
    }

    Sprite_BattlerPopBar.prototype.setUp = function(){
        if(this._init || !this._battler_sprite._battler){
            return; 
        }
        this._init = true;
        const battler = this._battler_sprite._battler;
        this._battler = battler;
        this._cur_value = battler.hp;
        this._begine_value = this._cur_value;
        if (this._battler.isActor()){
            this._width = actor_blood_width;
            this._height = actor_blood_height;
            this._pos_type = actor_blood_bar_pos_type;
        }else{
            if (this.isBossHpBar()){
                if(use_relative){
                    this._width = boss_hp_width / 100.0 * Graphics.width;
                    this._height = boss_hp_height / 100.0 * Graphics.height;
                }else{
                    this._width = boss_hp_width;
                    this._height = boss_hp_height;
                }
            }else{
                this._width = enemey_blood_width;
                this._height = enemey_blood_height;
                this._pos_type = enemey_blood_bar_pos_type;
            }
        }
        this.bitmap = new Bitmap(this._width, this._height);
        this.refreshPos();
        this.show();
    }

    Sprite_BattlerPopBar.prototype.isBossHpBar = function(){
        if(enable_boss_hp && this._battler && this._battler.isEnemy()){
            const enemy = this._battler;
            return enemy.enemy().note == "boss";
        }
        return false;
    }

    Sprite_BattlerPopBar.prototype.refreshPos = function(){
        if(this.isBossHpBar()){
            if(use_relative){
                const r_x = (boss_hp_x / 100.0 * Graphics.width) - this._width / 2.0;
                const r_y = (boss_hp_y / 100.0 * Graphics.height) - this.height / 2.0;
                this.move(r_x, r_y);
            }else{
                this.move(boss_hp_x, boss_hp_y);
            }
            return;
        }
        const ss_x = (this._battler_sprite.width - this._width) / 2;
        const s_x = this._battler_sprite.position.x - this._battler_sprite.width / 2;
        let y = 0;
        if(this._pos_type){
            y = this._battler_sprite.position.y - this._battler_sprite.height - this._height - actor_blood_bar_space;
        }else{
            y = this._battler_sprite.position.y + this._height + actor_blood_bar_space;
        }
        this.move(s_x + ss_x, y);
    }

    Sprite_BattlerPopBar.prototype.update = function(){
        if(!this._init){
            this.setUp();
            if(!this._init){
                return;
            }
        }
        this.refreshPos();
        Sprite.prototype.update.call(this);
        if (this._battler.isDead()){
            this.opacity = this._battler_sprite.opacity;
            if (this.opacity < 0.1){
                this.hide();
            }
            return;
        }
        this.bitmap.fillRect(0, 0, this.width, this.height, "#000000");
        this.bitmap.fillRect(1, 1, this._width - 2, this._height - 2, "#000000");
        const hp = this._battler.hp;
        const max_hp = this._battler.mhp;
        
        const target_value = (this._width - 4) * (hp  * 1.0 / max_hp);
        
        if (this._target_value != target_value){
            if (this._target_value === null){
                this._begine_value = target_value;
            }else{
                this._begine_value = this._target_value;
            }
            this._target_value = target_value;
            this._duration = 0;
        }

        if (this._duration + change_ratio > 1.0){
            this._duration = 1.0;
        }else{
            this._duration += change_ratio;
        }
        this._cur_value = this._cur_value * (1 - this._duration) + this._target_value * this._duration;
        const change_color = (this._target_value > this._cur_value) ? hp_dec_color : hp_inc_color;
        const left = Math.min(this._target_value, this._cur_value);
        const right = Math.max(this._target_value, this._cur_value);
        this.bitmap.fillRect(2, 2, left, this.height - 4, hp_base_color);
        this.bitmap.fillRect(2 + left, 2, right - left, this.height - 4, change_color);
    }

    Spriteset_Battle.prototype.createEnemyHp = function()
    {
        for (const enemy_sprite of this._enemySprites) {
            this._battleField.addChild(new Sprite_BattlerPopBar(enemy_sprite));
        }
    }

    Spriteset_Battle.prototype.createActorHp = function()
    {
        for (const actor_sprite of this._actorSprites) {
            this._battleField.addChild(new Sprite_BattlerPopBar(actor_sprite));
        }
    }

    const createEnemies = Spriteset_Battle.prototype.createEnemies;
    Spriteset_Battle.prototype.createEnemies = function(){
        createEnemies.apply(this, arguments);
        this.createEnemyHp();
    }

    const createActors = Spriteset_Battle.prototype.createActors;
    Spriteset_Battle.prototype.createActors = function(){
        createActors.apply(this, arguments);
        if($gameSystem.isSideView()){
            this.createActorHp();
        }
    }

})();