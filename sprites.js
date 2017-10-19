"use strict";
/*global Image*/
{

var fakeCanvas = document.createElement('canvas');
var ctxF = fakeCanvas.getContext('2d');

//Doing it this way lets me dynamically color a sprite
//Highlight a zero to see the sprites easily
var newImage = function(w,h,src=""){
    let img = new Image(w,h);
    img.src = src;
    return img;
};
var sprites = {
     heart:newImage(16,16,"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAPElEQVR42mNgQID/UEwIYFX3HwsmWs1/PJgoNTQ1gBg8agA1DCAmqohJaJQbQKxBRGcWsg3AZRDJgCgDAHfmuUdrN6HiAAAAAElFTkSuQmCC")
    ,defHeart:newImage(16,16,"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuOWwzfk4AAABKSURBVDhPYwCB/w4O/9ExWAIK8MpjkyQWU2wACI8aMGoACFOUmMCaQQCbJCEM1YoA2BThwlAtmACbYnQMVYofYNMIwlBpJMDAAABGnylj+IhG6wAAAABJRU5ErkJggg==")
    ,bonely:newImage(16,16,"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAfElEQVQ4T61TWwrAMAib9z/0Rh9CahNRWH8sVVON0Z513m2HMbj7O75hvA0HJkPudXWQI74DQMEpalZG9LF+PaZS3eTAT+SiBcCIjMyzj9IpqNEdNGRllgEyIeFvtM3qGFmlM/cXgKqUmb5auyClzAQUiZXqjhzItRWKtQ8f1h4KTIkAFgAAAABJRU5ErkJgggAA")
    ,cunnilingus:newImage(569,6,"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAjkAAAAGAgMAAABcNmevAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAJUExURUdwTP8A/////ywUgrwAAAABdFJOUwBA5thmAAABRklEQVQoz8WSMY6FMAxE418hKitV5IpQIU6JtwIqaipMBTnljsPfnm5RhJIwGcYvDoEJo6nv/x94ovUxtxuNrG3UhvX5VKJdoq3gbaMYdj5MHebYrwOTU6wkOyT/QBYVm1ieaTkl4yucUWbzUs/WRO09j/ZyDyn3rAPb+M2TC1vLugodDJ+MnI3727TbnOBDk9AZEVgPuSEoYhAP8Jcb+T9RJ7YeeeSdnh3F7HkogA9r2Qh5yn4jYUAS9opwqkQtlU8HRChqzzBfnVuu/qj3LpgnJ/n4X+ynOoTfKMhbPYr1+wINCCKtTA8f7yVfWpV5FXD740PzDsK+edSorfNf4H8lhfjxh/54/N38nb7y8TzJ+TQpnxs9/TMAciLcF7AAbxGfg5j3T6Khor78j94Pl9/Fsn6XOgi6Iq/i//qghQD2pb72Twi/vpTgyY3YSe4AAAAASUVORK5CYII=")
};
var shadowCache = {};
var imgShadow = function(img,cssColor="rgb(255,255,255)",key){
    let store = shadowCache[key];
    if(key !== undefined){
        if(!store){
            shadowCache[key] = {};
            store = shadowCache[key];
        }else if(store[cssColor]){
            return store[cssColor];
        }
    }
    let w=img.width,h=img.height;
    fakeCanvas.width = w;
    fakeCanvas.height= h;
    ctxF.globalCompositeOperation = "source-over";
    ctxF.globalAlpha = 1;
    ctxF.clearRect(0,0,w,h);
    ctxF.drawImage(img,0,0);
    ctxF.fillStyle = cssColor;
    ctxF.globalCompositeOperation = "source-in";
    ctxF.fillRect(0,0,w,h);
    let newImg = new Image(w,h);
    newImg.src = fakeCanvas.toDataURL();
    if(key !== undefined){
        store[cssColor] = Object.freeze(newImg.cloneNode(true));
    }
    return newImg;
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
    constructor(sheet=sprites.bonely,sprW=10,rodW=6,cssColor="rgb(255,255,255)",key="bonely"){
        this.sheet = sheet
        this.sheetAlt = imgShadow(sheet,cssColor,key);
        this.w = sprW;
        this.h = this.sheet.width - sprW;
        this.rodOff = Math.round((this.w-rodW)/2);
        this.fill=cssColor;
        this.key = key;
    }
    draw(ctx,x,y,l,lateral=false){
        l = clamp(l,this.h*2,l);
        let oldFill = ctx.fillStyle;
        ctx.fillStyle = this.fill;
        if(lateral){
            ctx.drawImage(this.sheetAlt,0     ,0     ,this.h,this.w,x         ,y,this.h,this.w);
            ctx.drawImage(this.sheetAlt,this.w,this.h,this.h,this.w,x+l-this.h,y,this.h,this.w);
            ctx.fillRect(x+this.h,y+this.rodOff,l-this.h-this.h,this.w-this.rodOff*2);
        }else{
            ctx.drawImage(this.sheetAlt,this.h,0,this.w,this.h,x,y         ,this.w,this.h);
            ctx.drawImage(this.sheetAlt,0,this.w,this.w,this.h,x,y+l-this.h,this.w,this.h);
            ctx.fillRect(x+this.rodOff,y+this.h,this.w-this.rodOff*2,l-this.h-this.h);
        }
        ctx.fillStyle = oldFill;
    }
    setCSS(cssColor){
        this.sheetAlt = imgShadow(this.sheet,cssColor,this.key);
        this.fill=cssColor;
    }
};

var MonoFont = class{
    constructor(sheet=sprites.cunnilingus,cW=5,space=1){
        this.sheet = sheet;
        this.cW = Math.round(cW);
        this.off = Math.round(cW+space);
        this.cH = this.sheet.height;
    }
    fillText(ctx,text,x,y,scale=1){
        scale = Math.round(scale);
        switch(ctx.textBaseline){
            case "top":
            case "hanging":
                break;
            case "middle":
                y -= Math.floor(this.cH*scale/2);
                break;
            case "alphabetical":
            case "ideographic":
            case "bottom":
            default:
                y -= this.cH*scale;
                break;
        }
        let len = text.length;
        for(let i=0;i<len;i++){
            let c = clamp(text.charCodeAt(i),32,127)-32;
            ctx.drawImage(this.sheet,c*this.off,0,this.cW,this.cH,x+i*this.off*scale,y,this.cW*scale,this.cH*scale);
        }
    }
};
var WidthFont = class{
    constructor(sheet,cWs,space=1){
        this.sheet = sheet;
        this.offs = [];
        let n = 0;
        let len = cWs.length;
        for(let i = 0;i<len;i++){
            n += cWs[i]||cWs[0];
            this.offs[i] = n;
        }
        this.cH = this.sheet.height;
    }
    fillText(ctx,text,x,y,scale=1){
        scale = Math.round(scale);
        switch(ctx.textBaseline){
            case "top":
            case "hanging":
                break;
            case "middle":
                y -= Math.floor(this.cH*scale/2);
                break;
            case "alphabetical":
            case "ideographic":
            case "bottom":
            default:
                y -= this.cH*scale;
                break;
        }
        let len = text.length;
        let off = 0;
        for(let i=0;i<len;i++){
            off += this.offs[c];
            let c = clamp(text.charCodeAt(i),32,127)-32;
            ctx.drawImage(this.sheet,this.offs[c],0,this.cW,this.cH,x+off,y,this.cW*scale,this.cH*scale);
        }
    }
}


}//End of scope