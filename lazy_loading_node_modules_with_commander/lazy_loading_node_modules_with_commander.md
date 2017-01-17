Recently, I've been building a command-line application to manage the data-acquisition process for a scientific study.  Today I admitted that it's just too slow to load and went about figuring out how to fix it.  The results were great! I'd like to write a little bit about how I created the problem and how I fixed it.
 
The app has the standard sub-command structure: 

    cmd sub-cmd [ arguments ... ] [ options ... ]

e.g.

    npm install commander

Sub-commands are the items of interest, but otherwise there's nothing that complicated going on from an interface standpoint. The app exposes exactly five, mutually-exclusive sub-commands:

    cmd stats
    cmd run
    cmd show <project metric>
    cmd query <name> <date-range>
    cmd update

## Enter Commander.js 

I decided to use [commander.js](https://github.com/tj/commander.js) to parse the commands. Commander is a nice, small and simple command-line application written by TJ Holowaychuk that exudes transparent feels and a great API. I recommend it.

## Modularity Only Gets You Half the Way There

Wanting to keep this application modular, I was breaking the functionality into atomic units and assembling these into top-level function modules for each path that the application could take. The cli index.js file was a basic entry point where I could register the module functions as callbacks to their respective sub-command and finally kick off the parser. 

Here is roughly what my `index.js` looked like: 

    const cli = require('commander');
    const { stats, run, query, health, update } = require('./commands');

    cli
        .command('stats')
        .description('gives you stats.')
        .action(stats);

    cli
        .command('run')
        .description('runs the app')
        .action(run);

    cli
        .command('query')
        .description('queries the API')
        .action(query);

    cli
        .command('health')
        .description('checks the health of various things')
        .action(health);

    cli
        .command('update')
        .description('updates the app')
        .action(update);

    cli.parse(process.argv);

## I'm Loading Everything Every Time

Once I started registering these modules with `commander`, the execution time for just the base command that prints a help page was 8 seconds! Of course subsequent proximal invocations of the command execute in around 300 to 400 milliseconds due to the OS cache. But for a user who is coming in and running this app infrequently over the course of a week, 8 seconds of start up time is prohibitive. It's unacceptable. While I don't expect a non-trivial command-line app written with Node to run as fast as a compiled coreutil, but getting close is important. I mean, 8 fucking seconds !?!?

## Loading Just the Libraries You Need

We want to restrict the loading of dependencies to the just those required by the sub-command we're running. More fundamentally, we want to gain a little more control over *when* we load our dependencies.  At the very least, this can be achieved by putting our require call inside of a function.

    function delayedRequire() {

        require('dependency-name');

    }

Woo! Problem solved. We can just pass something like this to commander's `.command` registration:

    cli
        .command('stats')
        .description('gets stats')
        .command(delayedRequire);


Well ... almost.  Commander is going to pass the parsed arguments to the function registered by `.command`. So our `delayedRequire` function should do something with these arguments. Lets try that out.

    function requireStats(...args) {
        
        // require returns the sub-command function
        // and we call the functions .apply method on the original arguments.

        require('./commands/stats').apply(this, args);

    }

If you've never used the `.apply` method of a JavaScript function, it offers finer-grained control over how a function invocation. In this case, you first specify the context for the invocation and you second specify an array of arguments (supplied from `delayedRequire` function in this case).

At this point, we might be tempted to start using our function, as it does the essential things we need: it requires the dependency only when we get around to calling it, it passes the cli-parsed arguments to the required module function. The `commander` object now has the right module and the correct arguments to run it as a callback. But it feels a little too boilerplate-y to register essentially the same function expression with the hardcoded dependency name in each `.command` call.

We can wrap a function like `requireStats` in an outer function that takes the dependencyName that you'd pass to `require`. This way, you can pass it a single argument, like require, and be done. 

    function makeLoader(dependencyName) {

        return function(...args) {
            require(dependencyName).apply(this, args);
        }

    }

So that's the solution! Here's what I came up with (including a few additional variations):


    const cli = require('commander');
    const basepath = './commands';
    const makeLoader = function(name) {

        return function(...args) {

            require(`${basepath}/${name}`).apply(this, args);

        };

    };

    const callbacks = [

        'stats', 'run', 'query', 'health', 'update'

    ]
    .reduce((o, dep) => {

       o[dep] = makeLoader(dep);
       return o;

    }, {});

    { stats, run, query, health, update } = callbacks; 

    cli
        .command('stats')
        .description('gives you stats.')
        .action(stats);

    cli
        .command('run')
        .description('runs the app')
        .action(run);

    cli
        .command('query')
        .description('queries the API')
        .action(query);

    cli
        .command('health')
        .description('checks the health of various things')
        .action(health);

    cli
        .command('update')
        .description('updates the app')
        .action(update);


    cli.parse(process.argv);
