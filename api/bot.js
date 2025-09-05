const { Telegraf, Markup } = require('telegraf');

// Загружаем токен из переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN;

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

// —————————— ОБЁРТКА ДЛЯ БЕЗОПАСНОГО ОБРАБОТЧИКА —————————— //
function safeHandler(handler) {
  return async (ctx) => {
    try {
      await handler(ctx);
    } catch (err) {
      console.error('Ошибка в обработчике:', err);
    }
  };
}

// —————————— УПРАВЛЕНИЕ РАЗРЕШЕННЫМИ ЧАТАМИ —————————— //
bot.command('+id', safeHandler(async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return ctx.reply('❌ Эта команда доступна только администраторам.');
  
  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('❌ Укажите ID чата после команды: /+id <ID_чата>');
  
  const chatId = parseInt(args[1]);
  if (isNaN(chatId)) return ctx.reply('❌ Неверный формат ID чата. Укажите числовой ID.');
  
  if (!ALLOWED_CHATS.includes(chatId)) {
    ALLOWED_CHATS.push(chatId);
    return ctx.reply(`✅ Чат с ID ${chatId} добавлен в разрешенные.`);
  } else {
    return ctx.reply(`ℹ️ Чат с ID ${chatId} уже есть в списке разрешенных.`);
  }
}));

bot.command('-id', safeHandler(async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return ctx.reply('❌ Эта команда доступна только администраторам.');
  
  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('❌ Укажите ID чата после команды: /-id <ID_чата>');
  
  const chatId = parseInt(args[1]);
  if (isNaN(chatId)) return ctx.reply('❌ Неверный формат ID чата. Укажите числовой ID.');
  
  const index = ALLOWED_CHATS.indexOf(chatId);
  if (index !== -1) {
    ALLOWED_CHATS.splice(index, 1);
    return ctx.reply(`✅ Чат с ID ${chatId} удален из разрешенных.`);
  } else {
    return ctx.reply(`ℹ️ Чат с ID ${chatId} не найден в списке разрешенных.`);
  }
}));

bot.command('/allowed_chats', safeHandler(async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return ctx.reply('❌ Эта команда доступна только администраторам.');
  
  if (ALLOWED_CHATS.length === 0) return ctx.reply('📝 Список разрешенных чатов пуст.');
  
  const chatList = ALLOWED_CHATS.map(id => `• ${id}`).join('\n');
  return ctx.reply(`📝 Разрешенные чаты:\n${chatList}`);
}));

// —————————— ЗАЩИТА ОТ ДОБАВЛЕНИЯ В ЧУЖИЕ ЧАТЫ —————————— //
bot.on('message', safeHandler(async (ctx) => {
  if (ctx.message.new_chat_members) {
    const newMembers = ctx.message.new_chat_members;
    const isBotAdded = newMembers.some(member => member.is_bot && member.id === ctx.botInfo.id);
    
    if (isBotAdded) {
      const chatId = ctx.chat.id;
      if (!ALLOWED_CHATS.includes(chatId)) {
        try {
          const keyboard = Markup.inlineKeyboard([
            [Markup.button.url('Красная звезда', 'https://t.me/red_star_development')]
          ]);
          
          await ctx.reply(
            `🚫 Я не могу работать в этом чате!\n\nЭтот чат не входит в список разрешенных. Если вам нужен подобный бот, обратитесь за помощью к разработчикам Красная звезда.`,
            { reply_markup: keyboard.reply_markup, disable_web_page_preview: true }
          );
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          await ctx.leaveChat();
        } catch (error) {
          console.error('Ошибка при выходе из чата:', error);
        }
      }
    }
  }
}));

