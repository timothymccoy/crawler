const remote = require('electron').remote;
const bootstrapper = remote.require('./index.js');
const fs = require('fs');
const path = require('path');
const request = require('request');
const progress = require('request-progress');

var config = require('./config.json');

var locationString = document.getElementById("locString");
var progressData = document.getElementById("progressData");

locationString.innerHTML = config.LocationName;


request(config.MediaPath+config.LocationId, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var resultsString = response.toJSON().body;
    var jsonObj = JSON.parse(resultsString);
    var files = jsonObj;
    var count = files.length;
    var fileIndex = 0;
    var filesToDownload = [];

    //compare local file list to files
    var localFiles = fs.readdirSync('./media');

    function contains(a,obj){
        var i = a.length;
        while(i--){
            if(a[i] === obj){
                return true;
            }
        }
        return false;
    }

    files.forEach(function(item){
        var pass = contains(localFiles,item.Name);
        if(!pass){
            filesToDownload.push(item);
        }
    });

    //delete local files NOT in playlist
    for(var i in localFiles){
        var doDelete = true;
        for(var y in files){
            if(localFiles[i]===files[y].Name){
                doDelete=false;
                break;
            }
        }
        if(doDelete){
	    console.log("Extra file detected");
	    console.log(localFiles[i]);
            fs.unlink('./media/'+localFiles[i]);
        }
        
    }

    if(filesToDownload==0){
	    progressData.style.width = "100%";
	    setTimeout(function(){
	      bootstrapper.openLoop();
	      bootstrapper.closeImporter();
	    },2000);
	    }else{
	        console.log("starting download");
    	}

    console.log("DOWNLOAD LIST");
    console.log(filesToDownload);


    for(var i=0; i<filesToDownload.length;i++){
        progress(request(filesToDownload[i].File), {
            //update throttle or delay if needed
        })
        .on('progress', function (state) {
            var parsed = parseFloat(Math.round(state.percent * 100) / 100).toFixed(2);
            var pwidth = (parsed*100)+"%";
            progressData.style.width = (parsed*100)+"%";
        })
        .on('error', function (err) {
            console.log("import error");
            // Do something with err 
        })
        .on('end', function () {
            fileIndex++;
            console.log("compeleted file: "+fileIndex);
            if(fileIndex==filesToDownload.length){
                console.log("dload complete");
                progressData.style.width = "100%";
                bootstrapper.openLoop();
                bootstrapper.closeImporter();
                
            }
        })
        .pipe(fs.createWriteStream('./media/'+filesToDownload[i].Name))
    }
  }else{
    var noConn = document.getElementById("noConn");
    noConn.innerHTML = "NO SERVER CONNECTION";
    progressData.style.width = "100%";
    setTimeout(function(){
      bootstrapper.openLoop();
      bootstrapper.closeImporter();
      console.log(response);
    },2000);
  }
})