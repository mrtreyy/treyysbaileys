const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('./lib')

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['AutoFlow', 'Chrome', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    // Flag prevents requesting multiple codes at once
    let pairingCodeRequested = false

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {

        // Request pairing code ONCE when the socket is ready — not on every QR refresh
        if (qr && !pairingCodeRequested && !sock.authState.creds.registered) {
            pairingCodeRequested = true
            try {
                // Use just the number with country code, no + prefix
                const code = await sock.requestPairingCode('2349151999259')
                console.log('=================================')
                console.log('  PAIRING CODE:', code)
                console.log('  Open WhatsApp > Linked Devices')
                console.log('  > Link with phone number > enter this code')
                console.log('=================================')
            } catch (err) {
                console.error('Failed to request pairing code:', err.message)
                pairingCodeRequested = false // allow retry
            }
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            const loggedOut = statusCode === DisconnectReason.loggedOut
            console.log('Connection closed. Reason:', statusCode, '| Logged out:', loggedOut)
            if (!loggedOut) {
                console.log('Reconnecting...')
                pairingCodeRequested = false
                start()
            } else {
                console.log('Logged out. Delete the auth folder and restart.')
            }
        }

        if (connection === 'open') {
            console.log('Connected successfully!')
        }
    })
}

start()
