/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="./token.ts" />
/// <reference path="./util.ts" />
/// <reference path="./init.ts" />

let slack_sdk_path: string = '@slack/client';

let user_lists = new Array();
let channel_lists = new Array();
let bot_lists = new Array();
let emoji_lists = new Array();

let slack = require(slack_sdk_path);
let emojione = require("emojione");
let RtmClient = slack.RtmClient;
let RTM_EVENTS = slack.RTM_EVENTS;
let CLIENT_EVENTS = slack.CLIENT_EVENTS;
let WebClient = slack.WebClient;
let marked = require("marked");
let webs = new Array();
let rtms = new Array();

let mark_read_flag = (localStorage["mark_read_flag"] == "true");

for(var i in tokens){
  rtms[i] = new RtmClient(tokens[i], {logLevel: 'debug'});
  rtms[i].start();
  webs[i] = new WebClient(tokens[i]);

  channel_lists[i] = {};
  init_channel_list(tokens[i], channel_lists[i]);


  user_lists[i] = {};
  init_user_list(tokens[i], user_lists[i]);
  emoji_lists[i] = {};
  init_emoji_list(tokens[i], emoji_lists[i]);

  // bot cannot be retrieved here
  bot_lists[i] = {};
}

for(var i in rtms){
  rtms[i].on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
    console.log(
    `Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet    connected to a channel`
    );
  });
}

function update_message(message: {}, user_list: {}, emoji_list: {}): number {
  let pre_message: {} = message["previous_message"];
  let current_message: {} = message["message"];
  let message_id: string = "#id_" + pre_message["ts"].replace(".", "");
  let message_form = $(message_id);

  current_message["text"] += "<span style='font-size: small; color: #aaaaaa;'> (edited)</span>";
  message_form.html(message_escape(current_message["text"], user_list, emoji_list));

  return 0;
}

function url_to_html(m: string): string {
  let message: string = m;
  message = message.replace(/<(http[^\|>]+)\|([^\|>]+)>/g,  "<a href='$1'>$2</a>");
  if(message == m)
    message = message.replace(/<(http[^>]+)>/g,  "<a href='$1'>$1</a>");
  return message;
}

function user_to_html(m: string, user_list: {}): string {
  let message: string = m;
  let users: string[] = message.match(/<@([^>]+)>/g);
  if(users) {
    users.forEach(function (user) {
      let short_user: string = user.replace(/\|[^>]+/g, "");
      let name: string = "@" + user_list[short_user.substr(2, short_user.length - 3)].name;
      message = message.replace(user, name);
    });
  }

  let specials: string[] = message.match(/<!([^>]+)>/g);
  if(specials) {
    specials.forEach(function (special) {
      let name: string = "@" + special.substr(2, special.length - 3);
      message = message.replace(special, name);
    });
  }
  return message;
}

function newline_to_html(m: string): string {
  let message: string = m.replace(/(\r\n|\n|\r)$/, "");
  message = message.replace(/\r\n|\n|\r/g, "<br>");
  return message;
}

function convert_emoji(m: string, emoji_list: {}): string {
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

function message_escape(m: string, user_list: {}, emoji_list: {}): string {
  let message: string = m;
  message = url_to_html(message);
  message = user_to_html(message, user_list);
  message = marked(message);
  message = newline_to_html(message);
  message = convert_emoji(message, emoji_list);

  return message;
}

function channel_mark (channel, timestamp, web) {
  web.channels.mark (channel, timestamp, function(err, info) {
    if(err) {
        console.log(err);
    }
  });
}

for(var i in rtms){
  let user_list:{} = user_lists[i];
  let channel_list:{} = channel_lists[i];
  let bot_list:{} = bot_lists[i];
  let emoji_list:{} = emoji_lists[i];
  let token: string = tokens[i]; 
  let web = webs[i];

  rtms[i].on(RTM_EVENTS.MESSAGE, function (message) {
  //console.log(message);
  // update
    if(message["subtype"] == "message_changed")
      return update_message(message, user_list, emoji_list);

    // bot_message or message
    let user: string = "";
    let image: string = "";
    let nick: string = "NoName";
    if(message["subtype"] == "bot_message") {
      if(!bot_list[message["bot_id"]])
        get_bot_info(message["bot_id"], token, bot_list);
      user = bot_list[message["bot_id"]];
      image = user["icons"]["image_36"];
      nick = message["username"];
    } else {
      user = user_list[message["user"]];
      image = user["profile"]["image_32"];
      nick = user["name"];
    }
    let text: string = message["text"] ? message_escape(message["text"], user_list, emoji_list) : "";
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
    table.prepend(record);

    if (mark_read_flag) {
      channel_mark(message["channel"], ts, web);
    }
  });
}