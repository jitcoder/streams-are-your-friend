import Koa from 'koa';
import koaBody from 'koa-body';
import Router from 'koa-router';
import mongo from 'mongodb';

const PORT = 3000;

const app = new Koa();
const router = new Router();

const generateItems = async (collection: mongo.Collection<any>) => {
  const items = [];

  console.log('generating...');
  for (let i = 0; i < 500000; i++) {
    items.push({ i, created: Date.now(), date: (new Date()).toDateString() });
  }

  console.log('inserting...');
  await collection.insertMany(items);

  console.log('done');
}

router.get('/generate', async (ctx) => {
  const conn = await mongo.connect('mongodb://localhost/test', { useUnifiedTopology: true });
  const db = conn.db('test');
  const collection = db.collection('mystuff');

  await collection.deleteMany({});
  await generateItems(collection);

  ctx.body = 'done';
})

router.get('/without-stream', async (ctx) => {
  const conn = await mongo.connect('mongodb://localhost/test', { useUnifiedTopology: true });
  const db = conn.db('test');
  const collection = db.collection('mystuff');

  const cursor = collection.find({});
  const results = [];

  while (await cursor.hasNext()) {
    results.push(JSON.stringify(await cursor.next()));
  }

  ctx.body = results.join('\n');
});

router.get('/stream', async (ctx) => {
  const conn = await mongo.connect('mongodb://localhost/test', { useUnifiedTopology: true });
  const db = conn.db('test');
  const collection = db.collection('mystuff');

  const cursor = collection.find({});
  ctx.body = cursor.stream({ transform: (doc) => JSON.stringify(doc) });
});

app.use(koaBody({ includeUnparsed: true }))
   .use(router.routes())
   .use(router.allowedMethods());


app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});