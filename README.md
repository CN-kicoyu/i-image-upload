## i-image-upload vue图片上传组件
vue picture component. Resize and preview your uploaded image

### 使用指南
``` javascript
import iImageUpload from 'i-image-upload'
import 'i-image-upload/dist/i-image-upload.css'

Vue.use(iImageUpload)
```

### i-image-upload 代码演示

#### 普通表单上传
可以在组件内部添加子节点传入自定义的上传按钮类型和文字提示

```html
<form 
  action="http://localhost:1400/avatar" 
  method="post" 
  enctype="multipart/form-data"
>
  <i-image-upload name="file">
    <i class="demo-icon">+</i>
  </i-image-upload>
  <button>上传</button>
</form>
```

#### 默认上传
使用 before-upload 限制用户上传的图片格式和大小, 只有返回 true, 才会继续上传图片，否则停止

```html
<template>
  <form>
    <i-image-upload 
      name="file" 
      action="http://localhost:1400/avatar" 
      :before-upload="beforeUpload"
      :on-preview="onPreview"
      :on-success="onSuccess"
      :on-error="onError"
    >
      <img v-if="imagePreview" :src="imagePreview" class="demo-avatar">
      <i class="demo-icon" v-else>+</i>
    </i-image-upload>
  </form>
</template>

<script>
export default {
  data () {
    return {
      imagePreview: ''
    }
  },
  methods: {
    beforeUpload (file) {
      const isJPG = file.type === 'image/jpeg'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isJPG) {
        console.error('上传头像图片只能是 JPG 格式!')
      }
      if (!isLt2M) {
        console.error('上传头像图片大小不能超过 2MB!')
      }
      return isJPG && isLt2M
    },
    onPreview (file) {
      this.imagePreview = file
    },
    onSuccess (res, dataurl) {
      console.log(res)
    },
    onError (res, dataurl) {
      console.log(res)
      this.imagePreview = ''
    }
  }
}
</script>

<style scoped>
.demo-icon {
  border: 1px dashed lightblue;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
  display: block;
  font-style: normal;
  color: lightblue;
  font-size: 26px;
}
.demo-avatar {
  border: 1px dashed lightblue;
  width: 100px;
  height: 100px;
}
</style>
```

#### 自定义ajax上传
使用 custom-handle-upload 覆盖默认的上传行为，可以自定义上传的实现

```html
<template>
  <form>
    <i-image-upload 
      name="file" 
      action="http://localhost:1400/avatar" 
      resultType="blob"
      :before-upload="beforeUpload"
      :customHandleUpload="onhandleUpload"
      :on-success="onSuccess"
      :on-error="onError"
    >
      <img v-if="imagePreview" :src="imagePreview" class="demo-avatar">
      <i class="demo-icon" v-else>+</i>
    </i-image-upload>
  </form>
</template>

<script>
export default {
  data () {
    return {
      imagePreview: ''
    }
  },
  methods: {
    beforeUpload (file) {
      const isJPG = file.type === 'image/jpeg'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isJPG) {
        console.error('上传头像图片只能是 JPG 格式!')
      }
      if (!isLt2M) {
        console.error('上传头像图片大小不能超过 2MB!')
      }
      return isJPG && isLt2M
    },
    onhandleUpload (formatFile) {
      this.imagePreview = formatFile
      let filedata = new FormData()
      filedata.append('file', data)

      return fetch('http://localhost:1400/avatar', {
        method: 'post',
        mode: 'no-cors',
        body: filedata
      })
    },
    onSuccess (res, dataurl) {
      console.log(res)
      this.imagePreview = res.data.imageUrl
    },
    onError (res, dataurl) {
      console.log(res)
      this.imagePreview = ''
    }
  }
}
</script>
```

### API

| 参数 | 说明 | 类型 | 默认值 |
|-----------|-----------|-----------|-------------|
| name | 上传的图片字段名 | `String` | `file` |
| disabled | 是否禁用 | `Boolean` | `false` |
| maxWidth | 不压缩上传的最大宽度<br/>autoScale为true的时候才有用 | `Number` | `1024` |
| maxHeight | 不压缩上传的最大高度<br/>autoScale为true的时候才有用 | `Number` | `1024` |
| autoScale | 上传图片超出maxWidth或者maxHeight时自动压缩 | `Boolean` | `true` |
| quality | 上传图像的质量，0 - 1.00之间的浮点数 | `Boolean` | `true` |
| scaleRatio | 上传图像的缩放比例，接受0 - 1之间的浮点数， 譬如0.5指缩放为原来的一半 | `Number` | `-` |
| autoRotate | 解析图像中的EXIF信息，并在上传之前正确旋转图像 | `Boolean` | `true` |
| capture | 设置可选的捕获属性 | `String` | `-` |
| resultType | 返回上传图片或者预览图片所需要的格式 | `String ['base64', 'blob']` | `base64` |
| action | 默认上传行为的上传地址 | `String` | `-` |
| custom-handle-upload | 覆盖默认的上传行为，可以自定义上传的实现 | `function(file, extra)` | `—` |
| before-upload | 上传图片之前的钩子，参数为上传的图片，只有返回 true, 才会继续上传图片，否则停止 | `function(file)` | `—` |
| on-preview | 预览上传图片的钩子 | `function(file)` | `—` |
| on-progress | 图片默认ajax上传时的钩子 | `function(event, dataurl)` | `—` |
| on-success | 图片上传成功时的钩子 | `function(response, dataurl)` | `—` |
| on-error | 图片上传失败时的钩子 | `function(response, dataurl)` | `—` |