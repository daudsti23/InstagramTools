'use strict'

const Client = require('instagram-private-api').V1;
const delay = require('delay');
const chalk = require('chalk');
const _ = require('lodash');
const inquirer = require('inquirer');

const User = [
    {
        type:'input',
        name:'username',
        message:'[>] Masukkan Username:',
	validate: function(value){
		if(!value) return 'Tidak boleh kosong';
		return true;
	}
    },
    {
        type:'password',
        name:'password',
        message:'[>] Masukkan Password:',
        mask:'*',
	validate: function(value){
		if(!value) return 'Tidak boleh kosong';
		return true;
	}
    },
    {
        type:'input',
        name:'sleep',
        message:'[>] Masukkan Sleeptime (MiliSeconds):',
        validate: function(value){
            value = value.match(/[0-9]/);
            if (value) return true;
            return 'Delay is number';
        }
    }
]

const Login = async function(User){

    /** Save Account **/
    const Device = new Client.Device(User.username);
    const Storage = new Client.CookieMemoryStorage();
    const session = new Client.Session(Device, Storage);

    try {
        await Client.Session.create(Device, Storage, User.username, User.password)
        const account = await session.getAccount();
        return Promise.resolve({session,account});
    } catch (err) {
        return Promise.reject(err);
    }

}

const Like = async function(session,media){
    try {
        if (media.params.hasLiked) {
           return chalk`{bold.blue Sudah Di Like}`;
        }
        await Client.Like.create(session, media.id);
        return chalk`{bold.green Sukses Like}`;
    } catch (err) {
        return chalk`{bold.red Gagal Like}`;
    }
}

const Excute = async function(User, sleep){
    try {
        console.log(chalk`\n{yellow [?] Mencoba Login . . .}`);
        const doLogin = await Login(User);
        console.log(chalk`{green [!] Login Berhasil}, {yellow [?] Mencoba Like semua Media di Feed / Timeline . . .\n}`);
        const feed = new Client.Feed.Timeline(doLogin.session);
        var cursor;
        do {
            if (cursor) feed.setCursor(cursor);
            var media = await feed.get();
            media = _.chunk(media, 10);
            for (var i = 0; i < media.length; i++) {
                await Promise.all(media[i].map(async (media) => {
                    const doLike = await Like(doLogin.session, media);
                    console.log(chalk`[{bold.green Username:}] ${media.params.user.username}\n[{cyan ${media.id}}] => [${doLike}]`);
                }))
                await console.log(chalk`{yellow \n [#][>] Delay For ${sleep} MiliSeconds [<][#] \n}`);
                await delay(sleep);
            }
        } while(feed.isMoreAvailable());
    } catch (err) {
        console.log(err);
    }
}

console.log(chalk`
 {bold.cyan
  —————————————————— [INFORMATION] ————————————————————

  [?] {bold.green BOTLIKEv1 | Like/Love TL IG *SET SLEEP!}

  [?] {bold.blue SUBSCRIBE YOUTUBE} {bold.cyan Daud Sanjaya}

  ——————————————————  [THANKS TO]  ————————————————————
  [✓] SCRIPT BY DAUD SANJAYA (daudsti11@gmail.com)
  [✓] CODE BY CYBER SCREAMER CCOCOT (ccocot@bc0de.net)
  [✓] FIXING & TESTING BY SYNTAX (@officialputu_id)
  [✓] CCOCOT.CO | BC0DE.NET | NAONLAH.NET | WingkoColi
  [✓] SGB TEAM REBORN | Zerobyte.id | ccocot@bc0de.net 
  —————————————————————————————————————————————————————}
      `);

inquirer.prompt(User)
    .then(answers => {
        Excute({
            username:answers.username,
            password:answers.password
        },answers.sleep);
    })
