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

const transformer = (data) => {
  return template.replace(REG, (match) => {
    // 去除两端大括号
    const key = match.trim().slice(1, match.length - 1).trim()

    return key in data ? data[key] : ''
  })
}

function add(data) {
  const str = transformer(data)

  document.getElementById('table-list__body').innerHTML += str
}

export {
  add
}