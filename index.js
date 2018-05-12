const Fs = require('fs')
const Path = require('path')
const dateformat = require('dateformat')

main()

function main()
{
    const data = initDataObject()
    loadConfig(data)
    initBackupDirectory(data.paths)
    initSavesObject(data)

    console.log('|||[ QuickSave ]|||')
    watchSavesDirectory(data)
}

function initDataObject()
{
    return {
        units: {
            "day": 'dd',
            "month": 'mm',
            "year": 'yy',
            "year-2": 'yy',
            "year-4": 'yyyy',
            "hour": 'HH',
            "hour-12": 'hh',
            "hour-24": 'HH',
            "minute": 'MM',
            "second": 'SS',
            "meridiem": 'TT',
            "meridiem-1L": 't',
            "meridiem-2L": 'tt',
            "meridiem-1U": 'T',
            "meridiem-2U": 'TT'
        },
        defaultConfig: {
            name: (key) => `${key} {day}/{month}/{year} {hour}:{minute}`,
            max: () => 5
        },
        paths: {
            saves: './Saves/',
            backups: './Saves/backups/',
            config: './quicksave.json'
        },
        saves: {}
    }
}

function initConfig(data)
{
    Fs.writeFileSync(data.paths.config,
        JSON.stringify({
            autosave: {
                name: data.defaultConfig.name("Auto"),
                max: 5
            },
            quiksave: {
                name: data.defaultConfig.name("Quick"),
                max: 10
            }
        }, null, 2)
    )
}

function loadConfig(data)
{
    if (! Fs.existsSync(data.paths.config))
        initConfig(data)
    data.config = JSON.parse(Fs.readFileSync(data.paths.config))
    data.saveNames = Object.keys(data.config).map(s => s + '.ess')
}

function initBackupDirectory(paths)
{
    if (! Fs.existsSync(paths.backups))
        Fs.mkdirSync(paths.backups)
}

function initSavesObject(data)
{
    Fs.readdir(data.paths.saves, (err, files) => setSavesObject(data, files))
    Fs.readdir(data.paths.backups, (err, files) => setSavesObject(data, files))
}

function setSavesObject(data, files)
{
    Object.keys(data.config)
        .forEach(k => {
            data.saves[k] = [...(data.saves[k] || []), ...files.filter(f => f.startsWith(k + '-'))]
            data.saves[k] = data.saves[k].filter((s, i) => data.saves[k].indexOf(s) == i)
            data.saves[k].sort()
        })
}

function watchSavesDirectory(data)
{
    let done = false
    let idTimeout = null
    Fs.watch(data.paths.saves, (event, filename) => {
        if (event != 'update' && event != 'change' || ! data.saveNames.includes(filename) || done)
            return done && (done = false)
        done = true
        idTimeout && clearTimeout(idTimeout)
        idTimeout = setTimeout(() => onSaveUpdate(filename, data), 1000)
    })
}

function onSaveUpdate(filename, data)
{
    const key = Path.basename(filename, '.ess')
    if ((data.config[key].max || data.defaultConfig.max(key)) <= data.saves[key].length)
        deleteSaveAndBackup(key, data)
    backupQuicksave(filename, key, data)
}

function deleteSaveAndBackup(key, data)
{
    const filenameToRemove = data.saves[key].splice(0, 1)[0]
    Fs.unlink(data.paths.saves + filenameToRemove, (err) => err && console.error(err))
    Fs.unlink(data.paths.backups + filenameToRemove, (err) => err && console.error(err))
}

function backupQuicksave(filename, key, data)
{
    const now = new Date()
    const newFile = `${key}-${dateformat(now, "yyyymmddHHMMss")}.ess`
    console.log(`=> ${newFile}`)
    copyFile(
        data.paths.saves + filename,
        data.paths.backups + newFile,
        { afterWriting: () => copyQuicksaveWithDate(newFile, now, key, data) }
    )
}

function copyQuicksaveWithDate(newFile, now, key, data)
{
    data.saves[key].push(newFile)
    copyFile(
        data.paths.backups + newFile,
        data.paths.saves + newFile,
        { afterReading: (fileContent) => injectDateIntofileContent(fileContent, now, key, data) }
    )
}

function injectDateIntofileContent(fileContent, now, key, data)
{
    const name = Object.entries(data.units)
        .reduce(
            (n, [u, f]) => n.replace(`{${u}}`, dateformat(now, f)),
            data.config[key].name || data.defaultConfig.name(key)
        )
    Buffer.from(name.substring(0, 31)).copy(fileContent, 64)
}

function copyFile(inputFile, outputFile, { afterReading, afterWriting })
{
    Fs.readFile(inputFile, (err, fileContent) => {
        if (err)
            return console.error(err)
        afterReading && afterReading(fileContent)
        Fs.writeFile(outputFile, fileContent, (err) => {
            if (err)
                return console.error(err)
            afterWriting && afterWriting()
        })
    })
}
