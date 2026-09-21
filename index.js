const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// Tu URL de Google Apps Script ya integrada
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwcjLwi9BETtBwdd8OzeHK5dqbHoJTfP1HmNcdd71V7lGOqEosYArKvNWTf72uFjd2i/exec';

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    console.log('Escanea el siguiente código QR con tu WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot conectado y escuchando mensajes y reacciones...');
});

// 1. CAPTURAR NUEVAS ÓRDENES (Cuando envían fotos o texto con el número de orden)
client.on('message', async (msg) => {
    const texto = msg.body.trim();
    const caption = msg.hasMedia ? msg.caption : ''; 
    const contenidoCompleto = (texto + ' ' + caption).toLowerCase();

    // Busca números de orden de 4 o más dígitos
    const match = contenidoCompleto.match(/\d{4,}/); 
    if (match && (contenidoCompleto.includes('orden') || contenidoCompleto.includes('reclamo') || msg.hasMedia)) {
        const idOrden = match[0];
        console.log(`📩 Nueva orden/reclamo detectada: #${idOrden}`);

        try {
            await axios.post(WEBHOOK_URL, {
                accion: 'agregar',
                idOrden: idOrden,
                detalle: contenidoCompleto
            });
            console.log(`✅ Orden #${idOrden} guardada en Google Sheets.`);
        } catch (error) {
            console.error('Error al enviar a Google Sheets:', error);
        }
    }
});

// 2. CAPTURAR EL CHECK (Reacción de WhatsApp para eliminar de la base de datos)
client.on('message_reaction', async (reaction) => {
    if (reaction.reaction === '✅') {
        try {
            const mensajeOriginal = await client.getMessageById(reaction.msgId._serialized);
            const contenido = (mensajeOriginal.body + ' ' + mensajeOriginal.caption).toLowerCase();
            
            const match = contenido.match(/\d{4,}/);
            if (match) {
                const idOrden = match[0];
                console.log(`🔄 Check detectado en orden #${idOrden}. Actualizando Google Sheets...`);

                const res = await axios.post(WEBHOOK_URL, {
                    accion: 'listo',
                    idOrden: idOrden
                });

                if (res.data.status === 'eliminado') {
                    console.log(`🗑️ Orden #${idOrden} removida de Google Sheets con éxito.`);
                }
            }
        } catch (error) {
            console.error('Error al procesar la reacción:', error);
        }
    }
});

client.initialize();
