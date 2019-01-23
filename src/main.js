var Munin = require('../lib/munin.js');

var dateformat = require('dateformat');
var strtotime = require('locutus/php/datetime/strtotime');

let args = process.argv.slice(2);
let show = false;
if (args[0] == 'show') {
    args = args.slice(1);
    show = true;
}

let [domain, host, probe, target, from, to, fc] = args;

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

console.log('From : ', dateformat(from, "dd/mm/yyyy HH:MM:ss"));
console.log('To   : ', dateformat(to, "dd/mm/yyyy HH:MM:ss"));

let munin = new Munin('/var/lib/munin');

munin.load().then( data => {
        if (show) {
            console.log(munin.describe(domain, host, probe, target));
        } else {
            munin.query(domain, host, probe, target, from, to, null, fc).then( data => {
                if (target != undefined) {
                    data = data.map( record => {
                        record.time = dateformat(new Date(record.time * 1000), "dd/mm/yyyy HH:MM:ss");
                        return record;
                    } );
                }
                console.log(data);
            })
        }
    }
);
