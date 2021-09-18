//=============================================================================
// RPG Maker MZ - Ira_Item
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Ira_Item to dispaly battle timeline.
 * @author irastra
 *
 * @help Ira_Item.js
 */

(() => {

    DataManager.onXhrLoad = function(xhr, name, src, url) {
        if (xhr.status < 400) {
            window[name] = JSON.parse(xhr.responseText);
            this.onLoad(name, window[name]);
        } else {
            this.onXhrError(name, src, url);
        }
    };

    BattleManager.processTurn = function() {
        const subject = this._subject;
        const action = subject.currentAction();
        if (action) {
            action.prepare();
            if (action.isValid()) {
                this.startAction();
            }
            let attack_again = false;
            if (subject.isActor()){
                const equips = subject.weapons();
                for(const equip of equips){
                    if(equip._effects){
                        for(effect_pair of Object.values(equip._effects)){
                            if(effect_pair[0] == EquipEffect.EFFECT_MUTIPIPLY){
                                if(!attack_again && effect_pair[1]){
                                    attack_again = Math.random() < (effect_pair[1] / 100.0);
                                }
                            }
                        }
                    }
                }
            }
            if (!attack_again){
                subject.removeCurrentAction();
            }
        } else {
            this.endAction();
            this._subject = null;
        }
    };

    BattleManager.updateAction = function() {
        const target = this._targets.shift();
        if (target) {
            this.invokeAction(this._subject, target);
        } else {
            this.endAction();
        }
        return target;
    };

    const createItemWindow = Scene_Item.prototype.createItemWindow;
    Scene_Item.prototype.createItemWindow = function(){
        createItemWindow.apply(this, arguments);
        this._equipOperationWindow = new Window_EquipOperation(new Rectangle(0,  0, Graphics.width, Graphics.height));
        this._equipOperationWindow.setHandler("cancel", this.onItemDetailCancel.bind(this));
        this._equipOperationWindow.setHandler("ok", this.onItemDetailCancel.bind(this));
        this.addChild(this._equipOperationWindow);
    }

    Scene_Item.prototype.onItemDetailCancel = function() {
        this._equipOperationWindow.hide();
        this._equipOperationWindow.deactivate();
        this._itemWindow.activate();
    };

    Scene_Item.prototype.onItemOk = function() {
        $gameParty.setLastItem(this.item());
        //alert(this.item().name + " " + $gameParty.lastItem().name);
        if (!DataManager.isWeapon(this.item())){
            this.determineItem();
        }else{
            this._equipOperationWindow.refresh();
            this._equipOperationWindow.show();
            this._equipOperationWindow.activate();
        }
    };

    Window_ItemList.prototype.isEnabled = function(item) {
        return $gameParty.canUse(item) || DataManager.isWeapon(item);
    };
    
    //-----------------------------------------------------------------------------
    // Ira_Item
    //
    Window_Base.prototype.drawItemName = function(item, x, y, width) {
        if (item) {
            const iconY = y + (this.lineHeight() - ImageManager.iconHeight) / 2;
            const textMargin = ImageManager.iconWidth + 4;
            const itemWidth = Math.max(0, width - textMargin);
            if(!DataManager.isWeapon(item) && item.note != "吸附石"){
                this.resetTextColor();
                this.drawIcon(item.iconIndex, x, iconY);
                this.drawText(item.name, x + textMargin, y, itemWidth);
            }else{
                this.changeTextColor(item.getLevelColor());
                this.drawIcon(item.iconIndex, x, iconY);
                this.drawText(item.getLevelName(), x + textMargin, y, itemWidth);
            }
        }
    };

    Window_Base.prototype.getCenterRectangle = function(width, height) {
        const x = (Graphics.width - width) / 2;
        const y = (Graphics.height - height) / 2;
        return new Rectangle(x, y, width, height);
    };
    
    const base_destroy_func = Window_Base.prototype.destroy;
    Window_Base.prototype.destroy = function(){
        base_destroy_func.apply(this, arguments);
        this.OnDestroy();
    }

    Window_Base.prototype.OnDestroy = function(){
    }


    const item_initialize_func = Window_ItemList.prototype.initialize;
    Window_ItemList.prototype.initialize = function(){
        item_initialize_func.apply(this, arguments);
        this.func = this.refresh.bind(this);
        EventManager.RegistEvent('item_update', this.func);
    }

    Window_ItemList.prototype.OnDestroy = function(){
        //alert("itemlist destroy");
        Window_Command.prototype.OnDestroy.call(this);
        EventManager.UnregistEvent('item_update', this.func);
    }
    
    const help_initialize_func = Window_Help.prototype.initialize;
    Window_Help.prototype.initialize = function(){
        help_initialize_func.apply(this, arguments);
        this.func = this.setItem.bind(this);
        EventManager.RegistEvent('item_update', this.func);
    }

    Window_Help.prototype.OnDestroy = function(){
        //alert("help destroy!")
        Window_Command.prototype.OnDestroy.call(this);
        EventManager.UnregistEvent('item_update', this.func);
    }

    Window_Help.prototype.resetFontSettings = function() {
        this.contents.fontFace = $gameSystem.mainFontFace() / 3 * 2;
        this.contents.fontSize = $gameSystem.mainFontSize() / 3 * 2;
        this.resetTextColor();
    };

    Window_Help.prototype.lineHeight = function() {
        return this.contents.fontSize;
    };

    Window_Help.prototype.calcTextHeight = function() {
        return this.contents.fontSize;
    };
    
    Window_Help.prototype.setItem = function(item) {
        if(!DataManager.isWeapon(item) && (item && item.note != "吸附石")){
            this.setText(item ? item.description : "");
        }else{
            this.setText(item ? item.getDesc() : "");
        }
    };

    function EquipEffect(){
    
    }

    window.EquipEffect = EquipEffect;

    EquipEffect.AddProperty = function(type, value, desc){
        this.EFFECT_RANAGE[type] = value;
        this.VALUE_DESC[type] = desc;
    }

    EquipEffect.setUp = function(){
        this.EFFECT_NONE = 0;
        this.EFFECT_CRITICAL = 1;
        this.EFFECT_PHICIAL_VALUE = 2;
        this.EFFECT_PHISIAL_PCT = 3;
        this.EFFECT_HP_VALUE = 4;
        this.EFFECT_HP_PCT = 5;
        this.EFFFCT_MAGIC_VALUE = 6;
        this.EFFECT_MAGIC_PCT = 7;
        this.EFFECT_MUTIPIPLY = 8;
        this.EFFECT_MAX = 8;
        this.EFFECT_RANAGE = {};
        this.VALUE_DESC = {};
        this.AddProperty(this.EFFECT_NONE, [0, null], "可镶嵌");
        this.AddProperty(this.EFFECT_CRITICAL, [0, 50], "暴击率");
        this.AddProperty(this.EFFECT_PHICIAL_VALUE, [0, 50], "物理攻击");
        this.AddProperty(this.EFFECT_PHISIAL_PCT, [0, 50], "物攻强度");
        this.AddProperty(this.EFFECT_HP_VALUE, [0, 50], "生命");
        this.AddProperty(this.EFFECT_HP_PCT, [0, 50], "生命力");
        this.AddProperty(this.EFFFCT_MAGIC_VALUE, [0, 50], "法术攻击");
        this.AddProperty(this.EFFECT_MAGIC_PCT, [0, 50], "法术强度");
        this.AddProperty(this.EFFECT_MUTIPIPLY, [0, 30], "连击率");
    }

    EquipEffect.setUp();
    
    function IraActor(obj){
        obj._grade_point = 0;
        obj._grade_point_add = 4;
        obj.OnActorLevelUp = OnActorLevelUp.bind(obj);
    }

    function OnActorLevelUp(){
        this._grade_point += this._grade_point_add;
    }

    function IraItem(obj){
        obj._item_level = 2;
        obj._color_list = [
            "white", "blue", "green", "orange", "yellow"
        ]
        obj._level_nick = [
            "凡品", "良品", "极品", "仙品", "神品"
        ]
        obj._effects = {}
        obj._item_level_max = obj._level_nick.length - 1;
        obj.IraItemDebug = IraItemDebug.bind(obj);
        obj.getLevelColor = getLevelColor.bind(obj);
        obj.getLevelText = getLevelText.bind(obj);
        obj.getLevelName = getLevelName.bind(obj);
        obj.getDesc = getDesc.bind(obj);
        obj.levelUp = levelUp.bind(obj);
        obj.initEffect = initEffect.bind(obj);
        obj.getEffectDesc = getEffectDesc.bind(obj);
        obj.convertEffect = convertEffect.bind(obj);
        obj.effectValid = effectValid.bind(obj);
        obj.getFreeSlot = getFreeSlot.bind(obj);
        obj.initEffect();
    }

    function levelUp(){
        this._item_level += 1;
        this._item_level = Math.min(this._item_level, this._item_level_max);
        this.initEffect();
    }

    function getLevelColor(){
        return this._color_list[this._item_level];
    }

    function getLevelText(){
        return this._level_nick[this._item_level];
    }

    function getLevelName(){
        return this.getLevelText() + "." + this.name;
    }

    function initEffect(){
        if (this.note == "吸附石"){
                const effect_type = EquipEffect.EFFECT_NONE;
                const effect_range = EquipEffect.EFFECT_RANAGE[effect_type];
                this._effects[0] = [effect_type, effect_range[1]];
            return;
        }
        for (let idx = 0; idx < this._item_level; idx++){
            if(!this._effects[idx]){
                const effect_type = idx == 0 ? EquipEffect.EFFECT_MUTIPIPLY : Math.randomInt(EquipEffect.EFFECT_MAX);
                const effect_range = EquipEffect.EFFECT_RANAGE[effect_type];
                this._effects[idx] = [effect_type, effect_range[1]];
            }
        }
    }

    function effectValid(effect_idx){
        return this._effects[effect_idx] && this._effects[effect_idx][0]!= EquipEffect.EFFECT_NONE;
    }

    function convertEffect(effect_idx, target_item, target_effect_idx){
        if (this.effectValid(effect_idx)){
            target_item._effects[target_effect_idx] = this._effects[effect_idx];
            const effect_type = EquipEffect.EFFECT_NONE;
            const effect_range = EquipEffect.EFFECT_RANAGE[effect_type];
            this._effects[effect_idx] = [effect_type, effect_range[1]]
        }

    }

    function getFreeSlot(){
        for(let idx = 0 ; idx < this._item_level; idx++){
            if (this._effects[idx][0] == EquipEffect.EFFECT_NONE){
                return idx;
            }
        }
        return null;
    }


    function getDesc(){
        const desc_list = Object.values(this._effects);
        let desc = "";
        for(effect of desc_list){
            if(effect[0] == EquipEffect.EFFECT_NONE){
                desc += EquipEffect.VALUE_DESC[effect[0]] + '\n';
            }else{
                desc += EquipEffect.VALUE_DESC[effect[0]] + " +" + effect[1] + '\n';
            }
        }
        return this.description + '\n' + desc;
    }

    function getEffectDesc(effect){
        return EquipEffect.VALUE_DESC[effect[0]] + " +" + effect[1];
    }

    function IraItemDebug(){
        alert("debug" + this._item_level);
    }

    const onLoad = DataManager.onLoad;
    DataManager.onLoad = function(name, data){
        onLoad.call(this, name, data);
        let init_func = null;
        if (["$dataItems", "$dataSkills", "$dataWeapons"].includes(name)){
            init_func = IraItem;
        }else if(["$dataActors"].includes(name)){
            init_func = IraActor;
        }
        if (init_func && data && data.forEach){
            data.forEach(element => {
                if (element){
                    init_func(element);
                }
            });
        }

    }
})();

