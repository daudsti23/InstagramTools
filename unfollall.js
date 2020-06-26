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
    if(!value) return 'Tidak boleh kosong;
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
  name:'mysyntx',
  message:'[>] Masukkan Total Target yang kamu mau (ITTYW):',
  validate: function(value){
    value = value.match(/[0-9]/);
    if (value) return true;
    return 'Hanya Gunakan Angka!';
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

const Unfollow = async function(session, accountId){
  try {
    await Client.Relationship.destroy(session, accountId);
    return chalk`{bold.green SUKSES}`;
  } catch (err){
    return chalk`{bold.red GAGAL}`;
  }
}

const Excute = async function(User,sleep,mysyntx){

  try {
    console.log(chalk`{yellow [?] Mencoba Login . . .}`);
    const doLogin = await Login(User);
    console.log(chalk`{green [!] Login Berhasil }{yellow [?] Mencoba untuk Unfollow Semua Akun yang diikuti . . .}`)
    const feed = new Client.Feed.AccountFollowing(doLogin.session, doLogin.account.id);
    var cursor;
    do{
      if (cursor) feed.setCursor(cursor);
      var getPollowers = await feed.get();
      getPollowers = _.chunk(getPollowers, mysyntx);
      for (let i = 0; i < getPollowers.length; i++) {
        var timeNow = new Date();
        timeNow = `${timeNow.getHours()}:${timeNow.getMinutes()}:${timeNow.getSeconds()}`
        await Promise.all(getPollowers[i].map(async(account) => {
          const doUnfollow = await Unfollow(doLogin.session, account.id);
          console.log(chalk`[{magenta ${timeNow}}] Unfollow {yellow @${account.params.username}} => ${doUnfollow}`);
        }));
        console.log(chalk`{yellow \n [#][>] Delay For ${sleep} MiliSeconds [<][#] \n}`);
        await delay(sleep);
      }
      cursor = await feed.getCursor();
    } while(feed.isMoreAvailable())
    console.log(chalk`{bold.green [+] Unfollow Semua Akun Berhasil!}`)
  } catch(e) {
    console.log(e)
  }
}

console.log(chalk`
  {bold.cyan
  —————————————————— [INFORMATION] ————————————————————
  [?] {bold.green UNFALL | Unfollow All Following IG!}
  
  [?] {bold.blue SUBSCRIBE YOUTUBE} {bold.cyan Daud Sanjaya}

  ——————————————————  [THANKS TO]  ————————————————————
  [✓] SCRIPT BY DAUD SANJAYA (daudsti11@gmail.com)
  [✓] CODE BY CYBER SCREAMER CCOCOT (ccocot@bc0de.net)
  [✓] FIXING & TESTING BY SYNTAX (@officialputu_id)
  [✓] CCOCOT.CO | BC0DE.NET | NAONLAH.NET | WingkoColi
  [✓] SGB TEAM REBORN | Zerobyte.id | ccocot@bc0de.net 
  —————————————————————————————————————————————————————
  Apa yang baru?
  1. Input Target/delay Manual (ITTYW)
  —————————————————————————————————————————————————————}
      `);

inquirer.prompt(User)
.then(answers => {
  Excute({
    username:answers.username,
    password:answers.password
  },answers.sleep,answers.mysyntx);
})
