In JavaScript, functional array methods like `map`, `filter`, `reduce`, `some` and `every` can bring a lot of clarity and brevity to the parts of your code that transform data.

This is what I mean:

    dataset
        .filter(hasX)
        .map(toY)
        .filter(compact)
        .length;

See how clear that is? I've filtered a dataset to just the items that have X, turned each item of the resulting subset into a Y, kept only the truthy values, and finally generated a count of the resulting items that fit my criteria. The original dataset isn't affected by this transformation because each of these methods produces a copy of its input array.

There are two important things to note here:

On an idiomatic level, I'm taking advantage of the orthogonality in the functional array methods that JavaScript offers (note that `sort`, although useful, mutates its input and is not one of these). Each array method works with an array and each method callback accepts a single item from that array. After the array method is invoked on each array item in its input, the current method returns the new array, on which another method can be called.

On an aesthetic level, I'm giving each callback a name that expresses the computational nature of the work that it does. The `filter` callback name, `hasX`, resembles a proposition and fittingly returns `true` or `false`. `map`'s callback name, `toY`, indicates what that item will be turned into. The goal here is to not only transform data in a pipeline, but to communicate any nuances in that overall transformation with great clarity.

## I want more!

This code is clear enough, but sometimes I need more out of my callbacks.  What if I want to filter, say, a list of dates based on whether they are within a specific date range? `filter`'s callback can only work on a single input that filter hands to it, a date from a list of dates.  So how to filter using additional criteria?

Let's imagine that the `X` in `hasX` or the `Y` in `toY` could be parameterized. Then we could separate the property-checking code (the `has` part) from the property-specificying code (the `X` part). But so far, everything `hasX` uses to do its work is contained within the `hasX` function definition. We'll need to figure out how to compose definitions. 

## Enter Scope

A first step would be to simply refer to an outer parameter from within the `hasX` function definition. Like this:

    const x = 'init';
    // ... code ...
    const hasX = (datum) => datum.includes(x);

It takes advantage of scoping rules to refer to an `x` from an outer scope in the module. This isn't any good, though, and here's why: When you look at the `hasX` definition, the only thing that is immediately clear about where `x` comes from is ... somewhere else. This means you'll have to go looking for it when it's time to debug. When we parameterize `x`, we entirely skip having to go look for it in the file where `hasX` is defined, as it will be in the function arguments. 

We also haven't managed to increase our control over how `X` is specified, since it's still effectively hard-coded into the function. 

So let's make our callback a truly great, capable, adaptable citizen in our code. If we think about the order of events in our functional pipeline, `hasX` accepts a single value at any point in `filter`'s iteration cycle. So whatever we hand `filter` has to be a function that accepts a single item from the array that is being filtered.  But if we break `hasX` into two separate functions, one which returns the other, then we just have to make sure to pass the correct one to `filter`.

## Temporality, Execution Context

We'll still need to take advantage of scope, but we can drastically improve the proximity of our input by composing two functions together. But which one comes first?

Let's think about a function returning a function for a second and just get clear on the temporality in this technique:

    fnA(x) {
        return fnB(y) {
            console.log(x, y);
        }
    }

I hope it is not a surprise to you that you will need to call `fnA` before you can call `fnB`. We could call these two functions like this:

    fnA('hello')('world');

Knowing that the inner function is returned last, let's try this out with our `hasX` function, which I'll refer to as `has` from now on (the `X` part is now a function). If we first focus on the callback that `filter` will receive directly, we can work backward to the definition of the compound function. 

    function (x) {
        return list.includes(x);
    }

We now need to wrap this in an outer function that returns this function when called:

    function has(list) {

        return function(x) {
            return list.includes(x);
        }

    }

### ES6 arrow functions: a gateway drug

I'm fond of using ES6's fat arrow/lambda functions [[1]] (#references) for specifying steps in a computation because they can really pare the syntax down to reveal just the semantics.  Here is the same composition done with arrow functions: 

    const has = (list) => (item) => list.includes(item);

These arrows can be nested arbitrarily, so this is just as valid:

    const wat = (arg1) => (arg2) => (arg3) => (arg4) => Math.max(arg1, arg2, arg3, arg4);

You can read this as: "`wat` is a function that takes in `arg1` and returns a function that takes in `arg2`, which returns a function that takes in `arg3`, which returns a function that takes in `arg4`, which returns the max of `arg1`, `arg2`, `arg3` and `arg4`".

Anyway, I encourage you to dive down this rabbit hole head first :]

