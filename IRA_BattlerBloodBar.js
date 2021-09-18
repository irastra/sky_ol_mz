//=============================================================================
// RPG Maker MZ - Sprite_BattlerPopBar
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 时间制模式下生效，展示玩家的行动进度。
 * @author irastra（喵一巫猫）
 *
 * @help 只在时间制下生效
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
            this._width = enemey_blood_width;
            this._height = enemey_blood_height;
            this._pos_type = enemey_blood_bar_pos_type;
        }
        this.bitmap = new Bitmap(this._width, this._height);
        this.refreshPos();
        this.show();
    }

    Sprite_BattlerPopBar.prototype.refreshPos = function(){
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
        this.bitmap.fillRect(0, 0, this.width, this.height, "#ff0000");
        this.bitmap.fillRect(1, 1, this._width - 2, this._height - 2, "#000000");
        const hp = this._battler.hp;
        const max_hp = this._battler.mhp;
        const target_value = this._width * (hp  * 1.0 / max_hp);
        if (this._target_value != target_value){
            if (this._target_value === null){
                this._begine_value = target_value;
            }else{
                this._begine_value = this._target_value;
            }
            this._target_value = target_value;
            this._duration = 0;
        }
        if (this._duration + 0.01 > 1){
            this._duration = 1;
        }else{
            this._duration += 0.01;
        }
        this._cur_value = this._cur_value * (1 - this._duration) + this._target_value * this._duration;
        this.bitmap.fillRect(2, 2, this._cur_value - 4, this.height - 4, "#ff0000");
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