// Kerakli kutubxonalarni import qilish
const TelegramBot = require('node-telegram-bot-api');

// Sizning bot tokeningizni bu yerga kiriting
// Uni @BotFather'dan olishingiz mumkin
const token = '8125620993:AAG23LOOrtNpvNQHbUvaju64kJNUlJbAlno';

// Bot instansiyasini yaratish
const bot = new TelegramBot(token, { polling: true });

// Mini App URL'sini bu yerga kiriting
// Bu sizning mini ilovangiz joylashgan manzil bo'ladi
const webAppUrl = 'https://frabjous-souffle-7abdfc.netlify.app/';

// /start buyrug'iga javob berish
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

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

console.log('Bot ishga tushdi!');

