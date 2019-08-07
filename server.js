/*
 * Isekai by bomb_and_kou#0669
 */
const fetch = require('node-fetch');
var https = require('https');
var querystring = require('querystring');
const btoa = require('btoa');
const CLIENT_ID = process.env.clientID
const CLIENT_SECRET = process.env.clientSecret


const Discord = require("discord.js")
const client = new Discord.Client({
  disableEveryone: true,
  messageCacheLifetime:60,
  messageSweepInterval:120
});
const config = require("./config.json");
var Filter = require('./filter/badwords.js');
var filter = new Filter({
  placeHolder: '×',
  emptyList: true
});
const express = require('express');
const app = express();
const path = require("path")
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
var statusMessage = 0
app.get("/ping", (request, response) => {
  //response.send("Hello Medra")
  response.sendStatus(200);
  userdb.read()
  var status = "Version " + config.version + " | g.help"
  switch(statusMessage){
    case 0:
    status = "Version " + config.version + " | g.help"
    break
    case 1:
    userdb.read()
    status = "Current Users: " + userdb.get("users").size().value() + " | g.help"
    break
    case 2:
      db.read()
    status = "Connected Channels: " + db.get("links").size().value() + " | g.help"
    break
    default:
      banned.read()
    statusMessage = -1  
    status = "Banned Users: " + banned.get("bannedUsers").size().value() + " | g.help"
    break
  }
  statusMessage++
  client.user.setPresence({
    game: {
      name: status
    }
  })
  
  
  
  
  let addlist = userdb.get("users").filter({"role": "unregistered"}).value()
  if (addlist.length>0){console.log("Clearing Expired Tokens")}
  for (let i=0;i<addlist.length;i++){
    let o = addlist[i]
    if (MinutesAgo(o.joined)>30){
      console.log(MinutesAgo(o.joined),o.name)
      userdb.get("users").remove({'id':o.id}).write()
      client.users.get(o.id).send("```Your Pending Authorization has Expired.```")
    }
  }
  addlist = [];
  addlist = userdb.get("users").filter({"role": "homeless"}).value()
  if (addlist.length>0){console.log("Clearing homeless users")}
  for (let i=0;i<addlist.length;i++){
    let o = addlist[i]
    if (MinutesAgo(o.expiration)>1440){
      console.log(MinutesAgo(o.expiration),o.name)
      userdb.get("users").remove({'id':o.id}).write()
      try {
      client.users.get(o.id).send("```Your account was deleted for 24 hours without a home server.```")
      } catch(err) {}
    }
  }
});

function MinutesAgo(date) {
  var date = new Date(date)
	var ago = new Date().getTime() - date.getTime();
		return Math.round(ago / 60 / 1000)
}

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/IO/index.html'));
});
app.get('/authorize.js', function(req, res) {
  
  
  res.sendFile(path.join(__dirname + '/IO/authorize.js'));
});
var RLM = false //randomlanguageMode
var translate = require('translate');

translate.engine = 'yandex';
translate.key = 'trnsl.1.1.20181221T193920Z.74b4574f7877de0d.b1662dd59cd68fa428a6d312ae3fe51efa23f893';
const languages = ['az','sq','am','en','ar','hy','af','eu','ba','be','bn','my','bg','bs','cy','hu','vi','ht','gl','nl','mrj','el','ka','gu','da','he','yi','id','ga','it','is','es','kk','kn','ca','ky','zh','ko','km','lo','la','lv','lt','lb','mg','ms','ml','mt','mk','mi','mr','mhr','mn','de','ne','no','pa','pap','fa','pl','pt','ro','ru','ceb','sr','si','sk','sl','sw','su','tg','th','tl','ta','tt','te','tr','udm','uz','uk','ur','fi','fr','hi','hr','cs','sv','gd','et','eo','jv','ja']
async function translateText(text,message,user={}) {
  
  if (!user.language){user.language = "en"}
  var testText = text  
    if (user.language!="en") {
   // let language = languages[Math.floor(Math.random() * languages.length)]
    
    testText = await translate(text, {from:user.language, to: "en"});
      //console.log(language,"->",testText)
      testText = text+"\n**__"+user.language+"__**->**__en__** "+testText 
    } else {
    testText = false
    }
    return new Promise((resolve, reject) => {
    resolve(testText)  
  })
}


const { URLSearchParams } = require('url');
app.post('/authorization', function(req, res) {
  //console.log(req)
  userdb.read()
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (ip) {
  ip = ip.split(",")[0]
  } else {ip = "ERROR"}
    var id = ip
	let dat = req.body        
        
        ///TEMPORARY
        let userdata = userdb.get("users").find({internalHash:dat.token}).value()
        if (!userdata){return res.send(JSON.stringify({status:402,dat:dat}))}
        //console.log(userdata)
        let response = setNickWeb(dat.name,userdata,{"ip":ip})
        //console.log(response)
        if (response.success){
        res.send(JSON.stringify({status:200,dat:dat}))
        }
        else {
        res.send(JSON.stringify({status:401,dat:dat}))
        } 
      return
  ///console.log(dat)
  const params = new URLSearchParams();
  params.append('client_id',process.env.clientID);
  params.append('client_secret',process.env.clientSecret);
  params.append('grant_type','authorization_code');
  params.append('code',dat.token);
  params.append('scope',"identify email");
  params.append('redirect_uri',"https://isekai.glitch.me/authorize");
  fetch('https://discordapp.com/api/v7/oauth2/token',{
    method:"POST",
    body: params.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      "Authorization": "Basic "+btoa(process.env.clientID+":"+process.env.clientSecret)
    }
    
  }).then((data)=>{
    data.json().then((d)=>{
      console.log(d)
      if (d.access_token) {
        
        let userdata = userdb.get("users").find({internalHash:dat.token}).value()
        if (!userdata){return res.send(JSON.stringify({status:402,dat:dat}))}
        //console.log(userdata)
        let response = setNickWeb(dat.name,userdata,{"ip":ip})
        //console.log(response)
        if (response.success){
        res.send(JSON.stringify({status:200,dat:dat}))
        }
        else {
        res.send(JSON.stringify({status:401,dat:dat}))
        } 
      } else {
      res.send(JSON.stringify({status:401,dat:dat}))
      }
    })
  })
  //DOCUMENTATION: https://discordapp.com/developers/docs/topics/oauth2#shared-resources-oauth2-urls
});



