const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');


// Inisialisasi client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

// Tampilkan QR code di terminal
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

// Siap digunakan
client.on('ready', () => {
    console.log('✅ Akari-Bot is ready!');
});

// Menggunakan fungsi untuk mengikuti pengalihan
async function getTiktokFromTikmate(url) {
    try {
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0'
        };

        const form = new URLSearchParams();
        form.append('url', url);

        const res = await axios.post('https://api.tikmate.app/api/lookup', form, { headers });
        const data = res.data;

        if (!data || !data.token || !data.id) {
            throw new Error('Token atau ID tidak ditemukan');
        }

        const videoUrl = `https://tikmate.app/download/${data.token}/${data.id}.mp4`;

        return {
            videoUrl
        };
    } catch (err) {
        console.error('Tikmate Error:', err.message);
        throw new Error('Gagal ambil video dari Tikmate');
    }
}







client.on('message', async (message) => {
    const msg = message.body.toLowerCase();

    // 🌟 Fitur !sticker
    if (message.hasMedia && msg === '!sticker') {
        const media = await message.downloadMedia();
        if (media) {
            await client.sendMessage(message.from, media, {
                sendMediaAsSticker: true,
                stickerAuthor: 'Akari-bot',
                stickerName: 'StickerPack'
            });
        }
        return;
    }

    // 🌟 Fitur !tiktok
    else if (msg.startsWith('!tiktok ')) {
        const tiktokUrl = msg.replace('!tiktok ', '').trim();
        if (!tiktokUrl.startsWith('http')) {
            return await message.reply('❌ Masukkan link TikTok yang valid!');
        }

        await message.reply('⏳ Mengambil video dari TikTok...');

        try {
            const result = await getTiktokFromTikmate(tiktokUrl);
            const media = await MessageMedia.fromUrl(result.videoUrl);
            await client.sendMessage(message.from, media, {
                caption: '✅ Berikut videonya tanpa watermark!'
            });
        } catch (err) {
            console.error(err);
            await message.reply('❌ Gagal ambil video. Coba lagi nanti!');
        }
        return;
    }

    // ✅ Command lain
    if (msg === '!info' || msg === '!about') {
        await message.reply(
            '🤖 *Tentang Akari-Bot*\n' +
            'Nama: Akari-bot\n' +
            'Versi: 1.0.0\n' +
            'Dibuat oleh: Bagus\n' +
            'Library: whatsapp-web.js\n' +
            'Fitur: !menu, !help, !sticker, !cuaca, !jadwal, !tiktok, auto-reply pintar\n\n' +
            'Ketik *!menu* untuk lihat semua fitur!'
        );
    } else if (msg === '!menu') {
        await message.reply('📋 Menu:\n1. !help\n2. !info\n3. !sticker\n4. !cuaca [kota]\n5. !jadwal [kota]\n6. !tiktok [url]');
    } else if (msg === '!help') {
        await message.reply('📖 Kirim *!menu* untuk lihat semua perintah.');
    } else if (msg.startsWith('!cuaca ')) {
        const kota = msg.replace('!cuaca ', '');
        await message.reply(`🔍 Mencari cuaca untuk ${kota}... (fitur cuaca segera aktif!)`);
    } else if (msg.startsWith('!jadwal ')) {
        const kota = msg.replace('!jadwal ', '');
        await message.reply(`🕌 Mencari jadwal sholat untuk ${kota}... (fitur jadwal segera aktif!)`);
    }

    // ✅ Auto Reply Sopan
    else if (msg.includes('halo') || msg.includes('hai')) {
        await message.reply('👋 Hai juga! Aku Akari-bot. Ketik *!menu* untuk lihat semua fitur.');
    } else if (msg.includes('kamu siapa') || msg.includes('bot siapa')) {
        await message.reply('🤖 Aku adalah Akari-bot, asisten yang dibuat oleh Bagus.');
    } else if (msg.includes('terima kasih') || msg.includes('thanks')) {
        await message.reply('🙏 Sama-sama! Senang bisa bantu.');
    }

    // ✅ Jawaban fallback
    else {
        await message.reply(
            '🤖 Aku belum paham maksudmu.\n' +
            'Coba ketik *!menu* buat lihat perintah yang tersedia.'
        );
    }
});

client.initialize();
