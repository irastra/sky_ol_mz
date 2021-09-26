//=============================================================================
// RPG Maker MZ - Sprite_BattleTimelineEx
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 真实速度行动条
 * @author irastra
 *
 * @help 真实感行动条
 */

(() => {
    const game_actor_initTpbChargeTime = Game_Battler.prototype.initTpbChargeTime;
    Game_Battler.prototype.initTpbChargeTime = function(advantageous){
        game_actor_initTpbChargeTime.call(this, advantageous);
        EventManager.PublishEvent("actor_init_tbp_charge_time", this);
    }

    function Sprite_BattleHead() {
        this.initialize(...arguments);
    }

    Sprite_BattleHead.prototype = Object.create(Sprite.prototype);
    Sprite_BattleHead.prototype.constructor = Sprite_BattleHead;

    Sprite_BattleHead.prototype.initialize = function(battler) {
        Sprite.prototype.initialize.call(this);
        this._battler = battler;
        this._selectionEffectCount = 0;
    }

    Sprite_BattleHead.prototype.updateSelectionEffect = function(sprite) {
        const target = this;
        if (this._battler.isSelected()) {
            this._selectionEffectCount++;
            if (this._selectionEffectCount % 30 < 15) {
                target.setBlendColor([255, 255, 255, 64]);
            } else {
                target.setBlendColor([0, 0, 0, 0]);
            }
        } else if (this._selectionEffectCount > 0) {
            this._selectionEffectCount = 0;
            target.setBlendColor([0, 0, 0, 0]);
        }
    };

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
        this._init_battler = [];
        this._is_directly_mode = true;
        this._slider_spirte_size = 32;
        this._slider_spirte_height = this._slider_spirte_size / 2.0;
        this._time_wheel = 5;
        this._base_size = 6.0;
        this.initMembers();
        this.createBitmap();
        this.move(this.pos_x(), this.pos_y());
        this.drawSelf();
        this.show();
        EventManager.RegistEvent("actor_init_tbp_charge_time", this.onBattlerTbpInitFinish.bind(this));
    };

    Sprite_BattleTimelineEx.prototype.destroy = function(){
        for(const sprite_battler of this._battler_sprite_set){
            sprite_battler.battler = null;
        }
        Sprite.prototype.destroy.apply(this, arguments);
    }

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
                let battler_sprite = new Sprite_BattleHead(enemy);
                battler_sprite.anchor.x = 0.5;
                const name = enemy.battlerName();
                this.loadBitmap(battler_sprite, name);
                this.addChild(battler_sprite);
                battler_sprite.bitmap.addLoadListener((_bitmap) => (this.resetItemSize(battler_sprite)));
                battler_sprite.move(0, this._slider_spirte_height);
                tmp_array.push(battler_sprite);
                this._battler_sprite_set.push(battler_sprite);
            }
            this._enemies_sprite_set.push(tmp_array);
        };

        const members = $gameParty.members();
        for (let idx =0; idx < $gameParty.maxBattleMembers(); idx++){
            const actor  = members[idx]; 
            let tmp_array = [];
            for (let i = 0; i < this._time_wheel; i++){
                let battler_sprite = new Sprite_BattleHead(actor);
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
                this._battler_sprite_set.push(battler_sprite);
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
        this._battler_sprite_set.sort(this.cmp);
        let right_x = -1;
        let check_sp = true;
        for(let idx = 0; idx < this._battler_sprite_set.length; idx++){
            let sprite = this._battler_sprite_set[idx];
            if (!sprite.visible){
                continue;
            }
            sprite.updateSelectionEffect();
            if(check_sp && sprite.is_sp){
                check_sp = false;
                continue;
            }
            if (sprite.position.x < right_x){
                const y = sprite.position.y;
                sprite.move(right_x, y);
            }
            right_x = sprite.position.x + this._slider_spirte_size;
        }
    }

    Sprite_BattleTimelineEx.prototype.tbp2LocalPosX = function(battler){
        const target_x =  (1.0 - battler.tpbChargeTime()) * this._base_size / battler.tpbAcceleration();
        return target_x;
    }

    Sprite_BattleTimelineEx.prototype.localPosX2TbpTrunFirst = function(battler, x){
        const tbp = 1.0 - (x * 1.0 * battler.tpbAcceleration() / this._base_size);
        return tbp;
    }
    Sprite_BattleTimelineEx.prototype.onBattlerTbpInitFinish = function(battler){
        if(!this._init_battler.includes(battler)){
            this._init_battler.push(battler);
            const total_cnt = $gameParty.members().length + $gameTroop.members().length;
            if(this._init_battler.length == total_cnt){
                this._init_battler.sort((a, b)=>{return a.tpbChargeTime() - b.tpbChargeTime()});
                for(let i = 1; i < this._init_battler.length; i++){
                    const last_battler = this._init_battler[i-1];
                    const cur_battler = this._init_battler[i];
                    const last_x = this.tbp2LocalPosX(last_battler);
                    const min_target_x = last_x + 10 + this._slider_spirte_size;
                    const max_cur_tbp = this.localPosX2TbpTrunFirst(cur_battler, min_target_x);
                    cur_battler._tpbChargeTime = Math.min(cur_battler._tpbChargeTime, max_cur_tbp);
                }
                this._init_battler = [];
            }
        }
    }

    Sprite_BattleTimelineEx.prototype.updateMember = function(battler, battler_sprite_array, idx){
        let y = 0;
        if(battler.isEnemy()){
            y = this._slider_spirte_height;// + this._slider_spirte_size * idx + 2;
        }else{
            y = this._slider_spirte_height;// + this._slider_spirte_size * idx  + 2;
        }
        const target_x =  (1.0 - battler.tpbChargeTime()) * this._base_size / battler.tpbAcceleration();
        const full_x = (1.0 / battler.tpbAcceleration()) * this._base_size;
        if (battler.isDead()){
            battler_sprite_array.forEach(battler_sprite => {
                battler_sprite.hide();
            });
            return;
        }else{
            battler_sprite_array.forEach(battler_sprite => {
                battler_sprite.show();
            });
        }
        for(let i =0 ; i < this._time_wheel; i++){
            const battler_sprite = battler_sprite_array[i];
            let next_x = target_x + full_x * i;
            if (next_x > this.bitmapWidth()){
                battler_sprite.hide();
            }else{
                battler_sprite.show();
            }
            battler_sprite.move(next_x, y);
        }
        const battle_sprite = battler_sprite_array[this._time_wheel - 1];
        if(battler._passTag && !battler.isDead()){
            battle_sprite.move(0, y);
            battle_sprite.show();
        }else{
            battle_sprite.hide();
        }
    }

    Sprite_BattleTimelineEx.prototype.cmp = function(aa, bb){
        a = aa._battler;
        b = bb._battler;
        if(aa.position.x == bb.position.x){
            if((a._passTag && b._passTag)){
                if(a.isActor() && b.isActor()){
                    return idx_b.actorId() - idx_a.actorId();
                }else if(a.isEnemy() && b.isEnemy()){
                    return idx_b.enemyId() - idx_a.enemyId();
                }else{
                    if (a.isActor()){
                        return 1;
                    }else{
                        return -1;
                    }
                }
            }else if(a._passTag && !b._passTag){
                return 1;
            }else if(!a._passTag && b._passTag){
                return -1;
            }else{
                return 0;
            }
        }else{
            return aa.position.x - bb.position.x;
        }
    }

    Sprite_BattleTimelineEx.prototype.updateMembers = function(){
        let idx = 0;
        const actors = $gameParty.members();
        for (const actor of actors){
            actor_sprite = this._actor_sprite_set[idx];
            this.updateMember(actor, actor_sprite, idx);
            idx += 1;
        }
        
        const enemies = $gameTroop.members();
        idx = 0;
        for (const enemy of enemies){
            enemy_sprite = this._enemies_sprite_set[idx];
            this.updateMember(enemy, enemy_sprite, idx + actors.length);
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
