const service = require('./service/index');

module.exports = ()=>{
    service.CallSite().then((val)=>{
        //console.log(val);
    });
}