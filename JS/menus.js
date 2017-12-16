"use strict";
{ //Start scope

const fakeCanvas = document.createElement('canvas');
const ctxF = fakeCanvas.getContext('2d');
ctxF.textBaseline = "top";

var MenuCanvas = class{
    constructor(heirarchy){
        this.heirarchy = heirarchy || {
            name: "menu",
            backColor: "rgba(255,0,0,1)",
            textColor: "rgba(0,0,0,1)",
            height:20, width:100,
            children: [],
            open: false
        };
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.style.cssText = "position:absolute; left:0px; top:0px;";
        let canX=0,canY=0;
        canvas.setPosition = this.setPos = function(newX,newY){
            canX = newX;
            canY = newY;
            canvas.style.left= canX+"px";
            canvas.style.top = canY+"px";
        };
        let fontCSS = "20px Comic Sans";
        let fontIsFunc = false;
        let fontSize = 20;
        let fontFunc;
        this.setFont = function(newFont,newSize){
            fontIsFunc = (typeof newFont)=="function";
            fontSize = newSize;
            if(fontIsFunc) fontFunc = newFont;
            else fontCSS = `${newSize}px ${newFont}`;
        };
        const fillText = function(text,x,y){
            if(fontIsFunc) fontFunc(ctxF,text,x,y,fontSize,ctxF.fillStyle);
            else ctxF.fillText(text,x,y);
        };
        let hOff = 0;
        let lvl = 0;
        let maxWidth = 0;
        const isOpen = function(mother){
            return (mother.open || !mother.canClose) && mother.children && mother.children.length>0;
        };
        const drawMother = function(mother){
            const backColor = mother.backColor||"rgba(0,0,0,1)";
            const textColor = mother.textColor||"rgba(255,255,255,1)";
            ctxF.fillStyle = backColor;
            ctxF.fillRect(lvl*10,hOff,mother.width,fontSize);
            ctxF.fillStyle = textColor;
            fillText(` ${mother.name}`,lvl*10,hOff);
            if(mother.toggled !== undefined){
                const h = mother.height;
                ctxF.fillStyle = textColor;
                ctxF.fillRect(lvl*10+mother.width-h*7/8,hOff+h/8,h*3/4,h*3/4);
                ctxF.fillStyle = backColor;
                ctxF.fillRect(lvl*10+mother.width-h*3/4,hOff+h/4,h  /2,h  /2);
                if(mother.toggled){
                    ctxF.fillStyle = textColor;
                    ctxF.fillRect(lvl*10+mother.width-h*5/8,hOff+h*3/8,h/4,h/4);
                }
            }
            if(mother.width>maxWidth) maxWidth = mother.width;
            hOff += mother.height;
            if(isOpen(mother)){
                lvl++;
                const ch = mother.children;
                for(let i=0;i<ch.length;i++){
                    drawMother(ch[i]);
                }
                lvl--;
            }
        };
        this.draw = function(){
            ctxF.font = fontCSS;
            drawMother(this.heirarchy);
            canvas.height = hOff;
            canvas.width = maxWidth;
            ctx.clearRect(0,0,hOff,maxWidth);
            ctx.drawImage(fakeCanvas,0,0);
            maxWidth = 0;
            hOff = 0;
            lvl = 0;
        };
        this.draw();
        
        let btn;
        const whichButton = function(mother,x,y){
            hOff += mother.height;
            if(isOpen(mother)){
                lvl++;
                btn = mother.children;
                for(let i=0;i<btn.length;i++){
                    if(hOff > y) return;
                    whichButton(btn[i],y);
                }
                lvl--;
            }
        };
        document.addEventListener("click",(e)=>{
            if(e.target!==canvas) return;
            const x = e.pageX-canX;
            const y = e.pageY-canY;
            whichButton(this.heirarchy,x,y);
            if(lvl*10 <= x){
                const hit = x > lvl*10+btn.width-btn.height;
                if((btn.toggled===undefined || hit) && btn.function) btn.function(btn);
                if(btn.toggled!==undefined && hit) btn.toggled = !btn.toggled;
                else btn.open = !btn.open;
            }
            btn = undefined;
            hOff = 0;
            lvl = 0;
        });
        
        document.body.appendChild(canvas);
    }
};

} //End of scope