function Window_EquipEffect(){
    this.initialize(... arguments);
}

Window_EquipEffect.prototype = Object.create(Window_Command.prototype);
Window_EquipEffect.prototype.constructor = Window_EquipEffect;
Window_EquipEffect.prototype.initialize = function(cb){
    const my_rect = this.getCenterRectangle(300, 200);
    Window_Command.prototype.initialize.call(this, my_rect);
    this.hide();
    this.deactivate();
    this.type = 0;
    this.cb = cb;
}

Window_EquipEffect.prototype.setType = function(type){
    this.type = type; 
}

Window_EquipEffect.prototype.makeCommandList = function(){
    const item = $gameParty.lastItem();
    if (item){
        let idx = 0;
        const effect_list = Object.values(item._effects);
        for (const effect of effect_list){
            let can_sel = true;
            if(this.type == 1){
                //吸附
                can_sel = (effect[0] != 0);
            }else{
                //镶嵌
                can_sel = (effect[0] == 0);
            }
            const effect_desc = item.getEffectDesc(effect)
            this.addCommand(effect_desc, ""+idx, can_sel);
            this.setHandler(""+idx, this.OnSelectItem.bind(this, idx));
            idx += 1;
        }
    }
    this.setHandler("cancel", this.OnCancelSelectItem.bind(this));
}

