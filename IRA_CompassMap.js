//=============================================================================
// RPG Maker MZ - IRA_CompassMap.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 小地图
 * @author irastra
 *
 * @help 左上角小地图
 * 
 * @param opacity_value
 * @text 背景透明度
 * @desc 背景透明度（0-255）
 * @type number
 * @default 128
 */

(() => {
    const pluginName = 'IRA_CompassMap';
    const parameters = PluginManager.parameters(pluginName);
    const bg_opacity = Number(parameters['opacity_value']);
    const prefix_event = "!";
    const target_width = 150;
    const target_height = 150;
    const sprite_title_width = 4;
    const sprite_title_height = 4;

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
        this.guid = GuidManager.NewGuid();
        this.initialize(...arguments);
    }
    CompassMap.prototype = Object.create(Sprite.prototype);
    CompassMap.prototype.constructor = CompassMap;

    CompassMap.prototype.initialize = function(){
        Sprite.prototype.initialize.call(this);
        this._draw_sprite = new Sprite();
        this._tmp_pos = new Point();
        this._size_x_scale = 1.0;
        this._size_y_scale = 1.0;
        this.loadContentMap();
        this.move(0, 0);
        this.opacity = bg_opacity;
        this.addChild(this._draw_sprite);
        this.show();
    }

    CompassMap.prototype.destroy = function(options) {
        this._draw_sprite.destroy();
        Window.prototype.destroy.call(this, options);
    };

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
        const ori_width = this.bitmap.width;
        const ori_height = this.bitmap.height;
        this.scale.x = this._size_x_scale = target_width * 1.0 / ori_width;
        this.scale.y = this._size_y_scale = target_height * 1.0 / ori_height;
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
        this._draw_sprite.bitmap.fillRect(x, y, width, block, outlineColor);
        this._draw_sprite.bitmap.fillRect(x, y + height, width, block, outlineColor);
        this._draw_sprite.bitmap.fillRect(x, y, block, height, outlineColor);
        this._draw_sprite.bitmap.fillRect(x + width, y, block, height, outlineColor)
    };
    

    CompassMap.prototype.update = function(){
        Sprite.prototype.update.call(this);
        this._draw_sprite.bitmap.clear();
        let player_pos_x=0;
        let player_pos_y=0;
        if(SceneManager._scene._spriteset && SceneManager._scene._spriteset._characterSprites){
            for(const character_spirte of SceneManager._scene._spriteset._characterSprites){
                if(character_spirte.isEmptyCharacter() || !character_spirte._characterName){
                    continue;
                }
                const character = character_spirte._character;
                if(!character){
                    continue;
                }
                if(character._characterName.indexOf(prefix_event) == 0){
                    continue;
                }
                const x = $gameMap.canvasToMapPosX(character.screenX());
                const y = $gameMap.canvasToMapPosY(character.screenY());
                const pos = this.worldToLocalPos(x, y);
                const color = character_spirte.checkCharacter($gamePlayer) ? "#ff0000" : "#00ff00" ; 
                if(character_spirte.checkCharacter($gamePlayer)){
                    player_pos_x = x;
                    player_pos_y = y;
                }
                this._draw_sprite.bitmap.fillRect(pos.x, pos.y, sprite_title_width / this._size_x_scale, sprite_title_height / this._size_y_scale, color);
            }
        }
        this.DrawInfo(player_pos_x, player_pos_y);
        this.drawRect(0, 0, this._draw_sprite.width - 2, this._draw_sprite.height - 2, 2);
    }

    CompassMap.prototype.DrawInfo = function(player_pos_x, player_pos_y){
        const bitmap = this._draw_sprite.bitmap;
        bitmap.fontFace = $gameSystem.mainFontFace();
        bitmap.outlineColor = "black";
        bitmap.outlineWidth = 8;
        bitmap.fontSize = 72;
        bitmap.drawText(Math.floor(player_pos_x) +" " + Math.floor(player_pos_y), 0, 0, 300, 100, "center");
    }

    const onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function(){
        onMapLoaded.apply(this, arguments);
        this._compass_map = new CompassMap();
        this.addChild(this._compass_map);
    }
})();