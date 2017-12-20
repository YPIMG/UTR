"use strict";
/*global MouseEvent*/
{ //Start scope

const convert = {
    touchstart:"mousedown",
    touchmove: "mousemove",
    touchend:  "mouseup",
};
const touchHandler = function(e){
    if(!convert[e.type]) return;
    const t = e.changedTouches[0];
    t.target.dispatchEvent(new MouseEvent(convert[e.type],{
        target: t.target,
        screenX:t.screenX, screenY:t.screenY,
        clientX:t.clientX, clientY:t.clientY,
        pageX:t.pageX, pageY:t.pageY,
        ctrlKey:e.ctrlKey, metaKey:e.metaKey,
        altKey:e.altKey, shiftKey:e.shiftKey,
        button:0, buttons:1,
        bubbles:true, cancelable:true,
        view:window,
    }));
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
    return false;
};
let active = false;
let func;
const options = {passive:false};
var toggleT2M = function(){
    func = active ? document.removeEventListener : document.addEventListener;
    func("touchstart" ,touchHandler,options);
    func("touchmove"  ,touchHandler,options);
    func("touchend"   ,touchHandler,options);
    func("touchcancel",touchHandler,options);
    active = !active;
};

} //End scope