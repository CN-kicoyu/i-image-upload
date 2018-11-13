<template>
  <div class="y-upload">
    <slot/>
    <input
      :ref="name"
      type="file"
      :name="name"
      accept="image/*"
      :capture="capture"
      :disabled="disabled"
      @change="onChange"
      class="y-input"
    >
  </div>
</template>

<script>
import ajax from './utils/ajax.js'
import EXIF from 'exif-js'
import dataURLtoBlob from 'blueimp-canvas-to-blob'

const func = {
  type: Function,
  default: function () {}
}

export default {
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
    onPreview: {...func},
    onProgress: {...func},
    onSuccess: {...func},
    onError: {...func},
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
    onChange (event) {
      const file = event.target.files && event.target.files.length ? event.target.files[0] : null
      if (this.disabled || !file || (this.beforeUpload && !this.beforeUpload(file))) {
        return
      }
      this.currentFile = file
      this.readFile(file).then(({content, rotate}) => {
        this.onHandleUpload(content, rotate)
      })
    },
    readFile (file) {
      return new Promise((resolve) => {
        const img = document.createElement('img')
        const reader = new window.FileReader()

        reader.onload = (event) => {
          img.src = event.target.result
          img.onload = () => {
            if (!this.autoRotate || typeof EXIF === 'undefined' || typeof EXIF.getData !== 'function' || typeof EXIF.getTag !== 'function') {
              resolve({content: img, rotate: undefined})
            } else {
              EXIF.getData(img, function () {
                const orientation = EXIF.getTag(this, 'Orientation')
                resolve({content: img, rotate: orientation})
              })
            }
          }
        }

        reader.readAsDataURL(file)
      })
    },
    onHandleUpload (content, rotate) {
      let canvas = document.createElement('canvas')
      canvas.width = content.width
      canvas.height = content.height
      const ctx = canvas.getContext('2d')
      ctx.save()

      const width = canvas.width
      const styleWidth = canvas.style.width
      const height = canvas.height
      const styleHeight = canvas.style.height

      if (typeof rotate === 'undefined') {
        rotate = 1
      }

      if (rotate) {
        if (rotate > 4) {
          canvas.width = height
          canvas.style.width = styleHeight
          canvas.height = width
          canvas.style.height = styleWidth
        }
        switch (rotate) {
          case 2:
            
            ctx.translate(width, 0)
            ctx.scale(-1, 1)
            break
          case 3:
            ctx.translate(width, height)
            ctx.rotate(Math.PI)
            break
          case 4:
            ctx.translate(0, height)
            ctx.scale(1, -1)
            break
          case 5:
            ctx.rotate(0.5 * Math.PI)
            ctx.scale(1, -1)
            break
          case 6:
            ctx.rotate(0.5 * Math.PI)
            ctx.translate(0, -height)
            break
          case 7:
            ctx.rotate(0.5 * Math.PI)
            ctx.translate(width, -height)
            ctx.scale(-1, 1)
            break
          case 8:
            ctx.rotate(-0.5 * Math.PI)
            ctx.translate(-width, 0)
            break
        }
      }
      ctx.drawImage(content, 0, 0)
      ctx.restore()
      
      const ratio = canvas.width / canvas.height
      let mWidth = this.autoScale ? Math.min(this.maxWidth, ratio * this.maxHeight) : ratio * this.maxHeight

      if (this.scaleRatio) {
        mWidth = Math.min(mWidth, Math.floor(this.scaleRatio * canvas.width))
      }

      if (mWidth <= 0) {
        mWidth = 1
      }

      while (canvas.width >= (2 * mWidth)) {
        canvas = this.getHalfScaleCanvas(canvas)
      }

      if (canvas.width > mWidth) {
        canvas = this.getAlgorithmCanvas(canvas, mWidth)
      }

      const quality = this.currentFile.type === 'image/jpeg' ? this.quality : 1.0
      const imageData = canvas.toDataURL(this.currentFile.type, quality)
      const uploadFile= this.formatResultType(imageData)
      this.onPreview(uploadFile)

      if (!this.customHandleUpload) {
        if (!this.action) {
          return
        }
        return this.uploadImage(imageData)
      }
      
      const req = this.customHandleUpload(uploadFile, {width: canvas.width, height: canvas.height})
      if (req && req.then) {
        req.then(res => {
          if (this.$refs[this.name]) {
            this.$refs[this.name].value = ''
          }
          this.onSuccess(res, imageData)
        },
        error => {
          if (this.$refs[this.name]) {
            this.$refs[this.name].value = ''
          }
          this.onError(error, imageData)
        })
      }
    },
    uploadImage (dataurl) {
      const formatFile = this.formatResultType(dataurl)
      const uploadFile = this.dataURLtoFile(dataurl)
      const options = {
        file: uploadFile,
        filename: this.name,
        action: this.action,
        onProgress: e => {
          this.onProgress(e, dataurl)
        },
        onSuccess: res => {
          if (this.$refs[this.name]) {
            this.$refs[this.name].value = ''
          }
          this.onSuccess(res, formatFile)
        },
        onError: error => {
          if (this.$refs[this.name]) {
            this.$refs[this.name].value = ''
          }
          this.onError(error, formatFile)
        }
      }
      ajax(options)
    },
    getHalfScaleCanvas (canvas) {
      const halfCanvas = document.createElement('canvas')
      halfCanvas.width = canvas.width / 2
      halfCanvas.height = canvas.height / 2

      halfCanvas.getContext('2d').drawImage(canvas, 0, 0, halfCanvas.width, halfCanvas.height)
      return halfCanvas
    },
    getAlgorithmCanvas (canvas, maxWidth) {
      const calcCanvas = document.createElement('canvas')
      const scale = maxWidth / canvas.width

      calcCanvas.width = canvas.width * scale
      calcCanvas.height = canvas.height * scale

      const srcImgData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
      const destImgDate = calcCanvas.getContext('2d').createImageData(calcCanvas.width, calcCanvas.height)

      this.bilinearInterpolation(srcImgData, destImgDate, scale)

      calcCanvas.getContext('2d').putImageData(destImgDate, 0, 0)
      return calcCanvas
    },
    bilinearInterpolation (srcCanvasData, destCanvasData, scale) {
      function inner (f00, f10, f01, f11, x, y) {
        const un_x = 1.0 - x
        const un_y = 1.0 - y
        return (f00 * un_x * un_y + f10 * x * un_y + f01 * un_x *
        y + f11 * x * y)
      }
      let iyv, iy0, iy1, ixv, ix0, ix1
      let idxD, idxS00, idxS10, idxS01, idxS11
      let dx, dy
      let r, g, b, a
      for (let i = 0; i < destCanvasData.height; ++i) {
        iyv = i / scale
        iy0 = Math.floor(iyv)
        // Math.ceil can go over bounds
        iy1 = (Math.ceil(iyv) > (srcCanvasData.height - 1) ? (srcCanvasData.height - 1) : Math.ceil(iyv))
        for (let j = 0; j < destCanvasData.width; ++j) {
          ixv = j / scale
          ix0 = Math.floor(ixv)
          // Math.ceil can go over bounds
          ix1 = (Math.ceil(ixv) > (srcCanvasData.width - 1) ? (srcCanvasData.width - 1) : Math.ceil(ixv))
          idxD = (j + destCanvasData.width * i) * 4
          // matrix to vector indices
          idxS00 = (ix0 + srcCanvasData.width * iy0) * 4
          idxS10 = (ix1 + srcCanvasData.width * iy0) * 4
          idxS01 = (ix0 + srcCanvasData.width * iy1) * 4
          idxS11 = (ix1 + srcCanvasData.width * iy1) * 4
          // overall coordinates to unit square
          dx = ixv - ix0
          dy = iyv - iy0
          // I let the r, g, b, a on purpose for debugging
          r = inner(srcCanvasData.data[idxS00], srcCanvasData.data[idxS10], srcCanvasData.data[idxS01], srcCanvasData.data[idxS11], dx, dy)
          destCanvasData.data[idxD] = r

          g = inner(srcCanvasData.data[idxS00 + 1], srcCanvasData.data[idxS10 + 1], srcCanvasData.data[idxS01 + 1], srcCanvasData.data[idxS11 + 1], dx, dy)
          destCanvasData.data[idxD + 1] = g

          b = inner(srcCanvasData.data[idxS00 + 2], srcCanvasData.data[idxS10 + 2], srcCanvasData.data[idxS01 + 2], srcCanvasData.data[idxS11 + 2], dx, dy)
          destCanvasData.data[idxD + 2] = b

          a = inner(srcCanvasData.data[idxS00 + 3], srcCanvasData.data[idxS10 + 3], srcCanvasData.data[idxS01 + 3], srcCanvasData.data[idxS11 + 3], dx, dy)
          destCanvasData.data[idxD + 3] = a
        }
      }
    },
    dataURLtoFile(dataurl) {
      const {name, type} = this.currentFile
      const fileType = Object.prototype.toString.call(dataurl)
      let rawFile = dataurl
      if (fileType !== '[object File]') {
        rawFile = fileType === '[object Blob]' ? dataurl : dataURLtoBlob(dataurl)
        return new window.File([dataURLtoBlob(dataurl)], name, { type });
      } else {
        return rawFile
      }
    },
    formatResultType (imageData) {
      if (this.resultType === 'blob' && typeof dataURLtoBlob !== 'undefined') {
        return dataURLtoBlob(imageData)
      }

      return imageData
    }
  }

}
</script>

<style scoped>
.y-upload {
  position: relative;
  display: inline-block;
}
.y-input {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
</style>
