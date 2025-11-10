// Kerakli kutubxonalarni import qilish
const TelegramBot = require('node-telegram-bot-api');

// Sizning bot tokeningizni bu yerga kiriting
// Uni @BotFather'dan olishingiz mumkin
const token = '8125620993:AAG23LOOrtNpvNQHbUvaju64kJNUlJbAlno';

// Admin ID'lar (avvalgi koddan)
const admins = [5761225998, 7122472578];

// Bot instansiyasini yaratish
const bot = new TelegramBot(token, { polling: true });

// Mini App URL'sini bu yerga kiriting
// Bu sizning mini ilovangiz joylashgan manzil bo'ladi
const webAppUrl = 'https://oscar-front.vercel.app/';

// Foydalanuvchi holatini saqlash
const userState = {};

// To'lov klaviaturasi
const paymentKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: "💳 PayMe orqali to'lash" }],
            [{ text: "🏦 Uzum Bank orqali to'lash" }],
            [{ text: "❌ Bekor qilish" }],
        ],
        resize_keyboard: true,
    },
};

// State'ni tozalash funksiyasi
function resetUserState(chatId) {
    userState[chatId] = { step: 'none', data: {} };
}

// /start buyrug'iga javob berish
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    resetUserState(chatId);
    // Mini ilovani ochish uchun tugma yaratish
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
                ]
            ]
        }
    };
    // Foydalanuvchiga xabar yuborish
    bot.sendMessage(chatId, 'Xush kelibsiz! Mini ilovamizdan foydalanish uchun quyidagi tugmani bosing 👇', opts);
});

// /payment buyrug'iga javob berish
bot.onText(/\/payment/, (msg) => {
    const chatId = msg.chat.id;
    resetUserState(chatId);
    userState[chatId] = { step: 'payment_select', data: {} };
    bot.sendMessage(chatId, "To'lovni qaysi usulda amalga oshirmoqchisiz?", paymentKeyboard);
});

// Message handler (to'lov tugmalari va fayllar uchun)
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const photo = msg.photo;
    const document = msg.document;

    // /start yoki /payment buyrug'larini e'tiborsiz qoldirish
    if (text && (text.startsWith('/start') || text.startsWith('/payment'))) {
        return;
    }

    // Joriy state'ni tekshirish
    if (!userState[chatId] || userState[chatId].step === 'none') {
        bot.sendMessage(chatId, "Xush kelibsiz! /start yoki /payment buyrug'ini bosing.");
        return;
    }

    const currentStep = userState[chatId].step;

    // To'lov tanlash bosqichi
    if (currentStep === 'payment_select') {
        if (text === "❌ Bekor qilish") {
            resetUserState(chatId);
            bot.sendMessage(chatId, "To'lov bekor qilindi. /start ni bosing.");
            return;
        } else if (text === "💳 PayMe orqali to'lash") {
            const paymeUrl = "https://payme.uz/fallback/merchant/?id=660d234690823bcdf98bebe5"; // Misol, o'zingiznikini qo'ying
            bot.sendMessage(chatId, `💳 PayMe orqali to'lash uchun quyidagi havolani oching:\n${paymeUrl}\n\nTo'lov chekini yuboring (.pdf yoki rasm):`);
            userState[chatId].step = 'payment_receipt';
            userState[chatId].data.method = 'PayMe';
            return;
        } else if (text === "🏦 Uzum Bank orqali to'lash") {
            const uzumUrl = "https://www.apelsin.uz/open-service?serviceId=498609633"; // Misol, o'zingiznikini qo'ying
            bot.sendMessage(chatId, `🏦 Uzum Bank orqali to'lash uchun quyidagi havolani oching:\n${uzumUrl}\n\nTo'lov chekini yuboring (.pdf yoki rasm):`);
            userState[chatId].step = 'payment_receipt';
            userState[chatId].data.method = 'Uzum Bank';
            return;
        }
        bot.sendMessage(chatId, "Iltimos, tugmalardan birini tanlang.");
        return;
    }

    // Fayl yuklash (chek uchun)
    if (currentStep === 'payment_receipt' && (photo || document)) {
        const method = userState[chatId].data.method;
        const username = msg.from.username ? `@${msg.from.username}` : 'Username yo\'q';
        const fileId = photo ? photo[photo.length - 1].file_id : document.file_id;
        const fileName = photo ? 'receipt.jpg' : document.file_name;
        const caption = `Yangi to'lov cheki: ${method} dan\nFoydalanuvchi ID: ${chatId}\nUsername: ${username}\nFayl: ${fileName}\nSana: ${new Date().toLocaleString('uz-UZ')}`;

        // Inline keyboard profilga o'tish uchun
        const inlineKeyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: `Profilga o'tish (${username})`,
                            url: `tg://user?id=${chatId}`
                        }
                    ]
                ]
            }
        };

        // Adminlarga yuborish (saqlamasdan, to'g'ridan-to'g'ri)
        for (const adminId of admins) {
            if (photo) {
                await bot.sendPhoto(adminId, fileId, { caption, ...inlineKeyboard });
            } else {
                await bot.sendDocument(adminId, fileId, { caption, ...inlineKeyboard });
            }
        }

        bot.sendMessage(chatId, `✅ Chekingiz muvaffaqiyatli adminlarga yuborildi. Tez orada tasdiqlanadi. /start ni bosing.`);
        resetUserState(chatId);
        return;
    }

    // Noma'lum holat
    bot.sendMessage(chatId, "Tushunmadim. /start yoki /payment ni bosing.");
});

console.log('Bot ishga tushdi!');
