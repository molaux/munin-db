var Munin = require('../lib/munin.js');

var dateformat = require('dateformat');
var strtotime = require('locutus/php/datetime/strtotime');
const util = require('util')

let args = process.argv.slice(2);


let [action, domain, host, probe, target, from, to, fc] = args;

if (from != undefined) {
    console.log(from);
    from = new Date(strtotime(from) * 1000);
    console.log(from);
} else {
    from = new Date(strtotime('1 hour ago') * 1000);
}

if (to != undefined) {
    to = new Date(strtotime(to) * 1000);
} else {
    to = new Date();
}


let munin = new Munin('/var/lib/munin');

switch (action) {
  case 'query' :
  case 'describe' :
    munin.load().then( data => {

        switch (action) {
          case 'describe':
            console.log(munin.describe(domain, host, probe, target));
            break;

          case 'query':
            console.log('From : ', dateformat(from, "dd/mm/yyyy HH:MM:ss"));
            console.log('To   : ', dateformat(to, "dd/mm/yyyy HH:MM:ss"));

            munin.query(domain, host, probe, target, from, to, null, fc).then( data => {
              if (target != undefined) {
                data = data.map( record => {
                  record.time = dateformat(new Date(record.time * 1000), "dd/mm/yyyy HH:MM:ss");
                  return record;
                });
              }
              console.log(data);
            });
            break;
        }

      });

    break;
  case 'limits' :
    munin.limits(domain, host, probe, target).then(data => console.log(util.inspect(data, false, null, true)));
    break;
}
