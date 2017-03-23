const remote = require('electron').remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

let clicked_dom;
let team_to_show, ch_to_show;

var menu = new Menu();
menu.append(new MenuItem({
    label: 'mark as read',
    type: 'checkbox',
    checked: mark_read_flag,
    click: function() {
        mark_read_flag = !mark_read_flag;
        localStorage["mark_read_flag"] = mark_read_flag;
    }
}));

menu.append(new MenuItem({
    label: 'show this channel',
    type: 'checkbox',
    checked: show_one_channel,
    click: function(event) {
        show_one_channel = !show_one_channel;
		let dom = clicked_dom;

		while(true){
		    // outside of table is clicked
		    if(!dom.parentNode)
			break;

		    if(!!dom.id && dom.id.indexOf("id_tr_") != -1){
			// dom.id: "id_tr_time_teamname_chname"
			team_to_show = dom.id.split("_")[3];
			ch_to_show = dom.id.split("_")[4];
			break;
		    }
		    else{
			dom = dom.parentNode;
		    }
		}

		let trs = $("tr");
		for(var i=0; i<trs.length; i++){
		    if(!trs[i].id)
			continue;

		    if(trs[i].id.indexOf(team_to_show) == -1 || trs[i].id.indexOf(ch_to_show) == -1){
				if(show_one_channel){
				    trs[i].style.display = "none";
				}
				else{
				    trs[i].style.display = "";
				}
		    }
		}
    }
}));

menu.append(new MenuItem({
    label: 'show pencils',
    type: 'checkbox',
    checked: show_pencils_flag,
    click: function() {
        show_pencils_flag = !show_pencils_flag;
        localStorage["show_pencils_flag"] = show_pencils_flag;

        if(show_pencils_flag) {
        	$('.message-button').each(function(){
        		$(this).addClass('active_pencil');
        		$(this).removeClass('inactive_pencil');
        	});
        } else {
        	$('.message-button').each(function(){
        		$(this).addClass('inactive_pencil');
        		$(this).removeClass('active_pencil');
        	});
        }
    }
}));

window.addEventListener('contextmenu', function (e) {
    clicked_dom = e.target;
    e.preventDefault();
    menu.popup(remote.getCurrentWindow());
}, false);
