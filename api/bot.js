const { Telegraf } = require('telegraf');

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

const commentText = `⚠️ Краткие правила комментариев:\n\n` +
`• Спам категорически запрещён.\n` +
`• Запрещён любой контент сексуальной направленности. Комментарии должны быть читабельны на работе.\n` +
`• Ведите себя прилично, не оскорбляйте других участников и поддерживайте обсуждение только по теме поста.\n` +
`• Любая политика или околополитический контент касающийся событий в реальной жизни запрещен.\n` +
`• Контент запрещённый к распространению на территории Российской Федерации будет удаляться, а участник его запостивший будет заблокирован.\n\n` +
`📡 Наш чат: https://t.me/+qAcLEuOQVbZhYWFi | Discord: https://discord.gg/rBnww7ytM3 | TikTok: https://www.tiktok.com/@spectr_mindustry?_t=ZN-8yZCVx33mr9&_r=1`;

function safeHandler(handler) {
  return async (ctx) => {
    try {
      await handler(ctx);
    } catch (err) {
      console.error('Ошибка в обработчике:', err);
    }
  };
}

// —————————— Команда /start ——————————
bot.start(safeHandler(async (ctx) => {
  const user = ctx.message.from;
  const firstName = user.first_name || '';
  const userID = user.id;

  let greeting = `👋 Привет${firstName ? ', ' + firstName : ''}! Я — автоматический бот для канала.\n\n` +
                 `Моя задача — добавлять комментарии с правилами под каждым постом в канале.\n\n` +
                 `Подписывайся на канал, чтобы видеть меня в действии! 😊`;

  if (userID === 2032240231) greeting = `Здравствуйте, Советчик! 👋\n\n` +
    `Я — автоматический бот для вашего канала.\n\n` +
    `Моя задача — добавлять комментарии с правилами под каждым постом.\n\n` +
    `Для работы используйте команду /help`;

  if (userID === 1465194766) greeting = `Здравствуйте, Спектр! 👋\n\n` +
    `Я — автоматический бот для вашего канала.\n\n` +
    `Моя задача — добавлять комментарии с правилами под каждым постом.\n\n` +
    `Для работы используйте команду /help`;

  await ctx.reply(greeting);
}));

// —————————— Команда /help ——————————
bot.help(safeHandler(async (ctx) => {
  const userId = ctx.from.id;

  if (ADMIN_IDS.includes(userId)) {
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

<b>Функции для админов:</b>
• Ответ на пересланные сообщения от пользователей
• Ответ по ссылке на сообщение формата t.me/c/...
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

// —————————— Команды /ida и /idr ——————————
bot.command('ida', safeHandler(async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return ctx.reply('❌ Только админам.');
  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('❌ Укажите ID чата: /ida <ID_чата>');
  const chatId = parseInt(args[1]);
  if (isNaN(chatId)) return ctx.reply('❌ Неверный формат ID.');
  if (!ALLOWED_CHATS.includes(chatId)) {
    ALLOWED_CHATS.push(chatId);
    return ctx.reply(`✅ Чат ${chatId} добавлен.`);
  } else return ctx.reply(`ℹ️ Чат ${chatId} уже в списке.`);
}));

bot.command('idr', safeHandler(async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return ctx.reply('❌ Только админам.');
  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('❌ Укажите ID чата: /idr <ID_чата>');
  const chatId = parseInt(args[1]);
  if (isNaN(chatId)) return ctx.reply('❌ Неверный формат ID.');
  const index = ALLOWED_CHATS.indexOf(chatId);
  if (index !== -1) {
    ALLOWED_CHATS.splice(index, 1);
    return ctx.reply(`✅ Чат ${chatId} удален.`);
  } else return ctx.reply(`ℹ️ Чат ${chatId} не найден.`);
}));

// —————————— Команда /allowed_chats ——————————
bot.command('allowed_chats', safeHandler(async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return ctx.reply('❌ Только админам.');
  if (ALLOWED_CHATS.length === 0) return ctx.reply('📝 Список пуст.');
  const chatList = ALLOWED_CHATS.map(id => `• ${id}`).join('\n');
  return ctx.reply(`📝 Разрешённые чаты:\n${chatList}`);
}));

// —————————— Команда /comment_text ——————————
bot.command('comment_text', safeHandler(async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return ctx.reply('❌ Только админам.');
  return ctx.reply(commentText);
}));

// —————————— Команда /info ——————————
bot.command('info', safeHandler(async (ctx) => {
  const infoText = `
⚙️ <b>О боте</b>
Версия: 0.0.1
ИИ: Red-AI 0.1
Разработчики: <a href="https://t.me/red_star_development">Красная звезда</a>
`;

  await ctx.reply(infoText, {
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });
}));

// —————————— Тестовая команда ——————————
bot.command('test', safeHandler(async (ctx) => await ctx.reply('✅ Бот активен и работает в штатном режиме!')));

// —————————— Обработка сообщений и пересылка ——————————
bot.on('message', safeHandler(async (ctx) => {
  const message = ctx.message;
  const userId = message.from.id;
  const chatId = message.chat.id;

  // Новый чат
  if (message.new_chat_members) {
    const isBotAdded = message.new_chat_members.some(m => m.is_bot && m.id === ctx.botInfo.id);
    if (isBotAdded && !ALLOWED_CHATS.includes(chatId)) {
      await ctx.reply('🚫 Я не могу работать в этом чате! Этот чат не разрешен.');
      await new Promise(r => setTimeout(r, 2000));
      return await ctx.leaveChat();
    }
  }

  // Ответ админа пользователю
  if (ADMIN_IDS.includes(userId) && message.reply_to_message?.forward_from) {
    const originalSender = message.reply_to_message.forward_from;
    if (originalSender) {
      let responseText = `🔹 Ответ от ${ADMIN_NAMES[userId]}:\n\n`;
      responseText += message.text || message.caption || '';
      await ctx.telegram.sendMessage(originalSender.id, responseText);
      return await ctx.reply('✅ Ваш ответ был отправлен пользователю.');
    }
  }

  // Пересылка сообщений пользователей в админ-чат
  if (!ADMIN_IDS.includes(userId) && chatId > 0 && !message.text?.startsWith('/')) {
    const userName = message.from.first_name || 'Без имени';
    const userUsername = message.from.username ? '@' + message.from.username : 'нет username';
    const time = new Date().toLocaleString('ru-RU');
    const caption = `📩 Новое сообщение из ЛС\n👤 Имя: ${userName}\n🔖 Username: ${userUsername}\n🆔 ID: ${userId}\n⏰ Время: ${time}`;
    await ctx.forwardMessage(ADMIN_CHAT_ID, chatId, message.message_id);
    await ctx.telegram.sendMessage(ADMIN_CHAT_ID, caption);
  }
}));

// —————————— Комментарии под постами канала ——————————
bot.on('channel_post', safeHandler(async (ctx) => {
  try {
    await ctx.reply(commentText);
  } catch (error) {
    console.error('Ошибка при добавлении комментария под постом:', error);
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
    console.error('Ошибка при обработке update:', error);
    if (!res.headersSent) res.status(500).send('Internal Server Error');
  }
};
