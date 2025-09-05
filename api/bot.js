const { Telegraf, Markup } = require('telegraf');

// Загружаем токен из переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('❌ BOT_TOKEN не найден в переменных окружения!');
}

// Константы
const CHANNEL_ID = -1002696885166;
const CHAT_ID = -1002899007927; // Чат канала
const ADMIN_CHAT_ID = -4969760870; // Чат администрации
const ADMIN_IDS = [2032240231, 1465194766];
const ADMIN_NAMES = {
  2032240231: 'Советчик 📜',
  1465194766: 'Спектр ♦️'
};

// Инициализируем бота
const bot = new Telegraf(BOT_TOKEN);

// Массив разрешенных чатов
let ALLOWED_CHATS = [CHAT_ID, ADMIN_CHAT_ID];

// —————————— УПРАВЛЕНИЕ РАЗРЕШЕННЫМИ ЧАТАМИ —————————— //
bot.command('+id', async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('❌ Эта команда доступна только администраторам.');
  }
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('❌ Укажите ID чата: /+id <ID_чата>');
  }
  const chatId = parseInt(args[1]);
  if (isNaN(chatId)) {
    return ctx.reply('❌ Неверный формат ID.');
  }
  if (!ALLOWED_CHATS.includes(chatId)) {
    ALLOWED_CHATS.push(chatId);
    return ctx.reply(`✅ Чат ${chatId} добавлен.`);
  } else {
    return ctx.reply(`ℹ️ Чат ${chatId} уже есть в списке.`);
  }
});

bot.command('-id', async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('❌ Эта команда доступна только администраторам.');
  }
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('❌ Укажите ID чата: /-id <ID_чата>');
  }
  const chatId = parseInt(args[1]);
  if (isNaN(chatId)) {
    return ctx.reply('❌ Неверный формат ID.');
  }
  const index = ALLOWED_CHATS.indexOf(chatId);
  if (index !== -1) {
    ALLOWED_CHATS.splice(index, 1);
    return ctx.reply(`✅ Чат ${chatId} удалён.`);
  } else {
    return ctx.reply(`ℹ️ Чат ${chatId} не найден.`);
  }
});

bot.command('allowed_chats', async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('❌ Эта команда доступна только администраторам.');
  }
  if (ALLOWED_CHATS.length === 0) {
    return ctx.reply('📝 Список пуст.');
  }
  const chatList = ALLOWED_CHATS.map(id => `• ${id}`).join('\n');
  return ctx.reply(`📝 Разрешённые чаты:\n${chatList}`);
});

// —————————— ЗАЩИТА ОТ ДОБАВЛЕНИЯ В ЧУЖИЕ ЧАТЫ —————————— //
bot.on('message', async (ctx, next) => {
  if (ctx.message.new_chat_members) {
    const newMembers = ctx.message.new_chat_members;
    const isBotAdded = newMembers.some(m => m.is_bot && m.id === ctx.botInfo.id);
    if (isBotAdded) {
      const chatId = ctx.chat.id;
      if (!ALLOWED_CHATS.includes(chatId)) {
        try {
          const keyboard = Markup.inlineKeyboard([
            [Markup.button.url('Красная звезда', 'https://t.me/red_star_development')]
          ]);
          await ctx.reply(
            `🚫 Я не могу работать в этом чате!\n\nЭтот чат не входит в список разрешённых. Обратитесь к разработчикам Красная звезда.`,
            { reply_markup: keyboard.reply_markup, disable_web_page_preview: true }
          );
          await new Promise(r => setTimeout(r, 2000));
          await ctx.leaveChat();
        } catch (err) {
          console.error('Ошибка при выходе из чата:', err);
        }
      }
    }
  }
  return next();
});

