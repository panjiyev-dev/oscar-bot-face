// Kerakli kutubxonalarni import qilish
const TelegramBot = require('node-telegram-bot-api');

// Sizning bot tokeningizni bu yerga kiriting
const token = '8445730557:AAEEbdgOlkLzUGtcV92iu9X9kDCNL3BgnO4';

// Bot instansiyasini yaratish
const bot = new TelegramBot(token, { polling: true });

// Mini App URL'sini bu yerga kiriting (Endi HTTPS - Vercel URL)
const webAppUrl = 'https://oscar-front.vercel.app/';

// Admin ID (to'lov ma'lumotlarini yuborish uchun)
const adminId = 7122472578;

// Foydalanuvchi holatini saqlash uchun Map (qaysi to'lov usuli kutmoqda)
const userStates = new Map();

// /start buyrug'iga javob berish
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username || 'Noma\'lum';
    // Mini ilovani ochish uchun tugma va tolov tugmasi (Endi Web App ishlaydi, chunki HTTPS)
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
                    ],
                    [
                        {
                            text: 'Karobka olmoqchiman',
                            callback_data: 'request_box'
                        }
                    ]
                ]
            }
        };
        bot.editMessageText('Tolov qilish usulini tanlang va to\'lov qiling. Keyin chekni screenshot yoki PDF formatda yuboring:', {
            chat_id: chatId,
            message_id: message.message_id,
            reply_markup: opts.reply_markup
        });
        // Holatni o'rnatish: kutmoqda
        userStates.set(chatId, { waiting: true, method: null });
        bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'request_box') {
        // Karobka so'rovi uchun holatni o'rnatish
        userStates.set(chatId, { waitingForBoxPhone: true });
        bot.editMessageText('Nomeringizni va ismingizni qoldiring, adminlarimiz sizga tavar va optom narxlari haqida sizga bog\'lanib ma\'lumot beradi.', {
            chat_id: chatId,
            message_id: message.message_id
        });
        bot.sendMessage(chatId, 'Iltimos, telefon raqamingizni yuboring (+998 XX XXX XX XX formatida).');
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

// Matnli xabarlarni boshqarish (telefon va ism uchun)
bot.on('text', (msg) => {
    const chatId = msg.chat.id;
    const state = userStates.get(chatId);
    const username = msg.from.username || 'Noma\'lum';
    const userId = msg.from.id;
    const text = msg.text.trim();

    if (state && state.waitingForBoxPhone) {
        // Telefon raqamini saqlash va ism so'rash
        userStates.set(chatId, { waitingForBoxName: true, boxPhone: text });
        bot.sendMessage(chatId, 'Rahmat! Endi ismingizni yuboring.');
    } else if (state && state.waitingForBoxName) {
        // Ismni saqlash va admin ga yuborish
        const phone = state.boxPhone;
        const name = text;

        const formattedMessage = `Yangi karobka so'rovi:\nFoydalanuvchi: [${username}](tg://user?id=${userId})\nTelefon: ${phone}\nIsm: ${name}`;

        try {
            bot.sendMessage(adminId, formattedMessage, { parse_mode: 'Markdown' });
            console.log(`Karobka so'rovi admin'ga yuborildi: ${username}`);
        } catch (error) {
            console.error('Admin ga yuborishda xato:', error.message);
            bot.sendMessage(chatId, 'So\'rov qabul qilindi, lekin admin tasdiqlashda muammo bo\'ldi. Keyinroq tekshiring.');
        }

        // Foydalanuvchiga tasdiq
        bot.sendMessage(chatId, 'Tez orada hodimlarimiz sizga bog\'lanishadi. Rahmat.');
        // Holatni tozalash
        userStates.delete(chatId);
    }
});

// Rasm yoki PDF yuborilganda (receipt sifatida) – xatolik ushlash qo'shildi
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
    // Sana va vaqt (hozirgi sana: 10/11/2025 formatida) – 5 soat oldinga o'rnatish
    const now = new Date(Date.now() + 5 * 60 * 60 * 1000);
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}, ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    // Xabar formatini tayyorlash
    const formattedMessage = `Yangi to'lov cheki: PayMe dan\nFoydalanuvchi: [${username}](tg://user?id=${userId})\nFayl: ${fileName}\nSana: ${dateStr}`;
    // Admin ga yuborish – try-catch bilan
    try {
        bot.sendPhoto(adminId, fileId, { caption: formattedMessage, parse_mode: 'Markdown' });
        console.log(`Chek admin'ga yuborildi: ${username}`);
    } catch (error) {
        console.error('Admin ga yuborishda xato:', error.message);
        // Foydalanuvchiga xabar berish (ixtiyoriy)
        bot.sendMessage(chatId, 'Chek qabul qilindi, lekin admin tasdiqlashda muammo bo\'ldi. Keyinroq tekshiring.');
    }
    // Foydalanuvchiga tasdiq
    bot.sendMessage(chatId, 'Tez orada hodimlarimiz sizga bog\'lanishadi.');
    // Holatni tozalash
    userStates.delete(chatId);
});

// PDF yuborilganda (document) – xatolik ushlash qo'shildi
bot.on('document', (msg) => {
    const chatId = msg.chat.id;
    const state = userStates.get(chatId);
    if (!state || !state.waiting) return;

    const username = msg.from.username || 'Noma\'lum';
    const userId = msg.from.id;
    const document = msg.document;
    const fileId = document.file_id;
    const fileName = document.file_name || 'receipt.pdf';
    // Sana va vaqt – 5 soat oldinga o'rnatish
    const now = new Date(Date.now() + 5 * 60 * 60 * 1000);
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}, ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    // Xabar formatini tayyorlash
    const formattedMessage = `Yangi to'lov cheki: PayMe dan\nFoydalanuvchi: [${username}](tg://user?id=${userId})\nFayl: ${fileName}\nSana: ${dateStr}`;
    // Admin ga yuborish – try-catch bilan
    try {
        bot.sendDocument(adminId, fileId, { caption: formattedMessage, parse_mode: 'Markdown' });
        console.log(`PDF chek admin'ga yuborildi: ${username}`);
    } catch (error) {
        console.error('Admin ga yuborishda xato:', error.message);
        bot.sendMessage(chatId, 'Chek qabul qilindi, lekin admin tasdiqlashda muammo bo\'ldi. Keyinroq tekshiring.');
    }
    // Foydalanuvchiga tasdiq
    bot.sendMessage(chatId, 'Tez orada hodimlarimiz sizga bog\'lanishadi.');
    // Holatni tozalash
    userStates.delete(chatId);
});

console.log('Bot ishga tushdi!');

