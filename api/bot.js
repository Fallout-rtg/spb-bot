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

const COMMENT_TEXT = `
<b>⚠️ Краткие правила комментариев:</b>

• Спам категорически запрещён.
• Запрещён любой контент сексуальной направленности. Комментарии должны быть читабельны на работе.
• Ведите себя прилично, не оскорбляйте других участников и поддерживайте обсуждение только по теме поста.
• Любая политика или околополитический контент касающийся событий в реальной жизни запрещен.
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

// —————————— Управления разрешёнными чатами ——————————
// —————————— Массив активных чатов ——————————
let ACTIVE_CHATS = [];

// —————————— Функция проверки всех групп, где бот находится ——————————
async function checkBotChats(bot) {
  for (const chatId of ACTIVE_CHATS.slice()) {
    if (!ALLOWED_CHATS.includes(chatId)) {
      try {
        await bot.telegram.sendMessage(
          chatId,
          '🚫 Этот чат больше не разрешён для работы бота.\n' +
          'Если хотите, чтобы бот снова работал здесь, обратитесь к <a href="https://t.me/red_star_development">Красной звезде</a>.',
          { parse_mode: 'HTML', disable_web_page_preview: true }
        );
      } catch (e) {
        // Игнорируем ошибки, если бот не может писать в чат
      }
      await bot.telegram.leaveChat(chatId);
      ACTIVE_CHATS = ACTIVE_CHATS.filter(id => id !== chatId);
    }
  }
}

// —————————— Команда /ida (добавить чат) ——————————
bot.command('ida', safeHandler(async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return ctx.reply('❌ Только админам.');
  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('❌ Укажите ID чата: /ida <ID>');
  const chatId = parseInt(args[1]);
  if (isNaN(chatId)) return ctx.reply('❌ Неверный формат ID.');

  if (!ALLOWED_CHATS.includes(chatId)) {
    ALLOWED_CHATS.push(chatId);
    await ctx.reply(`✅ Чат ${chatId} добавлен.`);
  } else return ctx.reply(`ℹ️ Чат ${chatId} уже в списке.`);

  // Проверка всех чатов на актуальность
  await checkBotChats(bot);
}));

// —————————— Команда /idr (удалить чат) ——————————
bot.command('idr', safeHandler(async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return ctx.reply('❌ Только админам.');
  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('❌ Укажите ID чата: /idr <ID>');
  const chatId = parseInt(args[1]);
  if (isNaN(chatId)) return ctx.reply('❌ Неверный формат ID.');

  const index = ALLOWED_CHATS.indexOf(chatId);
  if (index !== -1) {
    ALLOWED_CHATS.splice(index, 1);
    await ctx.reply(`✅ Чат ${chatId} удален.`);
  } else return ctx.reply(`ℹ️ Чат ${chatId} не найден.`);

  // Проверка всех чатов на актуальность
  await checkBotChats(bot);
}));

// —————————— Команда /allowed_chats (список разрешённых чатов) ——————————
bot.command('allowed_chats', safeHandler(async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return ctx.reply('❌ Только админам.');
  if (ALLOWED_CHATS.length === 0) return ctx.reply('📝 Список пуст.');
  const chatList = ALLOWED_CHATS.map(id => `• ${id}`).join('\n');
  await ctx.reply(`📝 Разрешённые чаты:\n${chatList}`);
}));

// —————————— Обработка новых чатов, где добавили бота ——————————
bot.on('new_chat_members', safeHandler(async (ctx) => {
  const chatId = ctx.chat.id;
  const isBotAdded = ctx.message.new_chat_members.some(m => m.is_bot && m.id === ctx.botInfo.id);
  if (isBotAdded) {
    ACTIVE_CHATS.push(chatId);

    if (!ALLOWED_CHATS.includes(chatId)) {
      await ctx.reply(
        '🚫 Этот чат не разрешён для работы бота.\n' +
        'Если хотите, чтобы бот снова работал здесь, обратитесь к <a href="https://t.me/red_star_development">Красной звезде</a>.',
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );
      await ctx.leaveChat();
      ACTIVE_CHATS = ACTIVE_CHATS.filter(id => id !== chatId);
    }
  }
}));

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
    `Моя задача — добавлять комментарии с правилами под каждым постом в канале.\n\n` +
    `Для работы используйте команду /help.`;

  if (userID === 1465194766) greeting = `Здравствуйте, Спектр! 👋\n\n` +
    `Я — автоматический бот для вашего канала.\n\n` +
    `Моя задача — добавлять комментарии с правилами под каждым постом в канале.\n\n` +
    `Для работы используйте команду /help.`;

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

// —————————— Команда /info ——————————
bot.command('info', safeHandler(async (ctx) => {
  const infoText = `
