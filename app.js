// // Kerakli kutubxonalarni import qilish
// const TelegramBot = require('node-telegram-bot-api');

// // Sizning bot tokeningizni bu yerga kiriting
// // Uni @BotFather'dan olishingiz mumkin
// const token = '8445730557:AAE3wmU89MCBKtD0eZVBxVAYPsDTUizcB1E';

// // Bot instansiyasini yaratish
// const bot = new TelegramBot(token, { polling: true });

// // Mini App URL'sini bu yerga kiriting
// // Bu sizning mini ilovangiz joylashgan manzil bo'ladi
// const webAppUrl = 'https://oscar-front.vercel.app/';

// // /start buyrug'iga javob berish
// bot.onText(/\/start/, (msg) => {
//     const chatId = msg.chat.id;

//     // Mini ilovani ochish uchun tugma yaratish
//     const opts = {
//         reply_markup: {
//             inline_keyboard: [
//                 [
//                     {
//                         text: 'Ilovani ochish',
//                         web_app: {
//                             url: webAppUrl
//                         }
//                     }
//                 ]
//             ]
//         }
//     };

//     // Foydalanuvchiga xabar yuborish
//     bot.sendMessage(chatId, 'Xush kelibsiz! Mini ilovamizdan foydalanish uchun quyidagi tugmani bosing 👇', opts);
// });

// console.log('Bot ishga tushdi!');
// Kerakli kutubxonalarni import qilish
const TelegramBot = require('node-telegram-bot-api');

// Sizning bot tokeningizni bu yerga kiriting
// Uni @BotFather'dan olishingiz mumkin
const token = '8125620993:AAG23LOOrtNpvNQHbUvaju64kJNUlJbAlno';

// Bot instansiyasini yaratish
const bot = new TelegramBot(token, { polling: true });

// Mini App URL'sini bu yerga kiriting
// Bu sizning mini ilovangiz joylashgan manzil bo'ladi
const webAppUrl = 'https://oscar-front.vercel.app';

// Admin ID (to'lov ma'lumotlarini yuborish uchun)
const adminId = 7122472578;

// Foydalanuvchi holatini saqlash uchun Map (qaysi to'lov usuli kutmoqda)
const userStates = new Map();

// /start buyrug'iga javob berish
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username || 'Noma\'lum';

    // Mini ilovani ochish uchun tugma va tolov tugmasi
    const opts = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Ilovani ochish',
                        web_app: {
                            url: webAppUrl
                        }
                    }
                ],
                [
                    {
                        text: 'Tolov qilish',
                        callback_data: 'start_payment'
                    }
                ]
            ]
        }
    };

    // Foydalanuvchiga xabar yuborish
    bot.sendMessage(chatId, `Xush kelibsiz, ${username}! Mini ilovamizdan foydalanish uchun quyidagi tugmani bosing 👇\n\nTolov qilish uchun "Tolov qilish" tugmasini bosing va chekni screenshot yoki PDF formatda yuboring.`, opts);
});

// Inline tugmalarni boshqarish
bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const data = callbackQuery.data;
    const username = callbackQuery.from.username || 'Noma\'lum';

    if (data === 'start_payment') {
        // Tolov usullari tugmalarini ko'rsatish
        const opts = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'PayMe',
                            url: 'https://payme.uz/fallback/merchant/?id=660d234690823bcdf98bebe5'
                        }
                    ],
                    [
                        {
                            text: 'UzumPay',
                            url: 'https://www.apelsin.uz/open-service?serviceId=498609633'
                        }
                    ],
                    [
                        {
                            text: 'Bekor qilish',
                            callback_data: 'cancel_payment'
                        }
                    ]
                ]
            }
        };
        bot.editMessageText('Tolov qilish usulini tanlang:', {
            chat_id: chatId,
            message_id: message.message_id,
            reply_markup: opts.reply_markup
        });
        // Holatni o'rnatish: kutmoqda
        userStates.set(chatId, { waiting: true, method: null });
        bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'cancel_payment') {
        userStates.delete(chatId);
        bot.editMessageText('Tolov bekor qilindi.', {
            chat_id: chatId,
            message_id: message.message_id
        });
        bot.answerCallbackQuery(callbackQuery.id);
    }
});

// Rasm yoki PDF yuborilganda (receipt sifatida)
bot.on('photo', (msg) => {
    const chatId = msg.chat.id;
    const state = userStates.get(chatId);
    if (!state || !state.waiting) return;

    const username = msg.from.username || 'Noma\'lum';
    const userId = msg.from.id;
    const photo = msg.photo[msg.photo.length - 1]; // Eng katta rasm
    const fileId = photo.file_id;

    // Fayl nomini olish uchun (soddalashtirilgan: jpg)
    const fileName = 'receipt.jpg';

    // Sana va vaqt
    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}, ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    // Xabar formatini tayyorlash
    const formattedMessage = `Yangi to'lov cheki: PayMe dan\nFoydalanuvchi: [${username}](tg://user?id=${userId})\nFayl: ${fileName}\nSana: ${dateStr}`;

    // Admin ga yuborish
    bot.sendPhoto(adminId, fileId, { caption: formattedMessage, parse_mode: 'Markdown' });

    // Foydalanuvchiga tasdiq
    bot.sendMessage(chatId, 'Chek muvaffaqiyatli qabul qilindi! Rahmat.');

    // Holatni tozalash
    userStates.delete(chatId);
});

// PDF yuborilganda (document)
bot.on('document', (msg) => {
    const chatId = msg.chat.id;
    const state = userStates.get(chatId);
    if (!state || !state.waiting) return;

    const username = msg.from.username || 'Noma\'lum';
    const userId = msg.from.id;
    const document = msg.document;
    const fileId = document.file_id;
    const fileName = document.file_name || 'receipt.pdf';

    // Sana va vaqt
    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}, ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    // Xabar formatini tayyorlash (PayMe misoli, agar kerak bo'lsa method bo'yicha o'zgartirish mumkin)
    const formattedMessage = `Yangi to'lov cheki: PayMe dan\nFoydalanuvchi: [${username}](tg://user?id=${userId})\nFayl: ${fileName}\nSana: ${dateStr}`;

    // Admin ga yuborish
    bot.sendDocument(adminId, fileId, { caption: formattedMessage, parse_mode: 'Markdown' });

    // Foydalanuvchiga tasdiq
    bot.sendMessage(chatId, 'Chek muvaffaqiyatli qabul qilindi! Rahmat.');

    // Holatni tozalash
    userStates.delete(chatId);
});

console.log('Bot ishga tushdi!');
