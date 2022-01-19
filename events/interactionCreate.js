let hastebin = require('hastebin');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isButton()) return;
    if (interaction.customId == "open-ticket") {
      if (client.guilds.cache.get(interaction.guildId).channels.cache.find(c => c.topic == interaction.user.id)) {
        return interaction.reply({
          content: 'Vous avez déjà créé un ticket !',
          ephemeral: true
        });
      };

      interaction.guild.channels.create(`ticket-${interaction.user.username}`, {
        parent: client.config.parentOpened,
        topic: interaction.user.id,
        permissionOverwrites: [{
            id: interaction.user.id,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: client.config.roleSupport,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: interaction.guild.roles.everyone,
            deny: ['VIEW_CHANNEL'],
          },
        ],
        type: 'text',
      }).then(async c => {
        interaction.reply({
          content: `Ticket créé! <#${c.id}>`,
          ephemeral: true
        });

        const embed = new client.discord.MessageEmbed()
          .setColor('6d6ee8')
          .setAuthor('Ticket', 'https://images-ext-1.discordapp.net/external/OEBcWxcV4ZXXLXSEohHBHU0lWu25MNxwEHsVjJZqAjM/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/931451884336742400/d5789ee4b4c8ede488be407affe28cac.png')
          .setDescription('Séléctionnez la catégorie de votre ticket')
          .setFooter('🐱 • MiaouBot | dev by ray.fr', 'https://images-ext-1.discordapp.net/external/OEBcWxcV4ZXXLXSEohHBHU0lWu25MNxwEHsVjJZqAjM/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/931451884336742400/d5789ee4b4c8ede488be407affe28cac.png')
          .setTimestamp();

        const row = new client.discord.MessageActionRow()
          .addComponents(
            new client.discord.MessageSelectMenu()
            .setCustomId('category')
            .setPlaceholder('Séléctionnez la catégorie du ticket')
            .addOptions([{
                label: 'Support',
                value: 'support',
                emoji: '❓',
              },
              {
                label: 'Suggestion',
                value: 'suggestion',
                emoji: '💡',
              },
              {
                label: 'Autres',
                value: 'autre',
                emoji: '📔',
              },
            ]),
          );

        msg = await c.send({
          content: `<@!${interaction.user.id}>`,
          embeds: [embed],
          components: [row]
        });

        const collector = msg.createMessageComponentCollector({
          componentType: 'SELECT_MENU',
          time: 20000
        });

        collector.on('collect', i => {
          if (i.user.id === interaction.user.id) {
            if (msg.deletable) {
              msg.delete().then(async () => {
                const embed = new client.discord.MessageEmbed()
                  .setColor('6d6ee8')
                  .setAuthor('Ticket', 'https://images-ext-1.discordapp.net/external/OEBcWxcV4ZXXLXSEohHBHU0lWu25MNxwEHsVjJZqAjM/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/931451884336742400/d5789ee4b4c8ede488be407affe28cac.png')
                  .setDescription(`<@!${interaction.user.id}> A créé un ticket ${i.values[0]}`)
                  .setFooter('🐱 • MiaouBot | dev by ray.fr', 'https://images-ext-1.discordapp.net/external/OEBcWxcV4ZXXLXSEohHBHU0lWu25MNxwEHsVjJZqAjM/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/931451884336742400/d5789ee4b4c8ede488be407affe28cac.png')
                  .setTimestamp();

                const row = new client.discord.MessageActionRow()
                  .addComponents(
                    new client.discord.MessageButton()
                    .setCustomId('close-ticket')
                    .setLabel('Fermer le ticket')
                    .setEmoji('899745362137477181')
                    .setStyle('DANGER'),
                  );

                const opened = await c.send({
                  content: `<@&${client.config.roleSupport}>`,
                  embeds: [embed],
                  components: [row]
                });

                opened.pin().then(() => {
                  opened.channel.bulkDelete(1);
                });
              });
            };
            if (i.values[0] == 'support') {
              c.edit({
                parent: client.config.parentsupports
              });
            };
            if (i.values[0] == 'suggestion') {
              c.edit({
                parent: client.config.parentsuggestion
              });
            };
            if (i.values[0] == 'autre') {
              c.edit({
                parent: client.config.parentAutres
              });
            };
          };
        });

        collector.on('end', collected => {
          if (collected.size < 1) {
            c.send(`Aucune catégorie séléctionnée. Fermeture du ticket...`).then(() => {
              setTimeout(() => {
                if (c.deletable) {
                  c.delete();
                };
              }, 5000);
            });
          };
        });
      });
    };

    if (interaction.customId == "close-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);

      const row = new client.discord.MessageActionRow()
        .addComponents(
          new client.discord.MessageButton()
          .setCustomId('confirm-close')
          .setLabel('Fermer le ticket')
          .setStyle('DANGER'),
          new client.discord.MessageButton()
          .setCustomId('no')
          .setLabel('Annuler la fermeture')
          .setStyle('SECONDARY'),
        );

      const verif = await interaction.reply({
        content: 'Êtes vous sûr de vouloir fermer le ticket ?',
        components: [row]
      });

      const collector = interaction.channel.createMessageComponentCollector({
        componentType: 'BUTTON',
        time: 10000
      });

      collector.on('collect', i => {
        if (i.customId == 'confirm-close') {
          interaction.editReply({
            content: `Ticket fermé par <@!${interaction.user.id}>`,
            components: []
          });

          chan.edit({
              name: `closed-${chan.name}`,
              permissionOverwrites: [
                {
                  id: client.users.cache.get(chan.topic),
                  deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: client.config.roleSupport,
                  allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: interaction.guild.roles.everyone,
                  deny: ['VIEW_CHANNEL'],
                },
              ],
            })
            .then(async () => {
              const embed = new client.discord.MessageEmbed()
                .setColor('6d6ee8')
                .setAuthor('Ticket', 'https://images-ext-1.discordapp.net/external/OEBcWxcV4ZXXLXSEohHBHU0lWu25MNxwEHsVjJZqAjM/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/931451884336742400/d5789ee4b4c8ede488be407affe28cac.png')
                .setDescription('```Contrôle des tickets```')
                .setFooter('🐱 • MiaouBot | dev by ray.fr', 'https://images-ext-1.discordapp.net/external/OEBcWxcV4ZXXLXSEohHBHU0lWu25MNxwEHsVjJZqAjM/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/931451884336742400/d5789ee4b4c8ede488be407affe28cac.png')
                .setTimestamp();

              const row = new client.discord.MessageActionRow()
                .addComponents(
                  new client.discord.MessageButton()
                  .setCustomId('delete-ticket')
                  .setLabel('Supprimer le ticket')
                  .setEmoji('🗑️')
                  .setStyle('DANGER'),
                );

              chan.send({
                embeds: [embed],
                components: [row]
              });
            });

          collector.stop();
        };
        if (i.customId == 'no') {
          interaction.editReply({
            content: 'Fermeture du ticket annulé !',
            components: []
          });
          collector.stop();
        };
      });

      collector.on('end', (i) => {
        if (i.size < 1) {
          interaction.editReply({
            content: 'Fermeture du ticket annulé !',
            components: []
          });
        };
      });
    };

    if (interaction.customId == "delete-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);

      interaction.reply({
        content: 'Sauvegarde des messages...'
      });

      chan.messages.fetch().then(async (messages) => {
        let a = messages.filter(m => m.author.bot !== true).map(m =>
          `${new Date(m.createdTimestamp).toLocaleString('fr-FR')} - ${m.author.username}#${m.author.discriminator}: ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`
        ).reverse().join('\n');
        if (a.length < 1) a = "Nothing"
        hastebin.createPaste(a, {
            contentType: 'text/plain',
            server: 'https://www.toptal.com/developers/hastebin/documents'
          }, {})
          .then(function (urlToPaste) {
            const embed = new client.discord.MessageEmbed()
              .setAuthor('Logs Ticket', 'https://images-ext-1.discordapp.net/external/OEBcWxcV4ZXXLXSEohHBHU0lWu25MNxwEHsVjJZqAjM/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/931451884336742400/d5789ee4b4c8ede488be407affe28cac.png')
              .setDescription(`📰 Logs du ticket \`${chan.id}\` créé par <@!${chan.topic}> et supprimé par <@!${interaction.user.id}>\n\nLogs: [**Cliquez ici pour voir les logs**](${urlToPaste})`)
              .setColor('2f3136')
              .setTimestamp();

            const embed2 = new client.discord.MessageEmbed()
              .setAuthor('Logs Ticket', 'https://images-ext-1.discordapp.net/external/OEBcWxcV4ZXXLXSEohHBHU0lWu25MNxwEHsVjJZqAjM/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/931451884336742400/d5789ee4b4c8ede488be407affe28cac.png')
              .setDescription(`📰 Logs de votre ticket \`${chan.id}\`: [**Cliquez ici pour voir les logs**](${urlToPaste})`)
              .setColor('2f3136')
              .setTimestamp();

            client.channels.cache.get(client.config.logsTicket).send({
              embeds: [embed]
            });
            client.users.cache.get(chan.topic).send({
              embeds: [embed2]
            }).catch(() => {console.log('I can\'t dm him :(')});
            chan.send('Suppression du channel...');

            setTimeout(() => {
              chan.delete();
            }, 5000);
          });
      });
    };
  },
};
