import message from './message.js'
import "./css/base.css"

let p = document.createElement("p");

p.innerHTML = message;

document.body.appendChild(p);