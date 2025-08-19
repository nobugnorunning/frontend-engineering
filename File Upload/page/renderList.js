const template = `
<tr data-id="{md5}">
    <td>{filename}</td>  
    <td>{size}</td>  
    <td>{md5}</td>  
    <td>0</td>  
    <td>
        <a class="option-btn option-btn--delete" href="javascript:void 0">
            删除
        </a>
    </td>  
</tr>
`

const REG = /\{[^}]*\}/g

const transformer = (tpl, data) => {
  return tpl.replace(REG, (match) => {
    // 去除两端大括号
    const key = match.trim().slice(1, match.length - 1).trim()

    return key in data ? data[key] : ''
  })
}

export default class Renderer {
  constructor (instance) {
    this.instance = instance
  }

  render() {
    let html = ''
    this.instance.state.uploadList.map(data => {
      html += transformer(template, data)
    })

    this.instance.tableBody.innerHTML = html
  }
}
