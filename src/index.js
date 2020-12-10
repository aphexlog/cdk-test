// v2 is modified to run in lambda

/*global reject */

exports.handler = async(event) => {
    var ipAddress = event.key1;
    return checkSourceForIp(ipAddress);

    // var ipAddress = process.argv[2]
    function getIpAddress() {
        // Checking input of ipAddress to validate format of IP.
        function validateIp() {
            if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipAddress)) {
                return true;
            } else {
                // Exits if not valid format
                console.error(`Invalid IP address: ${ipAddress}`);
            }
        }

        // Collecting geographic location of IP
        function getIpGeo() {
            const geoip = require('geoip-lite');
            const geo = geoip.lookup(ipAddress);
            return JSON.stringify(geo);
        }

        // Making it easier to call these seperately later on
        getIpAddress.validateIp = validateIp;
        getIpAddress.getIpGeo = getIpGeo;

    }

    function checkSourceForIp() {
        const request = require('request');
        const promise = require('promise');

        const lookupUrl = "https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/bi_sip_0_1d.ipset";

        // This RegEx does not account for the differance between 10 & 10.x.x.x - need to fix
        var re = new RegExp(ipAddress.replace(/\./g, '\\.'), 'gi');

        // Calling validateIp
        getIpAddress();
        getIpAddress.validateIp();
        const issueRequest = () => {
            return new promise(() => {
                request(lookupUrl, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        if (body.search(re) == -1) {
                            console.error(`No ipAddress match for: ${ipAddress}`);
                        } else {
                            // Won't move on to s3Upload unless ipAddress match
                            s3Upload(ipAddress);
                            console.log(`Found ipAddress match for: ${ipAddress}`);
                        }
                    }
                });
            });
        };
        return issueRequest();
    }

    function s3Upload() {
        const AWS = require('aws-sdk');
        const date = Date.now();
        const s3 = new AWS.S3({
            apiVersion: '2006-03-01',
            region: process.env.AWS_REGION,
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });
        const bucketParams = {
            Bucket: `blocklist-${ipAddress}`
        };
        s3.createBucket(bucketParams, function(err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log(`Bucket uploaded successfully at ${data.Location}`);
            }
        });
    }
};