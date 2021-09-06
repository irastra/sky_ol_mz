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

(() => {
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
    }

    Timer_Manager.prototype.update = function(s_i){
        let next_list = [];
        for (const my_timer of this._timer_list){
            my_timer.update(s_i);
            if(!my_timer.is_expired){
                next_list.push(my_timer);
            }
        }
        this._timer_list = next_list;
    }
    $gameTimerManager = new Timer_Manager();
    const scene_battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function(){
        scene_battle_update.apply(this, arguments);
        const active = this.isActive();
        $gameTimerManager.update(active); 
    }

    const start_action = BattleManager.startAction;
    BattleManager.startAction = function(){
        start_action.apply(this, arguments);
        $gameTimerManager.NewTimer(20, () => {
            const target = BattleManager.updateAction();
            if (target.shouldPopupDamage()) {
                target.startDamagePopup();
            }
        });
    }
})();