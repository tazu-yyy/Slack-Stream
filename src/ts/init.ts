/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="./util.ts" />

function init_data_from_api(api_url:string, token:string, success_func, parameters = []):number {
    let params:string = "";
    for (let parameter of parameters) {
        params = "&";
        params += parameter[0] + "=" + parameter[1];
    }

    $.ajax({
        type: "GET",
        url: api_url,
        data: "token=" + token + params,
        success: success_func
    });
    return 0;
}

function init_user_list(token:string, user_list: {}) {
    let api_url:string = "https://slack.com/api/users.list";
    init_data_from_api(api_url, token, function (data) {
        if (data["ok"]) {
            data["members"].forEach(function (member) {
                user_list[member["id"]] = member;
                console.log(user_list)
            });
        }
    });
};

function init_channel_list(token: string, channel_list: {}) {
    let api_url:string = "https://slack.com/api/channels.list";
    let private_api_url:string = "https://slack.com/api/groups.list";

    init_data_from_api(api_url, token, function (data) {
        if (data["ok"]) {
            data["channels"].forEach(function (channel) {
                channel_list[channel["id"]] = channel;
                channel_list[channel["id"]]["color"] = channel_color(channel["name"])
            });
            console.log(channel_list);
        }
    });

    init_data_from_api(private_api_url, token, function (data) {
        if (data["ok"]) {
            data["groups"].forEach(function (channel) {
                channel_list[channel["id"]] = channel;
            });
            console.log(channel_list);
        }
    });

};

function init_emoji_list(token: string, emoji_list: {}) {
    let api_url:string = "https://slack.com/api/emoji.list";
    init_data_from_api(api_url, token, function (data) {
        if (data["ok"]) {
            for (let key in data["emoji"]) {
                emoji_list[key] = data["emoji"][key];
            }
            console.log(emoji_list);
        }

    });
};