app.post('/discordOauth', function(req, res) {
  userdb.read()
   var id = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	let dat = req.body
  //console.log(dat)
  let response = {success:true}
  if (response.success){
    
    
  res.send(JSON.stringify({status:200,dat:dat}))
  }
  else {
  res.send(JSON.stringify({status:400,dat:dat}))
  }
});
app.get("/giveaway", function(req,res){
res.sendFile(path.join(__dirname + '/I7.html'))
})


app.get('/terms', function(req, res) {
  res.sendFile(path.join(__dirname + '/IO/terms.html'));
});
var url = require('url');
app.get('/authorize', function(req, res) {
 
  console.log(req.body)
  res.sendFile(path.join(__dirname + '/IO/authorize.html'));
});
app.get('/uptime', function(req, res) {
  res.sendFile(path.join(__dirname + '/IO/uptime.html'));
});
app.get('/manage-server', function(req, res) {
  res.sendFile(path.join(__dirname + '/IO/editServer.html'));
});
app.listen(process.env.PORT);
client.login(process.env.SECRET);
//BADWORDS IS BROKEN. THIS REMOVES IT
/*
filter = {}
filter.addWords = function(x) {
  return x
}
filter.clean = function(x) {
  let f = x
  //console.log(filter.list.length)
  for (let i = 0;i<filter.list.length;i++){
  var regex = new RegExp("\\b("+filter.list[i]+")\\b+","g")
    x = f.replace(regex,(g)=>{
    let l =  new Array(g.length + 1).join('×');
      return l
    })
  }
  return x
}
*/
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
var adapter = new FileSync('db.json');
var db = low(adapter);
var userAdapter = new FileSync('userdb.json');
var userdb = low(userAdapter);
var banned = low(new FileSync('banned.json'));
let badwords = low(new FileSync("badwords.json"))
badwords.defaults({
  banned: []
}).write()
banned.defaults({
  bannedUsers: []
}).write()
userdb.defaults({
  users: [
    {
      "id": "0",
      messages:0,
      "name": "Isekai",
      "nick": "Isekai",
      "warnings": 0,
      "legacyTag": "Isekai#5823",
      "internalHash": "FFFFFF",
      "muted": false,
      "ip":"localhost",
      "rank":["BOT","DEFAULT"],
      "joined": "2018-11-14T05:28:43.877Z",
      "role": "bot",
      "primaryChannel": "525786800896344064",
      "primaryServer": "511614248905080832"
    },
    {
      "id": "504137170374754314",
      "name": "D&D 5e Campaign Manager",
      messages:0,
      "nick": "D&D 5e",
      "warnings": 0,
      "legacyTag": "D&D 5e Campaign Manager#2108",
      "internalHash": "904842",
      "muted": false,
      "rank":["BOT","DEFAULT"],
      "joined": "2018-12-04T00:08:51.953Z",
      "ip": "localhost",
      "role": "bot",
      "primaryChannel": "525786749406937089",
      "primaryServer": "504136882477596672"
    },
    {
      "id": "174609192340946944",
      "name": "bomb_and_kou",
      "nick": "Ethan",
      "warnings": 0,
      "legacyTag": "bomb_and_kou#0669",
      "internalHash": "2002B4",
      "muted": false,
      "joined": "2018-12-10T06:04:37.206Z",
      "ip": "::ffff:127.0.0.1",
      "role": "user",
      "rank":["OWNER","ADMIN","DEFAULT"],
      "primaryChannel": "585003572643627018",
      "primaryServer": "571612136036499466",
      "messages": 0
    },
  ]
}).write()
db.defaults({
  links: [],
  bannedUsers: [],
  blacklist: []
}).write()
var links = db.get("links").value()
var bannedUsers = banned.get("bannedUsers").value()
//CODEchannelDelete
function loadBannedWords() {
  //badwords.read()
  filter.list = []
  filter.list = badwords.get("banned").value()
}
//setBannedWords
loadBannedWords()

function banWord(word) {
  badwords.get("banned").push(word).write()
  loadBannedWords()
}

