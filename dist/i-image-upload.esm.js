/*!
 * i-image-upload v1.0.1
 * Based on ImageUploader (c) Ross Turner (https://github.com/CN-kicoyu/i-image-upload)
 * Adapted by (c) 2018 kicoyu
 * Released under the MIT License.
 */


import EXIF from 'exif-js';
import dataURLtoBlob from 'blueimp-canvas-to-blob';

function getError (action, xhr) {
  var msg;
  if (xhr.response) {
    msg = "" + (xhr.response.error || xhr.response);
  } else if (xhr.responseText) {
    msg = "" + (xhr.responseText);
  } else {
    msg = "fail to post " + action + " " + (xhr.status);
  }

  var err = new Error(msg);
  err.status = xhr.status;
  err.method = 'post';
  err.url = action;
  return err
}

function getBody (xhr) {
  var text = xhr.responseText || xhr.response;
  if (!text) {
    return text
  }

  try {
    return JSON.parse(text)
  } catch (e) {
    return text
  }
}

function upload (option) {
  if (typeof XMLHttpRequest === 'undefined') {
    return
  }

  var xhr = new XMLHttpRequest();
  var action = option.action;

  if (xhr.upload) {
    xhr.upload.onprogress = function progress (e) {
      if (e.total > 0) {
        e.percent = e.loaded / e.total * 100;
      }
      option.onProgress(e);
    };
  }

  var formData = new FormData();
  formData.append(option.filename, option.file, option.file.name);

  xhr.onerror = function error (e) {
    option.onError(e);
  };

  xhr.onload = function onload () {
    if (xhr.status < 200 || xhr.status >= 300) {
      return option.onError(getError(action, xhr))
    }
    option.onSuccess(getBody(xhr));
  };

  xhr.open('post', action, true);

  xhr.send(formData);

  return xhr
}

var func = {
  type: Function,
  default: function () {}
};

