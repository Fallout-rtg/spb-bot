const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не установлен!');
}

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

// Глобальный обработчик ошибок бота
bot.catch((err, ctx) => {
  console.error(`Ошибка для update ${ctx.update?.update_id}:`, err);
  try {
    ctx.reply('❌ Произошла ошибка при обработке команды. Попробуйте позже.');
  } catch (e) {
    console.error('Не удалось отправить сообщение об ошибке:', e);
  }
});

function safeHandler(handler) {
  return async (ctx) => {
    try {
      await handler(ctx);
    } catch (err) {
      console.error('Ошибка в обработчике:', err);
      try {
        await ctx.reply('❌ Произошла ошибка при обработке запроса. Попробуйте позже.');
      } catch (e) {
        console.error('Не удалось отправить сообщение об ошибке:', e);
      }
    }
  };
}

function isAdmin(ctx) {
  return ctx.from && ADMIN_IDS.includes(ctx.from.id);
}

function isPrivate(ctx) {
  return ctx.chat && ctx.chat.type === 'private';
}

function restrictedCommand(handler, { adminOnly = false } = {}) {
  return safeHandler(async (ctx) => {
    if (!ctx.chat) {
      console.error('Нет информации о чате в контексте');
      return;
    }
    
    if (!isPrivate(ctx) && !isAdmin(ctx)) {
      return ctx.reply('❌ Эту команду можно использовать только в ЛС.');
    }
    if (adminOnly && !isAdmin(ctx)) {
      return ctx.reply('❌ Только админам.');
    }
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
      } catch (e) {
        console.error('Ошибка при отправке сообщения о выходе:', e);
      }
      
      try {
        await bot.telegram.leaveChat(chatId);
      } catch (e) {
        console.error('Ошибка при выходе из чата:', e);
      }
      
      ACTIVE_CHATS = ACTIVE_CHATS.filter(id => id !== chatId);
    }
  }
}

// Периодическая проверка чатов (каждые 5 минут)
setInterval(() => {
  checkBotChats(bot);
}, 5 * 60 * 1000);

// Автоматическое комментирование новых постов в канале
bot.on('channel_post', safeHandler(async (ctx) => {
  const post = ctx.update.channel_post;
  const postMessageId = post.message_id;
  
  try {
    // Отправляем комментарий с правилами
    await ctx.telegram.sendMessage(
      CHANNEL_ID,
      COMMENT_TEXT,
      {
        reply_to_message_id: postMessageId,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }
    );
    
    console.log(`✅ Добавлен комментарий к посту ${postMessageId}`);
    
    // Отчёт в админский чат
    const postLink = `https://t.me/${CHANNEL_USERNAME}/${postMessageId}`;
    await ctx.telegram.sendMessage(
      ADMIN_CHAT_ID,
      `✅ Автоматический комментарий добавлен к посту: ${postLink}`,
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );
  } catch (error) {
    console.error('❌ Ошибка при добавлении комментария:', error);
    await ctx.telegram.sendMessage(
      ADMIN_CHAT_ID,
      `❌ Не удалось добавить комментарий к посту!\nОшибка: ${error.message}`,
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );
  }
}));

// Обработка команд
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
  if (!ALLOWED_CHATS.includes(chatId)) {
    ALLOWED_CHATS.push(chatId);
    await ctx.reply(`✅ Чат ${chatId} добавлен.`);
  } else {
    await ctx.reply(`ℹ️ Чат ${chatId} уже в списке.`);
  }
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
  } else {
    await ctx.reply(`ℹ️ Чат ${chatId} не найден.`);
  }
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
  
  // Правильное преобразование ID чата (добавляем -100 в начало)
  const chatId = parseInt('-100' + match[1]);
  const messageId = parseInt(match[2], 10);
  
  REPLY_LINKS[ctx.from.id] = { chatId, messageId };
  await ctx.reply('✅ Ссылка принята. Теперь отправьте сообщение для пересылки.');
}, { adminOnly: true }));

