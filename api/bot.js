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
let REPLY_LINKS = {};

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
      console.error(err);
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
    if (!isPrivate(ctx) && !isAdmin(ctx)) return ctx.reply('❌ Эту команду можно использовать только в ЛС.');
    if (adminOnly && !isAdmin(ctx)) return ctx.reply('❌ Только админам.');
    await handler(ctx);
  });
}

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

bot.start(restrictedCommand(async (ctx) => {
  const user = ctx.message.from;
  const firstName = user.first_name || '';
  const userID = user.id;
  let greeting = `👋 Привет${firstName ? ', ' + firstName : ''}! Я — автоматический бот для канала.\n\nМоя задача — добавлять комментарии с правилами под каждым постом в канале.\n\nПодписывайся на канал, чтобы видеть меня в действии! 😊`;
  if (userID === 2032240231) greeting = `Здравствуйте, Советчик! 👋\n\nЯ — автоматический бот для вашего канала.\n\nМоя задача — добавлять комментарии с правилами под каждым постом в канале.\n\nДля работы используйте команду /help.`;
  if (userID === 1465194766) greeting = `Здравствуйте, Спектр! 👋\n\nЯ — автоматический бот для вашего канала.\n\nМоя задача — добавлять комментарии с правилами под каждым постом в канале.\n\nДля работы используйте команду /help.`;
  await ctx.reply(greeting);
}));

