const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;

const CHANNEL_USERNAME = 'spektrminda';
const CHANNEL_ID = -1002696885166;
const CHAT_ID = -1002899007927;
const ADMIN_CHAT_ID = -1002974532347;
const ADMIN_IDS = [2032240231, 1465194766];
const ADMIN_NAMES = {
  2032240231: 'Советчик 📜',
  1465194766: 'Спектр ♦️'
};

const bot = new Telegraf(BOT_TOKEN);

let ALLOWED_CHATS = [CHAT_ID, ADMIN_CHAT_ID];
let ACTIVE_CHATS = [];

const COMMENT_TEXT = `
<b>⚠️ Краткие правила комментариев:</b>

• Спам категорически запрещён.
• Запрещён любой контент сексуальной направленности. Комментарии должны быть читабельны на работе.
• Ведите себя прилично, не оскорбляйте других участников и поддерживайте обсуждение только по теме поста.
• Любая политика или околополитический контент касающаяся событий в реальной жизни запрещен.
• Контент запрещённый к распространению на территории Российской Федерации будет удаляться, а участник его запостивший будет заблокирован.

📡 <a href="https://t.me/+qAcLEuOQVbZhYWFi">Наш чат</a> | <a href="https://discord.gg/rBnww7ytM3">Discord</a> | <a href="https://www.tiktok.com/@spectr_mindustry?_t=ZN-8yZCVx33mr9&_r=1">TikTok</a>
`;

function safeHandler(handler) {
  return async (ctx) => {
    try {
      await handler(ctx);
    } catch (err) {
      console.error('Ошибка в обработчике:', err);
    }
  };
}

function isAdmin(ctx) {
  return ADMIN_IDS.includes(ctx.from.id);
}

function isPrivate(ctx) {
  return ctx.chat.type === 'private';
}

function restrictedCommand(handler, { adminOnly = false } = {}) {
  return safeHandler(async (ctx) => {
    if (!isPrivate(ctx) && !isAdmin(ctx)) {
      return ctx.reply('❌ Эту команду можно использовать только в ЛС.');
    }
    if (adminOnly && !isAdmin(ctx)) {
      return ctx.reply('❌ Только админам.');
    }
    await handler(ctx);
  });
}

// ----------------- Проверка чатов -----------------
async function checkBotChats(bot) {
  for (const chatId of ACTIVE_CHATS.slice()) {
    if (!ALLOWED_CHATS.includes(chatId)) {
      try {
        await bot.telegram.sendMessage(
          chatId,
          '🚫 Этот чат больше не разрешён для работы бота.\nЕсли хотите, чтобы бот снова работал здесь, обратитесь к <a href="https://t.me/red_star_development">Красной звезде</a>.',
          { parse_mode: 'HTML', disable_web_page_preview: true }
        );
      } catch (e) {}
      await bot.telegram.leaveChat(chatId);
      ACTIVE_CHATS = ACTIVE_CHATS.filter(id => id !== chatId);
    }
  }
}

// ----------------- Команды -----------------
bot.start(restrictedCommand(async (ctx) => {
  const user = ctx.message.from;
  const firstName = user.first_name || '';
  const userID = user.id;

  let greeting = `👋 Привет${firstName ? ', ' + firstName : ''}! Я — автоматический бот для канала.\n\n` +
                 `Моя задача — добавлять комментарии с правилами под каждым постом в канале.\n\n` +
                 `Подписывайся на канал, чтобы видеть меня в действии! 😊`;

  if (userID === 2032240231) greeting = `Здравствуйте, Советчик! 👋\n\n` +
    `Я — автоматический бот для вашего канала.\n\n` +
    `Моя задача — добавлять комментарии с правилами под каждым постом в канале.\n\n` +
    `Для работы используйте команду /help.`;

  if (userID === 1465194766) greeting = `Здравствуйте, Спектр! 👋\n\n` +
    `Я — автоматический бот для вашего канала.\n\n` +
    `Моя задача — добавлять комментарии с правилами под каждым постом в канале.\n\n` +
    `Для работы используйте команду /help.`;

  await ctx.reply(greeting);
}));

