module.exports = function (source) {
  return `
    (function() {
      var style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = ${JSON.stringify(source)};
      
      document.head.appendChild(style);
    })()
    
    module.exports = {}
  `
}