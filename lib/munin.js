var rrdtool = require('rrdtool');
var fs = require('fs');
var merge = require('merge');
var util = require('util');
var printf = require('printf');

class Munin {

    constructor(muninStoragePath) {
        this.muninStoragePath = muninStoragePath;
    }

    query(domain, host, probe, target, from, to, nbDots, fc) {

        if (domain == undefined) {
            return new Promise( (resolve, reject) => {
                resolve(Object.keys(this.munin.probes));
            });
        } else if (host == undefined) {
            return new Promise( (resolve, reject) => {
                if (this.munin.probes[domain] == undefined) {
                    resolve([]);
                } else {
                    resolve(Object.keys(this.munin.probes[domain]));
                }
            });
        } else if (probe == undefined) {
            return new Promise( (resolve, reject) => {
                if (this.munin.probes[domain][host] == undefined) {
                    resolve([]);
                } else {
                    resolve(Object.keys(this.munin.probes[domain][host]));
                }
            });
        } else if (target == undefined) {
            return new Promise( (resolve, reject) => {
                resolve(
                    Object.keys(this.munin.probes[domain][host][probe])
                      .filter(key => 'graph_data_size' in this.munin.probes[domain][host][probe][key])
                );
            });
        } else {
            from =  Math.floor(from.getTime() / 1000);
            to =  Math.floor(to.getTime() / 1000);

            let path = this.muninStoragePath + '/' + domain;
            let dbFilename = null;

            // Search for a matching rdd filename
            if (fs.existsSync(path)) {
                fs.readdirSync(path).forEach(filename => {
                    if (new RegExp( host + '\\.' + domain.replace('.', '\\.') + '-' + probe + '-' + target + '-.\\.rrd').test(filename)) {
                        dbFilename = filename;
                    }
                });
            }

            if (dbFilename === null) {
                throw 'Unknown probe ' + probe + ' or target ' + target;
            }

            // open the db
            let db = rrdtool.open( path + '/' + dbFilename );

            // translate resolution (nb points) from duration (minutes)
            // let duration = (to - from);
            // nbDots = (nbDots > 0 ? nbDots : 100);
            //
            // let res = Math.floor((duration / nbDots) / 300) * 300;
            // from = Math.floor(from / res) * res;
            // to = Math.floor(to / res) * res;
            //
            // console.log (from, to,  res, (to - from) / res);
            // query munin
            fc = fc ? fc : 'AVERAGE';

            return new Promise( (resolve, reject) => {
                db.fetch(fc, from, to, function (err, data) {

                    if (err) {
                        throw err;
                    }

                    resolve(data)

                });
            });
        }
    }

    load() {
        return new Promise( (resolve, reject) => {
            fs.readFile(this.muninStoragePath + '/datafile', 'ascii', (err,data) => {
                if (err) {
                    return console.log(err);
                }

                let munin = {
                    probes: {}
                };

                data.split('\n')
                    .slice(1)
                    .forEach(
                        (line, k) => {

                            if (! (/.+;.+:.+/.test(line))) {
                                return;
                            }
                            let [domain, hostProbe] = line.split(';');
                            let [host, probeLine] = hostProbe.split(':');
                            let [probeProperty, ... values] = probeLine.split(' ');
                            let probe = { };
                            [probe.name, probe.domain, ... probe.properties] = probeProperty.split('.');

                            let properties = {};
                            let propPointer = properties;
                            for (let p of probe.properties) {
                                propPointer[p] = {};
                                propPointer = propPointer[p];
                            }

                            propPointer.value = values.join(' ');

                            let probePath = {
                                [domain]: {
                                    [host.replace('.'+domain, '')]: {
                                        [probe.name]: {
                                            [probe.domain]: properties
                                        }
                                    }
                                }
                            }
                            munin.probes = merge.recursive(false, munin.probes, probePath);
                        });
                this.munin = munin;
                resolve(this.munin);
            });
        });
    }

    describe(domain, host, probe, target) {

        if (target == undefined) {
            return Object.keys(this.munin.probes[domain][host][probe])
              .filter(key => !('graph_data_size' in this.munin.probes[domain][host][probe][key]))
              .reduce((obj, key) => {
                obj[key] = this.munin.probes[domain][host][probe][key];
                return obj;
              }, {});
        } else {
            if (this.munin.probes[domain][host][probe][target] !== undefined) {
                return this.munin.probes[domain][host][probe][target];
            }
        }
    }
}



module.exports = Munin;