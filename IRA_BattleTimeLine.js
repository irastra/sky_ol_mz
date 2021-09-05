//=============================================================================
// RPG Maker MZ - Sprite_BattleTimeline
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Sprite_BattleTimeline to dispaly battle timeline.
 * @author irastra
 *
 * @help Sprite_BattleTimeline.js
 */

(() => {
    //-----------------------------------------------------------------------------
    // Sprite_BattleTimeline
    //
    // The sprite for displaying a character.
    function Sprite_BattleTimeline() {
        this.initialize(...arguments);
    }

    Sprite_BattleTimeline.prototype = Object.create(Sprite.prototype);
    Sprite_BattleTimeline.prototype.constructor = Sprite_BattleTimeline;

    Sprite_BattleTimeline.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.is_wait = false;
        this._actor_sprite_set = [];
        this._enemies_sprite_set = [];
        this._battler_sprite_set = [];
        this._is_directly_mode = true;
        this._slider_spirte_size = 48;
        this._slider_spirte_height = this._slider_spirte_size / 2.0;
        this.initMembers();
        this.createBitmap();
        this.move(this.pos_x(), this.pos_y());
        this.drawSelf();
        this.show();
    };

    Sprite_BattleTimeline.prototype.setWait = function(is_wait){
        this.is_wait = is_wait;
    }

    Sprite_BattleTimeline.prototype.loadBitmap = function(sprite, name) {
        if ($gameSystem.isSideView()) {
            sprite.bitmap = ImageManager.loadSvEnemy(name);
        } else {
            sprite.bitmap = ImageManager.loadEnemy(name);
        }
    };

    Sprite_BattleTimeline.prototype.resetItemSize = function(sprite){
        sprite.scale.x = this._slider_spirte_size / sprite.width;
        sprite.scale.y = this._slider_spirte_size / sprite.height;
    }

    Sprite_BattleTimeline.prototype.initMembers = function(){
        const enemies = $gameTroop.members();
        for (const enemy of enemies){
            let battler_sprite = new Sprite();
            battler_sprite.anchor.x = 0.5;
            const name = enemy.battlerName();
            this.loadBitmap(battler_sprite, name);
            this._enemies_sprite_set.push(battler_sprite);
            this._battler_sprite_set.push(battler_sprite);
            this.addChild(battler_sprite);
            battler_sprite.bitmap.addLoadListener((_bitmap) => (this.resetItemSize(battler_sprite)));
            battler_sprite.move(0, this._slider_spirte_height);
        };

        const members = $gameParty.members();
        for (const actor of members){
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
            this._actor_sprite_set.push(battler_sprite);
            this._battler_sprite_set.push(battler_sprite);
            this.addChild(battler_sprite);
            battler_sprite.bitmap.addLoadListener((_bitmap) => (this.resetItemSize(battler_sprite)));
            battler_sprite.move(0, this._slider_spirte_height);
        };
    }

    Sprite_BattleTimeline.prototype.update = function(){
        Sprite.prototype.update.call(this);
        if (this.is_wait){
            return;
        }
        this.updateMembers();
    }

    Sprite_BattleTimeline.prototype.updateMember = function(battler, battler_sprite){
        let y = 0;
        if(battler.isEnemy()){
            y = this._slider_spirte_height;
        }else{
            y = this._slider_spirte_height;
        }
        const target_x = battler.tpbChargeTime() * this.bitmapWidth();
        let next_x = 0;
        if (this._is_directly_mode){
            next_x = target_x;
        }else{
            const length = (target_x - battler_sprite.position.x) * 1.0;
            let speed = Math.ceil(length / 30);
            if (speed == 0){
                speed = 1;
            } 
            next =  battler_sprite.position.x + speed;
            if (next_x > target_x){
                next_x = target_x;
            }
            if (next_x > this.bitmapWidth()){
                next_x = 0;
            }
        }
        if (battler.isDead()){
            battler_sprite.hide();
        }else{
            battler_sprite.show();
        }
        battler_sprite.move(next_x, y);
    }

    Sprite_BattleTimeline.prototype.cmp = function(a, b){
        return b.position.x - a.position.x;
    }

    Sprite_BattleTimeline.prototype.updateMembers = function(){
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
        this._battler_sprite_set.sort(this.cmp);
        const range_block = this._slider_spirte_size;
        for(let idx =1; idx <this._battler_sprite_set.length; idx++){
            const previous_x = this._battler_sprite_set[idx - 1].position.x;
            const c_x = this._battler_sprite_set[idx].position.x;
            const y = this._battler_sprite_set[idx].position.y;
            if (previous_x - c_x < range_block){
                let adjust_x = previous_x - range_block;
                if (adjust_x < 0){
                    adjust_x = 0;
                }
                this._battler_sprite_set[idx].move(adjust_x, y);
            }
        }
    }

    Sprite_BattleTimeline.prototype.destroy = function(options) {
        this.bitmap.destroy();
        Sprite.prototype.destroy.call(this, options);
    };

    Sprite_BattleTimeline.prototype.createBitmap = function() {
        const width = this.bitmapWidth();
        const height = this.bitmapHeight();
        this.bitmap = new Bitmap(width, height);
    };

    Sprite_BattleTimeline.prototype.pos_x = function() {
        return 100 / 2;
    };

    Sprite_BattleTimeline.prototype.pos_y = function() {
        return 30;
    };


    Sprite_BattleTimeline.prototype.bitmapWidth = function() {
        return Graphics.width - 100;
    };

    Sprite_BattleTimeline.prototype.bitmapHeight = function() {
        return 8;
    };

    Sprite_BattleTimeline.prototype.drawSelf = function() {
        color_bg = "#0000ff";
        color_begin = "#ff0000"
        color_end = "#bfeeee";
        width = this.bitmapWidth();
        height = this.bitmapHeight();
        this.bitmap.fillRect(0, 0, width, height, color_bg);
        this.bitmap.gradientFillRect(2, 2, width - 4, height - 4, color_begin, color_end);
    };

    Spriteset_Battle.prototype.createTimeLine = function(){
        this.sprite_timeline = new Sprite_BattleTimeline();
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
