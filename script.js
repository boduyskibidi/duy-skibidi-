const GITHUB_USER = "USER";
const GITHUB_REPO = "REPO";
const GITHUB_FILE = "domain.json";

/*
GitHub Token
Fine-grained token:
Contents = Read & Write
*/

const GITHUB_TOKEN = "TOKEN";

const RAW_URL =
`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/${GITHUB_FILE}`;

const API_URL =
`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`;

let DATABASE = {};



// LOAD DATABASE

async function loadDatabase(){

    try{

        DATABASE = await fetch(RAW_URL)
        .then(r=>r.json());

        console.log("DATABASE:", DATABASE);

    }catch(e){

        console.log("LOAD ERROR", e);

    }

}



// FIND CODE

function findCode(){

    const text = document.body.innerText;

    const match = text.match(/\d{3}-\d+/);

    if(match){

        return match[0];

    }

    return null;

}



// FIND IMAGE

function findImages(){

    return [...document.querySelectorAll("img")]
    .filter(img=>img.width > 100);

}



// OCR IMAGE

async function scanImage(img){

    const result = await Tesseract.recognize(
        img.src,
        "eng"
    );

    return result.data.text;

}



// EXTRACT DOMAIN

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



// SHOW POPUP

function showPopup(code, oldDomain, newDomain){

    const box = document.createElement("div");

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
    `;

    box.innerHTML = `
    <h3>AI DOMAIN CHECK</h3>

    <p>Mã:</p>
    <input id="ai-code"
    value="${code}"
    style="width:100%;padding:10px">

    <p>Domain:</p>
    <input id="ai-domain"
    value="${newDomain || ''}"
    style="width:100%;padding:10px">

    <br><br>

    <button id="save-domain"
    style="
    width:100%;
    padding:12px;
    background:#00bcd4;
    border:none;
    color:#fff;
    border-radius:10px;
    ">
    LƯU DOMAIN
    </button>
    `;

    document.body.appendChild(box);

    document
    .getElementById("save-domain")
    .onclick = async ()=>{

        const c =
        document.getElementById("ai-code").value;

        const d =
        document.getElementById("ai-domain").value;

        await updateGithub(c,d);

        alert("Đã cập nhật GitHub");

        box.remove();

    };

}



// UPDATE GITHUB

async function updateGithub(code, domain){

    DATABASE[code] = domain;

    const oldFile = await fetch(API_URL,{
        headers:{
            Authorization:`token ${GITHUB_TOKEN}`
        }
    }).then(r=>r.json());

    const sha = oldFile.sha;

    const content = btoa(
        JSON.stringify(DATABASE,null,2)
    );

    await fetch(API_URL,{

        method:"PUT",

        headers:{
            Authorization:`token ${GITHUB_TOKEN}`,
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            message:`update ${code}`,

            content:content,

            sha:sha

        })

    });

}



// MAIN

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

        try{

            const text =
            await scanImage(img);

            console.log(text);

            const domain =
            extractDomain(text);

            if(!domain) continue;

            console.log("FOUND:", domain);

            const saved =
            DATABASE[code];

            // chưa có mã

            if(!saved){

                showPopup(
                    code,
                    null,
                    domain
                );

                return;

            }

            // domain đổi

            if(saved !== domain){

                showPopup(
                    code,
                    saved,
                    domain
                );

                return;

            }

            console.log("DOMAIN OK");

        }catch(e){

            console.log(e);

        }

    }

}



startAI();