function unbanWord(word) {
  badwords.get("banned").remove(word).write()
  loadBannedWords()
}
client.on("guildDelete", (guild) => {
  try {
    if (guild.id === "264445053596991498") {
      return
    }
    //console.log(guild)
    console.log("Server Deleted");
    let affectedusermap = userdb.get("users").filter({
      "primaryServer": guild.id
    }).value()
    if (affectedusermap === []) {
      globalAnnounce(makeEmbed("The link to '" + guild.name + "' was severed..", "Affected users: 0"));
      return
    }
    let userlist = "";
    console.log(affectedusermap)
    console.log(affectedusermap.length)
    for (let i = 0; i < affectedusermap.length; i++) {
      userdb.get("users").find({
        id: affectedusermap[i].id
      }).assign({
        "role": "homeless",
        "expiration":new Date()
      }).write()
      client.users.get(affectedusermap[i].id).send("Your home doorway was deleted. To set a new home use g.sethome on a network channel. If you no longer have access our home channel is https://discord.gg/6y2A4Pk\nTo invite me to your world use the following link: https://isekai.glitch.com")
      userlist += ("\n" + affectedusermap[i].nick + " (<@" + affectedusermap[i].id + ">)")
    }
    let desc = "Affected users: " + affectedusermap.length + userlist
    globalAnnounce(makeEmbed("The link to '" + guild.name + "' was severed..", desc));
    return
  } catch (err) {}
})
client.on('channelDelete', (c) => {
  try {
    if (c.guild.id === "264445053596991498") {
      return
    }
    let l = db.get("links").value()
    if (l.indexOf(c.id) === -1) {
      return;
    }
    console.log("Channel Deleted");
    db.get("links").update(arrayRemove(links, c.id)).write()
    links = arrayRemove(links, c.id)
    let affectedusermap = userdb.get("users").filter({
      "primaryChannel": c.id
    }).value()
    if (affectedusermap === []) {
      globalAnnounce(makeEmbed("A Doorway in " + c.guild.name + " has Closed.", "Affected souls: 0"));
      return
    }
    let userlist = "";
    console.log(affectedusermap)
    console.log(affectedusermap.length)
    for (let i = 0; i < affectedusermap.length; i++) {
      userdb.get("users").find({
        id: affectedusermap[i].id
      }).assign({
        "role": "homeless",
        "expiration":new Date()
      }).write()
      userlist += ("\n" + affectedusermap[i].nick + " (<@" + affectedusermap[i].id + ">)")
      client.users.get(affectedusermap[i].id).send("Your home doorway was deleted. To set a new home use g.sethome on a network channel. If you no longer have access our home channel is https://discord.gg/QEyr7bx\nTo invite me to your world use the following link: https://discordbots.org/bot/497371043292381199")
    }
    let desc = "Affected users: " + affectedusermap.length + userlist
    globalAnnounce(makeEmbed("A Doorway in " + c.guild.name + " has Closed.", desc));
    return
  } catch (err) {}
})
client.on('ready', () => {
  console.log("Bot is Online!");
  client.user.setPresence({
    game: {
      name: "Version " + config.version + " | g.help"
    }
  })
  //client.user.setStatus('dnd')
  userdb.read() ///update info
  db.read()
})
client.on("error", err => {
  //handle error
})
/* 
    Removes Channel
*/
client.on("guildMemberRemove", (guildMember) => {
  try {
    if (guildMember.guild.id === "264445053596991498") {
      return
    }
    let link = userdb.get("users").find({
      "id": guildMember.id,
      "primaryServer": guildMember.guild.id
    }).value()
    if (!link) {
      return;
    }
    console.log(link)
    userdb.get("users").find({
      "id": guildMember.id,
      "primaryServer": guildMember.guild.id
    }).assign({
        "role": "homeless",
        "expiration":new Date()
    }).write()
    if (link.nick!=="!undefined") {
    globalAnnounce(makeEmbed(">>" + link.nick + " has Left their home server. Nickname given a 24 hour grace period."))
    }
      //console.log(guildMember)
  } catch (err) {}
})
client.on("guildCreate", (guildCreate) => {
  guildCreate.owner.send("A Connection has been established. To link a channel to the network `IF the created channel was deleted` use `g.init`. The user requires `Administrator` privilages to use this command. This process is irriversable. A New Channel named `Isekai` has been created and set up for you! My help command is g.help (Only works in a server not this DM)")
  //sendHelp(guildCreate.ownerID)
  if (guildCreate.id === "264445053596991498") {
    return
  }
  guildCreate.createChannel("Isekai","text").then((channel)=>{
    channel.send("Connecting to Network... The Guild Owner must take steps");
    let message = {}
    message.channel = channel
    init(message,true)
    channel.send("Connected to the network!")
   })
  //console.log(guildCreate)
  globalAnnounce(makeEmbed("A connection to the world known as '" + guildCreate.name + "' was found. (Users: "+guildCreate.memberCount+")"))
})
/*
 *Get User Messages and Handle
 */
