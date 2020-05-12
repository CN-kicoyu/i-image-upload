import IImageUpload from './i-image-upload.vue'

function install (Vue) {
  if (install.installed) return
  install.installed = true
  Vue.component('i-image-upload', IImageUpload)
}

const iImageUpload = {
  install: install,
  IImageUpload
}

if (typeof window !== undefined && window.Vue) {
  window.Vue.use(iImageUpload)
}

export default iImageUpload