// Обработка добавления бота в новые чаты
bot.on('new_chat_members', safeHandler(async (ctx) => {
  const chatId = ctx.chat.id;
  const isBotAdded = ctx.message.new_chat_members.some(m => m.is_bot && m.id === ctx.botInfo.id);
  
  if (isBotAdded) {
    ACTIVE_CHATS.push(chatId);

    if (!ALLOWED_CHATS.includes(chatId)) {
      try {
        await ctx.reply(
          '🚫 Этот чат не разрешён для работы бота.\nЕсли хотите, чтобы бот снова работал здесь, обратитесь к <a href="https://t.me/red_star_development">Красной звезде</a>.',
          { parse_mode: 'HTML', disable_web_page_preview: true }
        );
        
        // Ждем немного перед выходом
        await new Promise(r => setTimeout(r, 2000));
        await ctx.leaveChat();
      } catch (e) {
        console.error('Ошибка при выходе из чата:', e);
      }
      
      ACTIVE_CHATS = ACTIVE_CHATS.filter(id => id !== chatId);
    }
  }
}));

// Обработка личных сообщений и пересылок
bot.on('message', safeHandler(async (ctx) => {
  const message = ctx.message;
  const userId = message.from.id;
  const chatId = message.chat.id;

 // Ответ админа пользователю по пересланному сообщению
if (isAdmin(ctx) && message.reply_to_message?.forward_from?.id) {
  const originalSenderId = message.reply_to_message.forward_from.id;
  
  try {
    if (message.text) {
      await ctx.telegram.sendMessage(originalSenderId, message.text);
    }
    
    if (message.photo) {
      await ctx.telegram.sendPhoto(
        originalSenderId,
        message.photo[message.photo.length - 1].file_id,
        { caption: message.caption || '' }
      );
    }
    
    if (message.sticker) {
      await ctx.telegram.sendSticker(originalSenderId, message.sticker.file_id);
    }
    
    await ctx.reply('✅ Ваш ответ был отправлен пользователю.');
  } catch (error) {
    console.error('Ошибка при отправке ответа пользователю:', error);
    await ctx.reply('❌ Не удалось отправить ответ пользователю. Возможно, он заблокировал бота.');
  }
  return;
}

  // Обработка ответов по ссылке
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

  // Пересылка сообщений обычных пользователей в админский чат
  if (!isAdmin(ctx) && isPrivate(ctx) && !message.text?.startsWith('/')) {
    const userName = message.from.first_name || 'Без имени';
    const userUsername = message.from.username ? '@' + message.from.username : 'нет username';
    const time = new Date().toLocaleString('ru-RU');
    const caption = `📩 Новое сообщение из ЛС\n👤 Имя: ${userName}\n🔖 Username: ${userUsername}\n🆔 ID: ${userId}\n⏰ Время: ${time}`;

    try {
      await ctx.forwardMessage(ADMIN_CHAT_ID, chatId, message.message_id);
      await ctx.telegram.sendMessage(ADMIN_CHAT_ID, caption, { parse_mode: 'HTML', disable_web_page_preview: true });
    } catch (error) {
      console.error('Ошибка при пересылке сообщения админам:', error);
    }
  }

  // Обработка пересланных сообщений в обсуждениях канала
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
      
      const postLink = `https://t.me/${CHANNEL_USERNAME}/${message.forward_from_message_id}`;
      const commentLink = `https://t.me/c/${String(CHAT_ID).slice(4)}/${sentMessage.message_id}`;
      
      await ctx.telegram.sendMessage(
        ADMIN_CHAT_ID,
        `✅ Комментарий успешно отправлен!\nПост: ${postLink}\nКомментарий: ${commentLink}`,
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );
    } catch (error) {
      console.error('Ошибка при отправке комментария:', error);
      await ctx.telegram.sendMessage(
        ADMIN_CHAT_ID,
        `❌ Не удалось отправить комментарий!\nОшибка: ${error.message}`,
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );
    }
  }
}));

// Middleware для логирования
bot.use((ctx, next) => {
  console.log('Получено обновление:', ctx.updateType, ctx.update?.update_id);
  return next();
});

// Экспорт для Vercel
module.exports = async (req, res) => {
  console.log('Получен запрос:', req.method, req.url);
  
  try {
    if (req.method === 'POST') {
      // Парсим тело запроса, если это строка
      const update = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      console.log('Обрабатываем update:', update.update_id);
      
      await bot.handleUpdate(update);
      res.status(200).send('OK');
    } else {
      res.status(200).json({ 
        status: 'Bot is running',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Ошибка при обработке update:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: error.message 
      });
    }
  }
};
