const net = require('net');

const sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

const connectToHostPort = ({ host, port }) => new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port, timeout: 15 * 1000 });

    socket.on('connect', () => {
        socket.end();
        resolve();
    });
    socket.on('error', (err) => {
        socket.end();
        reject(err);
    });
    socket.on('timeout', () => {
        socket.end();
        reject(new Error('Connection timeout'));
    });
});

const waitForIt = async ({
    name, host, port, output
}) => {
    const startTime = Date.now();
    let connected = false;
    while (!connected) {
        try {
            // eslint-disable-next-line no-await-in-loop
            await Promise.race([
                sleep(15).then(() => {
                    throw new Error('Connection timeout');
                }),
                connectToHostPort({ host, port })
            ]);
            connected = true;
        } catch {
            output(`Waiting for ${name} at ${host}:${port}...`);
        }
    }

    const endTime = Date.now();
    output(`${name} at ${host}:${port} is available after ${((endTime - startTime) / 1000).toFixed(0)} seconds`, 3);
};

module.exports = waitForIt;