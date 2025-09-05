const TelegramBot = require('node-telegram-bot-api');
const BOT_TOKEN = process.env.BOT_TOKEN;

// Константы
const CHANNEL_ID = -1002696885166;
const CHAT_ID = -1002899007927;
const ADMIN_CHAT_ID = -4969760870;
const ADMIN_IDS = [2032240231, 1465194766];
const ADMIN_NAMES = {
  2032240231: 'Советчик 📜',
  1465194766: 'Спектр ♦️'
};

// Инициализируем бота (без поллинга - для вебхука)
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// Массив разрешенных чатов
let ALLOWED_CHATS = [CHAT_ID, ADMIN_CHAT_ID];

// —————————— УПРАВЛЕНИЕ РАЗРЕШЕННЫМИ ЧАТАМИ —————————— //
bot.onText(/\/\+id (.+)/, (msg, match) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  if (!ADMIN_IDS.includes(userId)) {
    return bot.sendMessage(chatId, '❌ Эта команда доступна только администраторам.');
  }

  const targetChatId = parseInt(match[1]);
  if (isNaN(targetChatId)) {
    return bot.sendMessage(chatId, '❌ Неверный формат ID чата. Укажите числовой ID.');
  }

  if (!ALLOWED_CHATS.includes(targetChatId)) {
    ALLOWED_CHATS.push(targetChatId);
    bot.sendMessage(chatId, `✅ Чат с ID ${targetChatId} добавлен в разрешенные.`);
  } else {
    bot.sendMessage(chatId, `ℹ️ Чат с ID ${targetChatId} уже есть в списке разрешенных.`);
  }
});

bot.onText(/\/\-id (.+)/, (msg, match) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  if (!ADMIN_IDS.includes(userId)) {
    return bot.sendMessage(chatId, '❌ Эта команда доступна только администраторам.');
  }

  const targetChatId = parseInt(match[1]);
  if (isNaN(targetChatId)) {
    return bot.sendMessage(chatId, '❌ Неверный формат ID чата. Укажите числовой ID.');
  }

  const index = ALLOWED_CHATS.indexOf(targetChatId);
  if (index !== -1) {
    ALLOWED_CHATS.splice(index, 1);
    bot.sendMessage(chatId, `✅ Чат с ID ${targetChatId} удален из разрешенных.`);
  } else {
    bot.sendMessage(chatId, `ℹ️ Чат с ID ${targetChatId} не найден в списке разрешенных.`);
  }
});

bot.onText(/\/allowed_chats/, (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  if (!ADMIN_IDS.includes(userId)) {
    return bot.sendMessage(chatId, '❌ Эта команда доступна только администраторам.');
  }

  if (ALLOWED_CHATS.length === 0) {
    return bot.sendMessage(chatId, '📝 Список разрешенных чатов пуст.');
  }

  const chatList = ALLOWED_CHATS.map(id => `• ${id}`).join('\n');
  bot.sendMessage(chatId, `📝 Разрешенные чаты:\n${chatList}`);
});

// —————————— ОБРАБОТКА КОМАНД —————————— //
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;
  const userName = user.first_name || 'пользователь';
  const userID = user.id;

  let greeting = `Здравствуйте, ${userName}! 👋\n\nЯ — автоматический бот для канала.\n\nМоя задача — добавлять комментарии с правилами под каждым постом в канале.`;

  if (ADMIN_IDS.includes(userID)) {
    const adminName = ADMIN_NAMES[userID] || 'Администратор';
    greeting = `Приветствую, ${adminName}! 👋\n\nРад вас снова видеть! Я готов к работе и слежу за каналом.`;
  }

  bot.sendMessage(chatId, greeting);
});

bot.onText(/\/test/, (msg) => {
  bot.sendMessage(msg.chat.id, '✅ Бот активен и работает в штатном режиме!');
});

bot.onText(/\/info/, (msg) => {
  const infoText = `⚙️О боте⚙️\nВерсия: 0.0.1\nИИ: Red-AI 0.1 \nРазработчики: Красная звезда`;
  const keyboard = {
    inline_keyboard: [[{
      text: 'Красная звезда',
      url: 'https://t.me/red_star_development'
    }]]
  };

  bot.sendMessage(msg.chat.id, infoText, {
    reply_markup: keyboard,
    disable_web_page_preview: true
  });
});