Window_EquipEffect.prototype.OnSelectItem = function(idx){
    this.hide();
    this.cb(idx);
}

Window_EquipEffect.prototype.OnCancelSelectItem = function(){
    this.hide();
    this.cb(null);
}

function Window_EquipOperation(){
    this.initialize(... arguments);
}

Window_EquipOperation.prototype = Object.create(Window_Command.prototype);
Window_EquipOperation.prototype.constructor = Window_EquipOperation;
Window_EquipOperation.prototype.initialize = function(){
    Window_Command.prototype.initialize.apply(this, arguments);
    this.window_process = new Window_RandomProcess();
    this.addChild(this.window_process);
    this.window_effect = new Window_EquipEffect(this.selectItem.bind(this));
    let item_list = $gameParty.allItems();
    let filter_item_list = item_list.filter((_item)=>{return _item.note == "吸附石";});
    this.window_item_browser = new Window_ItemBrowser(filter_item_list, this.itemSlected.bind(this));
    this.addChild(this.window_item_browser);
    this.window_item_browser.setHandler("cancel", 
        () =>{
            this.window_item_browser.deactivate();
            this.window_item_browser.hide();
            this.window_effect.activate();
            this.window_effect.show();
        }
    )
    this.addChild(this.window_effect);
    this.setHandler("装备强化", this.levelUp.bind(this, 1));
    this.setHandler("属性吸附", this.convertEffect.bind(this, 2));
    this.setHandler("属性镶嵌", this.addEffect.bind(this, 3));
    this.deactivate();
    this.hide();
}

