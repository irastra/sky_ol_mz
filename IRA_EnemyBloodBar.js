//=============================================================================
// RPG Maker MZ - Sprite_BattlerPopBar
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Sprite_BattlerPopBar to dispaly battle timeline.
 * @author irastra
 *
 * @help Sprite_BattlerPopBar.js
 */

(() => {
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
        const battler = battle_sprite._battler;
        this._battler = battler;
        this._battler_sprite = battle_sprite;
        this._width = 120;
        this._height = 10;
        this.duration = 0;
        this._cur_value = battler.hp;
        this._begine_value = this._cur_value;
        this._target_value = null;
        this.bitmap = new Bitmap(this._width, this._height);
        this.refreshPos();
        this.show();
    }

    Sprite_BattlerPopBar.prototype.refreshPos = function(){
        const ss_x = (this._battler_sprite.width - this._width) / 2;
        const s_x = this._battler_sprite.position.x - this._battler_sprite.width / 2;
        const y = this._battler_sprite.position.y + this._battler_sprite.height / 2 + 2;
        this.move(s_x + ss_x, this._battler_sprite.position.y - this._height);
    }

    Sprite_BattlerPopBar.prototype.update = function(){
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

    const createEnemies = Spriteset_Battle.prototype.createEnemies;
    Spriteset_Battle.prototype.createEnemies = function(){
        createEnemies.apply(this, arguments);
        this.createEnemyHp();
    }
})();