const axios = require('axios');
const cheerio = require('cheerio');
const hashmap = require('hashmap');
const psl = require('psl');

const url = "https://www.google.com/";
const term = "About";

const domain = psl.parse(url).domain;
let matches = new hashmap();
let map = new hashmap();

const readUrlContent = async () => {
    try {
      const response = await axios.get(url);
      processUrlContent(url,response.data);
      console.log(`Searched ${map.size} pages, Found ${matches.size} pages with the term ${term}`);
      //loop map and return results
    } catch (error) {
      console.error(error);
    }
}

const processUrlContent = async(link,data) => {
    try{
        const $ = cheerio.load(data);
        //check page content for term
        $('*:not(link,script,meta,image,style,iframe)').each((i,elem)=>{
            const text = $(elem).text();
            if(text.includes(term)){
                console.log(term);
                //TODO: add context text
                matches.set(link,`...${term}...`)
                return false;
            }
        });
        //store urls and search if not crawled yet
        $('a:not([href*=javascript],[href^=#])').each((i,elem)=>{
            const link = $(elem).attr('href');
            //make sure we haven't been to this page, that links link to same domain, and that we don't go any deeper than 2 levels
            if(!map.has(link && psl.parse(link)===domain) && map.size<2){
                map.set(link,link);
                //readUrlContent(link);
            }
        });
    }catch(error){

    }
}

module.exports.CallSite = readUrlContent;