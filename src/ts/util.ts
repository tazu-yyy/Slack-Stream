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
