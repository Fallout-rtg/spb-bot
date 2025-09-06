const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;

const CHANNEL_USERNAME = 'spektrminda';
const CHANNEL_ID = -1002696885166;
const CHAT_ID = -1002899007927;       // обсуждение канала
const ADMIN_CHAT_ID = -1002974532347; // чат админов
const ADMIN_IDS = [2032240231, 1465194766];
const ADMIN_NAMES = {
  2032240231: 'Советчик 📜',
  1465194766: 'Спектр ♦️'
};

const bot = new Telegraf(BOT_TOKEN);

// Списки
let ALLOWED_CHATS = [CHAT_ID, ADMIN_CHAT_ID];
let ACTIVE_CHATS = [];

// Текст комментария (HTML)
const COMMENT_TEXT = `<b>⚠️ Краткие правила комментариев:</b>

• Спам категорически запрещён.
• Запрещён любой контент сексуальной направленности. Комментарии должны быть читабельны на работе.
• Ведите себя прилично, не оскорбляйте других участников и поддерживайте обсуждение только по теме поста.
• Любая политика или околополитический контент касающийся событий в реальной жизни запрещен.
• Контент запрещённый к распространению на территории Российской Федерации будет удаляться, а участник его запостивший будет заблокирован.

📡 <a href="https://t.me/+qAcLEuOQVbZhYWFi">Наш чат</a> | <a href="https://discord.gg/rBnww7ytM3">Discord</a> | <a href="https://www.tiktok.com/@spectr_mindustry?_t=ZN-8yZCVx33mr9&_r=1">TikTok</a>`;

// Обёртка для безопасных обработчиков
function safeHandler(handler) {
  return async (ctx, next) => {
    try {
      await handler(ctx, next);
    } catch (err) {
      console.error('Ошибка в обработчике:', err);
    }
  };
}

// Проверки доступа
function isAdminCtx(ctx) {
  return ctx.from && ADMIN_IDS.includes(ctx.from.id);
}
function isPrivateCtx(ctx) {
  return ctx.chat && ctx.chat.type === 'private';
}

// Команда-ограничитель (админ+личные сообщения)
function restrictedCommand(handler, { adminOnly = false } = {}) {
  return safeHandler(async (ctx) => {
    const admin = isAdminCtx(ctx);
    const isPrivate = isPrivateCtx(ctx);
    if (!isPrivate && !admin) {
      return ctx.reply('❌ Эту команду можно использовать только в личных сообщениях.');
    }
    if (adminOnly && !admin) {
      return ctx.reply('❌ Только администраторам.');
    }
    await handler(ctx);
  });
}

// Функция проверки чатов, где бот находится — при изменении ALLOWED_CHATS
async function checkBotChats() {
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
        // игнорируем, если уже нельзя писать в чат
      }
      try {
        await bot.telegram.leaveChat(chatId);
      } catch (e) {}
      ACTIVE_CHATS = ACTIVE_CHATS.filter(id => id !== chatId);
    }
  }
}

// Парсер ссылки на сообщение (поддерживает t.me/c/123/... и t.me/username/...)
async function parseMessageLink(ctx, text) {
  if (!text) return null;

  // t.me/c/123456789/42
  const reC = /t\.me\/c\/(\d+)\/(\d+)/i;
  const mC = text.match(reC);
  if (mC) {
    const numeric = mC[1]; // e.g. 2899007927
    const messageId = parseInt(mC[2], 10);
    const chatId = Number(`-100${numeric}`); // -100 + numeric
    if (Number.isNaN(chatId) || Number.isNaN(messageId)) return null;
    return { chatId, messageId };
  }

  // t.me/username/123  (попытка разрешить username -> getChat)
  const reUser = /t\.me\/([A-Za-z0-9_]+)\/(\d+)/i;
  const mU = text.match(reUser);
  if (mU) {
    const username = mU[1];
    const messageId = parseInt(mU[2], 10);
    try {
      // попробуем получить chat по username
      const chat = await ctx.telegram.getChat(`@${username}`);
      if (chat && chat.id) return { chatId: chat.id, messageId };
    } catch (e) {
      // не удалось разрешить username
      return null;
    }
  }

  return null;
}

