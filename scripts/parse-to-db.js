import fs from 'fs'
import path from 'path'
import 'dotenv/config'
import { MongoClient } from 'mongodb'

async function parsePlays(directory) {
  const lines = []

  const absPath = path.resolve(directory)
  for (const filename of await fs.promises.readdir(absPath)) {
    const file = path.join(absPath, filename)
    const contents = (await fs.promises.readFile(file)).toString()
    
    let play = contents.split('\n\n')
    let title = play.shift()
    let author = play.shift().replace(/by[ ]*/, '')
    let act = ''
    let scene = ''
    play.forEach(text => {
      let personae = ''
      let line = ''
      if (text.length == 0) {
      } else if (/^ACT/.test(text)) {
        act = text
      } else if (/^SCENE/.test(text)) {
        scene = text
      } else if (/^[ ]/.test(text)){
        const entry = {
          author,
          title,
          act,
          scene,
          'line': text.replace(/(\[_)|(_\])/g, '').trim(),
          'character': 'stage direction',
        }
        lines.push(entry)
      } else { 
        [personae, line] = text.split(/[.]{1}[ ]{1}/)
        const entry = {
          author,
          title,
          act,
          scene,
          line,
          'character': personae,
        }
        lines.push(entry)
      }
    })
  }
  return lines
}

const [_, __, directory] = process.argv;
if (!directory) {
	console.error('A directory is required');
	process.exit(1);
}

parsePlays(directory)
  .then(async lines => {
    const client = new MongoClient(process.env.MONGODB_URL)
    await client.connect()

    console.log(`parsed ${lines.length} lines`)
    const collection = client.db('quotes').collection('quotes')
    await collection.drop()
    await collection.insertMany(lines)
    return collection.createIndex({text: 'text'})
  })
  .then(d => {
    console.log(d)
    process.exit(0)
  })
  .catch(e => console.error(e))

