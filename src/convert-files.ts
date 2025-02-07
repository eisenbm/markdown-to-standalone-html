#!/usr/bin/node
const path = require('path')
const fs = require('fs')
const { exec } = require("child_process")
const YAML = require('yaml-front-matter')

const ignore = ['.', '..', '.DS_Store', '.gitkeep', '.gitignore']

// convert slugified file name to human readable
// capitalize first letter of each word
function unslugify (file: string) {
  file = file.replace(/-/g, ' ')
  return file.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()})
}

function getFiles (dirPath: string, arrayOfFiles: Array<string> = []) {
  let files = fs.readdirSync(dirPath)

  const distPath = dirPath.replace('docs/', 'dist/')
  console.log(distPath)
  exec(`mkdir ${distPath}`)

  files.filter((file: string) => !ignore.includes(file)).forEach(function (file:string) {
    console.log(dirPath)
    if (fs.lstatSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getFiles(dirPath + '/' + file, arrayOfFiles)
    } else if (fs.lstatSync(dirPath + '/' + file).isFile() && file.endsWith('.md')) {
      arrayOfFiles.push(path.join(dirPath, "/", file))
    }
  })

  return arrayOfFiles
}

function convertFiles (files: Array<string>, srcFolder: string, distFolder: string) {
  files.forEach(file => {
    const inputPath = file
    const outputPath = file.replace(srcFolder, distFolder).replace('.md', '.html')

    convertFile(inputPath, outputPath)
  })
}

function convertFile (inputPath: string, outputPath: string) {
  fs.readFile(inputPath, 'utf8', function (err: string, fileContents: string) {
    const yaml = YAML.loadFront(fileContents)
    const filename = outputPath.substring(outputPath.lastIndexOf('/'), outputPath.lastIndexOf('.'))
    const title = yaml.title || unslugify(filename)

    outputPath = outputPath.replace(filename, `"${title}"`)
    console.log(filename, outputPath)

    exec(`./dist/markdown-to-standalone-html.js -K -C -CC -B -hs atom-one-dark-reasonable -d 0 -o ${outputPath} ${inputPath}`, function(err: string, stdout: string, stderr: string) {
      if (err) {
        console.log(err)
        return
      }
      console.log(stdout)
    })
  })
}

const docsPath = path.join(__dirname, 'docs')
const distPath = path.join(__dirname, 'dist')

exec("rm -rf dist/*")
const files = getFiles(docsPath)
convertFiles(files, 'docs', 'dist')
