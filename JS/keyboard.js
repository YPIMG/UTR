"use strict";
{ //Start of scope

const prKeys={shift:undefined};
window.addEventListener("keydown",function(e){ //Key events need to be on Window because Firefox sucks ass
    const k = e.key.toLowerCase();
    prKeys[`${k}`] = true;
    prKeys[`${k},${e.location||0}`] = true;
    e.preventDefault();
    e.stopPropagation();
    return false;
});
window.addEventListener("keyup",function(e){
    const k = e.key.toLowerCase();
    prKeys[`${k}`] = false;
    prKeys[`${k},${e.location}`] = false;
    e.preventDefault();
    e.stopPropagation();
    return false;
});
document.addEventListener("blur",function(){
    Object.keys(prKeys).forEach((k)=> prKeys[k]=false);
});

const keyConv = {
    ctrl:"control",
    left:"arrowleft",
    up:"arrowup",
    right:"arrowright",
    down:"arrowdown",
    esc:"escape",
    del:"delete",
    space:" ",
    spacebar:" ",
};
var isKeyDown = function(k,l){
    k = k.toLowerCase();
    return prKeys[`${keyConv[k]||k},${l||""}`]||false;
};

} //End of scope