"use strict";
/*global imgShadow,sprites,drawImgBlend,Bone,MonoFont,WidthFont */ //sprites.js
/*global DataChannel*/ //DataChannel API
//canvas setup
var canvas0  = document.getElementById('canvas0');
var canvas1  = document.getElementById('canvas1');
var canvasH0 = document.getElementById('HUD0');
var canvasH1 = document.getElementById('HUD1');
var ctx0  = canvas0 .getContext('2d');
var ctx1  = canvas1 .getContext('2d');
var ctxH0 = canvasH0.getContext('2d');
var ctxH1 = canvasH1.getContext('2d');
ctx0 .imageSmoothingEnabled = false;
ctx1 .imageSmoothingEnabled = false;
ctxH0.imageSmoothingEnabled = false;
ctxH1.imageSmoothingEnabled = false;
//Keyboard handling
var prKeys={};
window.onkeydown=function(e){
    prKeys[e.key] = true;
    prKeys[e.key+","+e.location] = true;
    e.preventDefault();
    e.stopPropagation();
    return false;
};
window.onkeyup=function(e){
    delete prKeys[e.key];
    delete prKeys[e.key+","+e.location];
};
window.onblur=function(){
    prKeys=[];
};
var keyConv = {
    enter:"Enter",
    shift:"Shift",
    space:" ",
    control:"Control",
    ctrl:"Control",
    left:"ArrowLeft",
    up:"ArrowUp",
    right:"ArrowRight",
    down:"ArrowDown"
};
function isKeyDown(k){
    let l = k.split(',');
    if(k.charAt(0) == ","){
        l[1] = l[0];
        l[0] = ",";
    }
    let key = keyConv[l[0].toLowerCase()] || l[0].toLowerCase();
    if(l[1]) key = key + "," + l[1];
    return prKeys[key]||false;
}
//Making players and their sprites
var colors = { //The pallets of the standard 7 colors; keep in mind the default heart is its own color: pink
    red:"rgb(255,0,0)",
    orange:"rgb(252,166,0)",
    yellow:"rgb(255,255,0)",
    green:"rgb(0,192,0)",
    blue:"rgb(66,226,255)",
    indigo:"rgb(0,60,255)",
    violet:"rgb(213,53,217)"
};
function newPlayer(color,p={},online=false){
    let newP;
    if(online){
        newP = {
            color:color||p.color||"red",id:p.id,
            x:p.x||0,y:p.y||0,
            maxHP:p.maxHP,
            maxInv:p.maxInv,
            hp:p.hp||p.maxHP,
            inv:p.inv||p.maxInv,
            online:true,input:{
                dX:0,dY:0,spec:false
            }
        };
        let c = colors[newP.color];
        if(c){
            newP.css = c;
            newP.sprite = imgShadow(sprites.heart,c);
        }else{
            newP.css = "rgb(255,66,66)";
            newP.sprite = sprites.defHeart;
        }
        return newP;
    }
    p.id = p.id||(""+Date.now()+Math.floor(Math.random()*100000));
    newP = {
        color:color||p.color||"red",id:p.id,
        left:p.left||"left",
        up:p.up||"up",
        right:p.right||"right",
        down:p.down||"down",
        special:p.special||"shift",
        dX:p.dX||0,dY:p.dY||0,
        x:p.x||0,y:p.y||0,
        online:false,input:{
            dX:0,dY:0,spec:false
        },
        touching:[]
    };
    let c = colors[newP.color];
    if(c){
        newP.css = c;
        newP.sprite = imgShadow(sprites.heart,c);
    }else{
        newP.css = "rgb(255,66,66)";
        newP.sprite = sprites.defHeart; //Default heart
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
    newP.maxHP = p.maxHP||20,
    newP.maxInv = p.maxInv||20,
    newP.hp = newP.maxHP;
    newP.inv= newP.maxInv;
    newP.online = false;
    return newP;
}
var players=[
    newPlayer(window.prompt("What colour do you wanna be?")||"red",{
        left:"A",
        up:"W",
        right:"D",
        down:"S",
        special:"shift,1"
    }),
];
//Handling online FUCKING MULTIPLYER BIATCHES
var channel = new DataChannel();
var isOn = false;
var user2id = {};
channel.onopen = ()=>{
    isOn = true;
    channel.onmessage = function(msg,user){
        let len;
        switch(msg.type){
            case "sendPlayers": // msg = {type}
                console.log("Sending players to "+user);
                channel.send({type:"newPlayers",ps:players});
                break;
            case "newPlayers": // msg = {type,ps}
                console.log("Got players from "+user+": "+msg.ps);
                len = msg.ps.length;
                user2id[user] = [];
                for(let i=0;i<len;i++){
                    user2id[user].push(msg.ps[i].id);
                    players.push(newPlayer(undefined,msg.ps[i],true));
                }
                initHUD();
                break;
            case "input": // msg = {type,id,input}
                len = players.length;
                for(let i=0;i<len;i++){
                    let p = players[i];
                    if(p.id == msg.id){
                        p.input = msg.input;
                        break;
                    }
                }
                break;
        }
    };
    channel.onleave = function(user){
        console.log(user+" left.");
        let len = players.length;
        let ids = user2id[user];
        for(let i=0;i<len;i++){
            if(ids.includes(players[i].id)) players.splice(i,1);
        }
        initHUD();
    };
    setTimeout(()=>{
        channel.send({type:"sendPlayers"});
    },300);
};
let room = window.prompt("If you're playing online, type a room name.");
if(room && window.confirm("If you're the first in the room, hit OK.")){
    channel.open(room);
}else{
    channel.connect(room);
}
//Setting up the control-schemes and gameplay
var clamp = function(num,min,max){
    if(num < min) return min;
    if(max < num) return max;
    return num;
};
function inRange(num,min,max){
    return (num >= min)&&(num <= max);
}
var sqrt1_2 = Math.SQRT1_2;
function controlPlayer(p,id){
    let oldX = p.x;
    let oldY = p.y;
    p.touching = [];
    for(let i=0;i<players.length;i++){
        if(id==i)continue;
        let pT = players[i];
        if(id>i){ // If pT's coords were already done this frame, undo them for this calculation
            p.touching[i] = inRange(p.x-(pT.x-pT.dX),-16,16) && inRange(p.y-(pT.y-pT.dY),-16,16);
        }else{
            p.touching[i] = inRange(p.x- pT.x       ,-16,16) && inRange(p.y- pT.y       ,-16,16);
        }
    }
    let dX,dY,spec;
    let inp = p.input;
    if(p.online){
        dX = inp.dX;
        dY = inp.dY;
        spec = inp.spec;
    }else{
        let oldDX = inp.dX;
        let oldDY = inp.dY;
        let oldSpec = inp.spec;
        dX = inp.dX = isKeyDown(p.right)-isKeyDown(p.left);
        dY = inp.dY = isKeyDown(p.down) -isKeyDown(p.up);
        spec = inp.spec = isKeyDown(p.special);
        if((isOn) && (oldDX != dX || oldDY != dY || oldSpec != spec)){
            channel.send({type:"input",id:p.id,input:inp});
        }
    }
    switch(p.color){
        case "red":
        default:
            p.dX = dX*(spec ? 2 : 4); //The ability to slow down. STAGGERING
            p.dY = dY*(spec ? 2 : 4);
            break;
        case "orange":
            p.dX += dX*0.2;
            p.dY += dY*0.2;
            break;
        case "yellow": //Implementing parriage is gonna be fuuuuuuuuuuuuuuuuucking awful.
            p.dX = dX*4;
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
            if(spec && p.cool<=-140 && (dX||dY)){ //30 FPS, (140+10)/30 = 5 sec cooldown
                p.cool=10;
                p.dX = dX*15; //Dashing around at the speed of 15 pixels/frame
                p.dY = dY*15;
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
                if(i == id || !p.touching[i]) continue;
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
            if(p.carryID > id){ //We need any carried players to be calculated after the carrier, so we put them at the end of the player list
                players.push(p); //Put it at the end
                players.splice(id,1); //Remove it from where it was
                players[id].done = false; //Fixes player skipping
                p.carryID--;
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
    p.x = clamp(p.x,0,784); //800-16
    p.y = clamp(p.y,0,584); //600-16
    if(p.x == oldX) p.dX = 0;
    if(p.y == oldY) p.dY = 0;
}
//And now we ROLL.
let round = Math.round;
let ceil = Math.ceil;
let pi2 = Math.PI*2;
var cunnie = new MonoFont();
var wonder = new WidthFont();
var tick=0;
var curBattleFrame = ()=>{};
ctx0.fillStyle = "rgb(0,0,0)";
ctx0.fillRect(0,0,800,600);
function initHUD(){
    ctxH0.fillStyle = "rgb(0,0,0)";
    ctxH0.fillRect(0,0,480,360);
    ctxH1.textBaseline = "top"; //I like printing text using a top-right corner, thank you very much
    for(let i=0;i<players.length;i++){
        let p = players[i];
        ctxH0.fillStyle = p.css;
        ctxH0.fillRect(0,i*30,480,30);
        cunnie.fillText(ctxH1,p.color,10,i*30+5,3);
        wonder.fillText(ctxH1,"HP",132,i*30+10,1);
        ctxH0.fillStyle = "rgb(0,0,0)";
        ctxH0.fillRect(160,i*30+5,ceil(p.maxHP*1.2),21);
        cunnie.fillText(ctxH1,"  /"+p.maxHP,220,i*30+5,3);
    }
}
initHUD();
function firstBattleF(){
    var bone = new Bone();
    curBattleFrame = ()=>{
        for(let i=0;i<60;i++){
            bone.setCSS(`hsl(${((i+tick)*4)%360},100%,50%)`);
            bone.draw(ctx1,100+i*10,100,100+((i+tick)%100)*3);
        }
    };
}
curBattleFrame = firstBattleF;
function doBattleFrame(time){ //Okay, *NOW* we roll
    tick++;
    for(let i=0;i<players.length;i++){
        let p=players[i];
        while(!p.done){
            p.done = true;
            controlPlayer(p,i);
        }
        p.done = false;
    }
    ctx1.clearRect(0,0,800,600);
    for(let i=0;i<players.length;i++){
        let p = players[i];
        drawImgBlend(ctx1,p.sprite,round(p.x),round(p.y),i+1);
        if(p.color == "yellow" && p.cool>0){
            ctx1.strokeStyle = "rgb(255,255,0)";
            ctx1.beginPath();
            ctx1.arc(p.x+8,p.y+8,25-p.cool*2,0,pi2);
            ctx1.stroke();
        }
    }
    curBattleFrame(time);
    for(let i=0;i<players.length;i++){
        let hp = players[i].hp;
        ctxH1.fillStyle = "rgb(255,255,255)";
        ctxH1.fillRect(160,i*30+5,ceil(hp*1.2),21);
        cunnie.fillText(ctxH1,hp,220,i*30+5,3);
    }
    window.requestAnimationFrame(doBattleFrame);
}
window.requestAnimationFrame(doBattleFrame);