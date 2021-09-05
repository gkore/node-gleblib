const axios = require('axios');
const { EventEmitter } = require('stream');

//боб боб спёр с стаковерфлав
function CustomException(message) {
    const error = new Error(message);
    error.code = "GLEBLIB_ERROR";
    return error;
}
CustomException.prototype = Object.create(Error.prototype);

class gleblib extends EventEmitter {
    //дорогой почитатель говнокода, да будет тебе известно, что я знаю, 
    //что эти поля должны быть приватными, но грёбанный автоформат vscode не даёт
    //мне этого сделать, прошу отнестить к этому с пониманием
    res = null;
    ts = null;
    token = null;
    groupId = null;

    constructor(_token, _groupId) {
        super()
        this.token = _token;
        this.groupId = _groupId;
    }

    async callAPI(method, params) {
        if (this.token == null) {
            throw new CustomException("Token isn't set!");
        }
        var url = `https://api.vk.com/method/${method}?${encodeURI(params)}&access_token=${this.token}&v=5.131`;
        let res = await axios.get(url);
        return res.data.response;
    }

    async listen() {
        const ffres = await this.longPollReq(this.res.server, this.res.key, this.ts);
        for (var i = 0; i < ffres.updates.length; i++) {
            this.emit(ffres.updates[i].type, ffres.updates[i].object)
        }
        this.ts = ffres.ts;
        this.listen();
    }
    async start() {
        this.res = await this.getLPServer(this.groupId);
        this.ts = this.res.ts
        this.listen();
    }

    async longPollReq(server, key, ts) {
        var url = `${server}?act=a_check&key=${key}&ts=${ts}&wait=25`;
        return (await axios.get(url)).data;
    }

    async sendMessage(peer, text, keyboard) {
        if (keyboard == null) {
            keyboard = '';
        }
        return this.callAPI("messages.send", `peer_id=${peer}&message=${text}&random_id=0&keyboard=${JSON.stringify(keyboard)}`);
    }

    async getLPServer(group) {
        return this.callAPI("groups.getLongPollServer", "group_id=" + group);
    }

    async userInfo(id) {
        return this.callAPI("users.get", "user_ids=" + id);
    }
}

module.exports = gleblib;