const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;

const CHANNEL_ID = -1002696885166;
const CHAT_ID = -1002899007927;
const ADMIN_CHAT_ID = -4969760870;
const ADMIN_IDS = [2032240231, 1465194766];
const ADMIN_NAMES = {
  2032240231: 'Советчик 📜',
  1465194766: 'Спектр ♦️'
};

const bot = new Telegraf(BOT_TOKEN);

let ALLOWED_CHATS = [CHAT_ID, ADMIN_CHAT_ID];

function safeHandler(handler) {
  return async (ctx) => {
    try {
      await handler(ctx);
    } catch (err) {
      console.error('Ошибка в обработчике:', err);
    }
  };
}

bot.command('+id', safeHandler(async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return ctx.reply('❌ Только админам.');
  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('❌ Укажите ID: /+id <ID_чата>');
  const chatId = parseInt(args[1]);
  if (isNaN(chatId)) return ctx.reply('❌ Неверный формат ID.');
  if (!ALLOWED_CHATS.includes(chatId)) {
    ALLOWED_CHATS.push(chatId);
    return ctx.reply(`✅ Чат ${chatId} добавлен.`);
  } else return ctx.reply(`ℹ️ Чат ${chatId} уже в списке.`);
}));

bot.command('-id', safeHandler(async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return ctx.reply('❌ Только админам.');
  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('❌ Укажите ID: /-id <ID_чата>');
  const chatId = parseInt(args[1]);
  if (isNaN(chatId)) return ctx.reply('❌ Неверный формат ID.');
  const index = ALLOWED_CHATS.indexOf(chatId);
  if (index !== -1) {
    ALLOWED_CHATS.splice(index, 1);
    return ctx.reply(`✅ Чат ${chatId} удален.`);
  } else return ctx.reply(`ℹ️ Чат ${chatId} не найден.`);
}));

bot.command('/allowed_chats', safeHandler(async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return ctx.reply('❌ Только админам.');
  if (ALLOWED_CHATS.length === 0) return ctx.reply('📝 Список пуст.');
  const chatList = ALLOWED_CHATS.map(id => `• ${id}`).join('\n');
  return ctx.reply(`📝 Разрешенные чаты:\n${chatList}`);
}));

bot.start(safeHandler(async (ctx) => {
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

bot.help(safeHandler(async (ctx) => {
  const userId = ctx.from.id;
  const chatType = ctx.chat?.type;

  if (chatType === 'private') {
    if (ADMIN_IDS.includes(userId)) {
      const adminHelpText = `🛠 *Команды админов:*\n\n` +
        `/start - запуск бота\n` +
        `/help - показать это сообщение\n` +
        `/info - информация о боте\n` +
        `/test - проверка работоспособности\n` +
        `/+id <ID> - добавить чат в разрешенные\n` +
        `/-id <ID> - удалить чат из разрешенных\n` +
        `/allowed_chats - показать список разрешенных чатов\n\n` +
        `*Функции для админов:*\n` +
        `• Ответ на пересланные сообщения от пользователей\n` +
        `• Ответ по ссылке на сообщение формата t.me/c/...`;

      await ctx.reply(adminHelpText, { parse_mode: 'Markdown', disable_web_page_preview: true });
    } else {
      const userHelpText = `ℹ️ *Помощь по боту:*\n\n` +
        `Я — автоматический бот для канала. Моя задача — добавлять комментарии с правилами под каждым постом.\n\n` +
        `*Доступные команды:*\n` +
        `/start - запустить бота\n` +
        `/help - показать это сообщение\n` +
        `/info - информация о боте`;

      await ctx.reply(userHelpText, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }
  } else {
    await ctx.reply('ℹ️ Команда /help работает только в личных сообщениях.');
  }
}));

bot.command('test', safeHandler(async (ctx) => await ctx.reply('✅ Бот активен и работает в штатном режиме!')));

bot.command('info', safeHandler(async (ctx) => {
  const infoText = `⚙️ *О боте*\n` +
                   `Версия: 0.0.1\n` +
                   `ИИ: Red-AI 0.1\n` +
                   `Разработчики: [Красная звезда](https://t.me/red_star_development)`;

  await ctx.reply(infoText, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });
}));

bot.on('message', safeHandler(async (ctx) => {
  const message = ctx.message;
  const userId = message.from.id;
  const chatId = message.chat.id;

  if (message.new_chat_members) {
    const isBotAdded = message.new_chat_members.some(m => m.is_bot && m.id === ctx.botInfo.id);
    if (isBotAdded && !ALLOWED_CHATS.includes(chatId)) {
      const keyboard = Markup.inlineKeyboard([[Markup.button.url('Красная звезда', 'https://t.me/red_star_development')]]);
      await ctx.reply('🚫 Я не могу работать в этом чате! Этот чат не разрешен.', { reply_markup: keyboard.reply_markup });
      await new Promise(r => setTimeout(r, 2000));
      return await ctx.leaveChat();
    }
  }

  if (ADMIN_IDS.includes(userId) && message.reply_to_message?.forward_origin?.type === 'user') {
    const originalSender = message.reply_to_message.forward_origin.sender_user;
    if (originalSender) {
      let responseText = `🔹 Ответ от ${ADMIN_NAMES[userId]}:\n\n`;
      responseText += message.text || message.caption || '';
      const options = { entities: message.entities, caption_entities: message.caption_entities };
      await ctx.telegram.sendMessage(originalSender.id, responseText, options);
      if (message.photo) await ctx.telegram.sendPhoto(originalSender.id, message.photo[message.photo.length - 1].file_id, { caption: message.caption });
      if (message.sticker) await ctx.telegram.sendSticker(originalSender.id, message.sticker.file_id);
      return await ctx.reply('✅ Ваш ответ был отправлен пользователю.');
    }
  }

  if (chatId > 0 && !message.text?.startsWith('/')) {
    const userName = message.from.first_name || 'Без имени';
    const userUsername = message.from.username ? '@' + message.from.username : 'нет username';
    const time = new Date().toLocaleString('ru-RU');
    const caption = `📩 *Новое сообщение из ЛС*\n👤 Имя: ${userName}\n🔖 Username: ${userUsername}\n🆔 ID: ${message.from.id}\n⏰ Время: ${time}`;
    await ctx.forwardMessage(ADMIN_CHAT_ID, chatId, message.message_id);
    await ctx.telegram.sendMessage(ADMIN_CHAT_ID, caption, { parse_mode: 'Markdown', disable_web_page_preview: true });
  }
}));

const commentText = `⚠️ *Краткие правила комментариев:*\n\n` +
`• Спам категорически запрещён.\n` +
`• Запрещён любой контент сексуальной направленности. Комментарии должны быть читабельны на работе.\n` +
`• Ведите себя прилично, не оскорбляйте других участников и поддерживайте обсуждение только по теме поста.\n` +
`• Любая политика или околополитический контент касающийся событий в реальной жизни запрещен.\n` +
`• Контент запрещённый к распространению на территории Российской Федерации будет удаляться, а участник его запостивший будет заблокирован.\n\n` +
`📡 [Наш чат](https://t.me/+qAcLEuOQVbZhYWFi) | [Discord](https://discord.gg/rBnww7ytM3) | [TikTok](https://www.tiktok.com/@spectr_mindustry?_t=ZN-8yZCVx33mr9&_r=1)`;

bot.on('channel_post', safeHandler(async (ctx) => {
  try {
    await ctx.reply(commentText, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
  } catch (error) {
    console.error('Ошибка при добавлении комментария под постом:', error);
  }
}));

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body); // НЕ передаем res
      res.status(200).send('OK');       // ответ один раз
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
