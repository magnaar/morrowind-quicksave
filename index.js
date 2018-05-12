const Fs = require('fs')
const Path = require('path')
const dateformat = require('dateformat')
const paths = {
    saves: './Saves/',
    backups: './backups/',
    config: './quicksave.json'
}
const defaultConfig = {
    "name": (key) => `${key} dd/mm/yy HH:MM`,
    "max": () => 5
}

if (! Fs.existsSync(paths.config))
    Fs.writeFileSync(paths.config,
        JSON.stringify({
            autosave: {
                name: defaultConfig.name("Auto"),
                max: 5
            },
            quiksave: {
                name: defaultConfig.name("Quick"),
                max: 10
            }
        }, null, 2)
    )

const config = JSON.parse(Fs.readFileSync(paths.config))
const saveNames = Object.keys(config).map(s => s + '.ess')
const saves = {}

process.chdir(paths.saves)
if (! Fs.existsSync(paths.backups))
    Fs.mkdirSync(paths.backups)

function setSavesObject(files)
{
    Object.keys(config)
        .forEach(k => {
            saves[k] = [...(saves[k] || []), ...files.filter(f => f.startsWith(k + '-'))]
            saves[k] = saves[k].filter((s, i) => saves[k].indexOf(s) == i)
            saves[k].sort()
        })
}
Fs.readdir('.', (err, files) => setSavesObject(files))
Fs.readdir(paths.backups, (err, files) => setSavesObject(files))

console.log('|||[ QuickSave ]|||')
let done = false
Fs.watch('.', (event, filename) => {
    if (event != 'update' && event != 'change' || ! saveNames.includes(filename) || done)
        return done && (done = false)
    done = true
    setTimeout(() => {
        const key = Path.basename(filename, '.ess')
        if ((config[key].max || defaultConfig.max(key)) <= saves[key].length)
        {
            const filenameToRemove = saves[key].splice(0, 1)[0]
            Fs.unlink(filenameToRemove, (err) => err && console.error(err))
            Fs.unlink(paths.backups + filenameToRemove, (err) => err && console.error(err))
        }
        const now = new Date()
        const newFile = `${key}-${dateformat(now, "yyyymmddHHMMss")}.ess`
        console.log(`=> ${newFile}`)
        Fs.rename(filename, paths.backups + newFile, (err) => {
            if (err)
                console.error(err)
            else
            {
                saves[key].push(newFile)
                Fs.readFile(paths.backups + newFile, (err, data) => {
                    console.log(config[key].name, dateformat(now, config[key].name || defaultConfig.name(key)))
                    Buffer.from(dateformat(now, config[key].name || defaultConfig.name(key))).copy(data, 64)
                    Fs.writeFile(newFile, data, (err) => err && console.error(err))
                })
            }
        })
    }, 1000)
})
