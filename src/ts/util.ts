/// <reference path="../../node_modules/@types/jquery/index.d.ts" />

let seedrandom = require('seedrandom');

function channel_color(s) {
    let ret:string = "#";
    for (var i = 0; i < 3; i++) {
        let rng:{(): number} = seedrandom(s + i);
        let color_num:string = Math.floor(rng() * 180).toString(16);
        if (color_num.length == 1) color_num = "0" + color_num;
        ret += color_num;
    }
    return ret;
}


function get_bot_info(id:string, token: string, bot_list: {}) {
    let api_url:string = "https://slack.com/api/bots.info";
    //console.log("token=" + token + "&bot=" + id);
    $.ajax({
        type: "GET",
        url: api_url,
        data: "token=" + token + "&bot=" + id,
        async: false,
        success: function (data) {
            if (data["ok"]) {
                let bot = data["bot"];
                //console.log("data, bot");
                //console.log(data);
                //console.log(bot);
                bot_list[bot["id"]] = bot;
            }
        }
    });
}

function get_team_info(token: string, team_info: {}) {
    let api_url:string = "https://slack.com/api/team.info";
    $.ajax({
        type: "GET",
        url: api_url,
        data: "token=" + token,
        async: false,
        success: function (data) {
            if (data["ok"]) {
                team_info["team"] = data["team"];
            }
        }
    });
}

// Note: $.ajax does not properly recieve binary files,
// so we need to use XMLHttpRequest directly.
// http://www.henryalgus.com/reading-binary-files-using-jquery-ajax/
function get_image(image_url: string, token: string, tag_id: string, mime: string) {
    let request = new XMLHttpRequest();

    request.open("GET", image_url, /*async: */true);
    request.responseType = "arraybuffer";
    request.setRequestHeader("Authorization", "Bearer " + token);

    request.onreadystatechange = function(){
	let image_base64 = new Buffer(this.response).toString('base64');
	$("#" + tag_id)[0]["src"] = "data:" + mime + ";base64," + image_base64;
    }

    request.send();
}

function get_maximum_thumbnail(file: {}): string{
    let sizes: string[] = ["480", "360", "160", "80", "64"];

    for(var i in sizes){
	if(!!file["thumb_" + sizes[i]])
	    return file["thumb_" + sizes[i]];
    }
}