## We did it!

Finally, we can use this new approach like this:

    dataset
        .filter(has(x))
        .map(transformTo(Y))
        .filter(compact)
        .length();

This is just as readable as the snippet I originally offered, but it's more capable. The trick here is that I'm passing the return value of `has(x)`, which is a function itself, as the argument to the `filter` call.  The anonymous function that `has(x)` returns now contains a reference to `x` and can still accept an argument from `filter` as `filter` iterates through its input array.  In a sense, we are merging or compiling separate scopes into one.

## A Real Example

Let's try this technique with a real example. Let's imagine I have the following:

A list of filenames that have the format `<name>_<datestring>.json`. 

    const filenames = [
        'alice_2016-12-07.json',
        'alice_2016-12-04.json',
        'alice_2016-12-09.json',
        'alice_2016-12-31.json',        
        'bob_2016-12-09.json',
        'bob_2016-12-02.json'
        // ....
    ];
 
And list of users: 

    const users = [
        'bob',
        'alice',
        'fred'
    ];

And finally, a date range (inclusive):

    const start = ‘2016-12-01’;
    const stop = ‘2016-12-15’;


If the goal were to find all files missing from the date range for each user in `users`, here’s how I could use the technique discussed above:

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

    /* utilities for generating dates */
    const range = (n) => [ ...Array(n).keys() ];
    const generateDateRange = (start, stop) => {

        let startDate = moment(start);
        let stopDate = moment(stop);
        let dateOffset = moment.duration( stopDate.diff(startDate) ).days();

        return range(dateOffset + 1).map(offset => {

            return startDate
                .clone()
                .add({ days: offset })
                .format('YYYY-MM-DD');

        });
        
    };

    /* functional method callbacks */
    const belongsToUser = (user) => (filename) => filename.split('_')[0] === user;
    const inDateRange = (start, stop) => (dateString) => moment(dateString).isBetween(moment(start), moment(stop), null, '[]');
    const toDateString = (filename) => filename.split('_')[1].split('.')[0];

    /* report functions */
    const getMissingDates = (user, filenames, dateRange) => {

        const idealDates = generateDateRange(dateRange.start, dateRange.stop);
        const userDatesInRange = filenames
            .filter( belongsToUser(user) )
            .map(toDateString)
            .filter( inDateRange(dateRange.start, dateRange.stop) );

        return idealDates
            .filter(idealDate => !userDatesInRange.includes(idealDate));

    };

    const report = (users, filenames, dateRange) => {

        const schema = { dateRange: null, users: {} };

        const run = () => { 

            let data = users.reduce((obj, user) => {
                obj.dateRange = dateRange; 
                obj.users[user] = { 
                    missingDates: getMissingDates(user, filenames, dateRange),
                    files: filenames.filter(belongsToUser(user))
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


## Parting Thoughts

The point of all of this isn't just to be fancy with functions, although I'm somewhat a proponent of that because it vastly increases your programming literacy and problem-solving skills. And it's not to just create code that reads like English, although that is a major benefit as well.  Another important benefit is that composing functions to obtain a compound result decreases the complexity of your tests. When a function has implicit context (like a date function generating now()), those values aren't manipulable, and thus you can't pass them into your function at the time of the test. If you want to test against some other time than now, you run into an issue.

Whether you love or loathe testing, if you test the right things in isolation, they'll save you debugging time later.  But tests are only useful insofar as you can trust them, and trusting them means they need to be transparent and as simple as possible (otherwise, you need to test your tests!).  If I can get my transparent tests to pass, I don't have to worry any longer about the correctness of these atomic actions, just whether they are adequate for solving the larger task.  At that point, I'm free to write code at a consistent level of concern (doing things to lists versus managing state *while* doing things to lists).

## <a name="references"></a>References

[1] [JavaScript Arrow Functions] (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)


