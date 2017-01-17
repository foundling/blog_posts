const moment = require('moment');
const assert = require('assert');
const users = [ 'alice', 'bob', 'fred' ];
const filenames = [ 

    'alice_2016-12-07.json',
    'alice_2016-12-04.json',
    'alice_2016-12-09.json',
    'alice_2016-12-01.json',
    'alice_2016-12-03.json',
    'alice_2016-12-11.json',
    'alice_2016-12-31.json',
    'bob_2016-12-03.json',
    'bob_2016-12-09.json',
    'bob_2016-12-02.json'

];

const range = (n) => [ ...Array(n).keys() ];
const generateDateRange = (start, stop) => {

    let startDate = moment(start);
    let stopDate = moment(stop);
    let diff = moment.duration( stopDate.diff(startDate) ).days();

    return range(diff + 1).map(offset => startDate.clone().add({ days: offset }).format('YYYY-MM-DD'));
    
};

/* callbacks */
const belongsToUser = (user) => (filename) => filename.split('_')[0] === user;
const inDateRange = (start, stop) => (dateString) => moment(dateString).isBetween(moment(start), moment(stop), null, '[]');
const toDateString = (filename) => filename.split('_')[1].split('.')[0];

/* report functions */
const getMissingDates = (user, filenames, { start, stop }) => {

    const idealDates = generateDateRange(start, stop);
    const userFilesInRange = filenames
        .filter( belongsToUser(user) )
        .filter( filename => inDateRange(start, stop)(toDateString(filename)) );

    return idealDates
        .filter(idealDate => !userFilesInRange.map(toDateString).includes(idealDate));

};

const report = (users, filenames, dateRange) => {

    const schema = { dateRange: null, users: {} };

    const run = () => { 

        let data = users.reduce((obj, user) => {
            obj['dateRange'] = dateRange; 
            obj['users'][user] = { 
                'missingDates': getMissingDates(user, filenames, dateRange),
                'files': filenames.filter(belongsToUser(user))
            };

            return obj;
        }, schema);

        return data;

    };

    return { run };

};

/* basic tests */
assert(range(5).length === 5);
assert(toDateString('test_2016-12-01.json') === '2016-12-01'); 
assert(generateDateRange('2016-12-01','2016-12-05').length === 5);
assert(generateDateRange('2016-12-01','2016-12-05').includes('2016-12-01'));
assert(generateDateRange('2016-12-01','2016-12-05').includes('2016-12-02'));
assert(generateDateRange('2016-12-01','2016-12-05').includes('2016-12-03'));
assert(generateDateRange('2016-12-01','2016-12-05').includes('2016-12-04'));
assert(generateDateRange('2016-12-01','2016-12-05').includes('2016-12-05'));
assert(belongsToUser('test')('test_2016-12-01.json'));

/* run report */
const data = report(users, filenames, { start: '2016-12-01', stop: '2016-12-15' }).run();

/* log results */
console.log(JSON.stringify(data, null, 2));
