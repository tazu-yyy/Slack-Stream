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
let show_pencils_flag = (localStorage["show_pencils_flag"] == "true")
let show_one_channel = false;

let post_message;
let posting = false;

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

$("#slack_message_input").keypress(function(e) {
  if(e.which == 13 && e.altKey){ // Alt + Enter
    let input = $("#slack_message_input");
    input.val(input.val() + "\n");
  }else if(e.which == 13){ // Enter
    e.preventDefault();
    submit_message();
  } 
});

$("#slack_message_input").keyup(function(e) {
  if(e.which == 27){ // Esc
    $('#slack_message_form').hide();
  }
});

function submit_message(): void {
  let message = $("#slack_message_input").val();
  if(posting || message == "") return;

  posting = true;
  post_message (message, (err) => {
    posting = false;
    if(err) console.log(err);
    else {
      $("#slack_message_input").val("");
      $("#slack_message_form").hide();
    }
  });
}

function delete_message(tr_id: string, message: {}, team_name: string, ch_name: string): number {
  let pre_message: {} = message["previous_message"];
  let current_message: {} = message["message"];
  let message_tr = $("#" + tr_id);

  message_tr.remove();

  return 0;
}

function create_attachment_message(attachments: {}): string {
  let main_dom = $('<div></div>').addClass('div-attachment pull-left');

  // author
  let author_dom = $('<span></span>').addClass('attachment-author');
  if(attachments['author_icon']) author_dom.html('<img src="' + attachments['author_icon'] + '" />');
  if(attachments['author_link']) {
    let author_name_dom = $('<span></span>').addClass('attachment-author-name');
    if (attachments['author_link']) {
      author_name_dom = $('<a></a>').attr('href', attachments['author_link']).addClass('attachment-author-name');
    }
    author_name_dom.text(attachments['name']);
    author_dom.append(author_name_dom);
    main_dom.append(author_dom);
  }

  // title
  if(attachments['title']) {
    let title_dom = $('<b></b>').addClass('attachment-title');
    if(attachments['title_link']) {
      title_dom = $('<a></a>').attr('href', attachments['title_link']).attr('style', 'font-weight: bold;').addClass('attachment-title');
    }
    title_dom.text(attachments['title']);
    main_dom.append(title_dom);
  }

  // text
  if(attachments['text']) {
    main_dom.append(message_escape(attachments['text'], {}, {}));
  }

  // image
  if(attachments['image_url']) {
    let image_dom = $('<div style="width: 100%;"></div>').addClass('attachment-image');
    image_dom.html('<img src="' + attachments['image_url'] + '" width="100%" />');
    main_dom.append(image_dom);
  } else if (attachments['thumb_url']) {
    let thumb_dom = $('<div style="width: 20%;"></div>').addClass('pull-right');
    let width = 'width="100%"', height = "";
    thumb_dom.html('<img src="' + attachments['thumb_url'] + '" ' + width + ' ' + height + '/>');
    main_dom.attr('style', 'width: 75%;');
    return main_dom.prop('outerHTML') + thumb_dom.prop('outerHTML');
  }
  return main_dom.prop('outerHTML');
}

function update_message(message_id: string, message: {}, user_list: {}, emoji_list: {}): number {
  let pre_message: {} = message["previous_message"];
  let current_message: {} = message["message"];
  let message_form = $("#" + message_id);

  current_message["text"] += "<span style='font-size: small; color: #aaaaaa;'> (edited)</span>";
  let edited_message = message_escape(current_message["text"], user_list, emoji_list);
  if(current_message["attachments"]) {
    edited_message += create_attachment_message(current_message["attachments"][0]);
  }

  message_form.html(edited_message);
  return 0;
}

function mail_to_html(m: string): string {
  let message: string = m;
  message = message.replace(/<mailto:[^\|>]+\|([^\|>]+)>/g,  "<a href='mailto:$1'>$1</a>");
  return message;
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
  
  message = message.replace(/<@([^>]+)>/g, function (user) {
      let short_user: string = user.replace(/\|[^>]+/g, "");
      let name: string = "@" + user_list[short_user.substr(2, short_user.length - 3)].name;
      return name;
  });

  message = message.replace(/<!([^>]+)>/g, function(special) {
      let all: string = special.substr(2, special.length - 3);
      let bar: number = all.indexOf("|");
      let name: string = bar == -1 ? ("@" + all) : all.substr(bar + 1);
      return name;
  });

  return message;
}

function newline_to_html(m: string): string {
  let message: string = m.replace(/(\r\n|\n|\r)$/, "");
  message = message.replace(/\r\n|\n|\r/g, "<br>");
  return message;
}

function convert_emoji(m: string, emoji_list: {}): string {
  return m.replace(/:[a-zA-Z0-9_+\-]+:/g, function(emoji) {
      if (emoji != emojione.shortnameToImage(emoji)) {
        return emojione.shortnameToImage(emoji);
      } else if(!!emoji_list[emoji.substr(1, emoji.length-2)]) {
        let image_url = emoji_list[emoji.substr(1, emoji.length-2)];
        let html = '<img class="emojione" src="' + image_url + '" />';
        return html;
      } else {
        return emoji;
      }
  });
}

