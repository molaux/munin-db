var Munin = require('./munin.js')

var dateformat = require('dateformat')
var strtotime = require('strtotime')

let args = process.argv.slice(2)
let show = false
if (args[0] === 'show') {
  args = args.slice(1)
  show = true
}

let [domain, host, probe, target, from, to, fc] = args

if (from !== undefined) {
  from = strtotime(from)
} else {
  from = strtotime('1 hour ago')
}

if (to !== undefined) {
  to = strtotime(to)
} else {
  to = new Date()
}

console.log('From : ', dateformat(from, 'dd/mm/yyyy HH:MM:ss'))
console.log('To   : ', dateformat(to, 'dd/mm/yyyy HH:MM:ss'))

let munin = new Munin('/home/marco/src/munin-db-test')

munin.load().then(data => {
  if (show) {
    console.log(munin.describe(domain, host, probe, target))
  } else {
    munin.query(domain, host, probe, target, from, to, fc).then(data => {
      if (target !== undefined) {
        data = data.map(record => {
          record.time = dateformat(new Date(record.time * 1000), 'dd/mm/yyyy HH:MM:ss')
          return record
        })
      }
      console.log(data)
    })
  }
}
)