client.on('message', message => {
  
  //return
  try {
    if (!message.guild) {
      processDM(message)
      return
    }
    if (message.guild.id === "264445053596991498") {
      return
    }
    if (message.content.toLowerCase().startsWith("g.eval") && message.author.id === "174609192340946944") {
    try {
      eval(message.content.slice(7))
    } catch (err) {
      message.reply(err.toString())
    }
    return
  }
    
    
    userdb.read() //Update info
    banned.read()
    db.read()
    let isBanned = banned.get("bannedUsers").find({
      id: message.author.id
    }).value()
    if (isBanned !== undefined && db.get("links").value().indexOf(message.channel.id) !== -1) {
      message.reply("You are banned from Isekai (" + isBanned.reason + ")").then((c) => {
        message.delete();
        c.delete(4000)
      });
      return
    }
    if (message.content === "g.init" && message.channel.permissionsFor(message.member).has("ADMINISTRATOR", true)) {
      init(message,false)
      message.delete()
      return
    }
    if (message.content === "g.help") {
      sendHelp(message)
      message.delete()
      return
    }
    let links = db.get("links").value()
    var usernameOverride //define
    let userstuff = userdb.get("users").find({
      "id": message.author.id
    }).value()
    if (userstuff) {
      if (userstuff.role === "homeless" && message.content !== "g.sethome") {
        message.reply("You have no home door. Please use g.sethome").then((c) => {
          c.delete(4000)
        });
        message.delete()
        return
      }
    }
    if (message.webhookID !== null) { //ignore bot relay messages
      return
    }
    if (message.author.bot && message.author.tag !== "D&D 5e Campaign Manager#2108") { //ignore bot messages (comment out return to toggle)
      return
    }
    //These can be run anywhere
    if (message.content.startsWith("?")) {
      return
    } //ignore dyno messages
    if (message.channel.id === "493722553664405515") {
      try {
        autodelete(message)
      } catch (err) {};
      return
    } //Ignore this. 
    if (links.indexOf(message.channel.id) !== -1) { /// Was the message sent in an Isekai channel
      //console.log(message)
      let username = message.author.username
      if (username.replace(/[^\x00-\x7F]/g, "") === "" || username.startsWith("[")) {
        username = intToRGB(hashCode(message.author.tag))
      }
      let user = userdb.get('users').find({
        id: message.author.id
      }).value()
      if (!user) {
        //Define New User
        user = {
          "id": message.author.id,
          "name": username,
          "nick": "!undefined",
          messages:0,
          "warnings": 0,
          "legacyTag": message.author.tag,
          "internalHash": intToRGB(hashCode(message.author.id)),
          "muted": false,
          "mutedTime":false,
          afk:false,
          "rank":["DEFAULT"],
          "joined": new Date(),
          "expiration":false,
          "ip":false,
          "role": "unregistered",
          "primaryChannel": message.channel.id,
          "primaryServer": message.channel.guild.id
        }
        userdb.get("users").push(user).write()
        usernameOverride = "!undefined"
        var role = 'unregistered'
      } else {
        role = user.role
        usernameOverride = user.nick
      }
      if (user.muted){
      message.reply("You are Muted.").then((c) => {
          c.delete(2000)
        });
      message.delete();
      return
      }
      
      
      if (message.content.startsWith(config.prefix)) {
        processCommand(message,user);
        if (message.content.startsWith("g.eval")) {
          return
        }
        message.delete();
        return
      }
      console.log(intToRGB(hashCode(message.author.id)), usernameOverride + ": " + message.content)
      //let lst = arrayRemove(links, message.channel.id)
      let lst = links
      if (usernameOverride === "!undefined"&&role==='unregistered') {
        message.reply("<@" + user.id + ">, Before you may talk on our network you must activate your account. Instructions have been sent to your DMs").then((m) => {client.users.get(message.author.id).send("Account Pairing Required. Do this at https://isekai.glitch.me/terms.\nYour `6 Digit Activation Code` is: `"+intToRGB(hashCode(user.id))+"`.\nThis will become Inactive after 20 minutes and you will have to send a message to an Isekai channel again to refresh it.\n```Never tell ANYONE your auth code for ANY reason. Not even to our Moderators or Admins```");m.delete(18000)});
        message.delete();
        return
      }else if (usernameOverride==="!undefined"&&role==='user') {
                message.reply("<@" + user.id + ">, Set your username with g.nick <nickname>").then((m) => {m.delete(8000)});
        message.delete();
        return
                
      }
      translateText(String(message.content),message,user).then((fuckedText)=>{
      for (let i = 0; i < lst.length; i++) {
        Whook(lst[i], message, usernameOverride,message.author.id,user.rank,fuckedText)
      }
      })
      
      
      
      if (!user.messages){user.messages = 0}
      userdb.get("users").find({"id":message.author.id}).assign({messages:user.messages+1}).write()
      message.delete();
    }
  } catch (err) {
    message.delete()
    console.log(err)
  }
});