bot.help(restrictedCommand(async (ctx) => {
  const userId = ctx.from.id;

  if (isAdmin(ctx)) {
    const adminHelpText = `
<b>🛠 Команды админов:</b>

/start — запуск бота
/help — показать это сообщение
/info — информация о боте
/test — проверка работоспособности
/ida ID_чата — добавить чат в разрешённые
/idr ID_чата — удалить чат из разрешённых
/allowed_chats — показать список разрешённых чатов
/comment_text — показать текст комментариев под постами
`;
    await ctx.reply(adminHelpText, { parse_mode: 'HTML', disable_web_page_preview: true });
  } else {
    const userHelpText = `
ℹ️ Помощь по боту:

Команды:
/start — запустить бота
/help — показать это сообщение
/info — информация о боте
`;
    await ctx.reply(userHelpText, { parse_mode: 'HTML', disable_web_page_preview: true });
  }
}));

bot.command('info', restrictedCommand(async (ctx) => {
  const infoText = `
⚙️ О боте
Версия: 0.0.1
ИИ: Red-AI 0.1
Разработчики: <a href="https://t.me/red_star_development">Красная звезда</a>
`;
  await ctx.reply(infoText, { parse_mode: 'HTML', disable_web_page_preview: true });
}));

bot.command('test', restrictedCommand(async (ctx) => {
  await ctx.reply('✅ Бот активен и работает в штатном режиме!');
}, { adminOnly: true }));

bot.command('ida', restrictedCommand(async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('❌ Укажите ID чата: /ida <ID>');
  const chatId = parseInt(args[1]);
  if (isNaN(chatId)) return ctx.reply('❌ Неверный формат ID.');

  if (!ALLOWED_CHATS.includes(chatId)) {
    ALLOWED_CHATS.push(chatId);
    await ctx.reply(`✅ Чат ${chatId} добавлен.`);
  } else return ctx.reply(`ℹ️ Чат ${chatId} уже в списке.`);

  await checkBotChats(bot);
}, { adminOnly: true }));

bot.command('idr', restrictedCommand(async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('❌ Укажите ID чата: /idr <ID>');
  const chatId = parseInt(args[1]);
  if (isNaN(chatId)) return ctx.reply('❌ Неверный формат ID.');

  const index = ALLOWED_CHATS.indexOf(chatId);
  if (index !== -1) {
    ALLOWED_CHATS.splice(index, 1);
    await ctx.reply(`✅ Чат ${chatId} удален.`);
  } else return ctx.reply(`ℹ️ Чат ${chatId} не найден.`);

  await checkBotChats(bot);
}, { adminOnly: true }));

bot.command('allowed_chats', restrictedCommand(async (ctx) => {
  if (ALLOWED_CHATS.length === 0) return ctx.reply('📝 Список пуст.');
  const chatList = ALLOWED_CHATS.map(id => `• ${id}`).join('\n');
  await ctx.reply(`📝 Разрешённые чаты:\n${chatList}`);
}, { adminOnly: true }));

bot.command('comment_text', restrictedCommand(async (ctx) => {
  await ctx.reply(COMMENT_TEXT, { parse_mode: 'HTML', disable_web_page_preview: true });
}, { adminOnly: true }));

// ----------------- Новые чаты -----------------
bot.on('new_chat_members', safeHandler(async (ctx) => {
  const chatId = ctx.chat.id;
  const isBotAdded = ctx.message.new_chat_members.some(m => m.is_bot && m.id === ctx.botInfo.id);
  if (isBotAdded) {
    ACTIVE_CHATS.push(chatId);

    if (!ALLOWED_CHATS.includes(chatId)) {
      await ctx.reply(
        '🚫 Этот чат не разрешён для работы бота.\nЕсли хотите, чтобы бот снова работал здесь, обратитесь к <a href="https://t.me/red_star_development">Красной звезде</a>.',
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );
      await ctx.leaveChat();
      ACTIVE_CHATS = ACTIVE_CHATS.filter(id => id !== chatId);
    }
  }
}));

