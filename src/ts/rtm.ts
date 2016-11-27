/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="./token.ts" />
/// <reference path="./util.ts" />
/// <reference path="./init.ts" />

let slack_sdk_path: string = '@slack/client';

let user_list = {};
let channel_list = {};
let bot_list = {};
let emoji_list = {};

let emojione = require("emojione");
let RtmClient = require(slack_sdk_path).RtmClient;
let RTM_EVENTS = require(slack_sdk_path).RTM_EVENTS;
let CLIENT_EVENTS = require(slack_sdk_path).CLIENT_EVENTS;
let marked = require("marked");
let rtm = new RtmClient(token, {logLevel: 'debug'});
rtm.start();

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
  console.log(
    `Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`
  );
});


function update_message(message: {}): number {
  let pre_message: {} = message["previous_message"];
  let current_message: {} = message["message"];
  let message_id: string = "#id_" + pre_message["ts"].replace(".", "");
  let message_form = $(message_id);

  current_message["text"] += "<span style='font-size: small; color: #aaaaaa;'> (edited)</span>";
  message_form.html(message_escape(current_message["text"]));

  return 0;
}

function url_to_html(m: string): string {
  let message: string = m;
  message = message.replace(/<(http[^\|>]+)\|([^\|>]+)>/g,  "<a href='$1'>$2</a>");
  if(message == m)
    message = message.replace(/<(http[^>]+)>/g,  "<a href='$1'>$1</a>");
  return message;
}

function user_to_html(m: string): string {
  let message: string = m;
  let users: string[] = message.match(/<@([^>]+)>/g);
  if(users) {
    users.forEach(function (user) {
      let short_user: string = user.replace(/\|[^>]+/g, "");
      let name: string = "@" + user_list[short_user.substr(2, short_user.length - 3)].name;
      message = message.replace(user, name);
    });
  }
  return message;
}

function newline_to_html(m: string): string {
  let message: string = m.replace(/(\r\n|\n|\r)$/, "");
  message = message.replace(/\r\n|\n|\r/g, "<br>");
  return message;
}

function convert_emoji(m: string): string {
  let message = m;
  let emojis = m.match(/:[^:]+:/g);
  if(!!emojis) {
    for (let i = 0; i < emojis.length; i++) {
      if (emojis[i] != emojione.shortnameToImage(emojis[i])) {
        message = message.replace(emojis[i], emojione.shortnameToImage(emojis[i]));
      } else if(!!emoji_list[emojis[i].substr(1, emojis[i].length-2)]) {
        let image_url = emoji_list[emojis[i].substr(1, emojis[i].length-2)];
        let html = '<img class="emojione" src="' + image_url + '" />';
        message = message.replace(emojis[i], html);
      }
    }
  }
  message = convert_emoji_protocol(message);
  return message;
}

function convert_emoji_protocol(m: string): string {
  let message = m;
  let cdn = "//cdn.jsdelivr.net/emojione/assets/png/";
  message = message.replace(new RegExp(cdn, "g"), "https:" + cdn);
  return message;
}

function message_escape(m: string): string {
  let message: string = m;
  message = url_to_html(message);
  message = user_to_html(message);
  message = marked(message);
  message = newline_to_html(message);
  message = convert_emoji(message);

  return message;
}

rtm.on(RTM_EVENTS.MESSAGE, function (message) {
  //console.log(message);
  // update
  if(message["subtype"] == "message_changed")
    return update_message(message);

  // bot_message or message
  let user: string = "";
  let image: string = "";
  let nick: string = "NoName";
  if(message["subtype"] == "bot_message") {
    if(!bot_list[message["bot_id"]])
      get_bot_info(message["bot_id"]);
    user = bot_list[message["bot_id"]];
    image = user["icons"]["image_36"];
    nick = message["username"];
  } else {
    user = user_list[message["user"]];
    image = user["profile"]["image_32"];
    nick = user["name"];
  }
  let text: string = message["text"] ? message_escape(message["text"]) : "";
  let channel: {} = channel_list[message["channel"]];
  let table = $("#main_table");
  let ts: string = message["ts"];

  let ts_date: Date = new Date(new Date(Number(ts)*1000));
  let ts_hour: string = ts_date.getHours().toString();
  ts_hour = Number(ts_hour) < 10 ? "0" + ts_hour : ts_hour;
  let ts_min: string = ts_date.getMinutes().toString();
  ts_min = Number(ts_min) < 10 ? "0" + ts_min : ts_min;
  let ts_s: string = ts_hour + ":" + ts_min;

  let color: string = channel ? channel["color"] : channel_color(nick);
  let name: string = channel ? channel["name"] : "DM";

  let image_column: string = "<td><img src='" + image  + "' /></td>";
  let text_column: string = "<td><b>" + nick + " <span style='color: " + color + "'>#" + name + "</span></b> ";
  text_column += "<span style='color: #aaaaaa; font-size: small;'>" + ts_s + "</span><br>";
  text_column += "<span id='id_" + ts.replace(".", "") + "' class='message'>" + text + "</span></td>";

  let record: string = "<tr>" + image_column + text_column + "</tr>";
  table.append(record);
});
