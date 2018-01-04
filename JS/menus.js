"use strict";
{ //Start scope

const canvasF = document.createElement('canvas');
const winWidth = canvasF.width = window.screen.width;
const winHeight= canvasF.height= window.screen.height;
const ctxF = canvasF.getContext('2d');
ctxF.textBaseline = "top";

var MenuCanvas = class{
    constructor(heirarchy){
        this.heirarchy = heirarchy || {
            name: "Menu",
            backColor: "rgba(255,0,0,1)",
            forecolor: "rgba(0,0,0,1)",
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
        const isOpen = function(mother){
            return mother.open && mother.children && mother.children.length>0;
        };
        let hOffset = 0;
        let level = 0;
        let maxWidth = 0;
        const drawMother = function(mother){
            const backColor = mother.backColor||"rgba(0,0,0,1)";
            const foreColor = mother.forecolor||"rgba(255,255,255,1)";
            ctxF.fillStyle = backColor;
            ctxF.fillRect(level*10,hOffset,mother.width,mother.height||fontSize);
            ctxF.fillStyle = foreColor;
            fillText(mother.name,level*10+8,hOffset);
            if(mother.toggled !== undefined){
                const h = mother.height;
                ctxF.fillStyle = foreColor;
                ctxF.fillRect(level*10+mother.width-h*7/8,hOffset+h/8,h*3/4,h*3/4);
                ctxF.fillStyle = backColor;
                ctxF.fillRect(level*10+mother.width-h*3/4,hOffset+h/4,h  /2,h  /2);
                if(mother.toggled){
                    ctxF.fillStyle = foreColor;
                    ctxF.fillRect(level*10+mother.width-h*5/8,hOffset+h*3/8,h/4,h/4);
                }
            }
            if(mother.width>maxWidth) maxWidth = mother.width;
            hOffset += mother.height;
            if(isOpen(mother)){
                level++;
                const ch = mother.children;
                for(let i=0;i<ch.length;i++){
                    drawMother(ch[i]);
                }
                level--;
            }
        };
        this.draw = function(){
            ctxF.font = fontCSS;
            ctxF.clearRect(0,0,winWidth,winHeight);
            canvasF.width = winWidth;
            canvasF.height= winHeight;
            drawMother(this.heirarchy);
            if(maxWidth>winWidth) maxWidth = winWidth;
            if(hOffset>winHeight) hOffset = winHeight;
            canvas.width = canvasF.width = maxWidth;
            canvas.height= canvasF.height = hOffset;
            ctx.clearRect(0,0,hOffset,maxWidth);
            ctx.drawImage(canvasF,0,0);
            maxWidth = 0;
            hOffset = 0;
            level = 0;
        };
        this.draw();
        
        let btn;
        const whichButton = function(mother,x,y){
            btn = mother;
            hOffset += mother.height;
            if(hOffset>y)  return;
            if(isOpen(mother)){
                level++;
                const ch = mother.children;
                for(let i=0;i<ch.length;i++){
                    whichButton(ch[i],y);
                    if(hOffset>y) return;
                }
                level--;
            }
        };
        document.addEventListener("click",(e)=>{
            if(e.target!==canvas) return;
            const x = e.pageX-canX;
            const y = e.pageY-canY;
            whichButton(this.heirarchy,x,y);
            const indent = level*10;
            if(indent<=x && x<=(indent+btn.width)){
                const hit = x > indent+btn.width-btn.height;
                if((btn.toggled===undefined || !hit) && btn.onclick){
                    btn.onclick(btn,this.heirarchy);
                }
                if(btn.toggled!==undefined && hit){
                    if(btn.ontoggle) btn.ontoggle(btn,this.heirarchy);
                    btn.toggled = !btn.toggled;
                }
                else btn.open = !btn.open;
            }
            btn = undefined;
            hOffset = 0;
            level = 0;
            this.draw();
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        
        document.body.appendChild(canvas);
    }
};

} //End of scope