// ----------------- Ответ админа пользователю (по ссылке или пересланному сообщению) -----------------
bot.on('message', safeHandler(async (ctx) => {
  const message = ctx.message;
  const userId = message.from.id;
  const chatId = message.chat.id;

  if (isAdmin(ctx) && chatId === ADMIN_CHAT_ID && message.reply_to_message) {
    let targetChatId = null;
    let targetMessageId = null;

    const replied = message.reply_to_message;

    if (replied.forward_from && replied.forward_from.id) {
      targetChatId = replied.forward_from.id;
    }

    if (replied.text) {
      const linkMatch = replied.text.match(/t\.me\/c\/(\d+)\/(\d+)/);
      if (linkMatch) {
        const chatPart = parseInt(linkMatch[1], 10);
        const messagePart = parseInt(linkMatch[2], 10);
        if (!Number.isNaN(chatPart) && !Number.isNaN(messagePart)) {
          targetChatId = -1000000000000 + chatPart;
          targetMessageId = messagePart;
        }
      }
    }

    if (!targetChatId) {
      await ctx.reply(
        '❌ Не удалось определить, куда отправить ответ. Используйте пересланное сообщение или ссылку на сообщение t.me/c/...'
      );
      return;
    }

    try {
      const options = { caption: message.caption || '', disable_web_page_preview: true };

      if (message.text) {
        await ctx.telegram.sendMessage(targetChatId, message.text, options);
      }
      if (message.photo) {
        const fileId = message.photo[message.photo.length - 1].file_id;
        await ctx.telegram.sendPhoto(targetChatId, fileId, options);
      }
      if (message.video) {
        await ctx.telegram.sendVideo(targetChatId, message.video.file_id, options);
      }
      if (message.document) {
        await ctx.telegram.sendDocument(targetChatId, message.document.file_id, options);
      }
      if (message.sticker) {
        await ctx.telegram.sendSticker(targetChatId, message.sticker.file_id);
        if (message.text) await ctx.telegram.sendMessage(targetChatId, message.text, options);
      }
      if (message.animation) {
        await ctx.telegram.sendAnimation(targetChatId, message.animation.file_id, options);
      }
      if (message.poll) {
        const p = message.poll;
        const pollOptions = p.options.map(o => o.text);
        await ctx.telegram.sendPoll(targetChatId, p.question, pollOptions, {
          is_anonymous: p.is_anonymous,
          type: p.type,
        });
      }

      await ctx.reply('✅ Ответ успешно отправлен.');
    } catch (err) {
      console.error('Ошибка при отправке ответа админом:', err);
      await ctx.reply(`❌ Не удалось отправить ответ. Ошибка: ${err?.description || err?.message || err}`);
    }

    return;
  }

  // Пересылка обычных сообщений в админский чат
  if (!isAdmin(ctx) && isPrivate(ctx) && !message.text?.startsWith('/')) {
    const userName = message.from.first_name || 'Без имени';
    const userUsername = message.from.username ? '@' + message.from.username : 'нет username';
    const time = new Date().toLocaleString('ru-RU');
    const caption = `📩 Новое сообщение из ЛС\n👤 Имя: ${userName}\n🔖 Username: ${userUsername}\n🆔 ID: ${userId}\n⏰ Время: ${time}`;

    await ctx.forwardMessage(ADMIN_CHAT_ID, chatId, message.message_id);
    await ctx.telegram.sendMessage(ADMIN_CHAT_ID, caption, { parse_mode: 'HTML', disable_web_page_preview: true });
  }

  // Проверка нового чата при добавлении бота
  if (message.new_chat_members) {
    const isBotAdded = message.new_chat_members.some(m => m.is_bot && m.id === ctx.botInfo.id);
    if (isBotAdded && !ALLOWED_CHATS.includes(chatId)) {
      await ctx.reply(
        '🚫 Я не могу работать в этом чате! Этот чат не разрешён.\nЕсли хотите, чтобы бот работал здесь, обратитесь к <a href="https://t.me/red_star_development">Красной звезде</a>.',
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );
      await new Promise(r => setTimeout(r, 2000));
      return await ctx.leaveChat();
    }
  }

  // Комментарии под постами канала
  if (chatId === CHAT_ID && message.forward_from_chat?.id === CHANNEL_ID && message.forward_from_message_id) {
    try {
      const sentMessage = await ctx.telegram.sendMessage(
        CHAT_ID,
        COMMENT_TEXT,
        {
          reply_to_message_id: message.message_id,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        }
      );

      const postLink = `https://t.me/${message.forward_from_chat.username}/${message.forward_from_message_id}`;
      const commentLink = `https://t.me/c/${String(CHAT_ID).slice(4)}/${sentMessage.message_id}`;

      await ctx.telegram.sendMessage(
        ADMIN_CHAT_ID,
        `✅ Комментарий успешно отправлен!\nПост: ${postLink}\nКомментарий: ${commentLink}`,
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );

    } catch (error) {
      await ctx.telegram.sendMessage(
        ADMIN_CHAT_ID,
        `❌ Не удалось отправить комментарий!\nОшибка: ${error.message}`,
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );
    }
  }
}));

// ----------------- Экспорт модуля -----------------
module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } else {
      res.status(200).send('Bot is running.');
    }
  } catch (error) {
    console.error('Ошибка при обработке update:', error);
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
    }
  }
};