Window_EquipOperation.prototype.makeCommandList = function() {
    const is_weapon = DataManager.isWeapon(this.curItem());
    this.addCommand("装备强化", "装备强化", is_weapon);
    this.addCommand("属性吸附", "属性吸附", is_weapon);
    this.addCommand("属性镶嵌", "属性镶嵌", is_weapon);
};

Window_EquipOperation.prototype.selectItem = function(begin_idx) {
    if(begin_idx != null){
        let check_func = DataManager.isWeapon;
        if(this.opt_type == 3){
            check_func = this.effectStone;
        }else if(this.opt_type == 2){
            check_func = this.effectStoneEmpty;
        }
        this.window_item_browser.setUseCheckFunc(check_func);
        this.window_item_browser.show();
        this.window_item_browser.activate();
        this.begin_idx = begin_idx;
    }else{
        this.activate();
    }
};

Window_EquipOperation.prototype.effectStone = function(item){
    return item.note == "吸附石" && item.effectValid(0);
}

Window_EquipOperation.prototype.effectStoneEmpty = function(item){
    //alert(item._effects[0][0]);
    return item.note == "吸附石" && !item.effectValid(0);
}

Window_EquipOperation.prototype.curItem = function(){
    return $gameParty.lastItem();   
}

Window_EquipOperation.prototype.itemSlected = function(item) {
    let main_item = this.curItem();
    if (this.opt_type == 1){
        return;
    }else if(this.opt_type == 2){
        main_item.convertEffect(this.begin_idx, item, 0)
    }else if(this.opt_type == 3){
        item.convertEffect(0, main_item, this.begin_idx);
    }
    EventManager.PublishEvent('item_update', item);
    this.activate();
};

Window_EquipOperation.prototype.levelUp = function(idx){
    this.opty_type = idx;
    this.window_process.startProcess(this.processFinish.bind(this), "强化成功");
}