function processDM(message) {
  console.log(intToRGB(hashCode(message.author.id)), message.author.username + ": " + message.content)
}
/* globalAnnounce
    send string message to all channels in database as bot
*/
function globalAnnounce(message) {
  try {
  let links = db.get("links").value()
  for (let i = 0; i < links.length; i++) {
    let MSG = message
    if (typeof message !== "object") {
      if (!client.channels.get(links[i])) {
        return
      }
      let re = /@<([^>]+)>/g,
        MSG = message.replace(re, x => {
          let usertag = x.slice(2, -1);
          let user = userdb.get("users").find({
            "nick": usertag
          }).value()
          
          
          if (user) {
            if (user.primaryChannel === links[i]) {
              return "<@" + user.id + ">"
            }
          }
          return "**@" + usertag + "**";
          
          
        })
    }
    let msg={}
    msg.content = MSG
    //console.log(links[i]);
    //Whook(links[i], msg, "Isekai",'0')
    client.channels.get(links[i]).send(MSG)
  }
  } catch(err) {console.log(err)}
}
/* Whook
    Send Message to Webhook 'User' Channel channelID from <usernameOverride> containing message.
    if channelID does not exist remove from database
    if webhook does not exist Create it.
    if username invalid generate account hash
*/
function Whook(channelID, message, usernameOverride,fromuserid,roles,fuckedText) {
  try{
    let avatarURL
  db.read()
  userdb.read()
  let theChannel = client.channels.get(channelID)
  if (!theChannel) {
    console.log("deleting " + channelID);
    channelDelete(channelID)
    return
  }
  
    
  theChannel.fetchWebhooks().then(hook => {
    let webhook = hook.find(x => x.name === "User")
    if (webhook === null) {
      console.log("ERROR " + channelID, "Creating Hook")
      let tChannel = client.channels.get(channelID)
      tChannel.createWebhook('User').then(webhook => {
        console.log("Hook Made")
        var embed = {
          embed: {
            color: 534636,
            title: ">>" + tChannel.guild.name + " has connected a channel to the network."
          }
        }
        globalAnnounce(embed)
      }).catch((err) => {
        return
      })
      return
    }
    let username = "Error27"
    if (username.replace(/[^\x00-\x7F]/g, "") === "" || username.startsWith("[")) {
      username = intToRGB(hashCode(message.author.id))
    }
    if (usernameOverride) {
      username = usernameOverride
    }
   
    if (message.author){
      username = message.author.username
      if (usernameOverride) {
        username = usernameOverride
      }
      //RankConfig
     avatarURL = "https://cdn.glitch.com/0a7482ac-9b81-429d-b27a-5a8b05fc0668%2Fdiscordbackground.png?1548617880988" //Default
      
    
      
      
      
      
      
    
      /*Texty Box :)
      ok
      should prob make a List of Avatars
      added list down some --ln 905
      
      
      
      
      */
    //Overides
      if (message.author.bot || roles.indexOf("BOT")!=-1) {
        username = "[BOT] " + username
        avatarURL = "https://cdn.glitch.com/0a7482ac-9b81-429d-b27a-5a8b05fc0668%2Fbot.png?1548619665465"
      } else if (message.author.id === "174609192340946944") {
        avatarURL = "https://cdn.glitch.com/0a7482ac-9b81-429d-b27a-5a8b05fc0668%2Fowner.png?1548618196207"
        username = "[Owner] " + username
      } else if (roles.indexOf("ADMIN")!=-1) {
        avatarURL = "https://cdn.glitch.com/0a7482ac-9b81-429d-b27a-5a8b05fc0668%2FAdmin.png?1548618970869"
        username = "[Admin] " + username
      } else if (roles.indexOf("MODERATOR")!=-1) {
        avatarURL = "https://cdn.glitch.com/0a7482ac-9b81-429d-b27a-5a8b05fc0668%2FModerator.png?1548618967493"
        username = "[Mod] " + username
      } else if (roles.indexOf("EGG")!=-1) {
        avatarURL = "https://cdn.glitch.com/0a7482ac-9b81-429d-b27a-5a8b05fc0668%2FEGGPFP.png?1548619266497"
        //username = "[EGG] " + username
      }
      
    }
    
    
    let MSG = message.content
    if (fuckedText){
    MSG = fuckedText
    }
    var arr = [],
      re = /<@([^ ]+)>/g,
      input = MSG;
       
      MSG = input.replace(re, x => {
      if (message.channel.id === channelID) {
        message.reply("Please do not ping. Refer to g.help for how this bot handles pinging. Thanks").then((c) => {
          c.delete(8000)
        })
      };
      return "<Removed>"
    })
    var arr = [],
      re = /@<([^>]+)>/g,
      input = MSG;
    MSG = input.replace(re, x => {
      let userstring = "<ERROR>"
      let usertag = x.slice(2, -1);
      let user = userdb.get("users").find({
        "nick": usertag
      }).value()
      let blacklist = db.get("blacklist").find({"channelID":channelID}).value()
      userstring = "**@" + usertag + "**";
      
      if (user) {
        if (user.primaryChannel === channelID) {
          userstring = "<@" + user.id + ">"
        }
         if (blacklist!==undefined) {
      if (blacklist.blockedUsers.indexOf(user.id)!==-1){
      userstring = "**@BlacklistedUser "+intToRGB(hashCode(user.nick))+"**"
      }}
      }
      
     
      
      
      return userstring
    })
    //let avatarURL = "https://www.google.com/imgres?imgurl=https%3A%2F%2Fdiscordapp.com%2Fassets%2Fdd4dbc0016779df1378e7812eabaa04d.png&imgrefurl=https%3A%2F%2Fwww.reddit.com%2Fr%2Fdiscordapp%2Fcomments%2F4ksmrc%2Fis_there_a_way_to_access_the_default_discord_user%2F&docid=s1IK819X0FY3oM&tbnid=17IHLJfVDhhIUM%3A&vet=10ahUKEwiws5ii4O7eAhVRvFkKHTsaAgEQMwhWKAAwAA..i&w=256&h=256&bih=1369&biw=2560&q=default%20discord%20avatar&ved=0ahUKEwiws5ii4O7eAhVRvFkKHTsaAgEQMwhWKAAwAA&iact=mrc&uact=8"
    
    /*
    if (message.author){
      //console.log(message.author.id,message.author.avatar);
    avatarURL = "https://cdn.discordapp.com/avatars/"+message.author.id+"/"+message.author.avatar+".webp?size=256"
    } else {
    avatarURL = "https://images.discordapp.net/avatars/497371043292381199/a110680dc454c546bf1a84495951e99b.png?size=256"
    }
    */
    var content = {
      "username": username,
      "avatarURL": avatarURL
    }
    if (message.attachments){
      if (message.attachments.first()) {
      content.files = [message.attachments.first().url]
      }
    }
    if (message.embeds){
    if (message.embeds[0]) {
      content.embeds = [new Discord.RichEmbed(message.embeds[0])]
    }
    }
     let blacklist = db.get("blacklist").find({"channelID":channelID}).value()
    if (blacklist!==undefined) {
      if (blacklist.blockedUsers.indexOf(fromuserid)!==-1){
        let user = userdb.get("users").find({
        "id":fromuserid
        }).value()
        MSG = "||"+MSG+"||"
        content.username = "BlacklistedUser "+intToRGB(hashCode(user.nick))
        content.avatarURL = 'https://cdn.glitch.com/0a7482ac-9b81-429d-b27a-5a8b05fc0668%2FScreenshot_6.png?1542217371514'
        if (content.files){
        delete content.files
        delete content.attachments
      }
      }
    
    }
    
    
    
    webhook.send(filter.clean(MSG), content).catch(err => {
      console.log(err)
      //return message.channel.send("**Connection Error**")
    })
  })
  } catch(err) {console.log(err)}
}

