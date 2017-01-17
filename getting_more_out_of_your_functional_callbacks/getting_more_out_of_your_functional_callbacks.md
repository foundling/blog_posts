# Getting More Out of Your Functional Callbacks

In JavaScript, functional array methods like `map`, `filter`, `reduce`, `some` and `every` can bring a lot of clarity and brevity to the parts of your code that transform data.

This is what I mean:

    dataset
        .filter(hasX)
        .map(toY)
        .filter(compact)
        .length;

See how clear that is? I've filtered a dataset to just the items that have X, turned each item of the resulting subset into a Y, kept only the truthy values, and finally generated a count of the resulting items that fit my criteria. The original dataset isn't affected by this transformation because each of these methods produces a copy of its input array.

There are two important things to note here:

On an idiomatic level, I'm taking advantage of the orthoganality in the functional array methods that JavaScript offers (note that `sort`, which mutates its input, is not one of these). Each array method accepts an array and each method callback accepts a single item from that array. After the array method is invoked on each array item in its input, it is passed to the next array method in the chain.

On a code-hygiene level, I'm giving each callback a name that expresses the computational nature of the method that invokes it. The `filter` callback name, `hasX`, resembles a proposition and fittingly returns `true` or `false`. `map`'s callback name indicates what that item will be turned into. The goal here is to not only transform data in a pipeline, but to communicate any nuances in that overall transformation with great clarity.

## I want more!

This code is clear enough, but sometimes we might want more out of our callbacks. `filter`'s callback can only work on a single input that filter hands to it. Let's imagine that the `X` in `hasX` or the `Y` in `toY` could be parameterized. Then we could separate the property-checking code (the `has` part) from the property-specificying code (the `X` part). But so far, everything `hasX` uses to do its work is contained within a single execution context. How can we parameterize `X`?

# Enter Scope

A first step would be to simply refer to an outer parameter from within the `hasX` function definition. Like this:

    const x = 'init';
    // ... code ...
    const hasX = (datum) => datum.includes(x);

It takes advantage of scoping rules to refer to an `x` from an outer scope in the module. This isn't any good, though, and here's why: When you look at the `hasX` definition, the only thing that is immediately clear about where `x` comes from is ... somewhere else. The `// ... code ... ` section could be a bunch of lines, which means a lot of reading of code that you shouldn't have to read, just to find `x`.  The growth of a codebase introduces entropy that will likely widen that gap. If we could parameterize `x`, we'd entirely skip having to go look for it in the file where `hasX` is defined, as it will be in the function arguments. 

We also haven't managed to increase our control over how `X` is specified, since it's still effectively hard-coded into the function. 

So let's make our callback a truly great, capable, adaptable citizen in our code. If we think about the order of events in our functional pipeline, `hasX` accepts a single value at any point in `filter`'s iteration cycle. So whatever we hand `filter` has to be a function that accepts a single item from the array that is being filtered.  But if we break `hasX` into two separate functions, one which returns the other, then we just have to make sure to pass the correct one to `filter`.

## Temporality, Execution Context

We'll still need to take advantage of scope, but we can drastically improve the proximity of our input by composing two functions together. But which one comes first?

Let's think about a function returning a function for a second and just get clear on the temporality in this technique:

    fnA(x) {
        return fnB(y) {
            return y.method(x);
        }
    }

I hope it is not a surprise to you that you will need to call `fnA` before you can call `fnB`. We could call these two functions like this:

    fnA('test string')(arrayOfWords);

Knowing that the inner function is returned last, let's try this out with our `hasX` function, which I'll refer to as `has` from now on (the `X` part is now a function). If we first focus on the callback that `filter` will receive directly, we can work backward to the definition of the compound function. 

    const hasX (datum) => datum.includes(x);

We now need to wrap this in an outer function that returns this function when called:

    function has(x) {
        return function(datum) {
            return datum.includes(x);
        }
    }

I'm more fond of using the fat arrow anonymous functions from ES6 for computations like this, as they can make your code more succinct.  Here is how that would look:

    const has = (x) => (datum) => datum.includes(x);

And finally, we can use it like this:

    dataset
        .filter(has('a'))
        .map(transformTo('b'))
        .filter(compact)
        .length();

