const axios = require('axios');
const cheerio = require('cheerio');
const hashmap = require('hashmap');
const psl = require('psl');

const url = "https://www.apple.com";

const domain = psl.parse('www.apple.com').domain;
let map = new hashmap();
let levels = 0;

const extractHostname = (url) => {
    let hostname='';
    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }
    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];
    return hostname;
}

const trigger = async () => {
    map.set(url,url);
    await crawlUrlContent(url);
    map.forEach(function(value, key) {
        console.log(value);
    });
}

const crawlUrlContent = async (url) => {
    levels++;
    try {
        if(levels<=3){//limit search to 3 levels
            const response = await axios.get(url);
            const pageLinks = processUrlContent(url,response.data);
            if(pageLinks.length>0){
                for(const element of pageLinks){
                    if(!map.has(element)){
                        map.set(element,element);
                    }
                    await crawlUrlContent(element);
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
}

const processUrlContent = (link,data) => {
    try{
        const $ = cheerio.load(data);
        //return any links for crawling
        let linkList = [];
        $('a:not([href*=javascript],[href^=#])').each((i,elem)=>{
            let link = $(elem).attr('href');
            if(psl.parse(link).domain==undefined){
                if(psl.parse(extractHostname(link)).domain!==domain){
                    link = `https://www.${domain}${link}`;
                }
            }
            linkList.push(link.replace(/\/$/, ""));
        });
        return linkList;
    }catch(error){
        console.log(error);
    }
}

module.exports.CallSite = trigger;