Window_EquipOperation.prototype.convertEffect = function(idx){
    this.opt_type = idx;
    this.window_effect.setType(1);
    this.window_effect.refresh();
    this.window_effect.show();
    this.window_effect.activate();
}

Window_EquipOperation.prototype.addEffect = function(idx){
    this.opt_type = idx;
    this.window_effect.setType(2);
    this.window_effect.refresh();
    this.window_effect.show();
    this.window_effect.activate();
}

Window_EquipOperation.prototype.processFinish = function(){
    this.activate();
    const item = $gameParty.lastItem();
    item.levelUp();
    EventManager.PublishEvent('item_update', item);
}

function Window_RandomProcess(){
    this.initialize(... arguments);
}

Window_RandomProcess.prototype = Object.create(Window_Selectable.prototype);
Window_RandomProcess.prototype.constructor = Window_RandomProcess;
Window_RandomProcess.prototype.initialize = function(){
    const my_rect = this.getCenterRectangle(300, 200);
    Window_Base.prototype.initialize.call(this, my_rect);
    this.progress_width = 200;
    this.progress_height = 22;
    this.progress_sprite = new Sprite();
    this.progress_sprite.bitmap = new Bitmap(this.progress_width, this.progress_height);
    this.addChild(this.progress_sprite);
    this.progress_sprite.move((300 - 200) / 2, 10);
    this.frame_count = 0;
    this.cb = null;
    this._init_ok = false;
    this.deactivate();
    this.hide();
}

Window_RandomProcess.prototype.update = function(){
    Window_Base.prototype.update.call(this);
    this.processTouch();
    if(this.active && this._init_ok){
        this.frame_count += 1;
        if(this.frame_count > 100){
            this._init_ok = false;
        }
    }
    this.drawProgress();
}

Window_RandomProcess.prototype.drawProgress = function(){
    const x = 0;
    const y = 0;
    this.progress_sprite.bitmap.fillRect(x, y, this.progress_width, this.progress_height, "#000000");
    this.progress_sprite.bitmap.fillRect(x + 1, y + 1, this.progress_width * (this.frame_count / 100.0), this.progress_height -2, "yellow");
    if (this.frame_count > 100){
        this.drawText(this.res_str, x, y + 20, this.progress_width, this.lineHeight());
    }
}

Window_RandomProcess.prototype.startProcess = function(cb, res_str){
    this.cb = cb;
    this.res_str = res_str;
    this._init_ok = true;
    this.show();
    this.activate();
}

Window_RandomProcess.prototype.processTouch = function(){
    if (this.active && !this._init_ok) {
        if (Input.isTriggered("ok") || Input.isTriggered("cancel") || TouchInput.isTriggered()) {
            this.processOk();
        } else if (TouchInput.isCancelled()) {
            this.processOk();
        }
    }
}

Window_RandomProcess.prototype.processOk = function(){
    if (this.frame_count > 0 && !this._init_ok){
        this.frame_count = 0;
        this.deactivate();
        this.contents.clear();
        this.hide();
        this.cb();
    }
}

function Window_ItemBrowser(){
    this.initialize(... arguments);
}

Window_ItemBrowser.prototype = Object.create(Window_ItemList.prototype);
Window_ItemBrowser.prototype.constructor = Window_ItemBrowser;
Window_ItemBrowser.prototype.initialize = function(item_list, cb){
    const my_rect = this.getCenterRectangle(500, 400);
    Window_Selectable.prototype.initialize.call(this, my_rect);
    this._data = item_list;
    this._data_list = item_list;
    this.cb = cb;
    this.setHandler('ok', this.OnSelectItem.bind(this));
    this.refresh();
    this.deactivate();
    this.hide();
    this.selectLast();
}

Window_ItemBrowser.prototype.makeItemList = function(){
    this._data = this._data_list;
}

Window_ItemBrowser.prototype.OnSelectItem = function(){
    this.cb(this.item());
    this.deactivate();
    this.hide();
}

Window_ItemBrowser.prototype.isEnabled = function(item) {
    if(!this.use_check_func){
        return false;
    }
    return this.use_check_func(item);
};

Window_ItemBrowser.prototype.setUseCheckFunc = function(func) {
    return this.use_check_func = func;
};