This is just as readable as the snippet I originally offered, but it's more capable. The trick here is that I'm calling `has` inside of the invocation of filter, which gets evaluated and then passed to filter. `has(a)` will become a function that now contains `a` in its internal environment and can still accept the proper and final argument from filter as filter iterates through the input array.  In a figurative sense, I like to think of this as compiling two execution contexts into one. 

## Benefits for Testing

I should mention that if you are working with objects like dates, this method becomes especially useful because all of your input is passed in as parameters.  I hope to demonstrate this below in a real-life example of this technique for expanding your callbacks.

## A Real Example

I find myself using this technique quite often when I have to work with 
Imagine I have a list of filenames that have a name and a date:

    alice_2016-12-07.json
    alice_2016-12-04.json
    alice_2016-12-09.json
    alice_2016-12-01.json
    alice_2016-12-03.json
    alice_2016-12-11.json
    bob_2016-12-03.json
    bob_2016-12-09.json
    bob_2016-12-02.json
    ...

And let's say I want to find any files for any person in a list for whom there is missing data in some date range. Let's say the date range is '2016-12-01' through '2016-12-15' and it is inclusive. And let's say that the names I care about are 'bob','alice', and 'fred'. Here's how I could use this technique (which is a limited case of currying by the way):

    const moment = require('moment');
    const filenames = [

        'alice_2016-12-07.json',
        'alice_2016-12-04.json',
        'alice_2016-12-09.json',
        'alice_2016-12-01.json',
        'alice_2016-12-03.json',
        'alice_2016-12-11.json',
        'bob_2016-12-03.json',
        'bob_2016-12-09.json',
        'bob_2016-12-02.json'

    ];

    const inRange = (start, stop) => (date) => moment(date).isBetween(moment(start),moment(stop));

    filenames
        .filter()

I should note that I'm using ES6 syntax to express this in a much more concise manner.  It may not always be more readable to use ES6 syntax, so please don't consider it a silver bullet. But in this case I find it makes the code concise yet readable. This would be the ES5 alternative:

    function inRange (start, stop) {
        return function (date) {
            return moment(date).isBetween(moment(start), moment(stop));
        }
    }

This definition syntax is generalizable, so if you wanted to, you could write a function that returns a function that returns a function:

    const fn1 = (a) => (b) => (c) => max(a, b, c);

And now, when you get around to using `has`, you can write this:

    dataset
        .filter(hasX('Z'))
        .map(toY)
        .some(isZ);

## A Real Example

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

    const range = (max) => [ ...Array(max).keys() ];
    const parseDateString = (filename) => filename.split('_')[1].split('.')[0];
    const belongsTo = (user) => (filename) => filename.split('_')[0] === user;
    const inDateRange = (start, stop) => (dateString) => moment(dateString).isBetween(moment(start), moment(stop), null, '[]');
    const generateDateRange = (start, stop) => {

        let [ startDate, stopDate ] = [ moment(start), moment(stop) ];
        let diff = moment.duration(stopDate.diff(startDate)).days();

        return range(diff + 1).map(offset => startDate.clone().add({ days: offset }).format('YYYY-MM-DD'));
        
    };
    const getMissingDates = (user, filenames, { start, stop }) => {

        const idealDates = generateDateRange(start, stop);

        const userFilesInRange = filenames
            .filter( belongsTo(user) )
            .filter( filename => inDateRange(start, stop)(parseDateString(filename)) );

        return idealDates
            .filter(idealDate => !userFilesInRange.map(parseDateString).includes(idealDate));

    };
    const missingDataReport = (users, filenames, dateRange) => {

        const reportSchema = {
            dateRange: null,
            users: {}
        };

        console.log();

        const run = () => { 

            let data = users.reduce((obj, user) => {

                obj['dateRange'] = dateRange; 
                obj['users'][user] = { 
                    'missingDates': getMissingDates(user, filenames, dateRange),
                    'files': filenames.filter(belongsTo(user))
                };

                return obj;

            }, reportSchema);

            return data;

        };

        return { run };

    };

    const data = missingDataReport(users, filenames, { start: '2016-12-01', stop: '2016-12-15' }).run();
    console.log(JSON.stringify(data, null, 2));

