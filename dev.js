var path = require('path');
var fs = require('fs');
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
    BOX: { x:0, y:62,w: 170, h:170 },
    CODE: {x:0, y:0,w: 118, h:45}
}
function getBoxPosition(count){
    const FIRST_X = 106;
    const FIRST_Y = 244;
    const column = ((count - 1) % 10);
    const row = Math.ceil(count / 10);
    const x = FIRST_X + box_w * (column) + diff_x * (column);
    const y = FIRST_Y + box_h * (row - 1) + diff_y * (row - 1);
    return { x, y, w: box_w, h: box_h };
}


const DIR_CONFIG = {
    pages: path.resolve(__dirname, 'src', 'pages'), 
}
 
class FontGenerator {
    constructor() {
      this.config  = DIR_CONFIG;
    }
    async start(){
        await pageToSvg();
    }
    /**
     * 把page裡面每一個格子切下來
     */
    async pageToSvg() {
      const dirPath = this.config.pages;
      const files = fs.readdirSync(this.config.pages);
      asyncForEach(files, async (file) => {
        const pagePath = path.resolve(__dirname, dirPath, file);
        for (var i = 1; i <= 1; i++) {
            const {x, y, h, w } = getBoxPosition(i);
            const image = await Jimp.read(pagePath)
            image.crop( x, y, w, h );

            const codeImage = await Jimp.read(image)
            codeImage.crop(POSITION_CONFIG.BOX.x, POSITION_CONFIG.BOX.y, POSITION_CONFIG.BOX.H, POSITION_CONFIG.BOX.w)
            await codeImage.writeAsync(path.resolve(__dirname, 'src', 'temp', 'temp.png'));

            console.log(res);
        }
      })
    }
    crop(){
        var config = _self.config;
        fs.readdir(config.dir, function (err, files) {
            files.forEach(function (filename) {
                var filepath = config.dir + filename;
                var progress = [];
                for (var i = 1; i <= word_count; i++) {
                    progress.push(
                        new Promise(function (resolve, reject) {
                            var c = ((i - 1) % 10);
                            var r = Math.ceil(i / 10);
                            var x = first_x + box_w * (c) + diff_x * (c);
                            var y = first_y + box_h * (r - 1) + diff_y * (r - 1);
                            var croppath = config.crop_output + i + '.png';
                            var codepth = config.code_output + i + '.png';
                            var boxpath = config.box_output + i + '.png';

                            function crop() {
                                gm(filepath)
                                    .crop(box_w, box_h, x, y)
                                    .write(croppath, function (err) {
                                        code();
                                        box();
                                    });
                            }

                            function box() {
                                gm(croppath)
                                    .crop(170, 170, 0, 62)
                                    // .threshold(22, '%')
                                    .write(boxpath, function (err) {})
                            }

                            function code() {
                                gm(croppath)
                                    .crop(118, 45, 0, 0)
                                    .write(codepth, function (err) {
                                        resolve(true);
                                    });
                            }
                            crop();
                        })
                    );
                }
                Promise.all(progress).then(function () {
                    console.log('crop_success!');
                    _self.readCode();
                });
            });
        });
    }
  } 

  const fontGen = new FontGenerator();
  fontGen.start()

