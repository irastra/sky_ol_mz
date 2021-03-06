//=============================================================================
// RPG Maker MZ - IRA_BattleProcess.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 战斗调整
 * @author irastra
 *
 * @help 战斗调整。
 * 
 * @param use_atk_access
 * @desc 攻击前像目标移动。
 * @type number
 * @default 0
 * 
 * @param action_access_note
 * @desc 远程攻击备注
 * @type string
 * @default 远程
 */

function EventManager(){

}

EventManager.event_dict = {}

EventManager.RegistEvent = function(key, cb, cb_argument){
    const ret = EventManager.event_dict[key];
    if (!ret){
        EventManager.event_dict[key] = []
    }
    EventManager.event_dict[key].push([cb, cb_argument]);
}

EventManager.UnregistEvent = function(key, cb){
    let = event_list = EventManager.event_dict[key];
    if(!event_list){
        return;
    }
    const idx = event_list.indexOf(cb);
    event_list.splice(idx, 1);
    if(!event_list.length){
        delete EventManager.event_dict[key];
    }
}

EventManager.PublishEvent = function(key, arg){
    const event_list = EventManager.event_dict[key];
    if(event_list){
        for (const cb_pair of event_list){
            if(cb_pair[1]){
                cb_pair[0](cb_pair[1], arg);
            }else{
                cb_pair[0](arg);
            }
        }
    }
}

GuidManager = function(){

}

GuidManager.guid = 100000;

GuidManager.NewGuid = function(){
    return GuidManager.guid++;
}

// MyTimer
function MyTimer() {
    this.initialize(...arguments);
}

MyTimer.prototype = Object.create(Game_Timer.prototype);
MyTimer.prototype.constructor = MyTimer;

MyTimer.prototype.initialize = function(cb, cb_args) {
    Game_Timer.prototype.initialize.call(this);
    this.cb = cb;
    this.cb_args = cb_args;
    this.is_expired = false;
}

MyTimer.prototype.onExpire = function(){
    if (this.cb_args){
        this.cb(...this.cb_args);
    }else{
        this.cb();
    }
    this.is_expired = true;
}

function Timer_Manager(){
    this.initialize(...arguments);
}

Timer_Manager.prototype.constructor = Timer_Manager;

Timer_Manager.prototype.initialize = function (){
    this._timer_list = [];
}

Timer_Manager.prototype.NewTimer = function (delay, cb, cb_args){
    const my_timer = new MyTimer(cb, cb_args);
    this._timer_list.push(my_timer);
    my_timer.start(delay);
};

Timer_Manager.prototype.update_timer = function(s_i){
    let next_list = [];
    for (const my_timer of this._timer_list){
        my_timer.update(s_i);
        if(!my_timer.is_expired){
            next_list.push(my_timer);
        }
    }
    this._timer_list = next_list;
};

(() => {

    const pluginName = 'IRA_BattleProcess';
    const parameters = PluginManager.parameters(pluginName);
    const use_atk_access = Number(parameters['use_atk_access']);
    const action_access_note = String(parameters['action_access_note'])
    function IraDebugWindow(){
        this.guid = GuidManager.NewGuid();
        this.initialize(...arguments);
    }
    IraDebugWindow.prototype = Object.create(Window_Base.prototype);
    IraDebugWindow.prototype.constructor = IraDebugWindow;    
    IraDebugWindow.prototype.initialize = function(){
        Window_Base.prototype.initialize.call(this, arguments);
        IraDebugWindow.instance = this;
        this.is_add = false;
    }
    
    IraDebugWindow.Debug = function(info){
        const instance = IraDebugWindow.instance;
        if(instance){
            if(!instance.is_add){
                const cur_scene = SceneManager._scene;
                cur_scene.addChild(instance);
                instance.is_add = true;
                instance.show();
            }
            instance.contents.clear();
            instance.drawText(info, 0, 0, 300, 300, "center");
        }
    }
    
    IraDebugWindow.prototype.update = function(){
        Window_Base.prototype.update.apply(this, arguments);
    }
    
    IraDebugWindow.prototype.destroy = function(){
        IraDebugWindow.instance = null;
        Window_Base.prototype.initialize.apply(this, arguments);
    }

    //IraDebugWindow.instance = new IraDebugWindow(new Rectangle(300, 300, 300, 100));

    $gameTimerManager = new Timer_Manager();
    const scene_battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function(){
        scene_battle_update.apply(this, arguments);
        const active = this.isActive();
        $gameTimerManager.update_timer(active); 
    }
    
    BattleManager.isBusy = function() {
        return ($gameMessage.isBusy() || this._logWindow.isBusy());
    };

    const update_func = BattleManager.update;
    BattleManager.update = function(){
        update_func.apply(this, arguments);
    }


    Game_Action.prototype.repeatTargets = function(targets) {
        const repeatedTargets = [];
        const repeats = this.numRepeats();
        for (let i = 0; i < repeats; i++) {
            for (const target of targets) {
                if (target) {
                    repeatedTargets.push(target);
                }
            }
        }
        return repeatedTargets;
    };

    BattleManager.updateAction = function() {
        if (this._targets && this._base_target_num) {
            for(let i = 0; i < this._base_target_num; i++){
                const target = this._targets.shift();
                if (target) {
                    this.invokeAction(this._subject, target);
                }else{
                    this.endAction();
                    break;
                }
            }
        } else {
            this.endAction();
        }
    };

    Window_BattleLog.prototype.messageSpeed = function(){
        return 10;
    }    

    Window_BattleLog.prototype.maxLines = function() {
        return 20;
    };

    Sprite_Actor.prototype.setActorHome = function(index) {
        const x = Graphics.width * 0.98 - $gameParty.members().length * 32;
        this.setHome(x + index * 32, 220 + index * 68);
    };

    if (use_atk_access){
        Sprite_Actor.prototype.stepForward = function() {
            const action_target_pos = BattleManager.ActionTargetPos();
            if(this._actor.isActing() && action_target_pos && action_target_pos.length > 1){
                const x = action_target_pos[0] + 32;
                const y = action_target_pos[1];
                const move_dist_x = x - this._homeX;
                const move_dist_y = y - this._homeY;
                this.startMove(move_dist_x, move_dist_y, 12);
            }else{
                this.startMove(-48, 0, 12);
            }
        };
    
        BattleManager.ActionTargetPos = function(){
            return this.action_target_pos;
        }
        
        BattleManager.startAction = function() {
            const subject = this._subject;
            const action = subject.currentAction();
            const targets = action.makeTargets();
            this._phase = "action";
            this._action = action;
            this._targets = targets;
            const item = action.item();
            if(item && item.note == action_access_note && this._targets && this._targets.length > 0 && subject.isActor() && targets[0].isEnemy()){
                this.action_target_pos = [targets[0].screenX(), targets[0].screenY()];
            }else{
                this.action_target_pos = null;
            }
            subject.cancelMotionRefresh();
            subject.useItem(action.item());
            this._action.applyGlobal();
            this._logWindow.startAction(subject, action, targets);
        };
    }

    const start_action = BattleManager.startAction;
    BattleManager.startAction = function() {
        start_action.apply(this, arguments);
        this._base_target_num = this._targets.length / this._action.numRepeats();
    };   

})();