⚙️ О боте
Версия: 0.0.1
ИИ: Red-AI 0.1
Разработчики: <a href="https://t.me/red_star_development">Красная звезда</a>
`;
  await ctx.reply(infoText, { parse_mode: 'HTML', disable_web_page_preview: true });
}));

// —————————— Команда /test ——————————
bot.command('test', safeHandler(async (ctx) => {
  await ctx.reply('✅ Бот активен и работает в штатном режиме!');
}));

// —————————— Команда /comment_text ——————————
bot.command('comment_text', safeHandler(async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return ctx.reply('❌ Только админам.');
  await ctx.reply(COMMENT_TEXT, { parse_mode: 'HTML', disable_web_page_preview: true });
}));

// —————————— Обработка новых сообщений ——————————
bot.on('message', safeHandler(async (ctx) => {
  const message = ctx.message;
  const userId = message.from.id;
  const chatId = message.chat.id;

  // ————— Проверка нового чата при добавлении бота —————
  if (message.new_chat_members) {
    const isBotAdded = message.new_chat_members.some(m => m.is_bot && m.id === ctx.botInfo.id);
    if (isBotAdded && !ALLOWED_CHATS.includes(chatId)) {
      await ctx.reply(
        '🚫 Я не могу работать в этом чате! Этот чат не разрешен.\n' +
        'Если хотите, чтобы бот работал здесь, обратитесь к <a href="https://t.me/red_star_development">Красной звезде</a>.',
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );
      await new Promise(r => setTimeout(r, 2000));
      return await ctx.leaveChat();
    }
  }

  // ————— Ответ админа пользователю (по пересланному сообщению) —————
  if (ADMIN_IDS.includes(userId) && message.reply_to_message?.forward_from?.id) {
    const originalSenderId = message.reply_to_message.forward_from.id;
    let responseText = `🔹 Ответ от ${ADMIN_NAMES[userId]}:\n\n${message.text || message.caption || ''}`;
    await ctx.telegram.sendMessage(originalSenderId, responseText);
    if (message.photo) {
      await ctx.telegram.sendPhoto(
        originalSenderId,
        message.photo[message.photo.length - 1].file_id,
        { caption: message.caption }
      );
    }
    if (message.sticker) {
      await ctx.telegram.sendSticker(originalSenderId, message.sticker.file_id);
    }
    return await ctx.reply('✅ Ваш ответ был отправлен пользователю.');
  }

  // ————— Пересылка сообщений обычных пользователей в админский чат —————
  if (!ADMIN_IDS.includes(userId) && chatId > 0 && !message.text?.startsWith('/')) {
    const userName = message.from.first_name || 'Без имени';
    const userUsername = message.from.username ? '@' + message.from.username : 'нет username';
    const time = new Date().toLocaleString('ru-RU');
    const caption = `📩 Новое сообщение из ЛС\n👤 Имя: ${userName}\n🔖 Username: ${userUsername}\n🆔 ID: ${userId}\n⏰ Время: ${time}`;

    await ctx.forwardMessage(ADMIN_CHAT_ID, chatId, message.message_id);
    await ctx.telegram.sendMessage(ADMIN_CHAT_ID, caption, { parse_mode: 'HTML', disable_web_page_preview: true });
  }
}));

// Обработка новых постов в канале
bot.on('message', safeHandler(async (ctx) => {
  const message = ctx.message;

  // Проверяем, что сообщение пришло в группу обсуждения
  if (message.chat.id === CHAT_ID) {
    // Проверяем, что сообщение переслано из нужного канала
    if (message.forward_from_chat && message.forward_from_chat.id === CHANNEL_ID) {
      try {
        // Пытаемся отправить комментарий как ответ
        const sentMessage = await ctx.reply(COMMENT_TEXT, {
          parse_mode: 'HTML',
          reply_to_message_id: message.message_id,
          disable_web_page_preview: true
        });

        // Отчёт админам о успешной отправке
        const postLink = `https://t.me/${message.forward_from_chat.username}/${message.message_id}`;
        const commentLink = `https://t.me/c/${String(CHAT_ID).slice(4)}/${sentMessage.message_id}`;

        await ctx.telegram.sendMessage(ADMIN_CHAT_ID,
          `✅ Комментарий отправлен!\n\n` +
          `🔹 Пост: <a href="${postLink}">ссылка</a>\n` +
          `🔹 Комментарий: <a href="${commentLink}">ссылка</a>`,
          { parse_mode: 'HTML', disable_web_page_preview: true }
        );

      } catch (error) {
        console.error('Ошибка при отправке комментария:', error);

        // Отчёт админам о неудаче
        const postLink = message.forward_from_chat.username
          ? `https://t.me/${message.forward_from_chat.username}/${message.message_id}`
          : 'неизвестная ссылка';

        await ctx.telegram.sendMessage(ADMIN_CHAT_ID,
          `❌ Не удалось отправить комментарий под постом!\n\n` +
          `🔹 Пост: ${postLink}\n` +
          `Ошибка: ${error.message}`,
          { parse_mode: 'HTML', disable_web_page_preview: true }
        );
      }
    }
  }
}));

// —————————— Экспорт модуля для сервера ——————————
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