// ----------------- Команды -----------------
bot.start(restrictedCommand(async (ctx) => {
  const user = ctx.from || {};
  const firstName = user.first_name || '';
  const userID = user.id;

  let greeting = `👋 Привет${firstName ? ', ' + firstName : ''}! Я — автоматический бот для канала.\n\n` +
                 `Моя задача — добавлять комментарии с правилами под каждым постом в канале.\n\n` +
                 `Подписывайся на канал, чтобы видеть меня в действии! 😊`;

  if (userID === ADMIN_IDS[0]) greeting = `Здравствуйте, ${ADMIN_NAMES[ADMIN_IDS[0]]}! 👋\n\n` +
    `Я — автоматический бот для вашего канала.\n\n` +
    `Моя задача — добавлять комментарии с правилами под каждым постом в канале.\n\n` +
    `Для работы используйте команду /help.`;

  if (userID === ADMIN_IDS[1]) greeting = `Здравствуйте, ${ADMIN_NAMES[ADMIN_IDS[1]]}! 👋\n\n` +
    `Я — автоматический бот для вашего канала.\n\n` +
    `Моя задача — добавлять комментарии с правилами под каждым постом в канале.\n\n` +
    `Для работы используйте команду /help.`;

  await ctx.reply(greeting);
}));

bot.help(restrictedCommand(async (ctx) => {
  const isAdmin = isAdminCtx(ctx);

  if (isAdmin) {
    const adminHelpText =
`🛠 Команды администраторов:

/start — запуск бота
/help — показать это сообщение
/info — информация о боте
/test — проверка работоспособности
/ida ID — добавить чат в разрешённые
/idr ID — удалить чат из разрешённых
/allowed_chats — показать список разрешённых чатов
/comment_text — показать текст комментариев под постами

Функции для админов:
• Ответ на пересланные сообщения от пользователей (ответ в админском чате)
• Отправка содержимого в ответ на сообщение по ссылке: отправьте ссылку t.me/c/…/…, затем пришлите контент.`;
    // простой текст, без парсинга HTML, чтобы избежать проблем с сущностями
    await ctx.reply(adminHelpText, { disable_web_page_preview: true });
  } else {
    const userHelpText =
`ℹ️ Помощь по боту:

Я — автоматический бот для канала. Моя задача — добавлять комментарии с правилами под каждым постом.

Команды:
/start — запустить бота
/help — показать это сообщение
/info — информация о боте`;
    await ctx.reply(userHelpText, { disable_web_page_preview: true });
  }
}));

bot.command('info', restrictedCommand(async (ctx) => {
  const infoText = `⚙️ О боте
Версия: 0.0.1
ИИ: Red-AI 0.1
Разработчики: <a href="https://t.me/red_star_development">Красная звезда</a>`;
  await ctx.reply(infoText, { parse_mode: 'HTML', disable_web_page_preview: true });
}));

bot.command('test', restrictedCommand(async (ctx) => {
  await ctx.reply('✅ Бот активен и работает в штатном режиме!');
}, { adminOnly: true }));

bot.command('ida', restrictedCommand(async (ctx) => {
  const args = (ctx.message.text || '').split(/\s+/);
  if (args.length < 2) return ctx.reply('❌ Укажите ID чата: /ida <ID>');
  const chatId = parseInt(args[1], 10);
  if (Number.isNaN(chatId)) return ctx.reply('❌ Неверный формат ID.');

  if (!ALLOWED_CHATS.includes(chatId)) {
    ALLOWED_CHATS.push(chatId);
    await ctx.reply(`✅ Чат ${chatId} добавлен в разрешённые.`);
  } else {
    await ctx.reply(`ℹ️ Чат ${chatId} уже в списке разрешённых.`);
  }

  // Убедимся что бот не находится в запрещённых чатах
  await checkBotChats();
}, { adminOnly: true }));

bot.command('idr', restrictedCommand(async (ctx) => {
  const args = (ctx.message.text || '').split(/\s+/);
  if (args.length < 2) return ctx.reply('❌ Укажите ID чата: /idr <ID>');
  const chatId = parseInt(args[1], 10);
  if (Number.isNaN(chatId)) return ctx.reply('❌ Неверный формат ID.');

  const idx = ALLOWED_CHATS.indexOf(chatId);
  if (idx !== -1) {
    ALLOWED_CHATS.splice(idx, 1);
    await ctx.reply(`✅ Чат ${chatId} удалён из разрешённых.`);
  } else {
    await ctx.reply(`ℹ️ Чат ${chatId} не найден в списке разрешённых.`);
  }

  await checkBotChats();
}, { adminOnly: true }));

bot.command('allowed_chats', restrictedCommand(async (ctx) => {
  if (ALLOWED_CHATS.length === 0) return ctx.reply('📝 Список разрешённых чатов пуст.');
  const chatList = ALLOWED_CHATS.map(id => `• ${id}`).join('\n');
  await ctx.reply(`📝 Разрешённые чаты:\n${chatList}`);
}, { adminOnly: true }));

bot.command('comment_text', restrictedCommand(async (ctx) => {
  await ctx.reply(COMMENT_TEXT, { parse_mode: 'HTML', disable_web_page_preview: true });
}, { adminOnly: true }));

