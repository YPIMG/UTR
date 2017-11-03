"use strict";
/*global imgShadow,sprites,drawImgBlend,Bone,MonoFont,WidthFont */ //sprites.js
/*global DataChannel*/ //DataChannel API
//canvas setup
var canvas0  = document.getElementById('canvas0');
var canvas1  = document.getElementById('canvas1');
var canvasH0 = document.getElementById('HUD0');
var canvasH1 = document.getElementById('HUD1');
var canvasS0 = document.getElementById('screen0');
var ctx0  = canvas0 .getContext('2d');
var ctx1  = canvas1 .getContext('2d');
var ctxH0 = canvasH0.getContext('2d');
var ctxH1 = canvasH1.getContext('2d');
var ctxS0 = canvasS0.getContext('2d');
ctx0 .imageSmoothingEnabled = false;
ctx1 .imageSmoothingEnabled = false;
ctxH0.imageSmoothingEnabled = false;
ctxH1.imageSmoothingEnabled = false;
ctxS0.imageSmoothingEnabled = false;
//Keyboard handling
var prKeys={};
window.onkeydown=function(e){
    let k = e.key.toLowerCase();
    prKeys[k] = true;
    prKeys[k+","+e.location] = true;
    e.preventDefault();
    e.stopPropagation();
    return false;
};
window.onkeyup=function(e){
    let k = e.key.toLowerCase();
    delete prKeys[k];
    delete prKeys[k+","+e.location];
};
window.onblur=function(){
    prKeys=[];
};
var keyConv = {
    control:"control",
    ctrl:"control",
    alt:"alt",
    left:"arrowleft",
    up:"arrowup",
    right:"arrowright",
    down:"arrowdown",
    enter:"enter",
    shift:"shift",
    escape:"escape",
    esc:"escape",
    backspace:"backspace",
    delete:"delete",
    del:"delete",
    space:" ",
    spacebar:" ",
};
function isKeyDown(k){
    k = k.toLowerCase();
    let l = k.split(",");
    if(k.charAt(0) == ","){
        l[1] = l[2];
        l[0] = ",";
    }
    let key = keyConv[l[0]] || l[0];
    if(l[1]) key = key + "," + l[1];
    return prKeys[key]||false;
}
//Using mouse events for another control scheme on canvas1

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
function newPlayer(p={}){
    let newP = {
        color:p.color||"red",id:p.id||(""+Date.now()+Math.floor(Math.random()*1000)),
        css:"rgb(255,66,66)",sprite:sprites.defHeart,
        mouse:p.mouse||false,
        dX:p.dX||0,dY:p.dY||0,
        x:p.x||0,y:p.y||0,
        maxHP:p.maxHP||20,
        maxInv:p.maxInv||20,
        user:p.user,input:{
            dX:0,dY:0,spec:false
        },
        touching:[]
    };
    if(!(p.user || p.mouse)){
        newP.left = p.left||"left";
        newP.up = p.up||"up";
        newP.right = p.right||"right";
        newP.down = p.down||"down";
        newP.special = p.special||"shift";
    }
    let c = colors[p.color||"red"];
    if(c){
        newP.css = c;
        newP.sprite = imgShadow(sprites.heart,c);
    }
    switch(newP.color){
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
            newP.carryInd = -1;
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
    newPlayer({
        color:window.prompt("Player 1 Color"),
        left:"A",
        up:"W",
        right:"D",
        down:"S",
        special:"space"
    }),
    newPlayer({
        color:window.prompt("Player 2 Color"),
        left:"left",
        up:"up",
        right:"right",
        down:"down",
        special:"enter"
    }),
];
//Handling online FUCKING MULTIPLYER BIATCHES
var channel = new DataChannel();
var isOn = false;
var user2id = {};
var id2index = {};
function updateId2Index(){
    id2index = {};
    let len = players.length;
    for(let i=0;i<len;i++){
        id2index[players[i].id] = i;
    }
}
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
                let ps = msg.ps;
                console.log("Got players from "+user);
                len = ps.length;
                user2id[user] = [];
                for(let i=0;i<len;i++){
                    let p = ps[i];
                    if(p.user) continue;
                    p.user = user;
                    user2id[user].push(p.id);
                    players.push(newPlayer(p));
                }
                updateId2Index();
                initHUD();
                break;
            case "input": // msg = {type,id,input,sync,x,y,dX,dY}
                let p = players[id2index[msg.id]];
                p.input = msg.input;
                if(msg.sync){
                    p.x  = msg.x;
                    p.y  = msg.y;
                    p.dX = msg.dX;
                    p.dY = msg.dY;
                }
                break;
        }
    };
    channel.onleave = function(user){
        console.log(user+" left.");
        let ids = user2id[user];
        let len = ids.length;
        for(let i=0;i<len;i++){
            players.splice(id2index[ids[i]],1);
        }
        delete user2id[user];
        updateId2Index();
        initHUD();
    };
    setTimeout(()=>{
        channel.send({type:"sendPlayers"});
    },300);
};
let room = window.prompt("If you're playing online, type a room name.");
if(room && window.confirm("If you're the first in the room, hit OK.")){
    channel.open(room);
}else if(room){
    channel.connect(room);
}
//Setting up the control-schemes and gameplay
var clamp = function(num,min,max){
    if(num < min) return min;
    if(num > max) return max;
    return num;
};
function inRange(num,min,max){
    return (num >= min)&&(num <= max);
}
function inRangeEx(num,min,max){
    return (num > min) && (num < max);
}
var sqrt1_2 = Math.SQRT1_2;
function controlPlayer(p,index){
    let oldX = p.x;
    let oldY = p.y;
    let dX,dY,spec;
    let inp = p.input;
    if(p.user){
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
        if(isOn){
            if(tick%30 == 0){ //Every second, force a sync
                channel.send({type:"input",id:p.id,input:inp,sync:true,x:p.x,y:p.y,dX:p.dX,dY:p.dY});
            }else if((oldDX != dX || oldDY != dY || oldSpec != spec)){
                channel.send({type:"input",id:p.id,input:inp});
            }
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
            if((p.x+p.dX) > 784){
                p.x = 784*2-p.x;
                p.dX *= -0.95;
            }if((p.x+p.dX) < 0){
                p.x = -p.x;
                p.dX *= -0.95;
            }
            if((p.y+p.dY) > 584){
                p.y = 584*2-p.y;
                p.dY *= -0.95;
            }if((p.y+p.dY) < 0){
                p.y = -p.y;
                p.dY *= -0.95;
            }
            break;
        case "yellow": //Implementing parriage is gonna be fuuuuuuuuuuuuuuuuucking awful.
            p.dX = dX*4;
            p.dY = dY*4;
            p.cool--;
            if(spec && p.cool<=-50){ //30 FPS, (50+10)/30 = 2 sec cooldown
                p.cool = 10;
            }
            break;
        case "green": //Green is not a creative color.
            p.dX = dX*4;
            p.dY = dY*4;
            
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
            let carryInd = -1;
            let carryY = 1000;
            for(let i=0;i<players.length;i++){ //We find the highest possible carrier that isn't too high that you can't stand on it
                if(i == index || !p.touching[i]) continue;
                let pT = players[i];
                if(pT.y < carryY && p.y < pT.y-7 && (p.carryInd==-1 || pT.y < players[p.carryInd].y)){
                    carryY = pT.y;
                    carryInd = i;
                }
            }
            let oldCarry = p.carryInd;
            p.carryInd = carryInd==-1 ? p.carryInd : carryInd;
            if(p.carryInd != oldCarry){
                p.carryX = p.x-players[p.carryInd].x;
            }
            if(spec || (dY == 1)) p.carryInd = -1; //Cancel being carried by holding special or down, guaranteed
            p.ground = p.y == 584 || p.carryInd > -1;
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
                if(dY==-1){ //Jump
                    p.dY = -6;
                    p.carryInd = -1;
                    p.ground = false;
                }else if(p.carryInd > -1){ //Assigns your location based on your carrier's location.
                    p.dX = 0;
                    p.dY = 0;
                    p.carryX = clamp(p.carryX+dX*2,-10,10); //Lets you move a little bit while being carried
                    let pT = players[p.carryInd];
                    p.y = pT.y-16;
                    p.x = pT.x+p.carryX;
                    
                    if(p.y<=0){
                        let recID = p.carryInd;
                        for(let i = 16;true;i+=16){
                            players[recID].y = i;
                            players[recID].dY = 0;
                            recID = players[recID].carryInd;
                            if(!(recID > -1)) break;
                        }
                    }
                }
            }
            if(p.carryInd > index){ //We need any carried players to be calculated after the carrier, so we put them at the end of the player list
                players.push(p); //Put it at the end
                players.splice(index,1); //Remove it from where it was
                players[index].done = false; //Fixes player skipping
                p.carryInd--;
                updateId2Index(); //Make sure to not fuck up the syncage
                initHUD();
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
ctxH1.textBaseline = ctxH0.textBaseline = "top"; //I like printing text using a top-right corner, thank you very much
function initHUD(){
    ctxH0.fillStyle = "rgb(40,40,40)";
    ctxH0.fillRect(0,0,480,360);
    ctxH1.clearRect(0,0,480,360);
    for(let i=0;i<players.length;i++){
        let p = players[i];
        ctxH0.fillStyle = p.css;
        ctxH0.fillRect(0,i*30,480,30);
        ctxH0.fillStyle = "rgb(0,0,0)";
        ctxH0.fillRect(160,i*30+5,ceil(p.maxHP*1.2),21);
        ctxH1.fillStyle = "rgb(255,255,255)";
        ctxH1.fillRect(160,i*30+5,ceil(p.hp*1.2),21);
        cunnie.fillText(ctxH0,p.color,10,i*30+5,3);
        wonder.fillText(ctxH0,"HP",132,i*30+10,1);
        cunnie.fillText(ctxH1,`${p.hp}/${p.maxHP}`,220,i*30+5,3);
    }
}
initHUD();
function firstBattleF(){
    let bone = new Bone();
    curBattleFrame = (time)=>{
        for(let i=0;i<60;i++){
            let draw = true;
            let r = {
                x:100+i*10,y:100,
                w:10,h:100+((i+tick)%100)*3
            };
            for(let i=0;i<players.length;i++){
                let p=players[i];
                let m = {
                    x:p.x-p.dX,w:16+p.dX
                };
                if(p.dX<0){
                    m.w = 16-p.dX;
                    m.x = p.x;
                }
                if(inRange(r.x-m.x,-r.w,m.w)){
                    draw = false;
                    break;
                }
            }
            if(draw) bone.draw(ctx1,r.x,r.y,r.h);
        }
    };
}
curBattleFrame = firstBattleF;
function doBattleFrame(time){ //Okay, *NOW* we roll
    tick++;
    if(tick%30 == 0){
        
    }
    let oldHP = [];
    let plen = players.length;
    for(let index=0;index<plen;index++){
        let p = players[index];
        p.touching.length = 0;
        for(let i=0;i<plen;i++){
            if(i == index) continue;
            let pT = players[i];
            p.touching[i] = inRange(p.x-pT.x,-16,16) && inRange(p.y-pT.y,-16,16);
        }
    }
    for(let i=0;i<plen;i++){
        let p=players[i];
        oldHP.push(p.hp);
        while(!p.done){
            p.done = true;
            controlPlayer(p,i);
        }
        p.done = false;
    }
    ctx1.clearRect(0,0,800,600);
    for(let i=0;i<plen;i++){
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
    for(let i=0;i<plen;i++){
        let p = players[i];
        if(oldHP[i] != p.hp){
            ctxH1.clearRect(160,i*30+5,500,21);
            ctxH1.fillStyle = "rgb(255,255,255)";
            ctxH1.fillRect(160,i*30+5,ceil(p.hp*1.2),21);
            cunnie.fillText(ctxH1,`${p.hp}/${p.maxHP}`,220,i*30+5,3);
        }
    }
    window.requestAnimationFrame(doBattleFrame);
}
window.requestAnimationFrame(doBattleFrame);