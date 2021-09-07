//=============================================================================
// RPG Maker MZ - Sprite_BattleTimelineEx
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Sprite_BattleTimelineEx to dispaly battle timeline.
 * @author irastra
 *
 * @help Sprite_BattleTimelineEx.js
 */

(() => {
    //-----------------------------------------------------------------------------
    // Sprite_BattleTimelineEx
    //
    // The sprite for displaying a character.
    function Sprite_BattleTimelineEx() {
        this.initialize(...arguments);
    }

    Sprite_BattleTimelineEx.prototype = Object.create(Sprite.prototype);
    Sprite_BattleTimelineEx.prototype.constructor = Sprite_BattleTimelineEx;

    Sprite_BattleTimelineEx.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.is_wait = false;
        this._actor_sprite_set = [];
        this._enemies_sprite_set = [];
        this._battler_sprite_set = [];
        this._is_directly_mode = true;
        this._slider_spirte_size = 48;
        this._slider_spirte_height = this._slider_spirte_size / 2.0;
        this._time_wheel = 5;
        this.initMembers();
        this.createBitmap();
        this.move(this.pos_x(), this.pos_y());
        this.drawSelf();
        this.show();
    };

    Sprite_BattleTimelineEx.prototype.setWait = function(is_wait){
        this.is_wait = is_wait;
    }

    Sprite_BattleTimelineEx.prototype.loadBitmap = function(sprite, name) {
        if ($gameSystem.isSideView()) {
            sprite.bitmap = ImageManager.loadSvEnemy(name);
        } else {
            sprite.bitmap = ImageManager.loadEnemy(name);
        }
    };

    Sprite_BattleTimelineEx.prototype.resetItemSize = function(sprite){
        sprite.scale.x = this._slider_spirte_size / sprite.width;
        sprite.scale.y = this._slider_spirte_size / sprite.height;
    }

    Sprite_BattleTimelineEx.prototype.initMembers = function(){
        const enemies = $gameTroop.members();
        for (const enemy of enemies){
            let tmp_array = [];
            for (let i = 0;  i < this._time_wheel; i++){
                let battler_sprite = new Sprite();
                battler_sprite.anchor.x = 0.5;
                const name = enemy.battlerName();
                this.loadBitmap(battler_sprite, name);
                this.addChild(battler_sprite);
                battler_sprite.bitmap.addLoadListener((_bitmap) => (this.resetItemSize(battler_sprite)));
                battler_sprite.move(0, this._slider_spirte_height);
                tmp_array.push(battler_sprite);
            }
            this._enemies_sprite_set.push(tmp_array);
        };

        const members = $gameParty.members();
        for (const actor of members){
            let tmp_array = [];
            for (let i = 0; i < this._time_wheel; i++){
                let battler_sprite = new Sprite();
                battler_sprite.anchor.x = 0.5;
                battler_sprite.bitmap = ImageManager.loadFace(actor.faceName());
                let faceIndex = actor.faceIndex(); 
                let width =  ImageManager.faceWidth;
                let height = ImageManager.faceHeight;
                const pw = ImageManager.faceWidth;
                const ph = ImageManager.faceHeight;
                const sw = Math.min(width, pw);
                const sh = Math.min(height, ph);
                const sx = (faceIndex % 4) * pw + (pw - sw) / 2;
                const sy = Math.floor(faceIndex / 4) * ph + (ph - sh) / 2;
                battler_sprite.setFrame(sx, sy, sw, sh);
                tmp_array.push(battler_sprite);
                this.addChild(battler_sprite);
                battler_sprite.bitmap.addLoadListener((_bitmap) => (this.resetItemSize(battler_sprite)));
                battler_sprite.move(0, this._slider_spirte_height);
            }
            this._actor_sprite_set.push(tmp_array);
        };
    }

    Sprite_BattleTimelineEx.prototype.update = function(){
        Sprite.prototype.update.call(this);
        if (this.is_wait){
            return;
        }
        this.updateMembers();
    }

    Sprite_BattleTimelineEx.prototype.updateMember = function(battler, battler_sprite_array){
        let y = 0;
        if(battler.isEnemy()){
            y = this._slider_spirte_height;
        }else{
            y = this._slider_spirte_height;
        }
        const target_x =  (1.0 - battler.tpbChargeTime()) * 5.0 / battler.tpbAcceleration();
        const full_x = (1.0 / battler.tpbAcceleration()) * 5.0;
        let next_x = target_x;
        if (battler.isDead()){
            battler_sprite_array.forEach(battler_sprite => {
                battler_sprite.hide();
            });
        }else{
            battler_sprite_array.forEach(battler_sprite => {
                battler_sprite.show();
            });
        }
        for(let i =0 ; i < this._time_wheel; i++){
            const battler_sprite = battler_sprite_array[i];
            next_x = next_x + full_x * i;
            next_x = Math.ceil(next_x);
            if (next_x > this.bitmapWidth()){
                battler_sprite.hide();
            }else{
                battler_sprite.show();
            }
            battler_sprite.move(next_x, y);
        }
        const battle_sprite = battler_sprite_array[this._time_wheel - 1];
        if(battler._passTag){
            battle_sprite.move(0, y);
            battle_sprite.show();
        }else{
            battle_sprite.hide();
        }
        
    }

    Sprite_BattleTimelineEx.prototype.cmp = function(a, b){
        return b.position.x - a.position.x;
    }

    Sprite_BattleTimelineEx.prototype.updateMembers = function(){
        const enemies = $gameTroop.members();
        let idx = 0;
        for (const enemy of enemies){
            enemy_sprite = this._enemies_sprite_set[idx];
            this.updateMember(enemy, enemy_sprite);
            idx += 1;
        }

        const actors = $gameParty.members();
        idx = 0;
        for (const actor of actors){
            actor_sprite = this._actor_sprite_set[idx];
            this.updateMember(actor, actor_sprite);
            idx += 1;
        }
    }

    Sprite_BattleTimelineEx.prototype.destroy = function(options) {
        this.bitmap.destroy();
        Sprite.prototype.destroy.call(this, options);
    };

    Sprite_BattleTimelineEx.prototype.createBitmap = function() {
        const width = this.bitmapWidth();
        const height = this.bitmapHeight();
        this.bitmap = new Bitmap(width, height);
    };

    Sprite_BattleTimelineEx.prototype.pos_x = function() {
        return 100 / 2;
    };

    Sprite_BattleTimelineEx.prototype.pos_y = function() {
        return 30;
    };


    Sprite_BattleTimelineEx.prototype.bitmapWidth = function() {
        return Graphics.width - 100;
    };

    Sprite_BattleTimelineEx.prototype.bitmapHeight = function() {
        return 8;
    };

    Sprite_BattleTimelineEx.prototype.drawSelf = function() {
        color_bg = "#0000ff";
        color_begin = "#ff0000"
        color_end = "#bfeeee";
        width = this.bitmapWidth();
        height = this.bitmapHeight();
        this.bitmap.fillRect(0, 0, width, height, color_bg);
        this.bitmap.gradientFillRect(2, 2, width - 4, height - 4, color_begin, color_end);
    };

    Spriteset_Battle.prototype.createTimeLine = function(){
        this.sprite_timeline = new Sprite_BattleTimelineEx();
        this._battleField.addChild(this.sprite_timeline);
    };
    
    Spriteset_Battle.prototype.setWait = function(is_wait){
        this.sprite_timeline.setWait(is_wait);
    }

    const createLowerLayer = Spriteset_Battle.prototype.createLowerLayer
    Spriteset_Battle.prototype.createLowerLayer = function(){
        createLowerLayer.apply(this, arguments);
        if (BattleManager.isTpb()){
            this.createTimeLine();
        }
    }

})();