// var cropFont = {
//     config: {
//         dir: './src/',
//         crop_output: './crop/',
//         code_output: './code/',
//         box_output: './box/',
//         svg_output: './svg/'
//     },
//     start: function () {
//         var _self = cropFont;
//         var config = _self.config;
//         _self.crop();
//     },
//     clearDir: function () {
//         return new Promise(function (resolve, reject) {
//             var _self = cropFont;
//             var config = _self.config;
//             var dirs = [config.crop_output, config.code_output, config.box_output];
//             var progress = [];
//             dirs.forEach(function (dir) {
//                 progress.push(new Promise(function (res, reject) {
//                     rmDir = function (dirPath) {
//                         try {
//                             var files = fs.readdirSync(dirPath);
//                         } catch (e) {
//                             return;
//                         }
//                         if (files.length > 0)
//                             for (var i = 0; i < files.length; i++) {
//                                 var filePath = dirPath + '/' + files[i];
//                                 if (fs.statSync(filePath).isFile())
//                                     fs.unlinkSync(filePath);
//                                 else
//                                     rmDir(filePath);
//                             }
//                         fs.rmdirSync(dirPath);
//                         res(true);
//                     };
//                     rmDir(dir);
//                 }));
//             })
//             Promise.all(progress).then(function () {
//                 console.log('clear!!!');
//                 resolve(true);
//             });
//         });
//     },
//     cropImage: function (path, w, h, x, y) {
//         return new Promise(function (resolve, reject) {
//             gm(path)
//                 .crop(box_w, box_h, x, y)
//                 .write(outpath, function (err) {
//                     resolve(true);
//                 });
//         });
//     },
//     crop: function () {
//         var _self = cropFont;
//         var config = _self.config;
//         fs.readdir(config.dir, function (err, files) {
//             files.forEach(function (filename) {
//                 var filepath = config.dir + filename;
//                 var progress = [];
//                 for (var i = 1; i <= word_count; i++) {
//                     progress.push(
//                         new Promise(function (resolve, reject) {
//                             var c = ((i - 1) % 10);
//                             var r = Math.ceil(i / 10);
//                             var x = first_x + box_w * (c) + diff_x * (c);
//                             var y = first_y + box_h * (r - 1) + diff_y * (r - 1);
//                             var croppath = config.crop_output + i + '.png';
//                             var codepth = config.code_output + i + '.png';
//                             var boxpath = config.box_output + i + '.png';

//                             function crop() {
//                                 gm(filepath)
//                                     .crop(box_w, box_h, x, y)
//                                     .write(croppath, function (err) {
//                                         code();
//                                         box();
//                                     });
//                             }

//                             function box() {
//                                 gm(croppath)
//                                     .crop(170, 170, 0, 62)
//                                     // .threshold(22, '%')
//                                     .write(boxpath, function (err) {})
//                             }

//                             function code() {
//                                 gm(croppath)
//                                     .crop(118, 45, 0, 0)
//                                     .write(codepth, function (err) {
//                                         resolve(true);
//                                     });
//                             }
//                             crop();
//                         })
//                     );
//                 }
//                 Promise.all(progress).then(function () {
//                     console.log('crop_success!');
//                     _self.readCode();
//                 });
//             });
//         });
//     },
//     readCode: function () {
//         var _self = cropFont;
//         var config = _self.config;
//         var dir = config.code_output;
//         var crop_dir = config.crop_output;
//         var box_dir = config.box_output;
//         var svg_dir = config.svg_output;
//         fs.readdir(dir, function (err, files) {
//             var progress = [];
//             files.forEach(function (filename, i) {
//                 var filepath = dir + filename;
//                 var promise = new Promise(function (resolve, reject) {
//                     tesseract.process(filepath, {
//                         l: 'eng+deu',
//                         psm: 3,
//                         oem: 1
//                     }, function (err, text) {
//                         if (err) {
//                             console.log(err);
//                         } else {
//                             var text = text.replace(/(\r\n|\n|\r)/gm, "");
//                             var boxpath = box_dir + filename;
//                             var rename = svg_dir + text + '.svg';

//                             var params = {
//                                 threshold: 128,
//                                 fillStrategy: potrace.Posterize.FILL_MEAN
//                             };

//                             potrace.trace(boxpath, params, function (err, svg) {
//                                 if (err) throw err;
//                                 fs.writeFileSync(rename, svg);
//                                 resolve(true);
//                             });
//                         }
//                     });
//                 });
//                 progress.push(promise);
//             });
//             Promise.all(progress).then(function () {
//                 console.log('Read_all_success!');
//                 _self.toFont();
//             });
//         });
//     },
//     toFont: function () {
//         var _self = cropFont;
//         var config = _self.config;
//         var dir = config.svg_output;
//         var list = [];
//         fs.readdir(dir, function (err, files) {
//             files.forEach(function (file) {
//                 var path = dir + file;
//                 var valid = parseInt(file, 16)
//                 if (valid) {
//                     list.push(path);
//                 }

//             });
//             webfontsGenerator({
//                 files: list,
//                 dest: 'dest/',
//                 html: true,
//                 fontName: 'MY-Font',
//                 cssFontsUrl: path.join('./dest'),
//                 htmlDest: path.join('./', 'index' + '.html'),
//             }, function (error) {
//                 if (error) {
//                     console.log('Fail!', error);
//                 } else {
//                     console.log('Make Font Finished');
//                 }
//             });
//         });
//     }
// }

// // cropFont.start();
// cropFont.readCode();
// // cropFont.toFont();