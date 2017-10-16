"use strict";
/*global Image,ImageData*/

let fakeCanvas = document.createElement('canvas');
let ctxF = fakeCanvas.getContext('2d');

//Doing it this way lets me dynamically color a sprite
//Highlight a zero to see the sprites easily
var sData = {
    heart:[
        0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,
        0,1,1,1,1,1,0,0,0,0,1,1,1,1,1,0,
        1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,
        0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,
        0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,
        0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,
        0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,
        0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,
    ], defHeart:[
        0,1,1,1,1,1,0,0,0,1,1,1,1,1,0,0,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,
        0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,
        0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,
        0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,
        0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,
    ], bone:{
        top:[
            0,1,1,0,0,0,0,1,1,0,
            1,1,1,1,0,0,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,
            0,1,1,1,1,1,1,1,1,0,
            0,1,1,1,1,1,1,1,1,0,
        ], bottom:[
            0,1,1,1,1,1,1,1,1,0,
            0,1,1,1,1,1,1,1,1,0,
            1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,0,0,1,1,1,1,
            0,1,1,0,0,0,0,1,1,0,
        ], left:[
            0,1,1,1,0,0,
            1,1,1,1,1,1,
            1,1,1,1,1,1,
            0,1,1,1,1,1,
            0,0,1,1,1,1,
            0,0,1,1,1,1,
            0,1,1,1,1,1,
            1,1,1,1,1,1,
            1,1,1,1,1,1,
            0,1,1,1,0,0,
        ], right:[
            0,0,1,1,1,0,
            1,1,1,1,1,1,
            1,1,1,1,1,1,
            1,1,1,1,1,0,
            1,1,1,1,0,0,
            1,1,1,1,0,0,
            1,1,1,1,1,0,
            1,1,1,1,1,1,
            1,1,1,1,1,1,
            0,0,1,1,1,0,
        ],
    },
};
function data2img(data,r=255,g=255,b=255,a=1,x=0,y=0,w=16,h=16){
    let round = Math.round;
    r = round(r);
    g = round(g);
    b = round(b);
    
    let newData = [];
    for(let i=x*w;i<w*h;i++){
        if(i%w<y)continue;
        if(data[i]){
            newData.push(r,g,b,round(a*255));
        }else{
            newData.push(0,0,0,0);
        }
    }
    fakeCanvas.width = w;
    fakeCanvas.height= h;
    ctxF.clearRect(0,0,w,h);
    ctxF.putImageData(new ImageData(new Uint8ClampedArray(newData),w,h),0,0);
    let img = new Image();
    img.src = fakeCanvas.toDataURL();
    return img;
}

function drawImgBlend(ctx,img,x,y){
    let oldAlpha = ctx.globalAlpha;
    let oldComp = ctx.globalCompositeOperation;
    
    ctx.globalAlpha = 1; //Draws the part that doesn't intersect
    ctx.globalCompositeOperation = "destination-over";
    ctx.drawImage(img,x,y);
    
    ctx.globalAlpha = 1/2; //Draws the part that intersects, and blends it
    ctx.globalCompositeOperation = "source-atop";
    ctx.drawImage(img,x,y);
    
    ctx.globalAlpha = oldAlpha;
    ctx.globalCompositeOperation = oldComp;
}

function imgRGBA(img,r=255,g=255,b=255,a=1){ //BEWARE: MODIFIES IMAGE AOURCE, DOES NOT CREATE NEW IMAGE
    let w=img.width,h=img.height;
    fakeCanvas.width = w;
    fakeCanvas.height= h;
    ctxF.clearRect(0,0,w,h);
    ctxF.globalCompositeOperation = "xor";
    ctxF.fillStyle = `rgba(${r},${g},${b},${a})`;
    ctxF.drawImage(img,0,0);
    ctxF.fillRect(0,0,w,h); //Makes a negatove
    ctxF.fillRect(0,0,w,h); //Fills the negative
    img.src = fakeCanvas.toDataURL();
}

class Bone{
    constructor(data=sData.bone,r=255,g=255,b=255,a=1,w=10,h=6,rodW=6){
        this.top   = data2img(data.top   ,r,g,b,a,0,0,w,h);
        this.bottom= data2img(data.bottom,r,g,b,a,0,0,w,h);
        this.left  = data2img(data.left  ,r,g,b,a,0,0,h,w);
        this.right = data2img(data.right ,r,g,b,a,0,0,h,w);
        this.rodOff=Math.round((w-rodW)/2);
        this.w=w,this.h=h,this.rodW=rodW;
        this.fill=`rgba(${r},${g},${b},${a})`;
    }
    draw(ctx,x,y,l,lateral=false){
        let oldFill = ctx.fillStyle;
        ctx.fillStyle = this.fill;
        if(lateral){
            ctx.drawImage(this.left,x,y);
            ctx.fillRect(x+this.h,y+this.rodOff,l-this.h-this.h,this.rodW);
            ctx.drawImage(this.right,x+l-this.h,y);
        }else{
            ctx.drawImage(this.top,x,y);
            ctx.fillRect(x+this.rodOff,y+this.h,this.rodW,l-this.h-this.h);
            ctx.drawImage(this.bottom,x,y+l-this.h);
        }
        ctx.fillStyle = oldFill;
    }
    setRGBA(r=255,g=255,b=255,a=1){
        this.fill=`rgba(${r},${g},${b},${a})`;
        imgRGBA(this.top   ,r,g,b,a);
        imgRGBA(this.bottom,r,g,b,a);
        imgRGBA(this.left  ,r,g,b,a);
        imgRGBA(this.right ,r,g,b,a);
    }
}
