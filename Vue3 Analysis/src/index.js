function createApp(root) {
  return {
    mount: (rootSelector) => {
      const rootElement = document.querySelector(rootSelector)

      if (!rootElement) {
        throw new Error('Cannot find root element!')
      }
    }
  }
}

export {
  createApp
}