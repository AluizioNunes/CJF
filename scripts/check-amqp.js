import net from 'node:net';

const host = process.env.AMQP_HOST || 'cjf_rabbitmq';
const port = Number(process.env.AMQP_PORT || 5672);
const timeoutMs = Number(process.env.AMQP_TIMEOUT_MS || 5000);

const socket = new net.Socket();
let done = false;

function finish(code, msg) {
  if (done) return;
  done = true;
  try { socket.destroy(); } catch {}
  if (code === 0) {
    console.log(msg || 'OK');
    process.exit(0);
  } else {
    console.error(msg || 'ERRO');
    process.exit(code);
  }
}

socket.setTimeout(timeoutMs);
socket.on('timeout', () => finish(2, 'timeout'));
socket.on('error', (err) => finish(3, String(err)));

socket.connect(port, host, () => {
  const header = Buffer.from([0x41, 0x4d, 0x51, 0x50, 0x00, 0x00, 0x09, 0x01]);
  socket.write(header);
});

socket.once('data', (buf) => {
  finish(0, `conectado a ${host}:${port}, bytes=${buf.length}`);
});