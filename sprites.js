"use strict";
/*global Image*/
{

let fakeCanvas = document.createElement('canvas');
let ctxF = fakeCanvas.getContext('2d');

//Doing it this way lets me dynamically color a sprite
//Highlight a zero to see the sprites easily
var newImage = function(w,h,src=""){
    let img = new Image(w,h);
    img.src = src;
    return img;
};
var sprites = {
     heart   :newImage(16,16,"sprites/heart.png")
    ,defHeart:newImage(16,16,"sprites/default heart.png")
    ,bonely  :newImage(16,16,"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAfElEQVQ4T61TWwrAMAib9z/0Rh9CahNRWH8sVVON0Z513m2HMbj7O75hvA0HJkPudXWQI74DQMEpalZG9LF+PaZS3eTAT+SiBcCIjMyzj9IpqNEdNGRllgEyIeFvtM3qGFmlM/cXgKqUmb5auyClzAQUiZXqjhzItRWKtQ8f1h4KTIkAFgAAAABJRU5ErkJgggAA")
};

var shadowCache = new WeakMap();
var imgShadow = function(img,cssColor,copy=true){
    let store = shadowCache.get(img);
    if(copy) img = img.cloneNode(true);
    if(!copy){
        if(!store){
            shadowCache.set(img,{});
            store = shadowCache.get(img);
        }else if(store[cssColor]){
            img.src = store[cssColor];
            return img;
        }
    }
    let w=img.width,h=img.height;
    fakeCanvas.width = w;
    fakeCanvas.height= h;
    ctxF.globalCompositeOperation = "source-over";
    ctxF.clearRect(0,0,w,h);
    ctxF.drawImage(img,0,0);
    ctxF.fillStyle = cssColor;
    ctxF.globalCompositeOperation = "source-in";
    ctxF.fillRect(0,0,w,h);
    img.src = fakeCanvas.toDataURL();
    if(!copy) store[cssColor] = img.src;
    return img;
};

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
let clamp = function(num,min,max){
    if(num < min) return min;
    if(num > max) return max;
    return num;
};
var Bone = class{
    constructor(sheet=sprites.bonely,sprW=10,rodW=6,cssColor="rgb(255,255,255)"){
        this.sheet = imgShadow(sheet,cssColor,true);
        this.w = sprW;
        this.h = this.sheet.width - sprW;
        this.rodOff = Math.round((this.w-rodW)/2);
        this.fill=cssColor;
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
    setCSSColor(cssColor){
        imgShadow(this.sheet,cssColor,false);
        this.fill=cssColor;
    }
};


}//End of scope