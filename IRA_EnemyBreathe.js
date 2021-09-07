//=============================================================================
// RPG Maker MZ - Sprite_EnemyBreathe.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Sprite_EnemyBreathe to dispaly battle timeline.
 * @author irastra
 *
 * @arg breathFrame
 * @type number
 * @min 1
 * @max 100
 * @default 30
 * @text Breath Number
 * @desc Control number of the Breath.
 * 
 * @help Sprite_EnemyBreathe.js
 */

(() => {
    const pluginName = "EnemyBreathe";

    PluginManager.registerCommand(pluginName, "set", args => {
        //const pictureId = Number(args.pictureId);
        //const commonEventId = Number(args.commonEventId);
    });

    //-----------------------------------------------------------------------------
    // Sprite_EnemyBreathe
    //
    // The sprite for displaying a enemy sprite breathe.
    const Sprite_Enemy_Update = Sprite_Enemy.prototype.update;
    const Sprite_Enemy_Initialize = Sprite_Enemy.prototype.initialize;
    Sprite_Enemy.prototype.initialize = function(){
        Sprite_Enemy_Initialize.apply(this, arguments);
        this._frame_count = 0;
        this._is_breath_in = true;
        this._breath_count = 30;
        this._breath_wait = 30;
    }

    Sprite_Enemy.prototype.update = function(){
        Sprite_Enemy_Update.apply(this, arguments);
        if (this._breath_wait > 0){
            this._breath_wait -= 1;
            return;
        }
        this._frame_count++;
        if(this._frame_count > this._breath_count){
            this._frame_count = 0;
            this._is_breath_in = !this._is_breath_in;
            this._breath_wait = 10;
        }
        let scale = 1; 
        if (this._is_breath_in){
            scale = 1.0 + (this._frame_count * 1.0 / this._breath_count) * 0.02; 
        }else{
            scale = 1.0 + (1 - this._frame_count * 1.0 / this._breath_count) * 0.02;
        }
        this.scale.x = scale;
        this.scale.y = scale;
    }
})();