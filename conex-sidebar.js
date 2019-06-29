import "./conex-search-bar.js";
import {getConexDom} from "./conex-helper.js";

const bg = window.browser.extension.getBackgroundPage();

document.addEventListener("DOMContentLoaded", getConexDom(bg));
console.debug("conex-sidebar.js loaded");
