"use strict";
{ //Start scope

let dragging = false;
let curElement;
document.addEventListener("mousedown",(e)=>{
    if(e.shiftKey && e.target.style.position == "absolute"){
        dragging = true;
        curElement = e.target;
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
        return false;
    }
});
let moveCurElement = function(e){
    if(!dragging) return;
    const sisters = [curElement,...(curElement.sisterElements||[])];
    for(let i=0;i<sisters.length;i++){
        if(sisters[i].setPosition) sisters[i].setPosition(e.pageX,e.pageY);
        else{
            sisters[i].style.left= `${e.pageX}px`;
            sisters[i].style.top = `${e.pageY}px`;
        }
    }
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
    return false;
};
document.addEventListener("mousemove",moveCurElement);
document.addEventListener("mouseup",(e)=>{
    moveCurElement(e);
    dragging = false;
    curElement = undefined;
});

} //End of scope