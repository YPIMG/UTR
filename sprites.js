"use strict";
/*global Image*/
var WAIT = 0;
{

let fakeCanvas = document.createElement('canvas');
let ctxF = fakeCanvas.getContext('2d');

//Doing it this way lets me dynamically color a sprite
//Highlight a zero to see the sprites easily
var newImage = function(w,h,wait=false,src=""){
    let img = new Image(w,h);
    if(wait){
        WAIT++;
        img.onload = ()=>{WAIT--};
    }
    img.src = src;
    return img;
}
var sprites = {
     heart   :newImage(16,16,true,"sprites/heart.png")
    ,defHeart:newImage(16,16,true,"sprites/default heart.png")
    ,bonely  :newImage(16,16,true,"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAfElEQVQ4T61TWwrAMAib9z/0Rh9CahNRWH8sVVON0Z513m2HMbj7O75hvA0HJkPudXWQI74DQMEpalZG9LF+PaZS3eTAT+SiBcCIjMyzj9IpqNEdNGRllgEyIeFvtM3qGFmlM/cXgKqUmb5auyClzAQUiZXqjhzItRWKtQ8f1h4KTIkAFgAAAABJRU5ErkJgggAA")
};

var imgShadow = function(img,r=255,g=255,b=255,a=1,wait=false){
    let w=img.width,h=img.height;
    fakeCanvas.width = w;
    fakeCanvas.height= h;
    ctxF.globalCompositeOperation = "source-over";
    ctxF.clearRect(0,0,w,h);
    ctxF.drawImage(img,0,0);
    ctxF.fillStyle = `rgba(${r},${g},${b},${a})`;
    ctxF.globalCompositeOperation = "source-in";
    ctxF.fillRect(0,0,w,h);
    let newImg = new Image(w,h);
    if(wait){
        WAIT++;
        newImg.onload = ()=>{WAIT--};
    }
    newImg.src = fakeCanvas.toDataURL();
    return newImg;
}

var drawImgBlend = function(ctx,img,x,y){
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
};
var Bone = class{
    constructor(imgs=sprites.bonely,r=255,g=255,b=255,a=1,sprW=10,rodW=6,wait=false){
        this.sheet = imgShadow(imgs,r,g,b,a,wait);
        this.w = sprW;
        this.h = this.sheet.width - sprW;
        this.rodOff = Math.round((this.w-rodW)/2);
        this.fill=`rgba(${r},${g},${b},${a})`;
    }
    draw(ctx,x,y,l,lateral=false){
        l = clamp(l,this.h*2,l);
        let oldFill = ctx.fillStyle;
        ctx.fillStyle = this.fill;
        if(lateral){
            ctx.drawImage(this.sheet          ,0,0,this.h,this.w,x         ,y,this.h,this.w);
            ctx.drawImage(this.sheet,this.w,this.h,this.h,this.w,x+l-this.h,y,this.h,this.w);
            ctx.fillRect(x+this.h,y+this.rodOff,l-this.h-this.h,this.w-this.rodOff*2);
        }else{
            ctx.drawImage(this.sheet,this.h,0,this.w,this.h,x,y         ,this.w,this.h);
            ctx.drawImage(this.sheet,0,this.w,this.w,this.h,x,y+l-this.h,this.w,this.h);
            ctx.fillRect(x+this.rodOff,y+this.h,this.w-this.rodOff*2,l-this.h-this.h);
        }
        ctx.fillStyle = oldFill;
    }
    setRGBA(r=255,g=255,b=255,a=1,wait=false){
        if(wait) WAIT++;
        this.sheet = imgShadow(this.sheet,r,g,b,a,wait);
        this.fill=`rgba(${r},${g},${b},${a})`;
        if(wait) WAIT--;
    }
};

let clamp = function(num,min,max){
    if(num < min) return min;
    if(num > max) return max;
    return num;
};
let round = Math.round;
let sin = Math.sin;
let cos = Math.cos;
let rads = Math.PI/180;
let sqrt1_3 = Math.sqrt(1/3);

let matCache = [[1,0,0]];
for(let i=1;i<360;i++){
    matCache[i]=[0,0,0];
    let cosA = cos(i*rads);
    let sinA = sin(i*rads);
    let cosB = (1 - cosA)/3;
    let sinB = sinA*sqrt1_3;
    matCache[i][0] = cosB + cosA;
    matCache[i][1] = cosB - sinB;
    matCache[i][2] = cosB + sinB;
    Object.freeze(matCache[i]);
}

var Color = class{
    constructor(cssColor){
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.width = 1;
        canvas.height= 1;
        ctx.fillStyle = cssColor;
        ctx.fillRect(0,0,1,1);
        let [r,g,b,a] = ctx.getImageData(0,0,1,1).data;
        a = round(a/255);
        this._source = {r:r,g:g,b:b,a:a};
        this._result = {r:r,g:g,b:b,a:a};
        this._resulted = true;
        this._hueMatrix = [1,0,0];
        this._hueRot = 0;
        Object.seal(this);
    }
    get source(){
        return this._source;
    }
    set source(s){
        let {r,g,b,a} = s;
        if(!a && a!==0) a=1;
        this._source.r = r;
        this._source.g = g;
        this._source.b = b;
        this._source.a = a;
        this._resulted = false;
    }
    get hueRot(){
        return this._hueRot;
    }
    set hueRot(h){
        while(h>=360) h -= 360;
        while(h<   0) h += 360;
        if(this.hueRot != h) this._resulted=false;
        this._hueRot = h;
        if(!matCache[h]){
            let cosA = cos(h*rads);
            let sinA = sin(h*rads);
            let cosB = (1 - cosA)/3;
            let sinB = sinA*sqrt1_3;
            this._hueMatrix[0] = cosB + cosA;
            this._hueMatrix[1] = cosB - sinB;
            this._hueMatrix[2] = cosB + sinB;
        }
    }
    get result(){
        if(this._resulted){
            let {r,g,b,a} = this._result;
            return {r:r,g:g,b:b,a:a};
        }
        let {r,g,b,a} = this._source;
        let mat = matCache[this.hueRot]||this._hueMatrix;
        let newR = clamp(round(r*mat[0] + g*mat[1] + b*mat[2]),0,255);
        let newG = clamp(round(r*mat[2] + g*mat[0] + b*mat[1]),0,255);
        let newB = clamp(round(r*mat[1] + g*mat[2] + b*mat[0]),0,255);
        this._result.r = newR;
        this._result.g = newG;
        this._result.b = newB;
        this._resulted = true;
        return {r:newR,g:newG,b:newB,a:a};
    }
    get resultCSS(){
        let {r,g,b,a} = this.result;
        return `rgba(${r},${g},${b},${a})`;
    }
};


}//End of scope