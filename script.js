// ==UserScript==
// @name         AI DOMAIN CHECK
// @namespace    http://tampermonkey.net/
// @version      1.0
// @match        *://*/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js
// ==/UserScript==

(async function () {

'use strict';



// ===== JSONBIN =====

const BIN_ID = "6a0d2e856610dd3ae873af7e";
const API_KEY = "$2a$10$H6zrOF1KkyeytHoZ1Bv3c.2aB5GRtshVrPaoY/1JsxhEanW068OTu";



let DATABASE = {};



// ===== LOAD DATABASE =====

async function loadDatabase(){

    try{

        DATABASE = await fetch(
        `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,
        {
            headers:{
                "X-Master-Key": API_KEY
            }
        })
        .then(r=>r.json())
        .then(r=>r.record);

        console.log("DATABASE:", DATABASE);

    }catch(e){

        console.log("LOAD ERROR", e);

    }

}



// ===== UPDATE DATABASE =====

async function updateDatabase(){

    await fetch(
    `https://api.jsonbin.io/v3/b/${BIN_ID}`,
    {

        method:"PUT",

        headers:{
            "Content-Type":"application/json",
            "X-Master-Key": API_KEY
        },

        body:JSON.stringify(DATABASE)

    });

}



// ===== FIND CODE =====

function findCode(){

    const text = document.body.innerText;

    const match = text.match(/\d{3}-\d+/);

    if(match){

        return match[0];

    }

    return null;

}



// ===== FIND IMAGES =====

function findImages(){

    return [...document.querySelectorAll("img")]
    .filter(img => img.width > 100);

}



// ===== OCR IMAGE =====

async function scanImage(img){

    try{

        const result =
        await Tesseract.recognize(
            img.src,
            "eng"
        );

        return result.data.text;

    }catch(e){

        console.log(e);

        return "";

    }

}



// ===== EXTRACT DOMAIN =====

function extractDomain(text){

    const match = text.match(
    /https?:\/\/[\s↗→]*([a-z0-9.-]+\.[a-z]{2,})/i
    );

    if(match){

        return match[1]
        .replace("www.","")
        .toLowerCase();

    }

    return null;

}



// ===== POPUP =====

function showPopup(code, domain){

    if(document.getElementById("ai-popup"))
    return;

    const box = document.createElement("div");

    box.id = "ai-popup";

    box.style = `
    position:fixed;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    background:#111;
    color:#fff;
    z-index:999999;
    padding:20px;
    border-radius:15px;
    width:300px;
    font-family:Arial;
    box-shadow:0 0 20px #00bcd4;
    `;

    box.innerHTML = `
    <h3 style="margin-top:0">
    AI DOMAIN CHECK
    </h3>

    <p>Mã:</p>

    <input id="ai-code"
    value="${code}"
    style="
    width:100%;
    padding:10px;
    border:none;
    border-radius:8px;
    ">

    <p>Domain:</p>

    <input id="ai-domain"
    value="${domain}"
    style="
    width:100%;
    padding:10px;
    border:none;
    border-radius:8px;
    ">

    <br><br>

    <button id="save-domain"
    style="
    width:100%;
    padding:12px;
    background:#00bcd4;
    border:none;
    color:#fff;
    border-radius:10px;
    font-weight:bold;
    ">
    LƯU DOMAIN
    </button>
    `;

    document.body.appendChild(box);




    // SAVE

    document
    .getElementById("save-domain")
    .onclick = async ()=>{

        const c =
        document.getElementById("ai-code").value;

        const d =
        document.getElementById("ai-domain").value;

        DATABASE[c] = d;

        await updateDatabase();

        alert("ĐÃ LƯU DOMAIN");

        box.remove();

    };

}



// ===== MAIN =====

async function startAI(){

    await loadDatabase();

    const code = findCode();

    if(!code){

        console.log("NO CODE");

        return;

    }

    console.log("CODE:", code);




    const images = findImages();




    for(const img of images){

        const text =
        await scanImage(img);

        console.log(text);




        const domain =
        extractDomain(text);




        if(!domain)
        continue;




        console.log("FOUND:", domain);




        const saved =
        DATABASE[code];




        // CHƯA CÓ MÃ

        if(!saved){

            console.log("NEW CODE");

            showPopup(code, domain);

            return;

        }




        // DOMAIN ĐỔI

        if(saved !== domain){

            console.log("DOMAIN CHANGED");

            showPopup(code, domain);

            return;

        }




        console.log("DOMAIN OK");

    }

}



// ===== START =====

setTimeout(()=>{

    startAI();

},3000);

})();