// —————————— КОМАНДА /HELP —————————— //
bot.help(safeHandler(async (ctx) => {
  const userId = ctx.from.id;
  const chatType = ctx.chat.type;

  if (chatType === 'private') {
    if (ADMIN_IDS.includes(userId)) {
      const adminHelpText = `🛠️ *Команды для администраторов:*\n\n` +
        `/start - Запуск бота\n/help - Показать это сообщение\n/info - Информация о боте\n/test - Проверка работы\n` +
        `/+id <ID_чата> - Добавить чат\n/-id <ID_чата> - Удалить чат\n/allowed_chats - Список разрешенных\n\n` +
        `*Как отвечать пользователям:*\n1. Ответьте на пересланное сообщение в чате администрации\n2. Или отправьте ссылку на сообщение`;
      await ctx.reply(adminHelpText, { parse_mode: 'Markdown', disable_web_page_preview: true });
    } else {
      const userHelpText = `ℹ️ *Помощь по боту:*\n\n` +
        `Я — автоматический бот для канала. Моя задача — добавлять комментарии с правилами под каждым постом.\n\n` +
        `Доступные команды: /start, /help, /info`;
      await ctx.reply(userHelpText, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }
  }
}));

// —————————— ЛИЧНЫЕ СООБЩЕНИЯ —————————— //
bot.start(safeHandler(async (ctx) => {
  const user = ctx.message.from;
  const firstName = user.first_name || '';
  const userID = user.id;

  let greeting = `👋 Привет${firstName ? ', ' + firstName : ''}! Я — бот канала, который автоматически добавляет комментарии с правилами под каждым постом.\n\n` +
                 `Подписывайся на канал, чтобы видеть меня в действии! 😊`;

  // Приветствие для админов
  if (userID === 2032240231) { // Советчик
    greeting = `Здравствуйте, Советчик! 👋\n\n` +
               `Я — автоматический бот для вашего канала.\n` +
               `Моя задача — добавлять комментарии с правилами под каждым постом.\n\n` +
               `Для работы со мной используйте команду /help — там указаны все доступные функции.`;
  } else if (userID === 1465194766) { // Спектр
    greeting = `Здравствуйте, Спектр! 👋\n\n` +
               `Я — автоматический бот для вашего канала.\n` +
               `Моя задача — добавлять комментарии с правилами под каждым постом.\n\n` +
               `Для работы со мной используйте команду /help — там указаны все доступные функции.`;
  }

  await ctx.reply(greeting);
}));

bot.command('test', safeHandler(async (ctx) => {
  await ctx.reply('✅ Бот активен и работает в штатном режиме!');
}));

bot.command('info', safeHandler(async (ctx) => {
  const infoText = `⚙️О боте⚙️\nВерсия: 0.0.1\nИИ: Red-AI 0.1 \nРазработчики: Красная звезда`;
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.url('Красная звезда', 'https://t.me/red_star_development')]
  ]);
  await ctx.reply(infoText, { reply_markup: keyboard.reply_markup, disable_web_page_preview: true });
}));

// —————————— ОБРАБОТКА АДМИН-СООБЩЕНИЙ —————————— //
bot.on('message', safeHandler(async (ctx) => {
  const message = ctx.message;
  const userId = message.from.id;
  const chatId = message.chat.id;

  if (ADMIN_IDS.includes(userId)) {
    if (message.reply_to_message) {
      const repliedMessage = message.reply_to_message;
      if (repliedMessage.forward_origin && repliedMessage.forward_origin.type === 'user') {
        const originalSender = repliedMessage.forward_origin.sender_user;
        if (originalSender) {
          const userChatId = originalSender.id;
          const adminName = ADMIN_NAMES[userId] || 'Администратор';

          let responseText = `🔹 Ответ от ${adminName}:\n\n`;
          if (message.text) responseText += message.text;
          else if (message.caption) responseText += message.caption;

          const options = {};
          if (message.entities) options.entities = message.entities;
          if (message.caption_entities) options.caption_entities = message.caption_entities;

          try {
            await ctx.telegram.sendMessage(userChatId, responseText, options);
            if (message.photo) await ctx.telegram.sendPhoto(userChatId, message.photo[message.photo.length - 1].file_id, { caption: message.caption, caption_entities: message.caption_entities });
            else if (message.sticker) await ctx.telegram.sendSticker(userChatId, message.sticker.file_id);

            await ctx.reply('✅ Ваш ответ был отправлен пользователю.');
          } catch (error) {
            console.error('Ошибка при отправке ответа пользователю:', error);
            await ctx.reply('❌ Не удалось отправить ответ пользователю.');
          }
        }
      }
    }
    return;
  }

  // Пересылка сообщений от обычных пользователей
  if (chatId > 0 && !message.text?.startsWith('/')) {
    const user = message.from;
    const userName = user.first_name || user.last_name || 'Без имени';
    const userUsername = user.username ? `@${user.username}` : 'нет username';
    const time = new Date().toLocaleString('ru-RU');

    const caption = `📩 *Новое сообщение из ЛС*\n👤 *Имя:* ${userName}\n🔖 *Username:* ${userUsername}\n🆔 *ID:* ${user.id}\n⏰ *Время:* ${time}`;

    try {
      await ctx.forwardMessage(ADMIN_CHAT_ID, chatId, message.message_id);
      await ctx.telegram.sendMessage(ADMIN_CHAT_ID, caption, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Ошибка при пересылке сообщения админам:', error);
    }
  }
}));

// —————————— EXPORT ДЛЯ VERCEL —————————— //
module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body);
      return res.status(200).send('OK');
    }
    res.status(200).send('Bot is running 🚀');
  } catch (err) {
    console.error('Ошибка при обработке webhook:', err);
    res.status(500).send('Internal Server Error');
  }
};
