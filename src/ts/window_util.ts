const remote = require('electron').remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

var menu = new Menu();
menu.append(new MenuItem({
    label: 'mark read',
    type: 'checkbox',
    checked: mark_read_flag,
    click: function() {
        mark_read_flag = !mark_read_flag;
        localStorage["mark_read_flag"] = mark_read_flag;
    }
}));

window.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    menu.popup(remote.getCurrentWindow());
}, false);
