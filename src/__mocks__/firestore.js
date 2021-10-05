export default {
  storage: {
    ref() {
      return this
    },
    put() {
      return Promise.resolve({
        ref: {
          getDownloadURL() {
            return ""
          },
        },
      })
    },
  },
}