bot.help(restrictedCommand(async (ctx) => {
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
/reply_link — указать ссылку для ответа
`;
    await ctx.reply(adminHelpText, { parse_mode: 'HTML', disable_web_page_preview: true });
  } else {
    const userHelpText = `
ℹ️ Помощь по боту:

Я — автоматический бот для канала. Моя задача — добавлять комментарии с правилами под каждым постом.

Команды:
/start — запустить бота
/help — показать это сообщение
/info — информация о боте
`;
    await ctx.reply(userHelpText, { parse_mode: 'HTML', disable_web_page_preview: true });
  }
}));

bot.command('info', restrictedCommand(async (ctx) => {
  await ctx.reply(`⚙️ О боте\nВерсия: 0.0.1\nИИ: Red-AI 0.1\nРазработчики: <a href="https://t.me/red_star_development">Красная звезда</a>`, { parse_mode: 'HTML', disable_web_page_preview: true });
}));

bot.command('test', restrictedCommand(async (ctx) => {
  await ctx.reply('✅ Бот активен и работает в штатном режиме!');
}, { adminOnly: true }));

bot.command('ida', restrictedCommand(async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('❌ Укажите ID чата: /ida <ID>');
  const chatId = parseInt(args[1]);
  if (isNaN(chatId)) return ctx.reply('❌ Неверный формат ID.');
  if (!ALLOWED_CHATS.includes(chatId)) ALLOWED_CHATS.push(chatId), await ctx.reply(`✅ Чат ${chatId} добавлен.`);
  else return ctx.reply(`ℹ️ Чат ${chatId} уже в списке.`);
  await checkBotChats(bot);
}, { adminOnly: true }));

bot.command('idr', restrictedCommand(async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('❌ Укажите ID чата: /idr <ID>');
  const chatId = parseInt(args[1]);
  if (isNaN(chatId)) return ctx.reply('❌ Неверный формат ID.');
  const index = ALLOWED_CHATS.indexOf(chatId);
  if (index !== -1) ALLOWED_CHATS.splice(index, 1), await ctx.reply(`✅ Чат ${chatId} удален.`);
  else return ctx.reply(`ℹ️ Чат ${chatId} не найден.`);
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

bot.command('reply_link', restrictedCommand(async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('❌ Укажите ссылку на сообщение: /reply_link t.me/c/...');
  const link = args[1];
  const match = link.match(/t\.me\/c\/(\d+)\/(\d+)/);
  if (!match) return ctx.reply('❌ Неверный формат ссылки. Используйте t.me/c/...');
  const chatId = -1000000000000 + parseInt(match[1], 10);
  const messageId = parseInt(match[2], 10);
  REPLY_LINKS[ctx.from.id] = { chatId, messageId };
  await ctx.reply('✅ Ссылка принята. Теперь отправьте сообщение для пересылки.');
}, { adminOnly: true }));

bot.on('message', safeHandler(async (ctx) => {
  const message = ctx.message;
  const userId = message.from.id;
  const chatId = message.chat.id;

  if (message.new_chat_members) {
    const isBotAdded = message.new_chat_members.some(m => m.is_bot && m.id === ctx.botInfo.id);
    if (isBotAdded) {
      ACTIVE_CHATS.push(chatId);
      if (!ALLOWED_CHATS.includes(chatId)) {
        await ctx.reply('🚫 Этот чат не разрешён для работы бота.\nЕсли хотите, чтобы бот снова работал здесь, обратитесь к <a href="https://t.me/red_star_development">Красной звезде</a>.', { parse_mode: 'HTML', disable_web_page_preview: true });
        await ctx.leaveChat();
        ACTIVE_CHATS = ACTIVE_CHATS.filter(id => id !== chatId);
      }
    }
  }

  if (isAdmin(ctx) && REPLY_LINKS[userId] && !(message.text?.startsWith('/'))) {
    const { chatId: targetChat, messageId: targetMessage } = REPLY_LINKS[userId];
    try {
      if (message.text) await ctx.telegram.sendMessage(targetChat, message.text, { reply_to_message_id: targetMessage, disable_web_page_preview: true });
      if (message.photo) {
        const fileId = message.photo[message.photo.length - 1].file_id;
        await ctx.telegram.sendPhoto(targetChat, fileId, { caption: message.caption || '', reply_to_message_id: targetMessage });
      }
      if (message.video) await ctx.telegram.sendVideo(targetChat, message.video.file_id, { caption: message.caption || '', reply_to_message_id: targetMessage });
      if (message.document) await ctx.telegram.sendDocument(targetChat, message.document.file_id, { caption: message.caption || '', reply_to_message_id: targetMessage });
      if (message.sticker) await ctx.telegram.sendSticker(targetChat, message.sticker.file_id);
      if (message.animation) await ctx.telegram.sendAnimation(targetChat, message.animation.file_id, { caption: message.caption || '', reply_to_message_id: targetMessage });
      if (message.poll) {
        const p = message.poll;
        const options = p.options.map(o => o.text);
        await ctx.telegram.sendPoll(targetChat, p.question, options, { is_anonymous: p.is_anonymous, type: p.type });
      }
      await ctx.reply('✅ Сообщение успешно отправлено.');
      delete REPLY_LINKS[userId];
    } catch (err) {
      console.error(err);
      await ctx.reply(`❌ Ошибка при пересылке: ${err.description || err.message || err}`);
    }
    return;
  }

  if (!isAdmin(ctx) && isPrivate(ctx) && !message.text?.startsWith('/')) {
    const userName = message.from.first_name || 'Без имени';
    const userUsername = message.from.username ? '@' + message.from.username : 'нет username';
    const time = new Date().toLocaleString('ru-RU');
    const caption = `📩 Новое сообщение из ЛС\n👤 Имя: ${userName}\n🔖 Username: ${userUsername}\n🆔 ID: ${userId}\n⏰ Время: ${time}`;
    await ctx.forwardMessage(ADMIN_CHAT_ID, chatId, message.message_id);
    await ctx.telegram.sendMessage(ADMIN_CHAT_ID, caption, { parse_mode: 'HTML', disable_web_page_preview: true });
  }

  if (chatId === CHAT_ID && message.forward_from_chat?.id === CHANNEL_ID && message.forward_from_message_id) {
    try {
      const sentMessage = await ctx.telegram.sendMessage(CHAT_ID, COMMENT_TEXT, { reply_to_message_id: message.message_id, parse_mode: 'HTML', disable_web_page_preview: true });
      const postLink = `https://t.me/${message.forward_from_chat.username}/${message.forward_from_message_id}`;
      const commentLink = `https://t.me/c/${String(CHAT_ID).slice(4)}/${sentMessage.message_id}`;
      await ctx.telegram.sendMessage(ADMIN_CHAT_ID, `✅ Комментарий успешно отправлен!\nПост: ${postLink}\nКомментарий: ${commentLink}`, { parse_mode: 'HTML', disable_web_page_preview: true });
    } catch (error) {
      await ctx.telegram.sendMessage(ADMIN_CHAT_ID, `❌ Не удалось отправить комментарий!\nОшибка: ${error.message}`, { parse_mode: 'HTML', disable_web_page_preview: true });
    }
  }
}));

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } else {
      res.status(200).send('Bot is running.');
    }
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.status(500).send('Internal Server Error');
  }
};