var IImageUpload = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"y-upload"},[_vm._t("default"),_vm._v(" "),_c('input',{ref:_vm.name,staticClass:"y-input",attrs:{"type":"file","name":_vm.name,"accept":"image/*","capture":_vm.capture,"disabled":_vm.disabled},on:{"change":_vm.onChange}})],2)},staticRenderFns: [],_scopeId: 'data-v-86fbcba0',
  name: 'i-image-upload',
  props: {
    name: {
      type: String,
      default: 'file'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    beforeUpload: Function,
    onPreview: Object.assign({}, func),
    onProgress: Object.assign({}, func),
    onSuccess: Object.assign({}, func),
    onError: Object.assign({}, func),
    customHandleUpload: Function,
    maxWidth: {
      type: Number,
      default: 1024
    },
    maxHeight: {
      type: Number,
      default: 1024
    },
    autoScale: {
      type: Boolean,
      default: true
    },
    quality: {
      type: Number,
      default: 1.00
    },
    scaleRatio: Number,
    autoRotate: {
      type: Boolean,
      default: true
    },
    resultType: {
      type: String,
      default: 'base64'
    },
    action: String,
    capture: String
  },
  methods: {
    onChange: function onChange (event) {
      var this$1 = this;

      var file = event.target.files && event.target.files.length ? event.target.files[0] : null;
      if (this.disabled || !file || (this.beforeUpload && !this.beforeUpload(file))) {
        return
      }
      this.currentFile = file;
      this.readFile(file).then(function (ref) {
        var content = ref.content;
        var rotate = ref.rotate;

        this$1.onHandleUpload(content, rotate);
      });
    },
    readFile: function readFile (file) {
      var this$1 = this;

      return new Promise(function (resolve) {
        var img = document.createElement('img');
        var reader = new window.FileReader();

        reader.onload = function (event) {
          img.src = event.target.result;
          img.onload = function () {
            if (!this$1.autoRotate || typeof EXIF === 'undefined' || typeof EXIF.getData !== 'function' || typeof EXIF.getTag !== 'function') {
              resolve({content: img, rotate: undefined});
            } else {
              EXIF.getData(img, function () {
                var orientation = EXIF.getTag(this, 'Orientation');
                resolve({content: img, rotate: orientation});
              });
            }
          };
        };

        reader.readAsDataURL(file);
      })
    },
    onHandleUpload: function onHandleUpload (content, rotate) {
      var this$1 = this;

      var canvas = document.createElement('canvas');
      canvas.width = content.width;
      canvas.height = content.height;
      var ctx = canvas.getContext('2d');
      ctx.save();

      var width = canvas.width;
      var styleWidth = canvas.style.width;
      var height = canvas.height;
      var styleHeight = canvas.style.height;

      if (typeof rotate === 'undefined') {
        rotate = 1;
      }

      if (rotate) {
        if (rotate > 4) {
          canvas.width = height;
          canvas.style.width = styleHeight;
          canvas.height = width;
          canvas.style.height = styleWidth;
        }
        switch (rotate) {
          case 2:

            ctx.translate(width, 0);
            ctx.scale(-1, 1);
            break
          case 3:
            ctx.translate(width, height);
            ctx.rotate(Math.PI);
            break
          case 4:
            ctx.translate(0, height);
            ctx.scale(1, -1);
            break
          case 5:
            ctx.rotate(0.5 * Math.PI);
            ctx.scale(1, -1);
            break
          case 6:
            ctx.rotate(0.5 * Math.PI);
            ctx.translate(0, -height);
            break
          case 7:
            ctx.rotate(0.5 * Math.PI);
            ctx.translate(width, -height);
            ctx.scale(-1, 1);
            break
          case 8:
            ctx.rotate(-0.5 * Math.PI);
            ctx.translate(-width, 0);
            break
        }
      }
      ctx.drawImage(content, 0, 0);
      ctx.restore();

      var ratio = canvas.width / canvas.height;
      var mWidth = this.autoScale ? Math.min(this.maxWidth, ratio * this.maxHeight) : ratio * this.maxHeight;

      if (this.scaleRatio) {
        mWidth = Math.min(mWidth, Math.floor(this.scaleRatio * canvas.width));
      }

      if (mWidth <= 0) {
        mWidth = 1;
      }

      while (canvas.width >= (2 * mWidth)) {
        canvas = this$1.getHalfScaleCanvas(canvas);
      }

      if (canvas.width > mWidth) {
        canvas = this.getAlgorithmCanvas(canvas, mWidth);
      }

      var quality = this.currentFile.type === 'image/jpeg' ? this.quality : 1.0;
      var imageData = canvas.toDataURL(this.currentFile.type, quality);
      var uploadFile= this.formatResultType(imageData);
      this.onPreview(uploadFile);

      if (!this.customHandleUpload) {
        if (!this.action) {
          return
        }
        return this.uploadImage(imageData)
      }

      var req = this.customHandleUpload(uploadFile, {width: canvas.width, height: canvas.height});
      if (req && req.then) {
        req.then(function (res) {
          if (this$1.$refs[this$1.name]) {
            this$1.$refs[this$1.name].value = '';
          }
          this$1.onSuccess(res, imageData);
        },
        function (error) {
          if (this$1.$refs[this$1.name]) {
            this$1.$refs[this$1.name].value = '';
          }
          this$1.onError(error, imageData);
        });
      }
    },
    uploadImage: function uploadImage (dataurl) {
      var this$1 = this;

      var formatFile = this.formatResultType(dataurl);
      var uploadFile = this.dataURLtoFile(dataurl);
      var options = {
        file: uploadFile,
        filename: this.name,
        action: this.action,
        onProgress: function (e) {
          this$1.onProgress(e, dataurl);
        },
        onSuccess: function (res) {
          if (this$1.$refs[this$1.name]) {
            this$1.$refs[this$1.name].value = '';
          }
          this$1.onSuccess(res, formatFile);
        },
        onError: function (error) {
          if (this$1.$refs[this$1.name]) {
            this$1.$refs[this$1.name].value = '';
          }
          this$1.onError(error, formatFile);
        }
      };
      upload(options);
    },
    getHalfScaleCanvas: function getHalfScaleCanvas (canvas) {
      var halfCanvas = document.createElement('canvas');
      halfCanvas.width = canvas.width / 2;
      halfCanvas.height = canvas.height / 2;

      halfCanvas.getContext('2d').drawImage(canvas, 0, 0, halfCanvas.width, halfCanvas.height);
      return halfCanvas
    },
    getAlgorithmCanvas: function getAlgorithmCanvas (canvas, maxWidth) {
      var calcCanvas = document.createElement('canvas');
      var scale = maxWidth / canvas.width;

      calcCanvas.width = canvas.width * scale;
      calcCanvas.height = canvas.height * scale;

      var srcImgData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      var destImgDate = calcCanvas.getContext('2d').createImageData(calcCanvas.width, calcCanvas.height);

      this.bilinearInterpolation(srcImgData, destImgDate, scale);

      calcCanvas.getContext('2d').putImageData(destImgDate, 0, 0);
      return calcCanvas
    },
    bilinearInterpolation: function bilinearInterpolation (srcCanvasData, destCanvasData, scale) {
      function inner (f00, f10, f01, f11, x, y) {
        var un_x = 1.0 - x;
        var un_y = 1.0 - y;
        return (f00 * un_x * un_y + f10 * x * un_y + f01 * un_x *
        y + f11 * x * y)
      }
      var iyv, iy0, iy1, ixv, ix0, ix1;
      var idxD, idxS00, idxS10, idxS01, idxS11;
      var dx, dy;
      var r, g, b, a;
      for (var i = 0; i < destCanvasData.height; ++i) {
        iyv = i / scale;
        iy0 = Math.floor(iyv);
        // Math.ceil can go over bounds
        iy1 = (Math.ceil(iyv) > (srcCanvasData.height - 1) ? (srcCanvasData.height - 1) : Math.ceil(iyv));
        for (var j = 0; j < destCanvasData.width; ++j) {
          ixv = j / scale;
          ix0 = Math.floor(ixv);
          // Math.ceil can go over bounds
          ix1 = (Math.ceil(ixv) > (srcCanvasData.width - 1) ? (srcCanvasData.width - 1) : Math.ceil(ixv));
          idxD = (j + destCanvasData.width * i) * 4;
          // matrix to vector indices
          idxS00 = (ix0 + srcCanvasData.width * iy0) * 4;
          idxS10 = (ix1 + srcCanvasData.width * iy0) * 4;
          idxS01 = (ix0 + srcCanvasData.width * iy1) * 4;
          idxS11 = (ix1 + srcCanvasData.width * iy1) * 4;
          // overall coordinates to unit square
          dx = ixv - ix0;
          dy = iyv - iy0;
          // I let the r, g, b, a on purpose for debugging
          r = inner(srcCanvasData.data[idxS00], srcCanvasData.data[idxS10], srcCanvasData.data[idxS01], srcCanvasData.data[idxS11], dx, dy);
          destCanvasData.data[idxD] = r;

          g = inner(srcCanvasData.data[idxS00 + 1], srcCanvasData.data[idxS10 + 1], srcCanvasData.data[idxS01 + 1], srcCanvasData.data[idxS11 + 1], dx, dy);
          destCanvasData.data[idxD + 1] = g;

          b = inner(srcCanvasData.data[idxS00 + 2], srcCanvasData.data[idxS10 + 2], srcCanvasData.data[idxS01 + 2], srcCanvasData.data[idxS11 + 2], dx, dy);
          destCanvasData.data[idxD + 2] = b;

          a = inner(srcCanvasData.data[idxS00 + 3], srcCanvasData.data[idxS10 + 3], srcCanvasData.data[idxS01 + 3], srcCanvasData.data[idxS11 + 3], dx, dy);
          destCanvasData.data[idxD + 3] = a;
        }
      }
    },
    dataURLtoFile: function dataURLtoFile(dataurl) {
      var ref = this.currentFile;
      var name = ref.name;
      var type = ref.type;
      var fileType = Object.prototype.toString.call(dataurl);
      var rawFile = dataurl;
      if (fileType !== '[object File]') {
        rawFile = fileType === '[object Blob]' ? dataurl : dataURLtoBlob(dataurl);
        return new window.File([dataURLtoBlob(dataurl)], name, { type: type });
      } else {
        return rawFile
      }
    },
    formatResultType: function formatResultType (imageData) {
      if (this.resultType === 'blob' && typeof dataURLtoBlob !== 'undefined') {
        return dataURLtoBlob(imageData)
      }

      return imageData
    }
  }

};

function install (Vue) {
  if (install.installed) { return }
  install.installed = true;
  Vue.component('i-image-upload', IImageUpload);
}

var iImageUpload = {
  install: install,
  IImageUpload: IImageUpload
};

if (typeof window !== undefined && window.Vue) {
  window.Vue.use(iImageUpload);
}

export default iImageUpload;
