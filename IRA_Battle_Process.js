//=============================================================================
// RPG Maker MZ - IRA_Battle_Process.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc IRA_Battle_Process to dispaly battle timeline.
 * @author irastra
 *
 * @help IRA_Battle_Process.js
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
    //alert(EventManager.event_dict[key].length);
}

EventManager.UnregistEvent = function(key, cb){
    let = event_list = EventManager.event_dict[key];
    if(!event_list){
        return;
    }
    const idx = event_list.indexOf(cb);
    event_list.splice(idx, 1);
    //alert(event_list);
    if(!event_list.length){
        delete EventManager.event_dict[key];
    }
}

EventManager.PublishEvent = function(key, arg){
    const event_list = EventManager.event_dict[key];
    //alert(event_list.length);
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
    //alert("init timer manager!");
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
    $gameTimerManager = new Timer_Manager();
    const scene_battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function(){
        scene_battle_update.apply(this, arguments);
        const active = this.isActive();
        $gameTimerManager.update_timer(active); 
    }
    
    BattleManager.isBusy = function() {
        return (
            $gameMessage.isBusy() ||
            this._logWindow.isBusy()
        );
    };


})();