function message_escape(m: string, user_list: {}, emoji_list: {}): string {
  let message: string = m;
  message = url_to_html(message);
  message = mail_to_html(message);
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

function extract_text(message: any, user_list: {}, emoji_list: {}): string {
  if(message["text"]) {
    return message_escape(message["text"], user_list, emoji_list);
  } else if(message["attachments"]) {
    let attachments: [any] = message["attachments"];
    return attachments.map (attachment => {
      let text = attachment["text"] ? message_escape(attachment["text"], user_list, emoji_list) : "";
      let pretext = attachment["pretext"] ? message_escape(attachment["pretext"], user_list, emoji_list) : "";
      return text + pretext;
    }).reduce((a, b) => a + b);    
  } else {
     return "";
  }
}

for(var i in rtms){
  let user_list:{} = user_lists[i];
  let channel_list:{} = channel_lists[i];
  let bot_list:{} = bot_lists[i];
  let emoji_list:{} = emoji_lists[i];
  let token: string = tokens[i]; 
  let web = webs[i];
  let team_info = {};

  rtms[i].on(RTM_EVENTS.MESSAGE, function (message) {
    let user: string = "";
    let image: string = "";
    let nick: string = "NoName";
    let channel: {} = channel_list[message["channel"]];
    let channel_name: string = channel ? channel["name"] : "DM";
    if(!team_info["team"])
      get_team_info(token, team_info);
    let team_name: string = team_info["team"]["name"];

    let ts: string = message["ts"];
    let id_base = ts.replace(".", "") + "_" + team_name + "_" + channel_name;
    let tr_id = "id_tr_" + id_base;
    let text_id = "text_" + id_base;
    let button_id = "button_" + id_base;

    if(message["subtype"] == "message_deleted") {
      let pre_id_base = message["previous_message"]["ts"].replace(".", "") + "_" + team_name + "_" + channel_name;
      let pre_tr_id = "id_tr_" + pre_id_base;
      return delete_message(pre_tr_id, message, team_name, channel_name);
    } else if(message["subtype"] == "message_changed") {
      let pre_id_base = message["previous_message"]["ts"].replace(".", "") + "_" + team_name + "_" + channel_name;
      let pre_text_id = "text_" + pre_id_base;
      return update_message(pre_text_id, message, user_list, emoji_list);
    } else if(message["subtype"] == "bot_message") {
      if(!message["bot_id"]) { // "Only visible to you" bot has no bot_id or user info
        image = ""
        nick = "slackbot"
      } else { // Normal bots
        if(!bot_list[message["bot_id"]])
          get_bot_info(message["bot_id"], token, bot_list);
        user = bot_list[message["bot_id"]];
        image = user["icons"]["image_36"];
        nick = message["username"];
      }
    } else {
      user = user_list[message["user"]];
      image = user["profile"]["image_32"];
      nick = user["name"];
    }
    let text: string = extract_text(message, user_list, emoji_list);
    let table = $("#main_table");

    let ts_date: Date = new Date(new Date(Number(ts)*1000));
    let ts_hour: string = ts_date.getHours().toString();
    ts_hour = Number(ts_hour) < 10 ? "0" + ts_hour : ts_hour;
    let ts_min: string = ts_date.getMinutes().toString();
    ts_min = Number(ts_min) < 10 ? "0" + ts_min : ts_min;
    let ts_s: string = ts_hour + ":" + ts_min;

    let color: string = channel ? channel["color"] : channel_color(nick);
    
    let link: string = "";
    if(channel_name == "DM"){
        link = "slack://user?team=" + team_info["team"]["id"] + "&id=" + message["user"];
    }else{
        link = "slack://channel?team=" + team_info["team"]["id"] + "&id=" + message["channel"];
    }


    let image_column: string = "<td><img src='" + image  + "' /></td>";
    let text_column: string = "<td><b>" + nick + " <a class='slack-link' href='" + link + "'><span style='color: " + color + "'>#" + channel_name + "</span></b></a> ";
    if(tokens.length > 1) {
      text_column += "(" + team_name + ") ";
    }
    text_column += "<span style='color: #aaaaaa; font-size: small;'>" + ts_s + "</span>";
    let pencil_state = show_pencils_flag ? 'active_pencil' : 'inactive_pencil';
    text_column += " <span id='" + button_id + "' class='glyphicon glyphicon-pencil message-button " + pencil_state + "'></span><br>";
    text_column += "<span id='" + text_id + "' class='message'> "+ text + "</span></td>";

    let style: string = "";
    if(show_one_channel && (team_name != team_to_show || channel_name != ch_to_show))
      style = "display: none";
    let record: string = "<tr id='" + tr_id +
      "' style='" + style + "'>"+ image_column + text_column + "</tr>";
    table.prepend(record);

    var button = $("#" + button_id);
    $("#" + button_id).click(function() {
      let display_channel = channel ? ("#" + channel_name) : ("DM to " + nick);
      $("#slack_message_form").show();

      $("#slack_message_channel").html(display_channel);
      $("#slack_message_channel").css("color", color);
      $("#slack_message_input").focus();

      post_message = function(text, on_finish){
        if(channel){
          web.chat.postMessage (message["channel"], text, { "as_user": true }, function(err, info){
            on_finish(err);
          });
        }else{
          web.chat.postMessage ("@" + nick, text, { "as_user": true }, function(err, info){
            on_finish(err);
          });
        }
      };
    });

    if (channel && mark_read_flag) {
      channel_mark(message["channel"], ts, web);
    }
  });
}
