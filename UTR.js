"use strict";
/*global sData,data2img,drawImgBlend,Bone */

//canvas setup
var canvas0 = document.getElementById('canvas0');
var canvas1 = document.getElementById('canvas1');
var ctx0 = canvas0.getContext('2d');
var ctx1 = canvas1.getContext('2d');
//Keyboard handling
var prKeys=[];
window.onkeydown=function(e){
    prKeys[e.keyCode]=true;
    e.preventDefault();
    e.stopPropagation();
    return false;
};
window.onkeyup=function(e){
    prKeys[e.keyCode]=undefined;
};
window.onblur=function(){
    prKeys=[];
};
function keyDown(k){
    var ret;
    switch(k.toLowerCase()){
        case "enter":
            ret = prKeys[13];
            break;
        case "shift":
            ret = prKeys[16];
            break;
        case "control":
        case "ctrl":
            ret = prKeys[17];
            break;
        case "alt":
            ret = prKeys[18];
            break;
        case "space":
            ret = prKeys[32];
            break;
        case "left":
            ret = prKeys[37];
            break;
        case "up":
            ret = prKeys[38];
            break;
        case "right":
            ret = prKeys[39];
            break;
        case "down":
            ret = prKeys[40];
            break;
    }
    return ret||((typeof k==="string") ? prKeys[k.charCodeAt(0)] : prKeys[k])||false;
}
//Making players and their sprites
var colors = { //The pallets of the standard 7 colors; keep in mind the default heart is its own color: pink
    red:[255,0,0],
    orange:[255,127,0],
    yellow:[255,255,0],
    green:[0,255,0],
    blue:[66,226,255],//42e2ff
    indigo:[0,0,255],
    violet:[211,54,217]
};
var defHeart = data2img(sData.defHeart,255,66,66,1);
function newPlayer(color,variant,p){
    p=p||{};
    var newP = {
        color:color,variant:variant,ID:p.ID,
        left:p.left||"left",
        up:p.up||"up",
        right:p.right||"right",
        down:p.down||"down",
        special:p.special||"shift",
        dX:p.dX||0,dY:p.dY||0,
        x:p.x||0,y:p.y||0,
        maxHP:p.maxHP||20,
        maxInv:p.maxInv||20,
        touching:[]
    };
    if(colors[color]){
        newP.sprite = data2img(sData.heart,...colors[color],1);
    }else{
        newP.sprite = defHeart; //Default heart
    }
    switch(color){
        case "yellow":
            newP.cool = -1000; //Cooldown is set to -1000 so the ability is ready immediately
            newP.maxInv = 10; //Balancing for parry move
            break;
        case "green":
            newP.cool = -1000;
            newP.maxHP = 10; //Balancing for healing
            break;
        case "blue":
            newP.cool = -1000;
            break;
        case "indigo":
            newP.ground = false;
            newP.carryID = -1;
            newP.carryX = 0;
            newP.maxHP = 30;
            break;
        case "violet":
            newP.latest = false;
            newP.maxInv = 35; //Base stat is 20, add 15 for items in the real game (I'll balance later)
            break;
    }
    newP.hp = newP.maxHP;
    newP.inv= newP.maxInv;
    return newP;
}
var players=[
    newPlayer("red",0,{
        left:"A",
        up:"W",
        right:"D",
        down:"S",
        special:"shift"
    }),
    newPlayer("green",0,{
        left:"left",
        up:"up",
        right:"right",
        down:"down",
        special:"enter"
    }),
    newPlayer("indigo",0,{
        left:"F",
        up:"T",
        right:"H",
        down:"G",
        special:"space"
    }),
];
for(let id=0;id<players.length;id++){
    players[id].ID = id;
}
//Setting up the control-schemes and gameplay
function clamp(num,min,max){
    if(num < min) return min;
    if(max < num) return max;
    return num;
}
function inRange(num,min,max){
    return (num >= min)&&(num <= max);
}
var sqrt1_2 = Math.SQRT1_2;
function control(p){
    let oldX = p.x;
    let oldY = p.y;
    p.touching = [];
    for(let i=0;i<players.length;i++){
        if(p.ID==i)continue;
        let pT = players[i];
        if(p.ID>i){ // If pT's coords were already done this frame, undo them for this calculation
            p.touching[i] = inRange(p.x-pT.x+pT.dX,-16,16) && inRange(p.y-pT.y+pT.dY,-16,16);
        }else{
            p.touching[i] = inRange(p.x-pT.x      ,-16,16) && inRange(p.y-pT.y      ,-16,16);
        }
    }
    var dX = keyDown(p.right)-keyDown(p.left);
    var dY = keyDown(p.down) -keyDown(p.up);
    var spec = keyDown(p.special);
    switch(p.color){
        case "red":
        default:
            p.dX = dX*(spec ? 2 : 4); //The ability to slow down. STAGGERING
            p.dY = dY*(spec ? 2 : 4);
            break;
        case "orange":
            switch(p.variant){
                case 0: //Meme controls
                default:
                    p.dX += dX*0.2;
                    p.dY += dY*0.2;
                    break;
                case 1: //Actual fucking controls
                    p.dX = (p.dX*15 + dX*6)/16; //Dunno why I thought of doing it like this, but it controls surprisingly well. Too well...
                    p.dY = (p.dY*15 + dY*6)/16;
                    break;
            }
            break;
        case "yellow":
            p.dX = dX*4; //Implementing parriage is gonna be fuuuuuuuuuuuuuuuuucking awful.
            p.dY = dY*4;
            p.cool--;
            if(spec && p.cool<=-50){ //30 FPS, (50+10)/30 = 2 sec cooldown
                p.cool = 10;
            }
            break;
        case "green":
            p.dX = dX*4; //Green is not a creative color.
            p.dY = dY*4; //I'll do it later
            
            break;
        case "blue":
            let dXY = (dX&&dY) ? sqrt1_2 : 1;
            p.cool--;
            if(spec && p.cool<=-140){ //30 FPS, (140+10)/30 = 5 sec cooldown
                p.cool=10;
                p.dX = p.dX*5; //Dashing around at the speed of 15 pixels/frame
                p.dY = p.dY*5;
            }else if(p.cool<=0){
                p.dX = dX*dXY*3;
                p.dY = dY*dXY*3;
            }
            break;
        case "indigo":
            p.dX = dX*4;
            let carryID = -1;
            let carryY = 1000;
            for(let i=0;i<players.length;i++){ //We find the highest possible carrier that isn't too high that you can't stand on it
                if(i == p.ID || !p.touching[i]) continue;
                let pT = players[i];
                if(pT.y < carryY && p.y < pT.y-7 && (p.carryID==-1 || pT.y < players[p.carryID].y)){
                    carryY = pT.y;
                    carryID = i;
                }
            }
            let oldCarry = p.carryID;
            p.carryID = carryID==-1 ? p.carryID : carryID;
            if(p.carryID != oldCarry){
                p.carryX = p.x-players[p.carryID].x;
            }
            if(dY == 1) p.carryID = -1; //Holding down lets you cancel being carried, guaranteed
            p.ground = p.y == 584 || p.carryID > -1;
            if(dY != -1 && p.dY < -2 ){
                p.dY = -2;
            }
            if(!p.ground){ //This is gravity, designed to mirror Undertale very fucking closely. Yes, I stole the code. Sue me.
                if(p.dY <= -4){ //Remember that up is negative and down is positive, and it makes a lot more sense.
		            p.dY += 0.1;
	            }else if(p.dY > -4 && p.dY <= -1){
	            	p.dY += 0.25;
	            }else if(p.dY > -1 && p.dY <= 0.5){
	            	p.dY += 0.1;
	            }else if(p.dY > 0.5 && p.dY < 8.5){
	            	p.dY += 0.3;
	            }
            }else{
                p.dY = 0;
                if(p.carryID > -1){ //Assigns your location based on your carrier's location.
                    let pT = players[p.carryID];
                    p.dX = 0;
                    p.dY = 0;
                    p.carryX = clamp(p.carryX+dX*2,-10,10); //Lets you move a little bit while being carried
                    p.y = pT.y-16;
                    p.x = pT.x+p.carryX;
                    
                    if(p.y<=0){
                        let recID = p.carryID;
                        for(let i = 16;true;i+=16){
                            players[recID].y = i;
                            players[recID].dY = 0;
                            recID = players[recID].carryID;
                            if(recID === undefined || recID === -1) break;
                        }
                    }
                }
                if(dY==-1){ //Jump
                    p.dY = -6;
                    p.carryID = -1;
                    p.ground = false;
                }
            }
            if(p.carryID > p.ID){ //We need any carried players to be calculated after the carrier, so we put them at the end of the player list
                players.push(p); //Put it at the end
                players.splice(p.ID,1); //Remove it from where it was
                players[p.ID].redo = true; //Fixes player skipping
                p.carryID--;
                for(let i=p.ID;i<players.length;i++){ //Reassign all the IDs
                    players[i].ID = i;
                }
                p.done = true; //Don't re-update the same soul
            }
            break;
        case "violet":
            if(dY && dX){ //Latest is true when dY was the last direction used
                p.dX = p.latest ? dX*4 : 0;
                p.dY = p.latest ? 0 : dY*4;
            }else{
                p.latest = dX == 0;
                p.dX = dX*4;
                p.dY = dY*4;
            }
            break;
    }
    p.x += p.dX;
    p.y += p.dY;
    p.x = clamp(p.x,0,784);
    p.y = clamp(p.y,0,584);
    if(p.x == oldX) p.dX = 0;
    if(p.y == oldY) p.dY = 0;
}
//Enemy shit
var bone = new Bone(sData.bone,255,255,255,1);
//And now we ROLL.
var round = Math.round;
ctx0.fillStyle = "#000000";
ctx0.fillRect(0,0,800,600);
var pi2 = Math.PI*2;
var tick=0;
function frame(){
    for(let id=0;id<players.length;id++){
        let p=players[id];
        if(!p.done){
            control(p);
            p.done = false;
        }
        if(p.redo){ //Fixes the player-skipping bug
            id--;
            p.redo = false;
            continue;
        }
    }
    ctx1.clearRect(0,0,800,600);
    for(let id=0;id<players.length;id++){
        let p = players[id];
        
        drawImgBlend(ctx1,p.sprite,round(p.x),round(p.y),id+1);
        
        if(p.color == "yellow" && p.cool>0){
            ctx1.strokeStyle = "#FFFF00";
            ctx1.beginPath();
            ctx1.arc(p.x+8,p.y+8,25-p.cool*2,0,pi2);
            ctx1.stroke();
        }
    }
    bone.setRGBA(tick%255,tick%255,255,1);
    for(let i=0;i<50;i++){
        bone.draw(ctx1,100+i*10,100+(i+tick)%100,200-((i+tick)%100)*2);
    }
    bone.draw(ctx1,100,195,500,true); //If sixth arg is true, sideways
    
    tick++;
    window.requestAnimationFrame(frame);
}
window.requestAnimationFrame(frame);