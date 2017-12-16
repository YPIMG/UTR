"use strict";
{ //Start of scope

var JoystickCanvas = class{ //I apply functions within the constructor because I want private variables.
    constructor(d=200,sections=8,rot=true,snap=sections!=1){
        if(sections < 1) throw new RangeError("Not enough sections");
        if(sections%1 !== 0) throw new RangeError("Invalid amount of sections");
        rot = rot ? Math.PI/sections : 0;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.style.cssText = "position:absolute; left:0px; top:0px;";
        canvas.width = d;
        canvas.height= d;
        let canX=0,canY=0;
        canvas.setPosition = this.setPos = function(newX,newY){
            canX = newX;
            canY = newY;
            canvas.style.left= canX+"px";
            canvas.style.top = canY+"px";
        };
        this.setDiameter = function(newD){
            d = newD;
            canvas.width = d;
            canvas.height = d;
        };
        this.x = 0;
        this.y = 0;
        this.pressed = false;
        this.section = -1;
        const thresholds = [];
        const sectionPos = [[d/2+(rot ? d/4 : Math.cos(-Math.PI/sections)*d/4),d/2+(rot ? 0 : Math.sin(-Math.PI/sections)*d/4)]];
        const drawPos = [[d/2+(rot ? Math.cos(-Math.PI/sections)*d/2 : d/4),d/2+(rot ? Math.sin(-Math.PI/sections)*d/2 : 0)]];
        for(let i=1;i<sections;i++){
            thresholds[i] = 2*Math.PI*i/sections;
            if(snap){
                let a1 = 2*Math.PI*(i-(rot ? 0 : 0.5))/sections;
                let a2 = 2*Math.PI*(i-(rot ? 0.5 : 0))/sections;
                sectionPos[sections-i] = [d/2+Math.cos(a1)*d/4,d/2+Math.sin(a1)*d/4];
                drawPos[sections-i]    = [d/2+Math.cos(a2)*d/2,d/2+Math.sin(a2)*d/2];
            }
        }
        const drawStick = (x,y)=>{
            ctx.clearRect(0,0,d,d);
            ctx.fillStyle = "rgba(127,0,0,1)";
            ctx.beginPath();
            ctx.arc(d/2,d/2,d/2,0,2*Math.PI);
            ctx.fill();
            ctx.strokeStyle = "rgba(0,255,255,1)";
            ctx.beginPath();
            for(let i=0;i<sectionPos.length;i++){
                ctx.moveTo(d/2,d/2);
                ctx.lineTo(drawPos[i][0],drawPos[i][1]);
            }
            ctx.stroke();
            ctx.fillStyle = "rgba(127,127,127,1)";
            ctx.beginPath();
            ctx.arc(d/2,d/2,d/6,0,2*Math.PI);
            ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,1)";
            ctx.beginPath();
            ctx.arc(x,y,d/9,0,2*Math.PI);
            ctx.fill();
        };
        const doJoystick = (e)=>{
            this.x = e.pageX-canX - d/2;
            this.y = e.pageY-canY - d/2;
            const dist = Math.sqrt(this.x*this.x+this.y*this.y);
            if(dist < d/6){
                this.section = -1;
                drawStick(d/2,d/2);
                return;
            }
            if(!snap){
                this.section = 0;
                drawStick(d/2+d*this.x/dist/4,d/2+d*this.y/dist/4);
                return;
            }
            const oldSec = this.section;
            let angle = Math.atan2(this.y,this.x)-rot;
            if(angle < 0) angle += 2*Math.PI;
            angle = 2*Math.PI-angle;
            this.section = sections-1;
            for(let i=1;i<sections;i++){
                if(angle < thresholds[i]){
                    this.section = i-1;
                    break;
                }
            }
            if(this.section !== oldSec) drawStick(sectionPos[this.section][0],sectionPos[this.section][1]);
        };
        document.addEventListener("mousedown",(e)=>{
            if(e.target!==canvas) return;
            if((e.pageX-canX - d/2)**2+(e.pageY-canY - d/2)**2 > d*d/4) return;
            this.pressed = true;
            doJoystick(e);
        });
        document.addEventListener("mouseup",(e)=>{
            this.pressed = false;
            this.section = -1;
            drawStick(d/2,d/2);
        });
        document.addEventListener("mousemove",(e)=>{
            if(this.pressed){
                doJoystick(e);
            }
        });
        drawStick(d/2,d/2);
        document.body.appendChild(canvas);
    }
};

} //End of scope