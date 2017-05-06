function value_or_retry(value, retry_func){
    return value || retry_func();
}

class Channel {
    public name: string;
    public id: string;
    public color: string;
    public is_dm: boolean;

    constructor(channel_list: {}, im_list:{}, user_list: {}, channel_id: string, token: string){
	let info: {} = value_or_retry(channel_list[channel_id], function(){
	    // retry once in case a new channel was added after
	    // channel_list had been initialized
	    init_channel_list(token, channel_list);
	    return channel_list[channel_id];
	});

	// if info is undefined, this channel is a DM
	// (or a network error has occured, which we don't consider for now)
	if(!info) {
	    let im: {} = value_or_retry(im_list[channel_id], function(){
		init_im_list(token, im_list);
		return im_list[channel_id];
	    });

	    // insert a fake channel into channe_list so that DMs
	    // and normal channels can be treated in the same way later on
	    channel_list[channel_id] = {
		"name": "DM_to_" + user_list[im["user"]]["name"],
		"color": channel_color(user_list[im["user"]]["name"])
	    };
	    info = channel_list[channel_id];
	    this.is_dm = true;
	}

	this.name = info["name"];
	this.id = channel_id;
	this.color = info["color"]
    }
}