// ----------------- State для пересылки по ссылке -----------------
const adminReplyState = {}; // { adminId: { chatId, messageId } }

// ----------------- Единый обработчик сообщений -----------------
bot.on('message', safeHandler(async (ctx) => {
  const message = ctx.message;
  if (!message) return;

  // Игнорировать команды здесь (они обрабатываются специально)
  if (message.text && message.text.startsWith('/')) return;

  const fromId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  const isAdmin = isAdminCtx(ctx);
  const isPrivate = isPrivateCtx(ctx);

  // 1) Обработка добавления бота в чат (new_chat_members)
  if (message.new_chat_members && Array.isArray(message.new_chat_members)) {
    const isBotAdded = message.new_chat_members.some(m => m.is_bot && m.id === ctx.botInfo.id);
    if (isBotAdded) {
      // сохраняем активный чат
      if (!ACTIVE_CHATS.includes(chatId)) ACTIVE_CHATS.push(chatId);

      if (!ALLOWED_CHATS.includes(chatId)) {
        // уведомление с ссылкой на разработчиков, затем уход
        try {
          await ctx.reply(
            '🚫 Я не могу работать в этом чате.\n\n' +
            'Если хотите, чтобы бот снова работал здесь, обратитесь к <a href="https://t.me/red_star_development">Красная звезда</a>.',
            { parse_mode: 'HTML', disable_web_page_preview: true }
          );
        } catch (e) {}
        try { await ctx.leaveChat(); } catch (e) {}
        ACTIVE_CHATS = ACTIVE_CHATS.filter(id => id !== chatId);
      }
    }
    // если это новое членство — ничего далее не делаем с этим обновлением
    return;
  }

  // 2) Если сообщение пришло в личку от обычного пользователя — пересылаем в админский чат
  if (isPrivate && !isAdmin) {
    // не пересылаем команды (мы уже вышли для команд) и не пустые сообщения
    if (!message.text && !message.photo && !message.document && !message.video && !message.sticker && !message.animation && !message.poll) {
      return;
    }
    try {
      await ctx.forwardMessage(ADMIN_CHAT_ID, chatId, message.message_id);
    } catch (e) {
      console.error('Ошибка при пересылке в админский чат:', e);
    }
    const userName = ctx.from?.first_name || '';
    const userUsername = ctx.from?.username ? '@' + ctx.from?.username : 'нет username';
    const time = new Date().toLocaleString('ru-RU');
    const info = `📩 Новое сообщение из ЛС\n👤 Имя: ${userName}\n🔖 Username: ${userUsername}\n🆔 ID: ${fromId}\n⏰ Время: ${time}`;
    try {
      await ctx.telegram.sendMessage(ADMIN_CHAT_ID, info, { disable_web_page_preview: true });
    } catch (e) {}
    return;
  }

  // 3) Если админ отвечает (в админском чате) на пересланное сообщение — пересылаем ответ пользователю
  if (isAdmin && chatId === ADMIN_CHAT_ID && message.reply_to_message && message.reply_to_message.forward_from) {
    const originalUser = message.reply_to_message.forward_from;
    const originalId = originalUser.id;
    const adminName = ADMIN_NAMES[fromId] || ctx.from?.first_name || 'Администратор';
    const replyText = `🔹 Ответ от ${adminName}:\n\n${message.text || ''}`;
    try {
      await ctx.telegram.sendMessage(originalId, replyText);
      if (message.photo) {
        await ctx.telegram.sendPhoto(originalId, message.photo[message.photo.length - 1].file_id, { caption: message.caption });
      }
      if (message.document) {
        await ctx.telegram.sendDocument(originalId, message.document.file_id, { caption: message.caption });
      }
      if (message.video) {
        await ctx.telegram.sendVideo(originalId, message.video.file_id, { caption: message.caption });
      }
      if (message.sticker) {
        await ctx.telegram.sendSticker(originalId, message.sticker.file_id);
      }
      await ctx.reply('✅ Ваш ответ был отправлен пользователю.');
    } catch (err) {
      console.error('Ошибка при отправке ответа пользователю:', err);
      await ctx.reply('❌ Не удалось отправить ответ пользователю. Возможно, он заблокировал бота или удалил чат.');
    }
    return;
  }

  // 4) Работа с ссылкой и пересылкой содержимого (админы) — САМОЕ ВАЖНОЕ
  // Сначала: если админ присылает ссылку — принимаем цель
  if (isAdmin && message.text) {
    const target = await parseMessageLink(ctx, message.text.trim());
    if (target) {
      adminReplyState[fromId] = { chatId: target.chatId, messageId: target.messageId };
      await ctx.reply('✅ Ссылка принята. Теперь отправьте содержимое (текст, фото, видео, документ и т.д.), которое нужно отправить в ответ на указанное сообщение.');
      return;
    }
  }

  // Если у админа есть установленная цель — отправляем содержимое туда
  if (isAdmin && adminReplyState[fromId]) {
    const state = adminReplyState[fromId];
    try {
      // Текст
      if (message.text) {
        await ctx.telegram.sendMessage(state.chatId, message.text, { reply_to_message_id: state.messageId, disable_web_page_preview: true });
      }
      // Фото
      else if (message.photo) {
        const fileId = message.photo[message.photo.length - 1].file_id;
        await ctx.telegram.sendPhoto(state.chatId, fileId, { caption: message.caption, reply_to_message_id: state.messageId, disable_notification: false });
      }
      // Видео
      else if (message.video) {
        await ctx.telegram.sendVideo(state.chatId, message.video.file_id, { caption: message.caption, reply_to_message_id: state.messageId });
      }
      // Animation (gif)
      else if (message.animation) {
        await ctx.telegram.sendAnimation(state.chatId, message.animation.file_id, { caption: message.caption, reply_to_message_id: state.messageId });
      }
      // Document
      else if (message.document) {
        await ctx.telegram.sendDocument(state.chatId, message.document.file_id, { caption: message.caption, reply_to_message_id: state.messageId });
      }
      // Sticker
      else if (message.sticker) {
        await ctx.telegram.sendSticker(state.chatId, message.sticker.file_id, { reply_to_message_id: state.messageId });
      }
      // Poll
      else if (message.poll) {
        const poll = message.poll;
        const options = poll.options.map(o => o.text);
        await ctx.telegram.sendPoll(state.chatId, poll.question, options, { is_anonymous: poll.is_anonymous, type: poll.type, reply_to_message_id: state.messageId });
      } else {
        // Если тип не поддержан — сообщаем админу
        await ctx.reply('❌ Этот тип сообщения пока не поддерживается для пересылки.');
        return;
      }

      await ctx.reply('✅ Сообщение отправлено в ответ на выбранное сообщение.');
      delete adminReplyState[fromId];
    } catch (err) {
      console.error('Ошибка при пересылке по ссылке:', err);
      await ctx.reply(`❌ Ошибка при пересылке: ${err?.description || err?.message || err}`);
    }
    return;
  }

  // 5) Обработка сообщения в дискуссии канала — добавление комментария под пересланным постом
  // Ожидаем, что канал пересылает посты в дискуссию: msg.forward_from_chat.id === CHANNEL_ID
  if (chatId === CHAT_ID && message.forward_from_chat && message.forward_from_chat.id === CHANNEL_ID && message.forward_from_message_id) {
    try {
      // Отправляем комментарий в ответ на пересланное сообщение (reply_to_message_id = id пересланного сообщения в дискуссии)
      const sent = await ctx.telegram.sendMessage(
        CHAT_ID,
        COMMENT_TEXT,
        { reply_to_message_id: message.message_id, parse_mode: 'HTML', disable_web_page_preview: true }
      );

      // Отчёт админам с ссылками
      const postLink = `https://t.me/${message.forward_from_chat.username || CHANNEL_USERNAME}/${message.forward_from_message_id}`;
      const commentLink = `https://t.me/c/${String(CHAT_ID).slice(4)}/${sent.message_id}`;
      await ctx.telegram.sendMessage(
        ADMIN_CHAT_ID,
        `✅ Комментарий добавлен в обсуждение.\nПост: ${postLink}\nКомментарий: ${commentLink}`,
        { disable_web_page_preview: true }
      );
    } catch (err) {
      console.error('Ошибка при добавлении комментария:', err);
      // попробуем отправить отчёт об ошибке админам
      try {
        await ctx.telegram.sendMessage(ADMIN_CHAT_ID, `❌ Не удалось отправить комментарий!\nОшибка: ${err?.description || err?.message || err}`, { disable_web_page_preview: true });
      } catch (e) {}
    }
    return;
  }

  // остальные сообщения — ничего не делаем
}));

// ----------------- Обработка channel_post (если нужно реагировать прямо на публикации канала) -----------------
bot.on('channel_post', safeHandler(async (ctx) => {
  // Если нужно — можно реагировать на прямые channel_post, но чаще бот реагирует на пересланные сообщения в обсуждении.
  // Оставляем заглушку для логов (не мешает).
  // Если вы хотите, чтобы бот прямо комментировал канал (не обсуждение) — сюда можно добавить логику.
  return;
}));

// ----------------- Экспорт для Vercel / Serverless -----------------
module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      // Telegram присылает update в body
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
