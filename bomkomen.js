const Client = require('instagram-private-api').V1;
const delay = require('delay');
const chalk = require('chalk');
const _ = require('lodash');
const rp = require('request-promise');
const S = require('string');
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
  name:'target',
  message:'[>] Masukkan Username Target (Tanpa @[at]):',
  validate: function(value){
    if(!value) return 'Tidak boleh kosong';
    return true;
  }
},
{
  type:'input',
  name:'text',
  message:'[>] Masukkan Text Comment (Gunakan [|] jika lebih dari 1):',
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
    return 'Harus berupa Angka!';
  }
},
{
  type:'input',
  name:'sleep',
  message:'[>] Masukkan sleeptime (MiliSeconds):',
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
const Target = async function(username){
  const url = 'https://www.instagram.com/'+username+'/'
  const option = {
    url: url,
    method: 'GET'
  }
  try{
    const account = await rp(option);
    const data = S(account).between('<script type="text/javascript">window._sharedData = ', ';</script>').s
    const json = JSON.parse(data);
    if (json.entry_data.ProfilePage[0].graphql.user.is_private) {
      return Promise.reject('Target menggunakan privasi akun');
    } else {
      const id = json.entry_data.ProfilePage[0].graphql.user.id;
      const followers = json.entry_data.ProfilePage[0].graphql.user.edge_followed_by.count;
      return Promise.resolve({id,followers});
    }
  } catch (err){
    return Promise.reject(err);
  }

}

const Media = async function(session, id){
	const Media = new Client.Feed.UserMedia(session, id);

	try {
		const Poto = [];
		var cursor;
			if (cursor) Media.setCursor(cursor);
			const getPoto = await Media.get();
			await Promise.all(getPoto.map(async(poto) => {
				Poto.push({
					id:poto.id,
					link:poto.params.webLink
				});
			}))
			cursor = await Media.getCursor()
		return Promise.resolve(Poto);
	} catch (err){
		return Promise.reject(err);
	}
}

async function ngeComment(session, id, text){
  try {
    await Client.Comment.create(session, id, text);
    return true;
  } catch(e){
    return false;
  }
}

const Excute = async function(User, TargetUsername, Text, sleep, mysyntx){
	try {
		
		/** MENCOBA UNTUK LOGIN **/
		console.log('\n');
		console.log('[?] Mencoba Login . . .');
		const doLogin = await Login(User);
		console.log(chalk`{bold.green [!] Login Berhasil!}`);

		/** MENCOBA UNTUK MENDAPATKAN MEDIA **/	
		console.log('[?] Mencoba mendapatkan Media . . .')		
		const getTarget = await Target(TargetUsername);
		var getMedia = await Media(doLogin.session, getTarget.id);
		console.log(chalk`{bold.green [!] Berhasil mendapatkan Media Dari [${TargetUsername}] }\n`);
		getMedia = _.chunk(getMedia, mysyntx);

		/** MENCOBA MENGHAPUS SEMUA MEDIA **/
		for (let i = 0; i < getMedia.length; i++) {
			console.log('[?] Mencoba untuk Like Photo/Delay \n')
			await Promise.all(getMedia[i].map(async(media) => {
				var ranText = Text[Math.floor(Math.random() * Text.length)];
                const ngeDo = await ngeComment(doLogin.session, media.id, ranText)
				const PrintOut = chalk`${ngeDo ? chalk`{bold.green Sukses Komen}` : chalk`{bold.red Gagal Komen}`}`
				console.log(chalk`> ${media.link} => ${PrintOut} [${ranText}]`);
			}))
			console.log(chalk`{yellow \n [#][>] Delay For ${sleep} MiliSeconds [<][#] \n}`)
			    await delay(sleep)
		}
    console.log(chalk`{bold.green [+] Bom Komen Post Berhasil}`)
	} catch (err) {
		console.log(err);
	}
}
console.log(chalk`
  {bold.cyan
  —————————————————— [INFORMATION] ————————————————————

  [?] {bold.green BOM KOMEN POST TARGET *SET SLEEP!}

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
//daudsanjaya
inquirer.prompt(User)
.then(answers => {
  var text = answers.text.split('|');
  Excute({
    username:answers.username,
    password:answers.password
  },answers.target,text,answers.sleep,answers.mysyntx);
})