//Avatar List
const GlobalAvatars = [

]










/**
 * 
 * @param {String} msg message to send
 */

function log(msg) {
  client.channels.get("501668491133452288").send(msg)
}

//so just put all my commands here?
//yes, i believe i also have a message.lowercase value to get the commands to not require case but you have it if needed for say text input
function processCommand(message,user) {
  try{
  if (message.content.toLowerCase().startsWith("g.eval") && message.author.id === "174609192340946944") {
    try {
      eval(message.content.slice(7))
    } catch (err) {
      message.reply(err.toString())
    }
    return
  }
  if (message.content==="g.ping"){
  //DO
    message.reply("pong").then((pong=>{pong.delete(3000)}))

    //theres also globalAnnounce(), this send a message to Every channel
    //oh wow
    //also added makeEmbed(title,text), a Join message is globalAnnounce(makeEmbed(user.nick+" Has joined the Chat."));
    
    //would it be helpfull for me to make a avanced embed command like have a list of embed varibles then make them an embed if that makes any scence
    //makeEmbed accepts a 3rd field for misc data
    return
  }  
  
  if (message.content.startsWith("g.embed") && user.rank.indexOf("MODERATOR")!=-1){
    let pram = message.content.slice(8)
    pram = pram.split(";")    
    
    //it dident send the embeded message?
    message.channel.send(makeEmbed(pram[0], pram[1]))
    console.log(pram[0]);
  }
    
  if (message.content === "g.help") {
    sendHelp(message)
    return
  }
  if (message.content === "g.top"){
    replyTop(message);
  return
  }
  if (message.content === "g.restart" && message.author.id === "174609192340946944") {
    process.exit(0)
    return
  }
  if (message.content === "g.users") {
    getUserList(message)
    return
  }
  if (message.content.startsWith("g.whois")) {
    whois(message)
    return
  }
  //Mass Delete
  if (message.content === "g.bd()" && message.author.id === "174609192340946944") {
    BDELETE()
    return
  }
  //global Announcement
  if (message.content.startsWith("g.ann]") && user.rank.indexOf("ADMIN")!=-1) {
    globalAnnounce(message.content.slice(6))
    message.delete()
    return
  }
  //Ban User
  if (message.content.startsWith("g.ban") && user.rank.indexOf("ADMIN")!=-1) {
    let t = message.content.slice(6)
    t = t.split(";")
    //g.ban user;reason
    let tuser = t[0]
    let treason
    if (!t[1]){treason = "Ban"} else {treason = t[1]}
    ban(tuser,treason)
    message.delete()
    return
  }
    
  if (message.content.startsWith("g.unban") && user.rank.indexOf("ADMIN")!=-1) {
    unban(message.content.slice(8))
    message.delete()
    return
  }
    
  if (message.content.startsWith("g.mute") && (user.rank.indexOf("ADMIN")!=-1 || user.rank.indexOf("MODERATOR")!=-1)) {
    mute(message.content.slice(7))
    message.delete()
    return
  }
    
  if (message.content.startsWith("g.unmute") && (user.rank.indexOf("ADMIN")!=-1 || user.rank.indexOf("MODERATOR")!=-1)) {
    unmute(message.content.slice(9))
    message.delete()
    return
  }
  //Set Nickname
  if (message.content.startsWith("g.nick ") && user.muted==false) {
    let nick = filter.clean(message.content.slice(7))
    if (nick.length < 2 || nick.length > 24) {
      message.reply("Nicknames Must be between 2 and 24 characters").then((m) => m.delete(8000))
      return
    }
    let doesExist = userdb.get('users').find({
      "nick": nick
    }).value()
    if (doesExist) {
      message.reply("Name Already in Use").then((m) => m.delete(6000));
      return
    }
    if (nick.indexOf("[") > -1 || nick.indexOf("!") > -1 || nick.indexOf("<") > -1 || nick.indexOf(">") > -1 || nick.indexOf("\\") > -1 || nick.indexOf("]") > -1 || nick.indexOf("\'") > -1 || nick.indexOf("\"") > -1 || nick.indexOf("(") > -1 || nick.indexOf(")") > -1) {
      message.reply("Name Not Allowed, Invalid Characters: (`!`, `[`, `]`, `<`, `>`, `\\`, `\'`, `\"`, `(`, `)`)").then((m) => m.delete(6000));
      return
    }
    let oldNick = userdb.get('users').find({
      "id": message.author.id
    }).value()
    oldNick = oldNick.nick
    if (oldNick==="!undefined"){
      return
    }
    console.log("Username Change", oldNick, "->", nick)
    userdb.get('users').find({
      "id": message.author.id
    }).assign({
      "nick": nick,
      "role": "user",
      "primaryChannel": message.channel.id,
      "primaryServer": message.channel.guild.id
    }).write()
    message.reply("Name Assigned to '" + nick + "'").then((m) => m.delete(2000))
      var embed = {
        embed: {
          color: 534636,
          title: ">>" + oldNick + " changed their name to " + nick + "."
        }
      }
      globalAnnounce(embed)
    
  }
      if (message.content.startsWith("g.sethome")) {
    let doesExist = userdb.get('users').find({
      "id": message.author.id
    }).value()
    if (!doesExist) {
      return;
    }
    userdb.get('users').find({
      "id": message.author.id
    }).assign({
      "role": "user",
      "primaryChannel": message.channel.id,
      "primaryServer": message.channel.guild.id
    }).write()
    message.reply("Server Set").then((m) => m.delete(2000))
  }
  } catch(err){console.log(err)}
}
    
    
    function authorize(){
    
    
    
    }
    
    
    function setNickWeb(nickname,user,data){
      let nick = filter.clean(nickname)
    if (nick.length < 2 || nick.length > 24) {
      return {err:"Nicknames Must be between 2 and 24 characters"}
    }
    let doesExist = userdb.get('users').find({
      "nick": nick
    }).value()
    let userExist = userdb.get('users').find({
      "id": user.id
    }).value()
    if (!userExist){
    return {err:"You are not pending authorization."}
    }
    
    if (doesExist) {
      return {err:"Name Already in Use"}
    }
    if (nick.indexOf("[") > -1 || nick.indexOf("!") > -1 || nick.indexOf("<") > -1 || nick.indexOf(">") > -1 || nick.indexOf("\\") > -1 || nick.indexOf("]") > -1 || nick.indexOf("\'") > -1 || nick.indexOf("\"") > -1 || nick.indexOf("(") > -1 || nick.indexOf(")") > -1) {
      return {err:"Name Not Allowed, Invalid Characters: (`!`, `[`, `]`, `<`, `>`, `\\`, `\'`, `\"`, `(`, `)`)"}
    }
    let oldNick = userdb.get('users').find({
      "id": user.id
    }).value()
    if (oldNick.muted){
    return {err:"User is Muted"}
    }
    
    oldNick = oldNick.nick
      
    console.log("Username Change", oldNick, "->", nick)
    userdb.get('users').find({
      "id": user.id
    }).assign({
      "nick": nick,
      "role": "user",
      "ip":data.ip,
      "joined": new Date()
    }).write()
      if (oldNick=="!undefined"){
      userdb.get('users').find({
      "id": user.id
    }).assign({
      rank:["DEFAULT"]
    }).write()  
        
      var embed = {
        embed: {
          color: 534636,
          title: ">>" + nick + " has joined the chatroom."
        }
      }
      } else {
      var embed = {
        embed: {
          color: 534636,
          title: ">>" + oldNick + " changed their name to "+nick+"."
        }
        }
      }
      
      globalAnnounce(embed)
      let message = {}
      message.author = user
      if (oldNick=='!undefined'){
      sendHelp(message);
      }
      return {success:true}
    }
