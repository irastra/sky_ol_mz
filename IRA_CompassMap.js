//=============================================================================
// RPG Maker MZ - IRA_CompassMap.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc IRA_CompassMap to dispaly small map.
 * @author irastra
 *
 * @help IRA_CompassMap.js
 * 
 * @param opacity_value
 * @text 背景透明度
 * @desc 背景透明度（0-255）
 * @type number
 * @on 同じ背景画
 * @off 別に設定
 * @default 128
 */

(() => {
    const pluginName = 'IRA_CompassMap';
    const parameters = PluginManager.parameters(pluginName);
    const bg_opacity = Number(parameters['opacity_value']);

    ImageManager.loadCompassMap = function(filename) {
        return this.loadBitmap("img/maps/", filename);
    };

    DataManager.GetCompassMapName = function(mapId) {
        const filename = "Map%1".format(mapId.padZero(3));
        return filename;
    };

    Scene_Map.prototype.GetPlayerSprite = function(){
        for (const sprite of this._spriteset._characterSprites){
            if (sprite.checkCharacter($gamePlayer)){
                return sprite;
            }
        }
        return null;
    }

    Game_Map.prototype.canvasToMapPosX = function(x) {
        const tileWidth = this.tileWidth();
        const originX = x + this._displayX * tileWidth;
        return originX;
    };
    
    Game_Map.prototype.canvasToMapPosY = function(y) {
        const tileHeight = this.tileHeight();
        const originY = y + this._displayY * tileHeight;
        return originY;
    };

    function CompassMap (){
        this.initialize(...arguments);
    }
    CompassMap.prototype = Object.create(Sprite.prototype);
    CompassMap.prototype.constructor = CompassMap;

    CompassMap.prototype.initialize = function(){
        Sprite.prototype.initialize.call(this);
        this._draw_sprite = new Sprite();
        this._tmp_pos = new Point();
        this.loadContentMap();
        this.move(0, 0);
        this.opacity = bg_opacity;
        this.addChild(this._draw_sprite);
        this.show();
    }

    CompassMap.prototype.loadContentMap = function(){
        let map_id = $gamePlayer.newMapId();
        if (!map_id){
            map_id = $gameMap.mapId();
        }
        const map_name = DataManager.GetCompassMapName(map_id);
        this.bitmap =  ImageManager.loadCompassMap(map_name);
        this.bitmap.addLoadListener(this.OnContentMapLoaded.bind(this));
    }

    CompassMap.prototype.OnContentMapLoaded = function(){
        this.scale.x = 0.5;
        this.scale.y = 0.5;
        this._draw_sprite.bitmap = new Bitmap(this.bitmap.width, this.bitmap.height);
    }

    CompassMap.prototype.worldToLocalPos = function(x, y){
        const world_map_width = $gameMap.width() * $gameMap.tileWidth();
        const world_map_height = $gameMap.height() * $gameMap.tileHeight();
        this._tmp_pos.x = x * 1.0 * this._draw_sprite.width / world_map_width;
        this._tmp_pos.y = y * 1.0 * this._draw_sprite.height / world_map_height;
        return this._tmp_pos;
    }

    CompassMap.prototype.drawRect = function(x, y, width, height, block) {
        const outlineColor = "#ff0000";
        const mainColor = "#000000";
        this._draw_sprite.bitmap.fillRect(x, y, width, block, outlineColor);
        this._draw_sprite.bitmap.fillRect(x, y + height, width, block, outlineColor);
        this._draw_sprite.bitmap.fillRect(x, y, block, height, outlineColor);
        this._draw_sprite.bitmap.fillRect(x + width, y, block, height, outlineColor)
    };
    

    CompassMap.prototype.update = function(){
        Sprite.prototype.update.call(this);
        this._draw_sprite.bitmap.clear();
        if(SceneManager._scene._spriteset && SceneManager._scene._spriteset._characterSprites){
            for(const character_spirte of SceneManager._scene._spriteset._characterSprites){
                if(character_spirte.isEmptyCharacter() || !character_spirte._characterName){
                    continue;
                }
                const character = character_spirte._character;
                if(!character){
                    continue;
                }
                const x = $gameMap.canvasToMapPosX(character.screenX());
                const y = $gameMap.canvasToMapPosY(character.screenY());
                const pos = this.worldToLocalPos(x, y);
                const color = character_spirte.checkCharacter($gamePlayer) ? "#ff0000" : "#00ff00" ; 
                this._draw_sprite.bitmap.fillRect(pos.x, pos.y, 8, 8, color);
            }
        }
        this.drawRect(0, 0, this._draw_sprite.width - 1 , this._draw_sprite.height - 1, 1)
    }

    const onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function(){
        onMapLoaded.apply(this, arguments);
        this._compass_map = new CompassMap();
        this.addChild(this._compass_map);
    }

})();