bot.onText(/\/help/, (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;

  if (chatType === 'private') {
    if (ADMIN_IDS.includes(userId)) {
      const adminHelpText = `🛠️ *Команды для администраторов:*\n\n` +
        `/start - Запуск бота и приветствие\n` +
        `/help - Показать это сообщение\n` +
        `/info - Информация о боте\n` +
        `/test - Проверить работоспособность бота\n` +
        `/+id <ID_чата> - Добавить чат в разрешенные\n` +
        `/-id <ID_чата> - Удалить чат из разрешенных\n` +
        `/allowed_chats - Показать список разрешенных чатов\n\n` +
        `*Функции для админов:*\n` +
        `• Ответ на пересланные сообщения из ЛС пользователей\n` +
        `• Ответ по ссылке на сообщение формата https://t.me/c/...\n` +
        `• Все сообщения от пользователей пересылаются в чат администрации\n\n` +
        `*Как отвечать пользователям:*\n` +
        `1. Ответьте (reply) на пересланное сообщение в чате администрации\n` +
        `2. Или отправьте ссылку на сообщение, а на следующей строке - ответ\n` +
        `3. Бот сохранит ваше форматирование (жирный текст, курсив и т.д.)`;

      bot.sendMessage(chatId, adminHelpText, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
    } else {
      const userHelpText = `ℹ️ *Помощь по боту:*\n\n` +
        `Я - автоматический бот для канала. Моя основная задача - добавлять комментарии с правилами под каждым постом в канале.\n\n` +
        `*Доступные команды:*\n` +
        `/start - Запустить бота\n` +
        `/help - Получить помощь\n` +
        `/info - Информация о боте\n\n` +
        `Если у вас есть вопросы или предложения, обратитесь к администраторам канала.`;

      bot.sendMessage(chatId, userHelpText, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
    }
  }
});

// —————————— ЗАЩИТА ОТ ДОБАВЛЕНИЯ В ЧУЖИЕ ЧАТЫ —————————— //
bot.on('message', (msg) => {
  if (msg.new_chat_members) {
    const newMembers = msg.new_chat_members;
    const isBotAdded = newMembers.some(member => member.is_bot && member.id === bot.options.id);

    if (isBotAdded) {
      const chatId = msg.chat.id;

      if (!ALLOWED_CHATS.includes(chatId)) {
        const keyboard = {
          inline_keyboard: [[{
            text: 'Красная звезда',
            url: 'https://t.me/red_star_development'
          }]]
        };

        bot.sendMessage(chatId, 
          `🚫 Я не могу работать в этом чате!\n\nЭтот чат не входит в список разрешенных. Если вам нужен подобный бот, обратитесь за помощью к разработчикам Красная звезда.`,
          {
            reply_markup: keyboard,
            disable_web_page_preview: true
          }
        ).then(() => {
          setTimeout(() => {
            bot.leaveChat(chatId);
          }, 2000);
        }).catch(error => {
          console.error('Ошибка при выходе из чата:', error);
        });
      }
    }
  }
});

// —————————— ПЕРЕСЫЛКА СООБЩЕНИЙ ОТ ПОЛЬЗОВАТЕЛЕЙ —————————— //
bot.on('message', (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const text = msg.text || '';

  // Пропускаем сообщения от админов и команды
  if (ADMIN_IDS.includes(userId) || text.startsWith('/')) {
    return;
  }

  // Пересылаем только личные сообщения
  if (chatId > 0) {
    const user = msg.from;
    const userName = user.first_name || user.last_name || 'Без имени';
    const userUsername = user.username ? `@${user.username}` : 'нет username';
    const time = new Date().toLocaleString('ru-RU');

    const caption = `📩 *Новое сообщение из ЛС*\n👤 *Имя:* ${userName}\n🔖 *Username:* ${userUsername}\n🆔 *ID:* ${user.id}\n⏰ *Время:* ${time}`;

    // Пересылаем сообщение
    bot.forwardMessage(ADMIN_CHAT_ID, chatId, msg.message_id)
      .then(() => {
        // Отправляем информацию о пользователе
        return bot.sendMessage(ADMIN_CHAT_ID, caption, { parse_mode: 'Markdown' });
      })
      .catch(error => {
        console.error('Ошибка при пересылке сообщения админам:', error);
      });
  }
});

// —————————— ОБРАБОТКА ОТВЕТОВ АДМИНОВ —————————— //
// Для обработки ответов админов потребуется дополнительная логика
// которая выходит за рамки базового функционала node-telegram-bot-api
// Рекомендую использовать базу данных для отслеживания переписки

// —————————— ЭКСПОРТ ДЛЯ VERCEL —————————— //
module.exports = async (req, res) => {
  try {
    // Обрабатываем обновление от Telegram
    await bot.processUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling update:', error);
    res.status(500).send('Internal Server Error');
  }
};
