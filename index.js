const { default: makeWASocket, useMultiFileAuthState } = require('./lib')

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['AutoFlow', 'Chrome', '1.0.0']
    })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', async ({ connection, qr }) => {
        if (qr) {
            const code = await sock.requestPairingCode('2349151999259')
            console.log('PAIRING CODE:', code)
        }
        if (connection === 'open') console.log('CONNECTED!')
    })
}
start()
