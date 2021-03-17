var path = require('path');
var fs = require('fs');
var rimraf = require("rimraf");
const { promisify } = require('util')

var gm = require('gm');
const tesseract = require("node-tesseract-ocr")
var Promise = require('promise');
var ImageTracer = require('imagetracerjs');
var PNGReader = require('png.js');
var potrace = require('potrace');
var posterizer = potrace.Posterize;
// var trace = new potrace.Potrace();
var webfont = require('webfont').default;
var webfontsGenerator = require('webfonts-generator');
var Jimp = require('jimp');
// const Clipper = require('image-clipper');

// clipper.configure({
//     canvas: require('canvas')
// });

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

var box_w = 170;
var box_h = 234;
var first_x = 106;
var first_y = 244;
var diff_x = 63;
var diff_y = 38;
var word_count = 100;


const POSITION_CONFIG  = {
    START: {x: 97, y: 335, w: 314, h:361 },
    BOX: { x:0, y:62,w: 170, h:170 },
    CODE: {x:0, y:0,w: 118, h:45}
}
function getBoxPosition(count){
    const { START: { x, y, w, h } } = POSITION_CONFIG;
    const column = ((count - 1) % 10);  
    const row = Math.ceil(count / 10);
    const X =  x + w * (column) + 0 * (column);
    const Y =  y + h * (row - 1) + 0 * (row - 1);
    return { 
        pos: [X, Y, 314, 361],
        boxPos: [44, 141, 220, 220],
        codePos: [44, 0, 140, 130],
    };
} 

const DIR_CONFIG = {
    pages: path.resolve(__dirname, 'src', 'pages'), 
}
 
class FontGenerator {
    constructor() {
      this.config  = DIR_CONFIG;
    }
    async start(){
        console.log('>>>> START PAGE TO SVG' );
        await this.pageToSvg();
        // console.log('>>>> START SVG TO FONT' );
        // await this.svgToFont();
    }
    async getCode(codeImage){
        const tempPath = path.resolve(__dirname, 'src', 'temp', `temp.png`);
        let text = '';
        await codeImage.writeAsync(tempPath);
        text = await tesseract.recognize(tempPath, {
            lang: "eng",
            oem: 1,
            psm: 3,
        })  
        var pattern = new RegExp(/[^a-zA-Z0-9_\u4e00-\u9fa5\'']/)   
        // console.log(encodeURI(text));
        const code = text.replace(pattern, '');
        console.log(encodeURI(code));
        return text.replace(code, '');
    }
    /**
     * 把page裡面每一個格子切下來
     */
    async pageToSvg() {
      const dirPath = this.config.pages;
      const files = fs.readdirSync(this.config.pages);
      asyncForEach(files, async (file) => {
        const pagePath = path.resolve(__dirname, dirPath, file);
        for (var i = 10; i <= 100; i++) {
            const { pos, boxPos, codePos } = getBoxPosition(i);
            const image = await Jimp.read(pagePath)
            image.crop(...pos);
            const codeImage = await Jimp.read(image.clone())
            codeImage.crop(...codePos)
            const code = await this.getCode(codeImage);
            // 
            const boxImage = await Jimp.read(image.clone())
            boxImage.crop(...boxPos)
            await codeImage.writeAsync(path.resolve(__dirname, 'src', 'words', `${code}.svg`));
            console.log('>>>>' , code, 'done!!' );
        }s
      })
    }
    async svgToFont(){
        const dirPath = path.resolve(__dirname, 'src', 'words');
        const files = fs.readdirSync(dirPath) || [];
        const filesList = files.map(f => path.resolve(__dirname, dirPath, f)) 

        webfontsGenerator({
            files: filesList,
            dest: path.resolve(__dirname, 'dist'),
            html: true,
            fontName: 'MY-Font',
            cssFontsUrl: path.join('./dest'),
            htmlDest: path.join('./', 'index' + '.html'),
        }, function (error) {
            if (error) {
                console.log('Fail!', error);
            } else {
                console.log('Make Font Finished');
            }
        });
    }
  } 


  async function app(){
    const fontGen = new FontGenerator();
    await fontGen.start()
  }

  app();