function replyTop(message){
userdb.read()
let users = userdb.get("users")
  .sortBy('messages')
  .value()
  let userCount = []
  for (let i = 0;i<users.length;i++){
    if (userCount.length>=10){break}
    if (users[i].nick !=="!undefined"&&users[i].role !=="bot"){
      if (String(users[i].messages)!="undefined"){
        if (users[i].messages!=0){
          userCount.push(users[i]);
        }
      }
    }
  }
  console.log(userCount.length)
  let msgText = ""
  userCount = userCount.reverse()
  for (let i = 0;i<userCount.length;i++){
    msgText += (userCount[i].nick+" | ("+userCount[i].messages+")\n")
  }
  
  message.author.send(makeEmbed("Top "+userCount.length+" Users",msgText))
}


function autodelete(msg) {
  msg.delete(900000)
}

function hashCode(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function intToRGB(i) {
  var c = (i & 0x00FFFFFF).toString(16).toUpperCase();
  return "00000".substring(0, 6 - c.length) + c;
}
//Mass Delete
function BDELETE() {
  for (let i = 0; i < links.length; i++) {
    DELETE(i)
  }
  return
}

function DELETE(i) {
  client.channels.get(links[i]).bulkDelete(100, true).then((x) => {
    console.log("Deleted " + x.size + " messages.")
    if (x.size === 100) {
      DELETE(i)
    }
  })
}

function init(message,skipDoorway) {
  client.channels.get(message.channel.id).fetchWebhooks().then(hook => {
    let webhook = hook.find(x => x.name === "User")
    if (webhook === null) {
      let tChannel = client.channels.get(message.channel.id)
      tChannel.createWebhook('User').then(webhook => {
        db.get("links").push(message.channel.id).write()
        console.log("Hook Made")
        var embed = {
          embed: {
            color: 534636,
            title: "A new doorway has opened in '" + tChannel.guild.name + "'"
          }
        }
        if (!skipDoorway){
        globalAnnounce(embed)
        }
      }).catch(console.error)
      return
    } else {
      let tChannel = client.channels.get(message.channel.id)
      var embed = {
        embed: {
          color: 534636,
          title: ">>" + tChannel.guild.name + " has connected a channel to the network."
        }
      }
      globalAnnounce(embed)
      db.get("links").push(message.channel.id).write()
      db.read()
    }
  })
}

function sendHelp(message) {
  let nick = userdb.get('users').find({
    "id": message.author.id
  }).value().nick
  let channels = db.get("links").value()
  let helpmsg = "Welcome to Isekai created by bomb_and_kou#0669. Our main server is  https://discord.gg/6y2A4Pk \nMy Invite Link is https://discordapp.com/oauth2/authorize?client_id=497371043292381199&scope=bot&permissions=805331985\nTo link achannel type `g.init` in the channel to connect. Requires `Server Administrator Permissions`.\nMake sure it is a new channel as this proccess is irreversible currently."
  helpmsg += "\n\n__**RULES**__\nNo Spamming. Users spamming will get Blacklisted.\nNo Profanity. Bypassing the profanity filter will result in being blacklisted.\nDo not send any NSFW media (anything that would typically be labeled “18+” or “Mature Content”)\nRacism, Sexism, Bigotry, Trolling is cause for an immediate ban.\nListen to the staff.\nSerious Offenses can get your entire server blacklisted from our network."
  helpmsg += "\n\n__**HOW TO PING**__ \nYour ping is `@<" + nick + ">`" + "\n@user will not longer work and will be removed from messages. \nInstead wrap the Nickname in <> - @<Nickname>. ex: `Hello @<Bomb & Kou> how are you?`"
  helpmsg += "\nYou will only be pinged on 1 server that you are in.\n\nThe Bot Command Prefix is `" + config.prefix + "`\nMy commands will only work in connected channels below.\n__**Available Commands**__:\n"
  helpmsg += "```ruby\n:ADMIN\ninit() #create a link in the current channel\n:EVERYONE\nnick 'nickname' #Set your nickname\nhelp #Display this message (on new commands)\nsethome #Choose where to recieve pings\nwhois 'nickname' #Display info about a user (Case Sensative)\nblock 'nickname' #Block a user from your servers copy of the channel (Server Admin Only)\nusers #List Users (Not Yet Implimented)\nserverlist #List Connected Servers (Not Yet Implimented)```\n\n"
  helpmsg += "__**CONNECTED DOORWAYS**__ \n(#deleted-channel is a channel in a server you are not in)\n"
  
  client.users.get(message.author.id).send(helpmsg)
  helpmsg = "Connected Servers: " + channels.length + "\n"
  for (let i = 0; i < channels.length; i++) {
    helpmsg += "__"+String(client.channels.get(channels[i]).guild.name) + "__\n<#"+channels[i]+">\n"
  }
  client.users.get(message.author.id).send(helpmsg)
}
/**
 * 
 * @param {array} arr 
 * @param {string} value 
 */
function arrayRemove(arr, value) {
  return arr.filter(function(ele) {
    return ele != value;
  });
}

function ban(nick,reason) {
  if (!reason){reason = "Ban"}
  let user = userdb.get("users").find({
    "nick": nick
  }).value()
  if (!user) {
    return;
  }
  userdb.get("users").find({
    "nick": nick
  }).assign({
    "role": "banned"
  }).write()
  banned.get("bannedUsers").push({
    id: user.id,
    "reason": reason,
    "nick": nick,
    "ip":user.ip
  }).write()
  globalAnnounce(makeEmbed(">>" + nick + " was Banned. ["+reason+"]"))
} //
function unban(nick) {
  let user = userdb.get("users").find({
    "nick": nick
  }).value()
  if (!user) {
    return;
  }
  userdb.get("users").find({
    "nick": nick
  }).assign({
    "role": "user"
  }).write()
  banned.get("bannedUsers").remove({
    id: user.id
  }).write()
  globalAnnounce(makeEmbed(">>" + nick + " was Unbanned."))
} //



function mute(nick) {
  let user = userdb.get("users").find({
    "nick": nick
  }).value()
  if (!user) {
    return;
  }
  userdb.get("users").find({
    "nick": nick
  }).assign({
    "muted":true
  }).write()
  globalAnnounce(makeEmbed(">>" + nick + " was Muted."))
} //
function unmute(nick) {
  let user = userdb.get("users").find({
    "nick": nick
  }).value()
  if (!user) {
    return;
  }
  userdb.get("users").find({
    "nick": nick
  }).assign({
    "muted":false
  }).write()
  globalAnnounce(makeEmbed(">>" + nick + " was Unmuted."))
} //

function channelDelete(channelID, channel) {
  let link = db.get("links").value()
  link = arrayRemove(link, channelID)
  db.set("links", link).write()
  db.get("blacklist").remove({"channelID":channelID}).write()
}

function reply(message, text, seconds) {
  message.reply(text).then((c) => {
    c.delete(seconds * 1000)
  })
}

function whois(message) {
  let username = message.content.slice(8)
  let response = "No User Found"
  let user = userdb.get("users").find({
    "nick": username
  }).value()
  let data = {}
  if (user) {
    client.guilds.get(user.primaryServer).fetchMember(user.id).then(member => {
      response = "Username: " + member.user.username + "#" + member.user.discriminator + "\nMain Server: " + client.guilds.get(user.primaryServer).name
      let avatarURL = "https://cdn.discordapp.com/avatars/"+user.id+"/"+member.user.avatar+".webp?size=256"
      console.log(member.user)
      console.log(avatarURL)
      data = {
        
        thumbnail: {
          url: avatarURL
        }
      }
      let embed = makeEmbed(username, response, data)
      client.users.get(message.author.id).send(embed)
    });
  } else {
    let embed = makeEmbed(username, response, data)
    client.users.get(message.author.id).send(embed)
  }
}

function getUserList(message) {}

function makeEmbed(text, desc, misc) {
   var embed = {
     embed: {
       color: 534636,
       title: text
     }
   }
   embed.embed.description = desc
   for (let i in misc) {
     embed.embed[i] = misc[i]
   }
   return embed
 }
var stdin = process.openStdin();
stdin.addListener("data", function(d) {
  if (d.toString().trim().startsWith("say")) {
    globalAnnounce(d.toString().trim().slice(4))
    return
  }
  try {
    eval(d.toString())
  } catch (err) {
    console.log(err)
  }
});

function urlEncode(data) {
  let out = [];

  for (let key in data) {
    out.push(`${key}=${encodeURIComponent(data[key])}`);
  }

  return out.join('&')
}