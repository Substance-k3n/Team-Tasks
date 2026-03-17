import amqp from 'amqplib';

export async function setupRabbitMqTopology(): Promise<void> {
  const url = process.env.RMQ_URL || 'amqp://localhost:5672';
  const exchange = process.env.RMQ_EXCHANGE || 'team_tasks.exchange';
  const deadLetterExchange = process.env.RMQ_DLX || 'team_tasks.dlx';
  const mainQueue = process.env.RMQ_MAIN_QUEUE || 'team_tasks.main';
  const dlq = process.env.RMQ_DLQ || 'team_tasks.dlq';

  let connection: amqp.ChannelModel | null = null;
  let channel: amqp.Channel | null = null;

  try {
    connection = await amqp.connect(url);
    channel = await connection.createChannel();

    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.assertExchange(deadLetterExchange, 'topic', { durable: true });

    await channel.assertQueue(mainQueue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': deadLetterExchange,
        'x-dead-letter-routing-key': 'task.failed',
      },
    });

    await channel.assertQueue(dlq, {
      durable: true,
    });

    await channel.bindQueue(mainQueue, exchange, 'task.#');
    await channel.bindQueue(dlq, deadLetterExchange, 'task.failed');
  } finally {
    if (channel) {
      await channel.close();
    }

    if (connection) {
      await connection.close();
    }
  }
}
