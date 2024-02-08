const { Client, Intents } = require("discord.js");
const Discord = require("discord.js");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const myIntents = new Intents();
myIntents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_VOICE_STATES);
const client = new Client({ intents: myIntents });
const express = require("express");
const app = express();
app.get("/", async (req, res) => { res.send('hi') });
const http = require("http").createServer(app);
http.listen("80", () => { });
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.mong;
const MMongoclient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
MMongoclient.connect();
MMongoclient.db("admin").command({ ping: 1 });
console.log("☑️  You successfully connected to MongoDB!");
const BroadcastDB = MMongoclient.db("bc").collection("bc");
let prefix = "#"; let sec = '2';
let prefixes = {};
client.login(process.env.token);
client.on("ready", () => {
  console.log('Ready');
  client.guilds.cache.forEach(g => {
    BroadcastDB.findOne({
      guildID: g.id
    }, {}).then(async settings => {
      if (!settings) return; if (!settings.bcs[0]) return;
      if (settings.st == 'r') { BC(g.id); console.log(`continue sending broadcast for ${g.name}`) }
    })


  });




});

client.on("messageCreate", async message => {
  if (message.author.bot || message.channel.type == "dm" || !message.channel.guild) return;
  let args = message.content.split(" "); let cmd = args[0];

  if (cmd == prefix + "bc" || cmd == prefix + "broadcast") {
    // if (!message.member.permissions.has("ADMINISTRATOR")) return;
    BroadcastDB.findOne({
      guildID: message.guild.id
    }, {}).then(async settings => {
      if (!settings) {
        console.log(`[${message.guild.name}] wasn"t in my database! so i added it :)`);

        BroadcastDB.insertOne({
          guildID: message.guild.id,
          bcs: []
        }, function(err, res) {
        }).then(() => { console.log("1 document inserted"); }); return message.react('✅');
      }
      if (!args[1] || !["everyone"].includes(args[1]) || !args[2]) {
        return message.reply({
          embeds: [
            {
              fields: [{
                name: `**📣 Broadcast :**`,
                value: `${prefix}bc everyone <message>`,
              }], color: 3079936
            }
          ], allowedMentions: { repliedUser: false }
        }).catch(err => { });
      } else {
        if (settings.st == 'r') return message.reply({
          embeds: [{
            title: `There's an active Broadcast running..`,
            description: `**Use \`${prefix}status\` to Check in.\nUse \`${prefix}stop\` to stop the Broadcast.**`,
            color: '#EA3200'
          }]
        })
        // if (settings.bcs[0]) {return message.reply({content:"tt"});}
        message.guild.members.fetch().then(() => {
          let count = 0; let members = [];
          message.reply({
            embeds: [{ title: `⏳ preparing....`, color: '#ffa700' }]
          }).then(NM => {
            message.guild.members.cache.forEach(t => {
              if (t.user.bot) return;
              members.push(t.id); count++;
              if (count == message.guild.members.cache.filter(member => !member.user.bot).size) {
                BroadcastDB.updateOne({ guildID: message.guild.id }, { $set: { bcs: members } });
                BroadcastDB.updateOne({ guildID: message.guild.id }, { $set: { msg: message.content.split(" ").slice(2).join(" "), CH: message.channel.id, st: "r", su: 0, fa: 0 } });
                setTimeout(() => {
                  BC(message.guild.id);
                  setTimeout(() => {
                    NM.edit({
                      embeds: [{
                        title: `✅ Sending message to ${count} members...`, color: 3079936,
                        description: `**This channel will be the announce channel for the Broadcast.**\nUse \`${prefix}status\` to Check in.\nUse \`${prefix}stop\` to stop the Broadcast.`
                      }]
                    })
                  }, 500);
                }, 1000);
              }
            });


          }).catch(err => { });



        });

      }
    })
  }
  if (cmd == prefix + 'status') {
    // if (!message.member.permissions.has("ADMINISTRATOR")) return;
    BroadcastDB.findOne({
      guildID: message.guild.id
    }, {}).then(async settings => {
      let ee = {
        color: '#EA3200',
        title: `there isn't an active Broadcast running.`
      }
      if (!settings) { message.reply({ embeds: [ee] }).catch(err => { }) }
      if (settings.st !== 'r') { message.reply({ embeds: [ee] }).catch(err => { }) } else {
        message.reply({
          embeds: [{
            color: 3079936,
            fields: [{
              name: `**Status:**`, value: `**✅ success: \`${settings.su}\` ❌ failed: \`${settings.fa}\`.**
            remaining: ${settings.bcs.length}.\nends in <t:${Math.floor(Math.floor(Date.now() / 1000) + Math.floor(settings.bcs.length * sec))}:R>.`
            }, { name: '**Message:**', value: `${settings.msg}` }]
          }]
        }).catch(err => { console.log(err) });
      }


    })
  }
  if (cmd == prefix + 'stop') {
    // if (!message.member.permissions.has("ADMINISTRATOR")) return;
    BroadcastDB.findOne({
      guildID: message.guild.id
    }, {}).then(async settings => {
      let ee = {
        color: '#EA3200',
        title: `there isn't an active Broadcast running.`
      }
      if (!settings) { message.reply({ embeds: [ee] }).catch(err => { }) }
      if (settings.st !== 'r') { message.reply({ embeds: [ee] }).catch(err => { }) } else {
        BroadcastDB.updateOne({ guildID: message.guild.id }, { $set: { bcs: [], st: 'x' } });
        message.reply({
          embeds: [{
            color: 3079936,
            title: `✅ Broadcast has been stopped.`
          }]
        }).catch(err => { console.log(err) });
      }


    })
  }



});
function BC(guildID) {
  BroadcastDB.findOne({
    guildID: guildID
  }, {}).then(async settings => {
    if (!settings) return; if (!settings.bcs) return;
    if (settings.st !== 'r') return console.log('#4');
    let success = settings.su; let fail = settings.fa; let MMMM = settings.bcs;
    if (MMMM[0]) {
      await client.users.fetch(MMMM[0]).catch(err => { });
      let user = await client.users.cache.find(t => t.id == MMMM[0]);
      MMMM.shift(); BroadcastDB.updateOne({ guildID: guildID }, { $set: { bcs: MMMM } });
      if (user) {
        await user.send({ content: `${settings.msg}` }).then(() => {
          success++;
          console.log(`✅ ${user.username}`);
        }).catch(err => { fail++; });
      } else { fail++; }
      BroadcastDB.updateOne({ guildID: guildID }, { $set: { su: success, fa: fail } }).then(async () => {
        console.log(success + fail);
        setTimeout(() => {
          BC(guildID); console.log('looping')
        }, Math.floor(sec * 1000));
      })
    } else {
      let CH = await client.channels.fetch(settings.CH).catch(err => { });
      if (CH) CH.send({
        embeds: [{
          title: `Broadcast ENDED!!`, color: 3079936,
          description: `**✅ success: \`${settings.su}\` ❌ failed: \`${settings.fa}\`**`,
          footer: { text: `${guildID}` }, timestamp: new Date().toISOString()
        }]
      }).catch(err => { });
      BroadcastDB.updateOne({ guildID: guildID }, { $set: { bcs: [], st: 'x' } });

    }


  });
}
