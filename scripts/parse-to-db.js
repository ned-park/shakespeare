import fs from 'fs'
import path from 'path'
import 'dotenv/config'
import { MongoClient } from 'mongodb'

async function parsePlays(directory) {
  const lines = []

  const absPath = path.resolve(directory)
  for (const filename of await fs.promises.readdir(absPath)) {
    const file = path.join(absPath, filename)
    console.log(`Parsing ${file}`)
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
        [personae, ...line] = text.split(/[.]{1}[ ]{1}/)
        line = line.join('. ').replace(/[\n]/g, '<br />')
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

async function parseVerse(verse) {
  const lines = []

  const absPath = path.resolve(verse)
  for (const filename of await fs.promises.readdir(absPath)) {
    const file = path.join(absPath, filename)
    console.log(`Parsing ${file}`)
    const contents = (await fs.promises.readFile(file)).toString()
    
    let poem = contents.split('\n\n')
    let title = poem.shift().replace(/___/g, '')
    let author = poem.shift()
    let act = ''
    let scene = ''
    poem.forEach(text => {
      let personae = ''
      let line = ''
      if (text.length == 0) {
      } else if (/^[ ]*[XIV]+\./.test(text)) {
        act = text
      } else if (/^[ ]*\d+/.test(text)) {
        act = text.replace(/ /g, '')
      } else {
        const entry = {
          author,
          title,
          act,
          scene,
          'line': text.replace(/[\n]/g, '<br />'),
          character: 'William Shakespeare'
        }
        lines.push(entry)
      } 
    })
  }
  return lines
}

const [_, __, directory, verse] = process.argv;
if (!directory||!verse) {
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
    return collection.createIndex({line: 'text'})
  })
  .then(d => {
    console.log(d)
    process.exit(0)
  })
  .catch(e => console.error(e))


  parseVerse(verse)
  .then(async lines => {
    const client = new MongoClient(process.env.MONGODB_URL)
    await client.connect()

    console.log(`parsed ${lines.length} lines`)
    const collection = client.db('quotes').collection('quotes')
    await collection.insertMany(lines)
    return collection.createIndex({line: 'text'})
  })
  .then(d => {
    console.log(d)
    process.exit(0)
  })
  .catch(e => console.error(e))



  