// —————————— ОБРАБОТКА КОМАНДЫ /HELP —————————— //
bot.help(async (ctx) => {
  const userId = ctx.from.id;
  const chatType = ctx.chat.type;

  if (chatType === 'private') {
    if (ADMIN_IDS.includes(userId)) {
      const adminHelpText = `🛠️ *Команды админов:*\n\n`
        + `/start - запуск\n`
        + `/help - помощь\n`
        + `/info - инфо о боте\n`
        + `/test - проверка\n`
        + `/+id <ID> - добавить чат\n`
        + `/-id <ID> - удалить чат\n`
        + `/allowed_chats - список чатов\n\n`
        + `*Функции:*\n`
        + `• Ответ на пересланные сообщения\n`
        + `• Ответ по ссылке t.me/c/...`;
      await ctx.reply(adminHelpText, { parse_mode: 'Markdown' });
    } else {
      const userHelpText = `ℹ️ *Помощь:*\n\n`
        + `Я бот канала. Добавляю комментарии с правилами.\n\n`
        + `*Команды:*\n`
        + `/start - запустить\n`
        + `/help - помощь\n`
        + `/info - информация`;
      await ctx.reply(userHelpText, { parse_mode: 'Markdown' });
    }
  }
});

// —————————— КОМАНДЫ —————————— //
bot.start((ctx) => {
  const user = ctx.message.from;
  const userName = user.first_name || 'пользователь';
  const userID = user.id;
  let greeting = `Здравствуйте, ${userName}! 👋\n\nЯ — бот канала. Добавляю комментарии с правилами.`;
  if (ADMIN_IDS.includes(userID)) {
    const adminName = ADMIN_NAMES[userID] || 'Администратор';
    greeting = `Приветствую, ${adminName}! 👋\n\nРад снова видеть.`;
  }
  ctx.reply(greeting);
});

bot.command('test', (ctx) => ctx.reply('✅ Бот активен!'));

bot.command('info', (ctx) => {
  const infoText = `⚙️О боте⚙️\nВерсия: 0.0.1\nИИ: Red-AI 0.1\nРазработчики: Красная звезда`;
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.url('Красная звезда', 'https://t.me/red_star_development')]
  ]);
  ctx.reply(infoText, { reply_markup: keyboard.reply_markup, disable_web_page_preview: true });
});

// —————————— ПЕРЕСЫЛКА СООБЩЕНИЙ —————————— //
bot.on('message', async (ctx) => {
  const message = ctx.message;
  const userId = message.from.id;
  const chatId = message.chat.id;

  // Ответы админов
  if (ADMIN_IDS.includes(userId)) {
    if (message.reply_to_message && message.reply_to_message.forward_origin?.type === 'user') {
      const originalSender = message.reply_to_message.forward_origin.sender_user;
      if (originalSender) {
        const userChatId = originalSender.id;
        const adminName = ADMIN_NAMES[userId] || 'Админ';
        let responseText = `🔹 Ответ от ${adminName}:\n\n`;
        if (message.text) responseText += message.text;
        else if (message.caption) responseText += message.caption;
        try {
          await ctx.telegram.sendMessage(userChatId, responseText);
          await ctx.reply('✅ Ответ отправлен пользователю.');
        } catch (err) {
          console.error('Ошибка отправки ответа:', err);
          await ctx.reply('❌ Не удалось отправить ответ.');
        }
      }
    }
    return;
  }

  // Пересылка от пользователей
  if (chatId > 0 && !message.text?.startsWith('/')) {
    const user = message.from;
    const userName = user.first_name || user.last_name || 'Без имени';
    const userUsername = user.username ? `@${user.username}` : 'нет username';
    const time = new Date().toLocaleString('ru-RU');
    const caption = `📩 *Новое сообщение из ЛС*\n👤 *Имя:* ${userName}\n🔖 *Username:* ${userUsername}\n🆔 *ID:* ${user.id}\n⏰ *Время:* ${time}`;
    try {
      await ctx.forwardMessage(ADMIN_CHAT_ID, chatId, message.message_id);
      await ctx.telegram.sendMessage(ADMIN_CHAT_ID, caption, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Ошибка пересылки:', err);
    }
  }
});

// —————————— ЭКСПОРТ ДЛЯ VERCEL —————————— //
module.exports = async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (err) {
    console.error('Error handling update:', err);
    res.status(500).send('Internal Server Error');
  }
};
