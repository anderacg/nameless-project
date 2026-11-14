/* Keep the full character/NPC studio on its existing API while using painted artwork. */
(function(root){
 const E=root.PortraitEngine,A=root.PortraitArtwork;
 function gray(source){const c=document.createElement('canvas');c.width=source.width;c.height=source.height;const g=c.getContext('2d');g.drawImage(source,0,0);const im=g.getImageData(0,0,c.width,c.height),d=im.data;for(let k=0;k<d.length;k+=4)d[k]=d[k+1]=d[k+2]=Math.round(d[k]*.2126+d[k+1]*.7152+d[k+2]*.0722);g.putImageData(im,0,0);return c;}
 root.paintedPortraitGrayscale=gray;
 root.PortraitEngine=Object.freeze({...E,composite(p,options={}){if(!A.loaded)return E.composite(p,options);const image=A.composite(A.fromTemplate(p,{colors:options.colors||E.colors,size:E.size}),options);return options.colors?image:gray(image);}});
 A.ready.then(()=>{root.portraitWorkshop?.render(true);root.portraitStudio?.refresh()});
})(globalThis);
